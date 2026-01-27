import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useApi } from './useApi'

interface Patient {
  id: string
  userId: string
  dateOfBirth: Date
  bloodType?: string
  healthInsuranceId?: string
  healthInsuranceNumber?: string
  user: {
    id: string
    name: string
    email: string
    cpf: string
    phone: string
  }
}

interface PatientsResponse {
  data: Patient[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export function usePatients(initialPage = 1, initialLimit = 10) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [pagination, setPagination] = useState({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    pages: 0,
  })
  const [searchTerm, setSearchTerm] = useState('')

  const { loading, error, execute } = useApi<PatientsResponse>({
    onSuccess: (data) => {
      setPatients(data.data)
      setPagination(data.pagination)
    },
  })

  const fetchPatients = async (page = pagination.page, search = searchTerm) => {
    await execute(() =>
      api.get('/patients', {
        params: {
          page,
          limit: pagination.limit,
          search: search || undefined,
        },
      })
    )
  }

  useEffect(() => {
    fetchPatients()
  }, [])

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    fetchPatients(1, term)
  }

  const handlePageChange = (page: number) => {
    fetchPatients(page, searchTerm)
  }

  return {
    patients,
    pagination,
    loading,
    error,
    searchTerm,
    handleSearch,
    handlePageChange,
    refetch: fetchPatients,
  }
}
