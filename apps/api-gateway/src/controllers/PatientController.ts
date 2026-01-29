import { Request, Response, NextFunction } from 'express'
import { AppError } from '../middlewares/errorHandler'
import { prisma } from '../lib/prisma'
import { CreatePatientDTO, UpdatePatientDTO } from '@medgo/shared-types'

export class PatientController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10, search } = req.query

      const where = search
        ? {
            user: {
              OR: [
                { name: { contains: search as string, mode: 'insensitive' as const } },
                { cpf: { contains: search as string } },
                { email: { contains: search as string, mode: 'insensitive' as const } },
              ],
            },
          }
        : {}

      const [patients, total] = await Promise.all([
        prisma.patient.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                cpf: true,
                phone: true,
              },
            },
          },
        }),
        prisma.patient.count({ where }),
      ])

      res.json({
        data: patients,
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

      const patient = await prisma.patient.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              cpf: true,
              phone: true,
            },
          },
        },
      })

      if (!patient) {
        throw new AppError('Paciente não encontrado', 404)
      }

      res.json(patient)
    } catch (error) {
      next(error)
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body as CreatePatientDTO

      const patient = await prisma.patient.create({
        data: data as any,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              cpf: true,
              phone: true,
            },
          },
        },
      })

      res.status(201).json(patient)
    } catch (error) {
      next(error)
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const data = req.body as UpdatePatientDTO

      const patient = await prisma.patient.update({
        where: { id },
        data: data as any,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              cpf: true,
              phone: true,
            },
          },
        },
      })

      res.json(patient)
    } catch (error) {
      next(error)
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params

      await prisma.patient.delete({
        where: { id },
      })

      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }

  // Obter dados do paciente logado
  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id

      if (!userId) {
        throw new AppError('Usuário não autenticado', 401)
      }

      const patient = await prisma.patient.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              cpf: true,
              phone: true,
            },
          },
          healthInsurance: {
            select: {
              id: true,
              name: true,
              cnpj: true,
              phone: true,
              email: true,
              website: true,
            },
          },
        },
      })

      if (!patient) {
        throw new AppError('Perfil de paciente não encontrado', 404)
      }

      res.json(patient)
    } catch (error) {
      next(error)
    }
  }

  // Listar dependentes do paciente logado
  async listMyDependents(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id

      if (!userId) {
        throw new AppError('Usuário não autenticado', 401)
      }

      const patient = await prisma.patient.findUnique({
        where: { userId },
      })

      if (!patient) {
        throw new AppError('Perfil de paciente não encontrado', 404)
      }

      const dependents = await prisma.dependent.findMany({
        where: { patientId: patient.id },
        orderBy: { name: 'asc' },
      })

      res.json(dependents)
    } catch (error) {
      next(error)
    }
  }

  // Criar dependente
  async createDependent(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id

      if (!userId) {
        throw new AppError('Usuário não autenticado', 401)
      }

      const patient = await prisma.patient.findUnique({
        where: { userId },
      })

      if (!patient) {
        throw new AppError('Perfil de paciente não encontrado', 404)
      }

      const { name, cpf, dateOfBirth, relationship, bloodType, allergies, chronicConditions, healthInsuranceNumber } = req.body

      const dependent = await prisma.dependent.create({
        data: {
          patientId: patient.id,
          name,
          cpf,
          dateOfBirth: new Date(dateOfBirth),
          relationship,
          bloodType: bloodType || null,
          allergies: allergies || [],
          chronicConditions: chronicConditions || [],
          healthInsuranceNumber: healthInsuranceNumber || null,
        },
      })

      res.status(201).json(dependent)
    } catch (error: any) {
      if (error.code === 'P2002') {
        return next(new AppError('CPF já cadastrado para outro dependente', 409))
      }
      next(error)
    }
  }

  // Excluir dependente
  async deleteDependent(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id
      const { dependentId } = req.params

      if (!userId) {
        throw new AppError('Usuário não autenticado', 401)
      }

      const patient = await prisma.patient.findUnique({
        where: { userId },
      })

      if (!patient) {
        throw new AppError('Perfil de paciente não encontrado', 404)
      }

      // Verificar se o dependente pertence ao paciente
      const dependent = await prisma.dependent.findFirst({
        where: { id: dependentId, patientId: patient.id },
      })

      if (!dependent) {
        throw new AppError('Dependente não encontrado', 404)
      }

      await prisma.dependent.delete({
        where: { id: dependentId },
      })

      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }

  // Atualizar plano de saúde do paciente logado
  async updateMyHealthInsurance(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id
      const { healthInsuranceId, healthInsuranceNumber } = req.body

      if (!userId) {
        throw new AppError('Usuário não autenticado', 401)
      }

      // Verificar se a operadora existe
      if (healthInsuranceId) {
        const healthInsurance = await prisma.healthInsurance.findUnique({
          where: { id: healthInsuranceId },
        })

        if (!healthInsurance) {
          throw new AppError('Operadora de saúde não encontrada', 404)
        }
      }

      // Buscar paciente pelo userId
      const existingPatient = await prisma.patient.findUnique({
        where: { userId },
      })

      if (!existingPatient) {
        throw new AppError('Perfil de paciente não encontrado', 404)
      }

      // Atualizar dados do plano de saúde
      const patient = await prisma.patient.update({
        where: { userId },
        data: {
          healthInsuranceId,
          healthInsuranceNumber,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              cpf: true,
              phone: true,
            },
          },
          healthInsurance: {
            select: {
              id: true,
              name: true,
              cnpj: true,
              phone: true,
              email: true,
              website: true,
            },
          },
        },
      })

      res.json(patient)
    } catch (error) {
      next(error)
    }
  }
}
