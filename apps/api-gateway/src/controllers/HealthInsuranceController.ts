import { Request, Response, NextFunction } from 'express'
import { AppError } from '../middlewares/errorHandler'
import { prisma } from '../lib/prisma'

export class HealthInsuranceController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10, search } = req.query

      const where: any = {}

      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' as const } },
          { cnpj: { contains: search as string } },
        ]
      }

      const [healthInsurances, total] = await Promise.all([
        prisma.healthInsurance.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          include: {
            plans: true,
            _count: {
              select: { patients: true }
            }
          }
        }),
        prisma.healthInsurance.count({ where }),
      ])

      res.json({
        data: healthInsurances,
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

      const healthInsurance = await prisma.healthInsurance.findUnique({
        where: { id },
        include: {
          plans: true,
          _count: {
            select: { patients: true }
          }
        }
      })

      if (!healthInsurance) {
        throw new AppError('Plano de saúde não encontrado', 404)
      }

      res.json(healthInsurance)
    } catch (error) {
      next(error)
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body

      const existingCNPJ = await prisma.healthInsurance.findUnique({
        where: { cnpj: data.cnpj },
      })

      if (existingCNPJ) {
        throw new AppError('CNPJ já cadastrado', 409)
      }

      const healthInsurance = await prisma.healthInsurance.create({
        data,
      })

      res.status(201).json(healthInsurance)
    } catch (error) {
      next(error)
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const data = req.body

      const healthInsurance = await prisma.healthInsurance.update({
        where: { id },
        data,
      })

      res.json(healthInsurance)
    } catch (error) {
      next(error)
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params

      await prisma.healthInsurance.delete({
        where: { id },
      })

      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }

  // Plans management
  async listPlans(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params

      const plans = await prisma.healthInsurancePlan.findMany({
        where: { healthInsuranceId: id },
      })

      res.json({ data: plans })
    } catch (error) {
      next(error)
    }
  }

  async createPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const data = req.body

      const existingCode = await prisma.healthInsurancePlan.findUnique({
        where: { code: data.code },
      })

      if (existingCode) {
        throw new AppError('Código do plano já existe', 409)
      }

      const plan = await prisma.healthInsurancePlan.create({
        data: {
          ...data,
          healthInsuranceId: id,
        },
      })

      res.status(201).json(plan)
    } catch (error) {
      next(error)
    }
  }

  async updatePlan(req: Request, res: Response, next: NextFunction) {
    try {
      const { planId } = req.params
      const data = req.body

      const plan = await prisma.healthInsurancePlan.update({
        where: { id: planId },
        data,
      })

      res.json(plan)
    } catch (error) {
      next(error)
    }
  }

  async deletePlan(req: Request, res: Response, next: NextFunction) {
    try {
      const { planId } = req.params

      await prisma.healthInsurancePlan.delete({
        where: { id: planId },
      })

      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }
}
