import { Request, Response, NextFunction } from 'express'
import { AuthRequest } from '../middlewares/auth'
import { AppError } from '../middlewares/errorHandler'
import { prisma } from '../lib/prisma'
import { UpdateUserDTO } from '@medgo/shared-types'

export class UserController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10, search } = req.query

      const where = search
        ? {
            OR: [
              { name: { contains: search as string, mode: 'insensitive' as const } },
              { email: { contains: search as string, mode: 'insensitive' as const } },
              { cpf: { contains: search as string } },
            ],
          }
        : {}

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          select: {
            id: true,
            email: true,
            name: true,
            cpf: true,
            phone: true,
            role: true,
            status: true,
            hospitalId: true,
            healthInsuranceId: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.user.count({ where }),
      ])

      res.json({
        data: users,
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

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          cpf: true,
          phone: true,
          role: true,
          status: true,
          hospitalId: true,
          healthInsuranceId: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      if (!user) {
        throw new AppError('Usuário não encontrado', 404)
      }

      res.json(user)
    } catch (error) {
      next(error)
    }
  }

  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Usuário não autenticado', 401)
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          cpf: true,
          phone: true,
          role: true,
          status: true,
          hospitalId: true,
          healthInsuranceId: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      if (!user) {
        throw new AppError('Usuário não encontrado', 404)
      }

      res.json(user)
    } catch (error) {
      next(error)
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const data = req.body as UpdateUserDTO

      const user = await prisma.user.update({
        where: { id },
        data,
        select: {
          id: true,
          email: true,
          name: true,
          cpf: true,
          phone: true,
          role: true,
          status: true,
          hospitalId: true,
          healthInsuranceId: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      res.json(user)
    } catch (error) {
      next(error)
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params

      await prisma.user.delete({
        where: { id },
      })

      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }
}
