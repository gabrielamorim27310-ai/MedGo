import { Request, Response, NextFunction } from 'express'
import { AppError } from '../middlewares/errorHandler'
import { prisma } from '../lib/prisma'
import { CreateHospitalDTO, UpdateHospitalDTO, NearbyHospital, QueueStatus } from '@acolhe/shared-types'

const EARTH_RADIUS_KM = 6371

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a))
}

export class HospitalController {
  /**
   * Recomendação de unidades conveniadas por geolocalização: combina
   * distância (Haversine) com a situação da fila em tempo real de cada
   * unidade e devolve as melhores opções, com links prontos para
   * Maps/Waze.
   */
  async nearby(req: Request, res: Response, next: NextFunction) {
    try {
      const latitude = Number(req.query.latitude)
      const longitude = Number(req.query.longitude)
      const radiusKm = Number(req.query.radiusKm) || 25
      const limit = Number(req.query.limit) || 10
      const specialty = req.query.specialty as string | undefined
      const healthInsuranceId = req.query.healthInsuranceId as string | undefined

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new AppError('latitude e longitude são obrigatórios', 400)
      }

      const where: any = {
        status: 'ACTIVE',
        latitude: { not: null },
        longitude: { not: null },
      }

      if (specialty) {
        where.specialties = { has: specialty }
      }

      const hospitals = await prisma.hospital.findMany({ where })

      const insurance = healthInsuranceId
        ? await prisma.healthInsurance.findUnique({
            where: { id: healthInsuranceId },
            select: { id: true, name: true },
          })
        : null

      const withinRadius = hospitals
        .map((h) => ({
          hospital: h,
          distanceKm: haversineKm(latitude, longitude, h.latitude!, h.longitude!),
        }))
        .filter((item) => item.distanceKm <= radiusKm)

      if (withinRadius.length === 0) {
        res.json({ data: [], radiusKm, message: 'Nenhuma unidade encontrada no raio informado' })
        return
      }

      // Situação da fila de todas as unidades candidatas em uma única consulta.
      const queueAggregates = await prisma.queueEntry.groupBy({
        by: ['hospitalId'],
        where: {
          hospitalId: { in: withinRadius.map((item) => item.hospital.id) },
          status: QueueStatus.WAITING,
        },
        _count: true,
        _avg: { estimatedWaitTime: true },
      })

      const queueByHospital = new Map(
        queueAggregates.map((agg) => [
          agg.hospitalId,
          {
            totalWaiting: agg._count,
            avgWait: Math.round(agg._avg.estimatedWaitTime ?? 0),
          },
        ])
      )

      const maxWaitReference = 240

      const recommendations: NearbyHospital[] = withinRadius
        .map(({ hospital, distanceKm }) => {
          const queue = queueByHospital.get(hospital.id) ?? { totalWaiting: 0, avgWait: 0 }
          const acceptsInsurance = insurance
            ? hospital.acceptedHealthInsurances.includes(insurance.id) ||
              hospital.acceptedHealthInsurances.includes(insurance.name)
            : true

          const distanceScore = distanceKm / radiusKm
          const waitScore = Math.min(queue.avgWait / maxWaitReference, 1)
          const insurancePenalty = acceptsInsurance ? 0 : 1

          return {
            id: hospital.id,
            name: hospital.name,
            type: hospital.type,
            distanceKm: Math.round(distanceKm * 10) / 10,
            estimatedWaitTime: queue.avgWait,
            totalWaiting: queue.totalWaiting,
            acceptsInsurance,
            emergency24h: hospital.emergency24h,
            latitude: hospital.latitude!,
            longitude: hospital.longitude!,
            address: `${hospital.street}, ${hospital.number} - ${hospital.neighborhood}, ${hospital.city}/${hospital.state}`,
            phone: hospital.phone,
            specialties: hospital.specialties,
            recommendationScore:
              Math.round((0.45 * distanceScore + 0.45 * waitScore + 0.1 * insurancePenalty) * 1000) / 1000,
            mapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`,
            wazeUrl: `https://waze.com/ul?ll=${hospital.latitude},${hospital.longitude}&navigate=yes`,
          }
        })
        .sort((a, b) => a.recommendationScore - b.recommendationScore)
        .slice(0, limit)

      res.json({ data: recommendations, radiusKm, total: recommendations.length })
    } catch (error) {
      next(error)
    }
  }

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
