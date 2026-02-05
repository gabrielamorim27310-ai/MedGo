import { Request, Response, NextFunction } from 'express'
import { AppError } from '../middlewares/errorHandler'
import { prisma } from '../lib/prisma'
import crypto from 'crypto'

// Armazenamento temporário de estados OAuth (em produção, usar Redis)
const oauthStates = new Map<string, { healthInsuranceId: string; expiresAt: Date }>()

export class HealthInsuranceController {
  // Public endpoint for registration page - lists only OAuth-enabled insurances
  async listPublic(req: Request, res: Response, next: NextFunction) {
    try {
      const healthInsurances = await prisma.healthInsurance.findMany({
        where: {
          status: 'ACTIVE',
          oauthEnabled: true,
        },
        select: {
          id: true,
          name: true,
          website: true,
          oauthEnabled: true,
        },
        orderBy: { name: 'asc' },
      })

      res.json({ data: healthInsurances })
    } catch (error) {
      next(error)
    }
  }

  // Initiate OAuth flow - returns the authorization URL
  async initiateOAuth(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params

      const healthInsurance = await prisma.healthInsurance.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          oauthEnabled: true,
          oauthClientId: true,
          oauthAuthUrl: true,
          oauthScope: true,
          oauthRedirectUri: true,
          website: true,
        },
      })

      if (!healthInsurance) {
        throw new AppError('Plano de saúde não encontrado', 404)
      }

      if (!healthInsurance.oauthEnabled || !healthInsurance.oauthAuthUrl) {
        // Se não tem OAuth, retorna o website para redirect simples
        if (healthInsurance.website) {
          return res.json({
            type: 'redirect',
            url: healthInsurance.website,
            healthInsurance: {
              id: healthInsurance.id,
              name: healthInsurance.name,
            },
          })
        }
        throw new AppError('Plano de saúde não possui integração OAuth configurada', 400)
      }

      // Gerar state para proteção CSRF
      const state = crypto.randomBytes(32).toString('hex')
      oauthStates.set(state, {
        healthInsuranceId: healthInsurance.id,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutos
      })

      // Construir URL de autorização
      const authUrl = new URL(healthInsurance.oauthAuthUrl)
      authUrl.searchParams.set('client_id', healthInsurance.oauthClientId || '')
      authUrl.searchParams.set('redirect_uri', healthInsurance.oauthRedirectUri || '')
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('scope', healthInsurance.oauthScope || 'openid profile email')
      authUrl.searchParams.set('state', state)

      res.json({
        type: 'oauth',
        authUrl: authUrl.toString(),
        state,
        healthInsurance: {
          id: healthInsurance.id,
          name: healthInsurance.name,
        },
      })
    } catch (error) {
      next(error)
    }
  }

  // Handle OAuth callback
  async handleOAuthCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, state, error: oauthError } = req.query

      if (oauthError) {
        throw new AppError(`Erro OAuth: ${oauthError}`, 400)
      }

      if (!code || !state) {
        throw new AppError('Código ou state não fornecido', 400)
      }

      const stateData = oauthStates.get(state as string)
      if (!stateData) {
        throw new AppError('State inválido ou expirado', 400)
      }

      if (new Date() > stateData.expiresAt) {
        oauthStates.delete(state as string)
        throw new AppError('State expirado', 400)
      }

      const healthInsurance = await prisma.healthInsurance.findUnique({
        where: { id: stateData.healthInsuranceId },
        select: {
          id: true,
          name: true,
          oauthClientId: true,
          oauthClientSecret: true,
          oauthTokenUrl: true,
          oauthUserInfoUrl: true,
          oauthRedirectUri: true,
        },
      })

      if (!healthInsurance || !healthInsurance.oauthTokenUrl) {
        throw new AppError('Configuração OAuth inválida', 500)
      }

      // Trocar código por token
      const tokenResponse = await fetch(healthInsurance.oauthTokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: healthInsurance.oauthClientId || '',
          client_secret: healthInsurance.oauthClientSecret || '',
          code: code as string,
          redirect_uri: healthInsurance.oauthRedirectUri || '',
        }),
      })

      if (!tokenResponse.ok) {
        throw new AppError('Erro ao obter token do plano de saúde', 500)
      }

      const tokenData = await tokenResponse.json()

      // Obter informações do usuário
      let userInfo: any = {}
      if (healthInsurance.oauthUserInfoUrl && tokenData.access_token) {
        const userInfoResponse = await fetch(healthInsurance.oauthUserInfoUrl, {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        })

        if (userInfoResponse.ok) {
          userInfo = await userInfoResponse.json()
        }
      }

      // Limpar state usado
      oauthStates.delete(state as string)

      // Retornar dados do usuário para o frontend preencher o formulário
      res.json({
        success: true,
        healthInsuranceId: healthInsurance.id,
        healthInsuranceName: healthInsurance.name,
        userData: {
          name: userInfo.name || userInfo.given_name && userInfo.family_name
            ? `${userInfo.given_name} ${userInfo.family_name}`
            : null,
          email: userInfo.email || null,
          cpf: userInfo.cpf || userInfo.tax_id || null,
          phone: userInfo.phone || userInfo.phone_number || null,
          dateOfBirth: userInfo.birthdate || userInfo.date_of_birth || null,
          healthInsuranceNumber: userInfo.member_id || userInfo.insurance_number || userInfo.subscriber_id || null,
        },
      })
    } catch (error) {
      next(error)
    }
  }
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
