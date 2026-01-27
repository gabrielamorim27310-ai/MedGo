import { useState, useCallback } from 'react'
import { api } from '@/lib/api'
import {
  Appointment,
  CreateAppointmentDTO,
  UpdateAppointmentDTO,
  AppointmentStatus,
} from '@medgo/shared-types'

// Tipo estendido com relações expandidas (retornado pela API)
export interface AppointmentWithRelations extends Appointment {
  patient: { id: string; name: string }
  doctor: { id: string; name: string }
  hospital: { id: string; name: string }
}

interface UseAppointmentsReturn {
  appointments: AppointmentWithRelations[]
  loading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  fetchAppointments: (params?: AppointmentFilters) => Promise<void>
  createAppointment: (data: CreateAppointmentDTO) => Promise<Appointment>
  updateAppointment: (id: string, data: UpdateAppointmentDTO) => Promise<Appointment>
  deleteAppointment: (id: string) => Promise<void>
  confirmAppointment: (id: string) => Promise<Appointment>
  cancelAppointment: (id: string, reason: string) => Promise<Appointment>
  rescheduleAppointment: (id: string, scheduledDate: string, reason: string) => Promise<Appointment>
  checkInAppointment: (id: string) => Promise<Appointment>
  completeAppointment: (id: string, notes?: string) => Promise<Appointment>
  getAvailableSlots: (params: AvailableSlotsParams) => Promise<string[]>
  getStatistics: (params?: StatisticsParams) => Promise<AppointmentStatistics>
}

interface AppointmentFilters {
  page?: number
  limit?: number
  status?: AppointmentStatus
  type?: string
  hospitalId?: string
  patientId?: string
  doctorId?: string
  startDate?: string
  endDate?: string
}

interface AvailableSlotsParams {
  hospitalId: string
  date: string
  doctorId?: string
  specialtyId?: string
}

interface StatisticsParams {
  hospitalId?: string
  startDate?: string
  endDate?: string
}

interface AppointmentStatistics {
  total: number
  byStatus: Record<string, number>
  byType: Record<string, number>
  upcoming: number
  today: number
}

export function useAppointments(): UseAppointmentsReturn {
  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  const fetchAppointments = useCallback(async (params: AppointmentFilters = {}) => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.get('/appointments', { params })
      setAppointments(response.data.data)
      setPagination({
        page: response.data.page,
        limit: response.data.limit,
        total: response.data.total,
        totalPages: response.data.totalPages,
      })
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao buscar agendamentos')
      console.error('Error fetching appointments:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const createAppointment = useCallback(async (data: CreateAppointmentDTO): Promise<Appointment> => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.post('/appointments', data)
      return response.data
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao criar agendamento'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateAppointment = useCallback(
    async (id: string, data: UpdateAppointmentDTO): Promise<Appointment> => {
      setLoading(true)
      setError(null)

      try {
        const response = await api.put(`/appointments/${id}`, data)
        return response.data
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Erro ao atualizar agendamento'
        setError(errorMessage)
        throw new Error(errorMessage)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const deleteAppointment = useCallback(async (id: string): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      await api.delete(`/appointments/${id}`)
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao deletar agendamento'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const confirmAppointment = useCallback(async (id: string): Promise<Appointment> => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.post(`/appointments/${id}/confirm`)
      return response.data
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao confirmar agendamento'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const cancelAppointment = useCallback(async (id: string, reason: string): Promise<Appointment> => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.post(`/appointments/${id}/cancel`, { reason })
      return response.data
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao cancelar agendamento'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const rescheduleAppointment = useCallback(
    async (id: string, scheduledDate: string, reason: string): Promise<Appointment> => {
      setLoading(true)
      setError(null)

      try {
        const response = await api.post(`/appointments/${id}/reschedule`, {
          scheduledDate,
          reason,
        })
        return response.data
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Erro ao reagendar'
        setError(errorMessage)
        throw new Error(errorMessage)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const checkInAppointment = useCallback(async (id: string): Promise<Appointment> => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.post(`/appointments/${id}/check-in`)
      return response.data
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao fazer check-in'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const completeAppointment = useCallback(async (id: string, notes?: string): Promise<Appointment> => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.post(`/appointments/${id}/complete`, { notes })
      return response.data
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao concluir atendimento'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getAvailableSlots = useCallback(async (params: AvailableSlotsParams): Promise<string[]> => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.get('/appointments/available-slots', { params })
      return response.data.availableSlots
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao buscar horários disponíveis'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getStatistics = useCallback(
    async (params: StatisticsParams = {}): Promise<AppointmentStatistics> => {
      setLoading(true)
      setError(null)

      try {
        const response = await api.get('/appointments/statistics', { params })
        return response.data
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Erro ao buscar estatísticas'
        setError(errorMessage)
        throw new Error(errorMessage)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return {
    appointments,
    loading,
    error,
    pagination,
    fetchAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    confirmAppointment,
    cancelAppointment,
    rescheduleAppointment,
    checkInAppointment,
    completeAppointment,
    getAvailableSlots,
    getStatistics,
  }
}
