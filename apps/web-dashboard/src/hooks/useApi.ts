import { useState, useCallback } from 'react'
import { api } from '@/lib/api'
import { AxiosError } from 'axios'

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: string) => void
}

export function useApi<T = any>(options?: UseApiOptions<T>) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const execute = useCallback(
    async (apiCall: () => Promise<any>) => {
      try {
        setLoading(true)
        setError(null)
        const response = await apiCall()
        setData(response.data)
        options?.onSuccess?.(response.data)
        return response.data
      } catch (err) {
        const errorMessage = err instanceof AxiosError
          ? err.response?.data?.message || err.message
          : 'Erro ao processar requisição'
        setError(errorMessage)
        options?.onError?.(errorMessage)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [options]
  )

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return { data, error, loading, execute, reset }
}
