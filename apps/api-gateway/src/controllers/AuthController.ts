import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { AppError } from '../middlewares/errorHandler'
import { prisma } from '../lib/prisma'
import { LoginDTO, CreateUserDTO, AuthResponse } from '@acolhe/shared-types'
import { emailVerificationService } from '../services/EmailVerificationService'
import { resendMailer } from '../services/ResendMailer'

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'

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

      // Login "100%" só com e-mail confirmado (verificação via Resend).
      if (!user.emailVerifiedAt && emailVerificationService.enforced) {
        throw new AppError(
          'E-mail ainda não verificado. Confira sua caixa de entrada ou solicite um novo link.',
          403
        )
      }

      // Se for paciente, buscar informações do plano de saúde
      let healthInsuranceWebsite: string | null = null
      if (user.role === 'PATIENT') {
        const patient = await prisma.patient.findUnique({
          where: { userId: user.id },
          include: {
            healthInsurance: {
              select: { website: true, name: true }
            }
          }
        })
        if (patient?.healthInsurance?.website) {
          healthInsuranceWebsite = patient.healthInsurance.website
        }
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

      const response: any = {
        user: userWithoutPassword as any,
        token,
        refreshToken,
        healthInsuranceWebsite,
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
        healthInsuranceId,
        lgpdConsent,
        lgpdConsentVersion,
        ...data
      } = req.body

      // LGPD: tratamento de dados de saúde exige consentimento explícito.
      if (lgpdConsent !== true) {
        throw new AppError(
          'É necessário aceitar a política de privacidade (LGPD) para criar a conta',
          400
        )
      }

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
          healthInsuranceId: healthInsuranceId || null,
          lgpdConsentAt: new Date(),
          lgpdConsentVersion: lgpdConsentVersion || '1.0',
          // Sem Resend configurada (dev), a conta nasce verificada
          emailVerifiedAt: emailVerificationService.enforced ? null : new Date(),
        } as any,
      })

      // Verificação de e-mail via Resend (não bloqueia o cadastro se falhar)
      if (emailVerificationService.enforced) {
        emailVerificationService
          .issueAndSend({ id: user.id, email: user.email, name: user.name })
          .catch((err) => console.error('[register] falha ao enviar verificação:', err))
      }

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
            healthInsuranceId: healthInsuranceId || null,
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
        requiresEmailVerification: emailVerificationService.enforced,
      }

      res.status(201).json(response)
    } catch (error) {
      next(error)
    }
  }

  /**
   * SSO Google: recebe o ID token do Google Identity Services, valida
   * junto ao Google e cria/vincula a conta. E-mail já chega verificado
   * pelo próprio Google — sem etapa Resend.
   */
  async googleSignIn(req: Request, res: Response, next: NextFunction) {
    try {
      const { credential } = req.body

      if (!credential || typeof credential !== 'string') {
        throw new AppError('Credencial Google não fornecida', 400)
      }

      // Validação do ID token direto no endpoint oficial do Google
      const tokenInfoResponse = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
      )

      if (!tokenInfoResponse.ok) {
        throw new AppError('Credencial Google inválida ou expirada', 401)
      }

      const payload = (await tokenInfoResponse.json()) as {
        aud?: string
        sub?: string
        email?: string
        email_verified?: string | boolean
        name?: string
        picture?: string
      }

      // Aceita múltiplos client IDs separados por vírgula (ex.: um para
      // localhost e outro para o deploy na Vercel)
      const allowedClientIds = (process.env.GOOGLE_CLIENT_ID || '')
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)

      if (allowedClientIds.length === 0) {
        throw new AppError('SSO Google não configurado no servidor (GOOGLE_CLIENT_ID)', 500)
      }

      if (!payload.aud || !allowedClientIds.includes(payload.aud)) {
        throw new AppError('Credencial Google não pertence a esta aplicação', 401)
      }

      if (!payload.email || !payload.sub) {
        throw new AppError('Credencial Google sem e-mail associado', 401)
      }

      if (payload.email_verified !== 'true' && payload.email_verified !== true) {
        throw new AppError('A conta Google não tem e-mail verificado', 401)
      }

      let user = await prisma.user.findUnique({
        where: { email: payload.email },
      })

      if (!user) {
        // Primeira entrada via Google: cria conta de paciente.
        // Senha aleatória — o acesso é sempre pelo SSO (ou via reset).
        user = await prisma.user.create({
          data: {
            email: payload.email,
            name: payload.name || payload.email.split('@')[0],
            password: await bcrypt.hash(crypto.randomUUID(), 10),
            role: 'PATIENT',
            googleId: payload.sub,
            avatarUrl: payload.picture || null,
            emailVerifiedAt: new Date(),
            lgpdConsentAt: new Date(),
            lgpdConsentVersion: '1.0',
          } as any,
        })
      } else {
        // Conta existente: vincula o Google e confirma o e-mail
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: user.googleId ?? payload.sub,
            avatarUrl: user.avatarUrl ?? payload.picture ?? null,
            emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
          } as any,
        })
      }

      if (user.status !== 'ACTIVE') {
        throw new AppError('Conta suspensa ou inativa', 403)
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

      res.json({
        user: userWithoutPassword,
        token,
        refreshToken,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Completa o perfil de contas criadas via SSO Google: categoria,
   * CPF, telefone e dados específicos do papel (nascimento para
   * pacientes, CRM/COREN e hospital para profissionais).
   */
  async completeProfile(req: any, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id

      if (!userId) {
        throw new AppError('Não autenticado', 401)
      }

      const {
        role,
        cpf,
        phone,
        dateOfBirth,
        bloodType,
        allergies,
        chronicConditions,
        emergencyContactName,
        emergencyContactPhone,
        emergencyContactRelationship,
        professionalLicense,
        hospitalId,
        healthInsuranceId,
      } = req.body

      if (!cpf || !/^\d{11}$/.test(cpf)) {
        throw new AppError('CPF inválido (11 dígitos)', 400)
      }

      if (!phone || !/^\d{10,11}$/.test(phone)) {
        throw new AppError('Telefone inválido', 400)
      }

      const existingCPF = await prisma.user.findUnique({ where: { cpf } })
      if (existingCPF && existingCPF.id !== userId) {
        throw new AppError('CPF já cadastrado em outra conta', 409)
      }

      const validRoles = [
        'PATIENT', 'DOCTOR', 'NURSE', 'RECEPTIONIST',
        'HOSPITAL_ADMIN', 'HEALTH_INSURANCE_ADMIN',
      ]
      const finalRole = role && validRoles.includes(role) ? role : 'PATIENT'

      if (finalRole === 'PATIENT' && !dateOfBirth) {
        throw new AppError('Data de nascimento é obrigatória para pacientes', 400)
      }

      if ((finalRole === 'DOCTOR' || finalRole === 'NURSE') && !professionalLicense) {
        throw new AppError(
          finalRole === 'DOCTOR' ? 'CRM é obrigatório para médicos' : 'COREN é obrigatório para enfermeiros',
          400
        )
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          cpf,
          phone,
          role: finalRole,
          professionalLicense: professionalLicense || null,
          hospitalId: hospitalId || null,
          healthInsuranceId: healthInsuranceId || null,
        } as any,
      })

      // Cria o prontuário do paciente se ainda não existir
      if (finalRole === 'PATIENT') {
        const existingPatient = await prisma.patient.findUnique({
          where: { userId },
        })

        if (!existingPatient) {
          await prisma.patient.create({
            data: {
              userId,
              dateOfBirth: new Date(dateOfBirth),
              bloodType: bloodType || null,
              allergies: allergies || [],
              chronicConditions: chronicConditions || [],
              emergencyContactName: emergencyContactName || '',
              emergencyContactPhone: emergencyContactPhone || '',
              emergencyContactRelationship: emergencyContactRelationship || '',
              healthInsuranceId: healthInsuranceId || null,
            } as any,
          })
        }
      }

      // Reemite o JWT — o papel pode ter mudado
      const secret = process.env.JWT_SECRET
      const refreshSecret = process.env.JWT_REFRESH_SECRET

      if (!secret || !refreshSecret) {
        throw new AppError('JWT secrets not configured', 500)
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name, role: user.role },
        secret,
        { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
      )

      const refreshToken = jwt.sign(
        { id: user.id },
        refreshSecret,
        { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '30d') as any }
      )

      const { password: _, ...userWithoutPassword } = user

      res.json({ user: userWithoutPassword, token, refreshToken })
    } catch (error) {
      next(error)
    }
  }

  /** Confirma o e-mail a partir do token enviado via Resend. */
  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body

      if (!token || typeof token !== 'string') {
        throw new AppError('Token de verificação não fornecido', 400)
      }

      await emailVerificationService.confirm(token)

      res.json({ message: 'E-mail verificado com sucesso! Você já pode entrar.' })
    } catch (error) {
      next(error)
    }
  }

  /** Reenvia o link de verificação (resposta neutra por segurança). */
  async resendVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body

      if (!email) {
        throw new AppError('Email é obrigatório', 400)
      }

      const user = await prisma.user.findUnique({ where: { email } })

      if (user && !user.emailVerifiedAt && emailVerificationService.enforced) {
        await emailVerificationService.issueAndSend({
          id: user.id,
          email: user.email,
          name: user.name,
        })
      }

      res.json({
        message: 'Se o e-mail estiver cadastrado e pendente, um novo link foi enviado.',
      })
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

        const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`

        if (resendMailer.isConfigured) {
          await resendMailer.send({
            to: user.email,
            subject: 'Redefinição de senha — Acolhe',
            html: `
              <div style="font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: linear-gradient(160deg, #F0FAF8, #E6F4F1); border-radius: 16px; border: 1px solid #CBE8E2;">
                <h1 style="color: #0E7268; font-size: 22px; margin: 0 0 8px;">Acolhe</h1>
                <p style="color: #182B30; font-size: 15px; line-height: 1.6;">
                  Olá, <strong>${user.name}</strong>! Recebemos um pedido para redefinir sua senha.
                </p>
                <p style="text-align: center; margin: 28px 0;">
                  <a href="${resetLink}"
                     style="display: inline-block; padding: 12px 32px; background: linear-gradient(160deg, #1B9C8C, #0E7268); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600;">
                    Redefinir senha
                  </a>
                </p>
                <p style="color: #4A6067; font-size: 12px; line-height: 1.5;">
                  O link vale por 1 hora. Se você não pediu a redefinição, ignore esta mensagem.
                </p>
              </div>
            `,
          })
        } else {
          console.log(`[RESET PASSWORD] Link (dev): ${resetLink}`)
        }
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

  /**
   * LGPD — portabilidade (art. 18, V): exporta todos os dados pessoais
   * do titular autenticado em formato estruturado.
   */
  async exportMyData(req: any, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id

      if (!userId) {
        throw new AppError('Usuário não autenticado', 401)
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          patient: {
            include: {
              dependents: true,
              queueEntries: true,
              appointments: true,
            },
          },
          notifications: true,
          healthInsurance: {
            select: { name: true, cnpj: true },
          },
        },
      })

      if (!user) {
        throw new AppError('Usuário não encontrado', 404)
      }

      const { password: _password, ...userData } = user as any

      res.setHeader('Content-Disposition', 'attachment; filename="meus-dados-acolhe.json"')
      res.json({
        exportedAt: new Date(),
        legalBasis: 'LGPD art. 18, V — portabilidade dos dados',
        data: userData,
      })
    } catch (error) {
      next(error)
    }
  }

  /** LGPD — atualização/registro de consentimento do titular autenticado. */
  async updateConsent(req: any, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id
      const { lgpdConsent, lgpdConsentVersion } = req.body

      if (!userId) {
        throw new AppError('Usuário não autenticado', 401)
      }

      if (lgpdConsent !== true) {
        throw new AppError('Consentimento inválido', 400)
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          lgpdConsentAt: new Date(),
          lgpdConsentVersion: lgpdConsentVersion || '1.0',
        },
        select: {
          id: true,
          lgpdConsentAt: true,
          lgpdConsentVersion: true,
        },
      })

      res.json(user)
    } catch (error) {
      next(error)
    }
  }
}
