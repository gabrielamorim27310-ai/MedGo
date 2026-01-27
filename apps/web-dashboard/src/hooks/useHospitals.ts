import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useApi } from './useApi'
import { Hospital } from '@medgo/shared-types'

interface HospitalsResponse {
  data: Hospital[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export function useHospitals(initialPage = 1, initialLimit = 10) {
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [pagination, setPagination] = useState({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    pages: 0,
  })
  const [searchTerm, setSearchTerm] = useState('')

  const { loading, error, execute } = useApi<HospitalsResponse>({
    onSuccess: (data) => {
      setHospitals(data.data)
      setPagination(data.pagination)
    },
  })

  const fetchHospitals = async (page = pagination.page, search = searchTerm) => {
    await execute(() =>
      api.get('/hospitals', {
        params: {
          page,
          limit: pagination.limit,
          search: search || undefined,
        },
      })
    )
  }

  useEffect(() => {
    fetchHospitals()
  }, [])

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    fetchHospitals(1, term)
  }

  const handlePageChange = (page: number) => {
    fetchHospitals(page, searchTerm)
  }

  return {
    hospitals,
    pagination,
    loading,
    error,
    searchTerm,
    handleSearch,
    handlePageChange,
    refetch: fetchHospitals,
  }
}
