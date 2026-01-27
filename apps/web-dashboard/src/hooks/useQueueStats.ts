import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useApi } from './useApi'
import { QueueStatistics } from '@medgo/shared-types'

export function useQueueStats(hospitalId: string, refreshInterval = 30000) {
  const [stats, setStats] = useState<QueueStatistics | null>(null)

  const { loading, error, execute } = useApi<QueueStatistics>({
    onSuccess: (data) => setStats(data),
  })

  const fetchStats = async () => {
    if (!hospitalId) return
    await execute(() => api.get(`/queues/hospital/${hospitalId}/stats`))
  }

  useEffect(() => {
    fetchStats()

    const interval = setInterval(fetchStats, refreshInterval)

    return () => clearInterval(interval)
  }, [hospitalId, refreshInterval])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  }
}
