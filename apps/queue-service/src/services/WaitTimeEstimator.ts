import { QueueStatus } from '@acolhe/shared-types'
import { prisma } from '../lib/prisma'

/**
 * Estimador dinâmico de tempo de espera.
 *
 * Combina três sinais aprendidos continuamente a partir do histórico da
 * própria unidade (sem depender de dados externos):
 *
 * 1. Tempo médio de atendimento com ponderação exponencial por recência
 *    (EWMA) — atendimentos recentes pesam mais que os antigos.
 * 2. Paralelismo real — quantos atendimentos estão IN_PROGRESS agora,
 *    como proxy do número de guichês/consultórios abertos.
 * 3. Fator de demanda do horário — razão entre o ritmo de chegadas da
 *    última hora e o ritmo médio do dia, para reagir a picos.
 */

const DEFAULT_SERVICE_MINUTES = 15
const EWMA_ALPHA = 0.15
const HISTORY_SAMPLE = 60

export interface WaitEstimate {
  estimatedWaitTime: number
  avgServiceMinutes: number
  activeStations: number
  demandFactor: number
}

export class WaitTimeEstimator {
  async estimateForPosition(hospitalId: string, position: number): Promise<WaitEstimate> {
    const [avgServiceMinutes, activeStations, demandFactor] = await Promise.all([
      this.ewmaServiceMinutes(hospitalId),
      this.countActiveStations(hospitalId),
      this.demandFactor(hospitalId),
    ])

    const ahead = Math.max(position - 1, 0)
    const minutes = (ahead / activeStations) * avgServiceMinutes * demandFactor

    return {
      estimatedWaitTime: Math.max(Math.round(minutes), 0),
      avgServiceMinutes: Math.round(avgServiceMinutes * 10) / 10,
      activeStations,
      demandFactor: Math.round(demandFactor * 100) / 100,
    }
  }

  /** EWMA da duração dos últimos atendimentos concluídos (mais recentes pesam mais). */
  private async ewmaServiceMinutes(hospitalId: string): Promise<number> {
    const completed = await prisma.queueEntry.findMany({
      where: {
        hospitalId,
        status: QueueStatus.COMPLETED,
        startTime: { not: null },
        endTime: { not: null },
      },
      orderBy: { endTime: 'desc' },
      take: HISTORY_SAMPLE,
      select: { startTime: true, endTime: true },
    })

    if (completed.length === 0) {
      return DEFAULT_SERVICE_MINUTES
    }

    // Itera do mais antigo para o mais recente para que a EWMA convirja
    // dando peso maior às observações recentes.
    let ewma: number | null = null
    for (let i = completed.length - 1; i >= 0; i--) {
      const entry = completed[i]
      const minutes =
        (entry.endTime!.getTime() - entry.startTime!.getTime()) / 60000

      if (minutes <= 0 || minutes > 240) continue

      ewma = ewma === null ? minutes : EWMA_ALPHA * minutes + (1 - EWMA_ALPHA) * ewma
    }

    return ewma ?? DEFAULT_SERVICE_MINUTES
  }

  /** Atendimentos simultâneos em andamento agora (proxy de guichês abertos). */
  private async countActiveStations(hospitalId: string): Promise<number> {
    const inProgress = await prisma.queueEntry.count({
      where: { hospitalId, status: QueueStatus.IN_PROGRESS },
    })
    return Math.max(inProgress, 1)
  }

  /** Ritmo de chegadas da última hora comparado ao ritmo médio do dia. */
  private async demandFactor(hospitalId: string): Promise<number> {
    const now = Date.now()
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const hoursElapsed = Math.max((now - startOfDay.getTime()) / 3600000, 1)

    const [lastHour, today] = await Promise.all([
      prisma.queueEntry.count({
        where: { hospitalId, checkInTime: { gte: new Date(now - 3600000) } },
      }),
      prisma.queueEntry.count({
        where: { hospitalId, checkInTime: { gte: startOfDay } },
      }),
    ])

    if (today === 0) return 1

    const avgPerHour = today / hoursElapsed
    if (avgPerHour === 0) return 1

    // Limita o fator para evitar estimativas explosivas em amostras pequenas.
    return Math.min(Math.max(lastHour / avgPerHour, 0.5), 2.5)
  }
}
