import { Server } from 'socket.io'
import { QueueEntry, QueuePriority, QueueStatus } from '@medgo/shared-types'
import { prisma } from '../lib/prisma'
import { RedisCache } from './RedisCache'

export class QueueManager {
  private io: Server
  private cache: RedisCache

  constructor(io: Server) {
    this.io = io
    this.cache = new RedisCache()
  }

  async addToQueue(queueEntry: Partial<QueueEntry>): Promise<QueueEntry> {
    const position = await this.calculatePosition(
      queueEntry.hospitalId!,
      queueEntry.priority!
    )

    const estimatedWaitTime = await this.calculateEstimatedWaitTime(
      queueEntry.hospitalId!,
      position
    )

    const entry = await prisma.queueEntry.create({
      data: {
        ...queueEntry as any,
        position,
        estimatedWaitTime,
        status: QueueStatus.WAITING,
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                name: true,
                cpf: true,
              },
            },
          },
        },
        hospital: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    await this.cache.invalidateHospitalQueue(queueEntry.hospitalId!)

    this.io.to(`hospital:${queueEntry.hospitalId}`).emit('queue:update', {
      action: 'added',
      entry,
    })

    this.io.to(`patient:${queueEntry.patientId}`).emit('queue:position', {
      position,
      estimatedWaitTime,
    })

    return entry as QueueEntry
  }

  async updateQueueEntry(
    id: string,
    updates: Partial<QueueEntry>
  ): Promise<QueueEntry> {
    const entry = await prisma.queueEntry.update({
      where: { id },
      data: updates as any,
      include: {
        patient: {
          include: {
            user: {
              select: {
                name: true,
                cpf: true,
              },
            },
          },
        },
        hospital: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    await this.cache.invalidateHospitalQueue(entry.hospitalId)

    if (updates.status) {
      await this.recalculatePositions(entry.hospitalId)
    }

    this.io.to(`hospital:${entry.hospitalId}`).emit('queue:update', {
      action: 'updated',
      entry,
    })

    this.io.to(`patient:${entry.patientId}`).emit('queue:status', {
      status: entry.status,
      position: entry.position,
      estimatedWaitTime: entry.estimatedWaitTime,
    })

    return entry as QueueEntry
  }

  async removeFromQueue(id: string): Promise<void> {
    const entry = await prisma.queueEntry.findUnique({
      where: { id },
    })

    if (!entry) {
      throw new Error('Queue entry not found')
    }

    await prisma.queueEntry.delete({
      where: { id },
    })

    await this.cache.invalidateHospitalQueue(entry.hospitalId)
    await this.recalculatePositions(entry.hospitalId)

    this.io.to(`hospital:${entry.hospitalId}`).emit('queue:update', {
      action: 'removed',
      entryId: id,
    })

    this.io.to(`patient:${entry.patientId}`).emit('queue:removed', {
      entryId: id,
    })
  }

  async callNextPatient(hospitalId: string, specialty?: string): Promise<QueueEntry | null> {
    const where: any = {
      hospitalId,
      status: QueueStatus.WAITING,
    }

    if (specialty) {
      where.specialty = specialty
    }

    const nextEntry = await prisma.queueEntry.findFirst({
      where,
      orderBy: [
        { priority: 'asc' },
        { checkInTime: 'asc' },
      ],
      include: {
        patient: {
          include: {
            user: {
              select: {
                name: true,
                cpf: true,
                phone: true,
              },
            },
          },
        },
        hospital: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!nextEntry) {
      return null
    }

    const updatedEntry = await this.updateQueueEntry(nextEntry.id, {
      status: QueueStatus.IN_PROGRESS,
      startTime: new Date(),
    })

    this.io.to(`patient:${nextEntry.patientId}`).emit('queue:called', {
      entry: updatedEntry,
      message: 'Você foi chamado! Dirija-se ao atendimento.',
    })

    return updatedEntry as QueueEntry
  }

  private async calculatePosition(
    hospitalId: string,
    priority: QueuePriority
  ): Promise<number> {
    const priorityValues: Record<QueuePriority, number> = {
      [QueuePriority.EMERGENCY]: 0,
      [QueuePriority.URGENT]: 1,
      [QueuePriority.SEMI_URGENT]: 2,
      [QueuePriority.NORMAL]: 3,
      [QueuePriority.LOW]: 4,
    }

    const count = await prisma.queueEntry.count({
      where: {
        hospitalId,
        status: QueueStatus.WAITING,
        OR: [
          { priority: { in: Object.keys(priorityValues).filter(p => priorityValues[p as QueuePriority] <= priorityValues[priority]) as QueuePriority[] } },
        ],
      },
    })

    return count + 1
  }

  private async calculateEstimatedWaitTime(
    hospitalId: string,
    position: number
  ): Promise<number> {
    const averageServiceTime = 15

    const completedToday = await prisma.queueEntry.findMany({
      where: {
        hospitalId,
        status: QueueStatus.COMPLETED,
        endTime: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    })

    if (completedToday.length > 0) {
      const totalTime = completedToday.reduce((acc, entry) => {
        if (entry.startTime && entry.endTime) {
          return acc + (entry.endTime.getTime() - entry.startTime.getTime())
        }
        return acc
      }, 0)

      const avgTime = totalTime / completedToday.length / 1000 / 60
      return Math.round((position - 1) * avgTime)
    }

    return (position - 1) * averageServiceTime
  }

  private async recalculatePositions(hospitalId: string): Promise<void> {
    const waitingEntries = await prisma.queueEntry.findMany({
      where: {
        hospitalId,
        status: QueueStatus.WAITING,
      },
      orderBy: [
        { priority: 'asc' },
        { checkInTime: 'asc' },
      ],
    })

    for (let i = 0; i < waitingEntries.length; i++) {
      const entry = waitingEntries[i]
      const newPosition = i + 1
      const estimatedWaitTime = await this.calculateEstimatedWaitTime(
        hospitalId,
        newPosition
      )

      await prisma.queueEntry.update({
        where: { id: entry.id },
        data: {
          position: newPosition,
          estimatedWaitTime,
        },
      })

      this.io.to(`patient:${entry.patientId}`).emit('queue:position', {
        position: newPosition,
        estimatedWaitTime,
      })
    }

    this.io.to(`hospital:${hospitalId}`).emit('queue:recalculated')
  }

  async getQueueStats(hospitalId: string) {
    const cacheKey = `queue:stats:${hospitalId}`
    const cached = await this.cache.get(cacheKey)

    if (cached) {
      return cached
    }

    const [totalWaiting, byPriority, bySpecialty] = await Promise.all([
      prisma.queueEntry.count({
        where: {
          hospitalId,
          status: QueueStatus.WAITING,
        },
      }),
      prisma.queueEntry.groupBy({
        by: ['priority'],
        where: {
          hospitalId,
          status: QueueStatus.WAITING,
        },
        _count: true,
      }),
      prisma.queueEntry.groupBy({
        by: ['specialty'],
        where: {
          hospitalId,
          status: QueueStatus.WAITING,
        },
        _count: true,
      }),
    ])

    const stats = {
      hospitalId,
      totalWaiting,
      byPriority: byPriority.reduce((acc, item) => {
        acc[item.priority] = item._count
        return acc
      }, {} as any),
      bySpecialty: bySpecialty.reduce((acc, item) => {
        acc[item.specialty] = item._count
        return acc
      }, {} as any),
      timestamp: new Date(),
    }

    await this.cache.set(cacheKey, stats, 60)

    return stats
  }
}
