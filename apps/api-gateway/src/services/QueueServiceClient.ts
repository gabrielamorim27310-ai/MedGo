import axios from 'axios'
import { QueueEntry, QueuePriority } from '@acolhe/shared-types'

const QUEUE_SERVICE_URL =
  process.env.QUEUE_SERVICE_URL || 'http://localhost:3002'

const client = axios.create({
  baseURL: `${QUEUE_SERVICE_URL}/api/queues`,
  timeout: 8000,
})

/**
 * Cliente HTTP do queue-service. Todo o ciclo de vida da fila virtual
 * (posição, senha, estimativa dinâmica, eventos WebSocket e notificações)
 * vive no queue-service — o gateway apenas orquestra.
 */
export class QueueServiceClient {
  async addToQueue(data: {
    hospitalId: string
    patientId: string
    priority: QueuePriority
    specialty: string
    symptoms: string
    eligibility?: unknown
  }): Promise<QueueEntry> {
    const response = await client.post('/', data)
    return response.data
  }

  async updateEntry(id: string, updates: Record<string, unknown>): Promise<QueueEntry> {
    const response = await client.patch(`/${id}`, updates)
    return response.data
  }

  async removeEntry(id: string): Promise<void> {
    await client.delete(`/${id}`)
  }

  async callNext(hospitalId: string, specialty?: string): Promise<QueueEntry | null> {
    const response = await client.post('/call-next', { hospitalId, specialty })
    return response.data
  }

  async getStats(hospitalId: string): Promise<Record<string, unknown>> {
    const response = await client.get(`/stats/${hospitalId}`)
    return response.data
  }

  async estimate(hospitalId: string, priority?: QueuePriority): Promise<{
    estimatedWaitTime: number
    position: number
  }> {
    const response = await client.get(`/estimate/${hospitalId}`, {
      params: { priority },
    })
    return response.data
  }

  async isAvailable(): Promise<boolean> {
    try {
      await axios.get(`${QUEUE_SERVICE_URL}/health`, { timeout: 2000 })
      return true
    } catch {
      return false
    }
  }
}

export const queueServiceClient = new QueueServiceClient()
