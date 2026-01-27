import { Request, Response, NextFunction } from 'express'
import { AppError } from '../middlewares/errorHandler'
import { prisma } from '../lib/prisma'
import { CreateHospitalDTO, UpdateHospitalDTO } from '@medgo/shared-types'

export class HospitalController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10, search, type, status } = req.query

      const where: any = {}

      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' as const } },
          { cnpj: { contains: search as string } },
        ]
      }

      if (type) {
        where.type = type
      }

      if (status) {
        where.status = status
      }

      const [hospitals, total] = await Promise.all([
        prisma.hospital.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
        }),
        prisma.hospital.count({ where }),
      ])

      res.json({
        data: hospitals,
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

      const hospital = await prisma.hospital.findUnique({
        where: { id },
      })

      if (!hospital) {
        throw new AppError('Hospital não encontrado', 404)
      }

      res.json(hospital)
    } catch (error) {
      next(error)
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body as CreateHospitalDTO

      const existingCNPJ = await prisma.hospital.findUnique({
        where: { cnpj: data.cnpj },
      })

      if (existingCNPJ) {
        throw new AppError('CNPJ já cadastrado', 409)
      }

      const hospital = await prisma.hospital.create({
        data,
      })

      res.status(201).json(hospital)
    } catch (error) {
      next(error)
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const data = req.body as UpdateHospitalDTO

      const hospital = await prisma.hospital.update({
        where: { id },
        data,
      })

      res.json(hospital)
    } catch (error) {
      next(error)
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params

      await prisma.hospital.delete({
        where: { id },
      })

      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }
}
