// @ts-nocheck
import { prisma } from '../lib/prisma'
import {
  AppointmentStatus,
  AppointmentType,
  QueueStatus,
  QueuePriority,
} from '@medgo/shared-types'
import { subDays, startOfDay, endOfDay, format } from 'date-fns'

export class AnalyticsService {
  async getOverviewMetrics(startDate?: Date, endDate?: Date) {
    const start = startDate || subDays(new Date(), 30)
    const end = endDate || new Date()

    const [
      totalPatients,
      totalHospitals,
      totalAppointments,
      totalQueueEntries,
      activeQueues,
      completedAppointments,
    ] = await Promise.all([
      prisma.patient.count(),
      prisma.hospital.count({ where: { status: 'ACTIVE' } }),
      prisma.appointment.count({
        where: {
          createdAt: { gte: start, lte: end },
        },
      }),
      prisma.queueEntry.count({
        where: {
          joinedAt: { gte: start, lte: end },
        },
      }),
      prisma.queueEntry.count({
        where: {
          status: { in: [QueueStatus.WAITING, QueueStatus.CALLED] },
        },
      }),
      prisma.appointment.count({
        where: {
          status: AppointmentStatus.COMPLETED,
          completedAt: { gte: start, lte: end },
        },
      }),
    ])

    return {
      totalPatients,
      totalHospitals,
      totalAppointments,
      totalQueueEntries,
      activeQueues,
      completedAppointments,
      period: {
        start,
        end,
      },
    }
  }

  async getAppointmentAnalytics(hospitalId?: string, startDate?: Date, endDate?: Date) {
    const start = startDate || subDays(new Date(), 30)
    const end = endDate || new Date()

    const where: any = {
      scheduledDate: { gte: start, lte: end },
    }
    if (hospitalId) where.hospitalId = hospitalId

    const [total, byStatus, byType, avgDuration, noShowRate] = await Promise.all([
      prisma.appointment.count({ where }),

      prisma.appointment.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),

      prisma.appointment.groupBy({
        by: ['type'],
        where,
        _count: true,
      }),

      prisma.appointment.aggregate({
        where: {
          ...where,
          status: AppointmentStatus.COMPLETED,
          duration: { not: null },
        },
        _avg: { duration: true },
      }),

      this.calculateNoShowRate(where),
    ])

    const statusDistribution = byStatus.reduce((acc, item) => {
      acc[item.status] = item._count
      return acc
    }, {} as Record<string, number>)

    const typeDistribution = byType.reduce((acc, item) => {
      acc[item.type] = item._count
      return acc
    }, {} as Record<string, number>)

