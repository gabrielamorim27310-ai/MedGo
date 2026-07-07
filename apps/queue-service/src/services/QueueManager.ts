import { Server } from 'socket.io'
import { QueueEntry, QueuePriority, QueueStatus } from '@acolhe/shared-types'
import { prisma } from '../lib/prisma'
import { RedisCache } from './RedisCache'
import { WaitTimeEstimator } from './WaitTimeEstimator'
import { NotificationDispatcher } from './NotificationDispatcher'

const TICKET_PREFIX: Record<QueuePriority, string> = {
  [QueuePriority.EMERGENCY]: 'E',
  [QueuePriority.URGENT]: 'U',
  [QueuePriority.SEMI_URGENT]: 'S',
  [QueuePriority.NORMAL]: 'N',
  [QueuePriority.LOW]: 'L',
}

const ENTRY_INCLUDE = {
  patient: {
    include: {
      user: {
        select: {
          id: true,
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
} as const

export class QueueManager {
  private io: Server
  private cache: RedisCache
  private estimator: WaitTimeEstimator
  private notifier: NotificationDispatcher

  constructor(io: Server) {
    this.io = io
    this.cache = new RedisCache()
    this.estimator = new WaitTimeEstimator()
    this.notifier = new NotificationDispatcher()
  }

  async addToQueue(queueEntry: Partial<QueueEntry>): Promise<QueueEntry> {
    const hospitalId = queueEntry.hospitalId!
    const priority = queueEntry.priority!

    const [position, ticketCode] = await Promise.all([
      this.calculatePosition(hospitalId, priority),
      this.generateTicketCode(hospitalId, priority),
    ])

    const { estimatedWaitTime } = await this.estimator.estimateForPosition(
      hospitalId,
      position
    )

    const entry = await prisma.queueEntry.create({
      data: {
        ...(queueEntry as any),
        position,
        ticketCode,
        estimatedWaitTime,
        status: QueueStatus.WAITING,
      },
      include: ENTRY_INCLUDE,
    })

    await this.cache.invalidateHospitalQueue(hospitalId)

    this.io.to(`hospital:${hospitalId}`).emit('queue:update', {
      action: 'added',
      entry,
    })

    this.io.to(`patient:${entry.patientId}`).emit('queue:position', {
      position,
      estimatedWaitTime,
      ticketCode,
    })

    const userId = (entry as any).patient?.userId
    if (userId) {
      void this.notifier.queueCheckIn(userId, {
        hospitalName: (entry as any).hospital?.name ?? 'hospital',
        ticketCode: ticketCode,
        position,
        estimatedWaitTime,
      })
    }

    return entry as unknown as QueueEntry
  }

  async updateQueueEntry(
    id: string,
    updates: Partial<QueueEntry>
  ): Promise<QueueEntry> {
    const entry = await prisma.queueEntry.update({
      where: { id },
      data: updates as any,
      include: ENTRY_INCLUDE,
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
      ticketCode: entry.ticketCode,
    })

    return entry as unknown as QueueEntry
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
      include: ENTRY_INCLUDE,
    })

    if (!nextEntry) {
      return null
    }

    const updatedEntry = await this.updateQueueEntry(nextEntry.id, {
      status: QueueStatus.IN_PROGRESS,
      calledAt: new Date(),
      startTime: new Date(),
    })

    this.io.to(`patient:${nextEntry.patientId}`).emit('queue:called', {
      entry: updatedEntry,
      message: 'Você foi chamado! Dirija-se ao atendimento.',
    })

    const userId = (nextEntry as any).patient?.userId
    if (userId) {
      void this.notifier.queueCalled(userId, {
        hospitalName: (nextEntry as any).hospital?.name ?? 'hospital',
        ticketCode: nextEntry.ticketCode,
        roomNumber: updatedEntry.roomNumber ?? null,
      })
    }

    return updatedEntry
  }

  /** Estimativa para quem ainda vai entrar na fila (usada na recomendação de unidades). */
  async estimateForNewArrival(hospitalId: string, priority: QueuePriority) {
    const position = await this.calculatePosition(hospitalId, priority)
    const estimate = await this.estimator.estimateForPosition(hospitalId, position)
    return { position, ...estimate }
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

    const samePriorityOrHigher = Object.keys(priorityValues).filter(
      (p) => priorityValues[p as QueuePriority] <= priorityValues[priority]
    ) as QueuePriority[]

    const count = await prisma.queueEntry.count({
      where: {
        hospitalId,
        status: QueueStatus.WAITING,
        priority: { in: samePriorityOrHigher },
      },
    })

    return count + 1
  }

  /** Gera a senha do paciente no formato "N-042" (prefixo da prioridade + sequência do dia). */
  private async generateTicketCode(
    hospitalId: string,
    priority: QueuePriority
  ): Promise<string> {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const todayCount = await prisma.queueEntry.count({
      where: {
        hospitalId,
        priority,
        checkInTime: { gte: startOfDay },
      },
    })

    const sequence = String(todayCount + 1).padStart(3, '0')
    return `${TICKET_PREFIX[priority]}-${sequence}`
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
      include: {
        patient: {
          select: { userId: true },
        },
      },
    })

    for (let i = 0; i < waitingEntries.length; i++) {
      const entry = waitingEntries[i]
      const newPosition = i + 1

      if (entry.position === newPosition) continue

      const { estimatedWaitTime } = await this.estimator.estimateForPosition(
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
        ticketCode: entry.ticketCode,
      })

      // Notifica fora do app apenas quem está perto de ser chamado,
      // para não inundar o paciente de avisos.
      if (newPosition <= 3 && entry.patient?.userId) {
        void this.notifier.queuePositionUpdate(entry.patient.userId, {
          ticketCode: entry.ticketCode,
          position: newPosition,
          estimatedWaitTime,
        })
      }
    }

    this.io.to(`hospital:${hospitalId}`).emit('queue:recalculated')
  }

  async getQueueStats(hospitalId: string) {
    const cacheKey = `queue:stats:${hospitalId}`
    const cached = await this.cache.get(cacheKey)

    if (cached) {
      return cached
    }

    const [totalWaiting, byPriority, bySpecialty, arrivalEstimate] = await Promise.all([
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
      this.estimateForNewArrival(hospitalId, QueuePriority.NORMAL),
    ])

    const stats = {
      hospitalId,
      totalWaiting,
      estimatedWaitForNewArrival: arrivalEstimate.estimatedWaitTime,
      avgServiceMinutes: arrivalEstimate.avgServiceMinutes,
      activeStations: arrivalEstimate.activeStations,
      demandFactor: arrivalEstimate.demandFactor,
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
