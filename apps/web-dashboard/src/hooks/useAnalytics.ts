import { useState, useCallback } from 'react'
import axios from 'axios'

const ANALYTICS_API_URL = process.env.NEXT_PUBLIC_ANALYTICS_URL || 'http://localhost:3004/api'

interface OverviewMetrics {
  totalPatients: number
  totalHospitals: number
  totalAppointments: number
  totalQueueEntries: number
  activeQueues: number
  completedAppointments: number
  period: {
    start: Date
    end: Date
  }
}

interface AppointmentAnalytics {
  total: number
  statusDistribution: Record<string, number>
  typeDistribution: Record<string, number>
  averageDuration: number
  noShowRate: number
  period: { start: Date; end: Date }
}

interface QueueAnalytics {
  total: number
  statusDistribution: Record<string, number>
  priorityDistribution: Record<string, number>
  averageWaitTime: number
  completionRate: number
  period: { start: Date; end: Date }
}

interface TrendData {
  date: string
  value: number
}

interface TopHospital {
  id: string
  name: string
  city: string
  state: string
  completedAppointments: number
  completedQueueEntries: number
  totalBeds: number
  availableBeds: number
}

export function useAnalytics() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getOverviewMetrics = useCallback(
    async (startDate?: string, endDate?: string): Promise<OverviewMetrics | null> => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        if (startDate) params.append('startDate', startDate)
        if (endDate) params.append('endDate', endDate)

        const response = await axios.get(
          `${ANALYTICS_API_URL}/overview?${params.toString()}`
        )
        return response.data
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Erro ao buscar métricas gerais'
        setError(errorMessage)
        console.error('Error fetching overview metrics:', err)
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const getAppointmentAnalytics = useCallback(
    async (
      hospitalId?: string,
      startDate?: string,
      endDate?: string
    ): Promise<AppointmentAnalytics | null> => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        if (hospitalId) params.append('hospitalId', hospitalId)
        if (startDate) params.append('startDate', startDate)
        if (endDate) params.append('endDate', endDate)

        const response = await axios.get(
          `${ANALYTICS_API_URL}/appointments?${params.toString()}`
        )
        return response.data
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || 'Erro ao buscar analytics de agendamentos'
        setError(errorMessage)
        console.error('Error fetching appointment analytics:', err)
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const getQueueAnalytics = useCallback(
    async (
      hospitalId?: string,
      startDate?: string,
      endDate?: string
    ): Promise<QueueAnalytics | null> => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        if (hospitalId) params.append('hospitalId', hospitalId)
        if (startDate) params.append('startDate', startDate)
        if (endDate) params.append('endDate', endDate)

        const response = await axios.get(
          `${ANALYTICS_API_URL}/queues?${params.toString()}`
        )
        return response.data
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || 'Erro ao buscar analytics de filas'
        setError(errorMessage)
        console.error('Error fetching queue analytics:', err)
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const getHospitalPerformance = useCallback(
    async (hospitalId: string, startDate?: string, endDate?: string): Promise<any | null> => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        if (startDate) params.append('startDate', startDate)
        if (endDate) params.append('endDate', endDate)

        const response = await axios.get(
          `${ANALYTICS_API_URL}/hospitals/${hospitalId}/performance?${params.toString()}`
        )
        return response.data
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || 'Erro ao buscar performance do hospital'
        setError(errorMessage)
        console.error('Error fetching hospital performance:', err)
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const getTrends = useCallback(
    async (metric: string, days = 30, hospitalId?: string): Promise<TrendData[] | null> => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        params.append('metric', metric)
        params.append('days', days.toString())
        if (hospitalId) params.append('hospitalId', hospitalId)

        const response = await axios.get(
          `${ANALYTICS_API_URL}/trends?${params.toString()}`
        )
        return response.data.data
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Erro ao buscar tendências'
        setError(errorMessage)
        console.error('Error fetching trends:', err)
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const getTopHospitals = useCallback(
    async (
      limit = 10,
      startDate?: string,
      endDate?: string
    ): Promise<TopHospital[] | null> => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        params.append('limit', limit.toString())
        if (startDate) params.append('startDate', startDate)
        if (endDate) params.append('endDate', endDate)

        const response = await axios.get(
          `${ANALYTICS_API_URL}/top-hospitals?${params.toString()}`
        )
        return response.data.data
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || 'Erro ao buscar top hospitais'
        setError(errorMessage)
        console.error('Error fetching top hospitals:', err)
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return {
    loading,
    error,
    getOverviewMetrics,
    getAppointmentAnalytics,
    getQueueAnalytics,
    getHospitalPerformance,
    getTrends,
    getTopHospitals,
  }
}