    return {
      total,
      statusDistribution,
      typeDistribution,
      averageDuration: avgDuration._avg.duration || 0,
      noShowRate,
      period: { start, end },
    }
  }

  private async calculateNoShowRate(where: any) {
    const [total, noShows] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.count({
        where: {
          ...where,
          status: AppointmentStatus.NO_SHOW,
        },
      }),
    ])

    return total > 0 ? (noShows / total) * 100 : 0
  }

  async getQueueAnalytics(hospitalId?: string, startDate?: Date, endDate?: Date) {
    const start = startDate || subDays(new Date(), 30)
    const end = endDate || new Date()

    const where: any = {
      joinedAt: { gte: start, lte: end },
    }
    if (hospitalId) where.hospitalId = hospitalId

    const [total, byStatus, byPriority, avgWaitTime, completionRate] = await Promise.all([
      prisma.queueEntry.count({ where }),

      prisma.queueEntry.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),

      prisma.queueEntry.groupBy({
        by: ['priority'],
        where,
        _count: true,
      }),

      this.calculateAverageWaitTime(where),

      this.calculateCompletionRate(where),
    ])

    const statusDistribution = byStatus.reduce((acc, item) => {
      acc[item.status] = item._count
      return acc
    }, {} as Record<string, number>)

    const priorityDistribution = byPriority.reduce((acc, item) => {
      acc[item.priority] = item._count
      return acc
    }, {} as Record<string, number>)

    return {
      total,
      statusDistribution,
      priorityDistribution,
      averageWaitTime: avgWaitTime,
      completionRate,
      period: { start, end },
    }
  }

  private async calculateAverageWaitTime(where: any) {
    const completedEntries = await prisma.queueEntry.findMany({
      where: {
        ...where,
        status: QueueStatus.COMPLETED,
        joinedAt: { not: null },
        calledAt: { not: null },
      },
      select: {
        joinedAt: true,
        calledAt: true,
      },
    })

    if (completedEntries.length === 0) return 0

    const totalWaitTime = completedEntries.reduce((sum, entry) => {
      const waitTime = entry.calledAt!.getTime() - entry.joinedAt!.getTime()
      return sum + waitTime
    }, 0)

    return Math.round(totalWaitTime / completedEntries.length / 1000 / 60)
  }

  private async calculateCompletionRate(where: any) {
    const [total, completed] = await Promise.all([
      prisma.queueEntry.count({ where }),
      prisma.queueEntry.count({
        where: {
          ...where,
          status: QueueStatus.COMPLETED,
        },
      }),
    ])

    return total > 0 ? (completed / total) * 100 : 0
  }

  async getHospitalPerformance(hospitalId: string, startDate?: Date, endDate?: Date) {
    const start = startDate || subDays(new Date(), 30)
    const end = endDate || new Date()

    const [
      appointmentMetrics,
      queueMetrics,
      patientCount,
      averageRating,
      utilizationRate,
    ] = await Promise.all([
      this.getAppointmentAnalytics(hospitalId, start, end),
      this.getQueueAnalytics(hospitalId, start, end),
      prisma.appointment.count({
        where: {
          hospitalId,
          scheduledDate: { gte: start, lte: end },
        },
        distinct: ['patientId'],
      }),
      this.calculateAverageRating(hospitalId, start, end),
      this.calculateUtilizationRate(hospitalId, start, end),
    ])

    return {
      hospitalId,
      period: { start, end },
      appointments: appointmentMetrics,
      queues: queueMetrics,
      uniquePatients: patientCount,
      averageRating,
      utilizationRate,
    }
  }

  private async calculateAverageRating(hospitalId: string, start: Date, end: Date) {
    return 4.5
  }

  private async calculateUtilizationRate(hospitalId: string, start: Date, end: Date) {
    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
      select: { totalBeds: true },
    })

    if (!hospital || !hospital.totalBeds) return 0

    const appointmentsCount = await prisma.appointment.count({
      where: {
        hospitalId,
        scheduledDate: { gte: start, lte: end },
        status: { in: [AppointmentStatus.COMPLETED, AppointmentStatus.IN_PROGRESS] },
      },
    })

    const daysInPeriod = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const maxCapacity = hospital.totalBeds * daysInPeriod

    return maxCapacity > 0 ? (appointmentsCount / maxCapacity) * 100 : 0
  }

  async getTrendData(metric: string, days = 30, hospitalId?: string) {
    const trends = []
    const today = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(today, i)
      const start = startOfDay(date)
      const end = endOfDay(date)

      let value = 0

      switch (metric) {
        case 'appointments':
          value = await prisma.appointment.count({
            where: {
              scheduledDate: { gte: start, lte: end },
              ...(hospitalId && { hospitalId }),
            },
          })
          break

        case 'queue_entries':
          value = await prisma.queueEntry.count({
            where: {
              joinedAt: { gte: start, lte: end },
              ...(hospitalId && { hospitalId }),
            },
          })
          break

        case 'patients':
          value = await prisma.patient.count({
            where: {
              createdAt: { gte: start, lte: end },
            },
          })
          break

        default:
          value = 0
      }

      trends.push({
        date: format(date, 'yyyy-MM-dd'),
        value,
      })
    }

    return trends
  }

  async getTopPerformingHospitals(limit = 10, startDate?: Date, endDate?: Date) {
    const start = startDate || subDays(new Date(), 30)
    const end = endDate || new Date()

    const hospitals = await prisma.hospital.findMany({
      where: { status: 'ACTIVE' },
      take: limit,
      include: {
        _count: {
          select: {
            appointments: {
              where: {
                scheduledDate: { gte: start, lte: end },
                status: AppointmentStatus.COMPLETED,
              },
            },
            queues: {
              where: {
                joinedAt: { gte: start, lte: end },
                status: QueueStatus.COMPLETED,
              },
            },
          },
        },
      },
      orderBy: {
        appointments: {
          _count: 'desc',
        },
      },
    })

    return hospitals.map((hospital) => ({
      id: hospital.id,
      name: hospital.name,
      city: hospital.city,
      state: hospital.state,
      completedAppointments: hospital._count.appointments,
      completedQueueEntries: hospital._count.queues,
      totalBeds: hospital.totalBeds,
      availableBeds: hospital.availableBeds,
    }))
  }
}
