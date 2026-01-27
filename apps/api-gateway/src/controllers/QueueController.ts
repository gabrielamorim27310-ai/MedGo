import { Request, Response, NextFunction } from 'express'
import { AppError } from '../middlewares/errorHandler'
import { prisma } from '../lib/prisma'
import { CreateQueueEntryDTO, UpdateQueueEntryDTO, QueueStatus } from '@medgo/shared-types'

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

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body as CreateQueueEntryDTO

      const queue = await prisma.queueEntry.create({
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

      res.status(201).json(queue)
    } catch (error) {
      next(error)
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const data = req.body as UpdateQueueEntryDTO

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

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params

      await prisma.queueEntry.delete({
        where: { id },
      })

      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }
}
