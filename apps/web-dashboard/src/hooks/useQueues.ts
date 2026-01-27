import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useApi } from './useApi'
import { QueueEntry, QueueStatus, QueuePriority } from '@medgo/shared-types'

interface QueuesResponse {
  data: QueueEntry[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

interface QueueFilters {
  hospitalId?: string
  status?: QueueStatus
  priority?: QueuePriority
}

export function useQueues(initialPage = 1, initialLimit = 10, filters?: QueueFilters) {
  const [queues, setQueues] = useState<QueueEntry[]>([])
  const [pagination, setPagination] = useState({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    pages: 0,
  })

  const { loading, error, execute } = useApi<QueuesResponse>({
    onSuccess: (data) => {
      setQueues(data.data)
      setPagination(data.pagination)
    },
  })

  const fetchQueues = async (page = pagination.page) => {
    await execute(() =>
      api.get('/queues', {
        params: {
          page,
          limit: pagination.limit,
          ...filters,
        },
      })
    )
  }

  useEffect(() => {
    fetchQueues()
  }, [filters])

  const handlePageChange = (page: number) => {
    fetchQueues(page)
  }

  const updateQueueEntry = async (id: string, updates: Partial<QueueEntry>) => {
    await execute(() => api.put(`/queues/${id}`, updates))
    await fetchQueues()
  }

  return {
    queues,
    pagination,
    loading,
    error,
    handlePageChange,
    updateQueueEntry,
    refetch: fetchQueues,
  }
}
