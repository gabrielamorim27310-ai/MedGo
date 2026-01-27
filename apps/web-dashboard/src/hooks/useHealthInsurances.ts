import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useApi } from './useApi'

export interface HealthInsurancePlan {
  id: string
  healthInsuranceId: string
  name: string
  code: string
  coverageType: string
  coverageEmergencyRoom: boolean
  coverageHospitalization: boolean
  coverageSurgery: boolean
  coverageExams: boolean
  coverageTelemedicine: boolean
  coverageSpecialties: string[]
  monthlyPrice: number
  coPaymentConsultation: number
  coPaymentExam: number
  coPaymentEmergency: number
  status: string
}

export interface HealthInsurance {
  id: string
  name: string
  cnpj: string
  status: string
  phone: string
  email: string
  website?: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
  partnerHospitals: string[]
  plans?: HealthInsurancePlan[]
  _count?: {
    patients: number
  }
  createdAt: string
  updatedAt: string
}

interface HealthInsurancesResponse {
  data: HealthInsurance[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export function useHealthInsurances(initialPage = 1, initialLimit = 10) {
  const [healthInsurances, setHealthInsurances] = useState<HealthInsurance[]>([])
  const [pagination, setPagination] = useState({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    pages: 0,
  })
  const [searchTerm, setSearchTerm] = useState('')

  const { loading, error, execute } = useApi<HealthInsurancesResponse>({
    onSuccess: (data) => {
      setHealthInsurances(data.data)
      setPagination(data.pagination)
    },
  })

  const fetchHealthInsurances = async (page = pagination.page, search = searchTerm) => {
    await execute(() =>
      api.get('/health-insurances', {
        params: {
          page,
          limit: pagination.limit,
          search: search || undefined,
        },
      })
    )
  }

  useEffect(() => {
    fetchHealthInsurances()
  }, [])

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    fetchHealthInsurances(1, term)
  }

  const handlePageChange = (page: number) => {
    fetchHealthInsurances(page, searchTerm)
  }

  return {
    healthInsurances,
    pagination,
    loading,
    error,
    searchTerm,
    handleSearch,
    handlePageChange,
    refetch: fetchHealthInsurances,
  }
}
