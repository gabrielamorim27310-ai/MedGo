import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { AppError } from '../middlewares/errorHandler'
import { prisma } from '../lib/prisma'
import { LoginDTO, CreateUserDTO, AuthResponse } from '@medgo/shared-types'

// Armazenamento temporário de tokens de reset (em produção, usar Redis ou banco de dados)
const resetTokens = new Map<string, { email: string; expiresAt: Date }>()

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body as LoginDTO

      const user = await prisma.user.findUnique({
        where: { email },
      })

      if (!user) {
        throw new AppError('Email ou senha inválidos', 401)
      }

      const isPasswordValid = await bcrypt.compare(password, user.password)

      if (!isPasswordValid) {
        throw new AppError('Email ou senha inválidos', 401)
      }

      const secret = process.env.JWT_SECRET
      const refreshSecret = process.env.JWT_REFRESH_SECRET

      if (!secret || !refreshSecret) {
        throw new AppError('JWT secrets not configured', 500)
      }

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        secret,
        { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
      )

      const refreshToken = jwt.sign(
        { id: user.id },
        refreshSecret,
        { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '30d') as any }
      )

      const { password: _, ...userWithoutPassword } = user

      const response: AuthResponse = {
        user: userWithoutPassword as any,
        token,
        refreshToken,
      }

      res.json(response)
    } catch (error) {
      next(error)
    }
  }

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        dateOfBirth,
        bloodType,
        allergies,
        chronicConditions,
        emergencyContactName,
        emergencyContactPhone,
        emergencyContactRelationship,
        healthInsuranceNumber,
        ...data
      } = req.body

      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      })

      if (existingUser) {
        throw new AppError('Email já cadastrado', 409)
      }

      const existingCPF = await prisma.user.findUnique({
        where: { cpf: data.cpf },
      })

      if (existingCPF) {
        throw new AppError('CPF já cadastrado', 409)
      }

      const hashedPassword = await bcrypt.hash(data.password, 10)

      const user = await prisma.user.create({
        data: {
          ...data,
          password: hashedPassword,
        } as any,
      })

      // Se for paciente, criar registro de Patient
      if (data.role === 'PATIENT' && dateOfBirth) {
        await prisma.patient.create({
          data: {
            userId: user.id,
            dateOfBirth: new Date(dateOfBirth),
            bloodType: bloodType || null,
            allergies: allergies || [],
            chronicConditions: chronicConditions || [],
            emergencyContactName: emergencyContactName || '',
            emergencyContactPhone: emergencyContactPhone || '',
            emergencyContactRelationship: emergencyContactRelationship || '',
            healthInsuranceNumber: healthInsuranceNumber || null,
          } as any,
        })
      }

      const secret = process.env.JWT_SECRET
      const refreshSecret = process.env.JWT_REFRESH_SECRET

      if (!secret || !refreshSecret) {
        throw new AppError('JWT secrets not configured', 500)
      }

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        secret,
        { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
      )

      const refreshToken = jwt.sign(
        { id: user.id },
        refreshSecret,
        { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '30d') as any }
      )

      const { password: _, ...userWithoutPassword } = user

      const response: AuthResponse = {
        user: userWithoutPassword as any,
        token,
        refreshToken,
      }

      res.status(201).json(response)
    } catch (error) {
      next(error)
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body

      if (!refreshToken) {
        throw new AppError('Refresh token não fornecido', 401)
      }

      const refreshSecret = process.env.JWT_REFRESH_SECRET
      const secret = process.env.JWT_SECRET

      if (!secret || !refreshSecret) {
        throw new AppError('JWT secrets not configured', 500)
      }

      const decoded = jwt.verify(refreshToken, refreshSecret) as { id: string }

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      })

      if (!user) {
        throw new AppError('Usuário não encontrado', 404)
      }

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        secret,
        { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
      )

      const newRefreshToken = jwt.sign(
        { id: user.id },
        refreshSecret,
        { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '30d') as any }
      )

      res.json({
        token,
        refreshToken: newRefreshToken,
      })
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        next(new AppError('Refresh token inválido', 401))
      } else {
        next(error)
      }
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ message: 'Logout realizado com sucesso' })
    } catch (error) {
      next(error)
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body

      if (!email) {
        throw new AppError('Email é obrigatório', 400)
      }

      const user = await prisma.user.findUnique({
        where: { email },
      })

      // Por segurança, sempre retornamos sucesso mesmo se o email não existir
      if (user) {
        // Gerar token de reset
        const resetToken = crypto.randomBytes(32).toString('hex')
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

        // Armazenar token (em produção, salvar no banco ou Redis)
        resetTokens.set(resetToken, { email: user.email, expiresAt })

        // Em produção, enviar email com o link de reset
        // Por enquanto, logamos o token para teste
        console.log(`[RESET PASSWORD] Token para ${email}: ${resetToken}`)
        console.log(`[RESET PASSWORD] Link: http://localhost:3000/reset-password?token=${resetToken}`)
      }

      res.json({
        message: 'Se o email estiver cadastrado, você receberá um link para redefinir sua senha.'
      })
    } catch (error) {
      next(error)
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, newPassword } = req.body

      if (!token || !newPassword) {
        throw new AppError('Token e nova senha são obrigatórios', 400)
      }

      if (newPassword.length < 6) {
        throw new AppError('Senha deve ter no mínimo 6 caracteres', 400)
      }

      const resetData = resetTokens.get(token)

      if (!resetData) {
        throw new AppError('Token inválido ou expirado', 400)
      }

      if (new Date() > resetData.expiresAt) {
        resetTokens.delete(token)
        throw new AppError('Token expirado', 400)
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10)

      await prisma.user.update({
        where: { email: resetData.email },
        data: { password: hashedPassword },
      })

      // Remover token usado
      resetTokens.delete(token)

      res.json({ message: 'Senha alterada com sucesso' })
    } catch (error) {
      next(error)
    }
  }
}
