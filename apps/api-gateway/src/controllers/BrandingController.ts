import { Request, Response, NextFunction } from 'express'
import { AppError } from '../middlewares/errorHandler'
import { prisma } from '../lib/prisma'
import { UpsertBrandingDTO } from '@acolhe/shared-types'

/**
 * White-label B2B: cada hospital ou operadora contratante recebe um slug
 * com logo, cores e nome próprios. O endpoint público é consumido pelo
 * frontend para tematizar a interface do tenant.
 */
export class BrandingController {
  // Público — usado pelo frontend do tenant (ex.: acolhe.app/h/santa-casa)
  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params

      const branding = await prisma.brandingConfig.findUnique({
        where: { slug },
      })

      if (!branding || !branding.active) {
        throw new AppError('Configuração de marca não encontrada', 404)
      }

      res.json(branding)
    } catch (error) {
      next(error)
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const brandings = await prisma.brandingConfig.findMany({
        orderBy: { displayName: 'asc' },
      })
      res.json({ data: brandings })
    } catch (error) {
      next(error)
    }
  }

  async upsert(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body as UpsertBrandingDTO

      if (!data.slug || !data.displayName) {
        throw new AppError('slug e displayName são obrigatórios', 400)
      }

      if (!/^[a-z0-9-]{3,50}$/.test(data.slug)) {
        throw new AppError('slug deve conter apenas letras minúsculas, números e hífens', 400)
      }

      const branding = await prisma.brandingConfig.upsert({
        where: { slug: data.slug },
        create: {
          slug: data.slug,
          displayName: data.displayName,
          tagline: data.tagline,
          logoUrl: data.logoUrl,
          primaryColor: data.primaryColor ?? '#16736B',
          accentColor: data.accentColor ?? '#C98A2D',
          backgroundColor: data.backgroundColor ?? '#F4EFE6',
          hospitalId: data.hospitalId,
          healthInsuranceId: data.healthInsuranceId,
          active: data.active ?? true,
        },
        update: {
          displayName: data.displayName,
          tagline: data.tagline,
          logoUrl: data.logoUrl,
          ...(data.primaryColor && { primaryColor: data.primaryColor }),
          ...(data.accentColor && { accentColor: data.accentColor }),
          ...(data.backgroundColor && { backgroundColor: data.backgroundColor }),
          ...(data.hospitalId !== undefined && { hospitalId: data.hospitalId }),
          ...(data.healthInsuranceId !== undefined && { healthInsuranceId: data.healthInsuranceId }),
          ...(data.active !== undefined && { active: data.active }),
        },
      })

      res.status(201).json(branding)
    } catch (error) {
      next(error)
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params

      await prisma.brandingConfig.delete({
        where: { slug },
      })

      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }
}
