import { Request, Response, NextFunction } from 'express'
import { AppError } from '../middlewares/errorHandler'
import { prisma } from '../lib/prisma'
import { CreateQueueEntryDTO, UpdateQueueEntryDTO, QueueStatus, QueuePriority } from '@acolhe/shared-types'
import { queueServiceClient } from '../services/QueueServiceClient'
import { eligibilityService } from '../services/EligibilityService'
import { AuthRequest } from '../middlewares/auth'

export class QueueController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10, hospitalId, status, priority } = req.query

      const where: any = {}

      if (hospitalId) {
        where.hospitalId = hospitalId
      }

      if (status) {
        where.status = status
      }

      if (priority) {
        where.priority = priority
      }

      const [queues, total] = await Promise.all([
        prisma.queueEntry.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          include: {
            patient: {
              include: {
                user: {
                  select: {
                    name: true,
                    cpf: true,
                  },
                },
              },
            },
            hospital: {
              select: {
                name: true,
              },
            },
          },
          orderBy: [
            { priority: 'asc' },
            { checkInTime: 'asc' },
          ],
        }),
        prisma.queueEntry.count({ where }),
      ])

      res.json({
        data: queues,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      })
    } catch (error) {
      next(error)
    }
  }

  /** Filas do paciente autenticado: ativas e histórico. */
  myQueues = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        throw new AppError('Não autenticado', 401)
      }

      const patient = await prisma.patient.findUnique({
        where: { userId: req.user.id },
        select: { id: true },
      })

      if (!patient) {
        res.json({ active: [], history: [] })
        return
      }

      const entries = await prisma.queueEntry.findMany({
        where: { patientId: patient.id },
        include: {
          hospital: {
            select: { id: true, name: true, city: true, state: true },
          },
        },
        orderBy: { checkInTime: 'desc' },
        take: 50,
      })

      const activeStatuses: QueueStatus[] = [QueueStatus.WAITING, QueueStatus.IN_PROGRESS]

      res.json({
        active: entries.filter((e) => activeStatuses.includes(e.status as QueueStatus)),
        history: entries.filter((e) => !activeStatuses.includes(e.status as QueueStatus)),
      })
    } catch (error) {
      next(error)
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params

      const queue = await prisma.queueEntry.findUnique({
        where: { id },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  name: true,
                  cpf: true,
                  phone: true,
                },
              },
            },
          },
          hospital: true,
        },
      })

      if (!queue) {
        throw new AppError('Entrada de fila não encontrada', 404)
      }

      res.json(queue)
    } catch (error) {
      next(error)
    }
  }

  async getByHospital(req: Request, res: Response, next: NextFunction) {
    try {
      const { hospitalId } = req.params
      const { status = QueueStatus.WAITING } = req.query

      const queues = await prisma.queueEntry.findMany({
        where: {
          hospitalId,
          status: status as QueueStatus,
        },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  name: true,
                  cpf: true,
                },
              },
            },
          },
        },
        orderBy: [
          { priority: 'asc' },
          { checkInTime: 'asc' },
        ],
      })

      res.json(queues)
    } catch (error) {
      next(error)
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { hospitalId } = req.params

      // Estatísticas em tempo real vêm do queue-service (com cache Redis
      // e estimativa dinâmica); em caso de indisponibilidade, calcula
      // localmente a partir do banco.
      try {
        const stats = await queueServiceClient.getStats(hospitalId)
        res.json(stats)
        return
      } catch {
        console.warn('[QueueController] queue-service indisponível, calculando stats localmente')
      }

      const [totalWaiting, byPriority, bySpecialty] = await Promise.all([
        prisma.queueEntry.count({
          where: {
            hospitalId,
            status: QueueStatus.WAITING,
          },
        }),
        prisma.queueEntry.groupBy({
          by: ['priority'],
          where: {
            hospitalId,
            status: QueueStatus.WAITING,
          },
          _count: true,
        }),
        prisma.queueEntry.groupBy({
          by: ['specialty'],
          where: {
            hospitalId,
            status: QueueStatus.WAITING,
          },
          _count: true,
        }),
      ])

      const waitingQueues = await prisma.queueEntry.findMany({
        where: {
          hospitalId,
          status: QueueStatus.WAITING,
        },
        select: {
          estimatedWaitTime: true,
        },
      })

      const averageWaitTime = waitingQueues.length > 0
        ? waitingQueues.reduce((acc, q) => acc + (q.estimatedWaitTime || 0), 0) / waitingQueues.length
        : 0

      res.json({
        hospitalId,
        totalWaiting,
        averageWaitTime: Math.round(averageWaitTime),
        byPriority: byPriority.reduce((acc, item) => {
          acc[item.priority] = item._count
          return acc
        }, {} as any),
        bySpecialty: bySpecialty.reduce((acc, item) => {
          acc[item.specialty] = item._count
          return acc
        }, {} as any),
        timestamp: new Date(),
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Check-in na fila virtual. Fluxo integrado:
   * 1. Resolve o paciente (o próprio usuário, quando role PATIENT).
   * 2. Verifica elegibilidade junto à operadora (convênio + cobertura).
   * 3. Delega ao queue-service: posição, senha, estimativa dinâmica,
   *    eventos WebSocket e notificação de check-in.
   */
  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = req.body as CreateQueueEntryDTO
      let patientId = data.patientId

      // Paciente autenticado só entra na fila em nome próprio.
      if (req.user?.role === 'PATIENT') {
        const ownPatient = await prisma.patient.findUnique({
          where: { userId: req.user.id },
          select: { id: true },
        })

        if (!ownPatient) {
          throw new AppError('Cadastro de paciente não encontrado para este usuário', 404)
        }

        patientId = ownPatient.id
      }

      const hospital = await prisma.hospital.findUnique({
        where: { id: data.hospitalId },
        select: { id: true, status: true },
      })

      if (!hospital) {
        throw new AppError('Hospital não encontrado', 404)
      }

      if (hospital.status !== 'ACTIVE') {
        throw new AppError('Hospital não está recebendo pacientes no momento', 422)
      }

      const eligibility = await eligibilityService.check({
        patientId,
        hospitalId: data.hospitalId,
        specialty: data.specialty,
        isEmergency:
          data.priority === QueuePriority.EMERGENCY ||
          data.priority === QueuePriority.URGENT,
      })

      if (!eligibility.eligible) {
        throw new AppError(
          `Cobertura não confirmada: ${eligibility.reasons.join('; ')}`,
          422
        )
      }

      const payload = {
        hospitalId: data.hospitalId,
        patientId,
        priority: data.priority,
        specialty: data.specialty,
        symptoms: data.symptoms,
        eligibility: eligibility as unknown as Record<string, unknown>,
      }

      try {
        const entry = await queueServiceClient.addToQueue(payload)
        res.status(201).json(entry)
        return
      } catch {
        console.warn(
          '[QueueController] queue-service indisponível, registrando check-in direto no banco'
        )
      }

      // Fallback degradado: registra a entrada sem tempo real.
      const queue = await prisma.queueEntry.create({
        data: {
          hospitalId: payload.hospitalId,
          patientId: payload.patientId,
          priority: payload.priority,
          specialty: payload.specialty,
          symptoms: payload.symptoms,
          eligibility: payload.eligibility as any,
        },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  name: true,
                  cpf: true,
                },
              },
            },
          },
          hospital: {
            select: {
              name: true,
            },
          },
        },
      })

      res.status(201).json(queue)
    } catch (error) {
      next(error)
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const data = req.body as UpdateQueueEntryDTO

      // Delegar ao queue-service mantém posições, estimativas e eventos
      // em tempo real consistentes.
      try {
        const entry = await queueServiceClient.updateEntry(id, data as any)
        res.json(entry)
        return
      } catch {
        console.warn('[QueueController] queue-service indisponível, atualizando direto no banco')
      }

      const queue = await prisma.queueEntry.update({
        where: { id },
        data,
        include: {
          patient: {
            include: {
              user: {
                select: {
                  name: true,
                  cpf: true,
                },
              },
            },
          },
          hospital: {
            select: {
              name: true,
            },
          },
        },
      })

      res.json(queue)
    } catch (error) {
      next(error)
    }
  }

  /** Chama o próximo paciente da fila (painel da recepção). */
  async callNext(req: Request, res: Response, next: NextFunction) {
    try {
      const { hospitalId, specialty } = req.body

      if (!hospitalId) {
        throw new AppError('hospitalId é obrigatório', 400)
      }

      const entry = await queueServiceClient.callNext(hospitalId, specialty)

      if (!entry) {
        res.json({ message: 'Fila vazia', entry: null })
        return
      }

      res.json(entry)
    } catch (error) {
      next(error)
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params

      try {
        await queueServiceClient.removeEntry(id)
        res.status(204).send()
        return
      } catch {
        console.warn('[QueueController] queue-service indisponível, removendo direto no banco')
      }

      await prisma.queueEntry.delete({
        where: { id },
      })

      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }
}
