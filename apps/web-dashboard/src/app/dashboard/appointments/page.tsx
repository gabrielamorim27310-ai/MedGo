'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Calendar,
  Clock,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  CalendarCheck,
  UserCheck,
} from 'lucide-react'
import { useAppointments, type AppointmentWithRelations } from '@/hooks/useAppointments'
import { AppointmentStatus, AppointmentType } from '@medgo/shared-types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { LoadingPage } from '@/components/ui/loading'
import { ErrorMessage } from '@/components/ui/error'

const statusColors: Record<AppointmentStatus, string> = {
  [AppointmentStatus.SCHEDULED]: 'bg-blue-500',
  [AppointmentStatus.CONFIRMED]: 'bg-green-500',
  [AppointmentStatus.IN_PROGRESS]: 'bg-yellow-500',
  [AppointmentStatus.COMPLETED]: 'bg-gray-500',
  [AppointmentStatus.CANCELLED]: 'bg-red-500',
  [AppointmentStatus.NO_SHOW]: 'bg-orange-500',
  [AppointmentStatus.RESCHEDULED]: 'bg-indigo-500',
}

const statusLabels: Record<AppointmentStatus, string> = {
  [AppointmentStatus.SCHEDULED]: 'Agendado',
  [AppointmentStatus.CONFIRMED]: 'Confirmado',
  [AppointmentStatus.IN_PROGRESS]: 'Em Atendimento',
  [AppointmentStatus.COMPLETED]: 'Concluído',
  [AppointmentStatus.CANCELLED]: 'Cancelado',
  [AppointmentStatus.NO_SHOW]: 'Faltou',
  [AppointmentStatus.RESCHEDULED]: 'Reagendado',
}

const typeLabels: Record<AppointmentType, string> = {
  [AppointmentType.IN_PERSON]: 'Presencial',
  [AppointmentType.TELEMEDICINE]: 'Telemedicina',
  [AppointmentType.EMERGENCY]: 'Emergência',
}

export default function AppointmentsPage() {
  const {
    appointments,
    loading,
    error,
    pagination,
    fetchAppointments,
    confirmAppointment,
    cancelAppointment,
    checkInAppointment,
    getStatistics,
  } = useAppointments()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<AppointmentStatus | ''>('')
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetchAppointments({ page: 1, limit: 20 })
    loadStatistics()
  }, [])

  const loadStatistics = async () => {
    try {
      const data = await getStatistics()
      setStats(data)
    } catch (err) {
      console.error('Error loading statistics:', err)
    }
  }

  const handleSearch = () => {
    fetchAppointments({
      page: 1,
      limit: 20,
      status: selectedStatus || undefined,
    })
  }

  const handleConfirm = async (id: string) => {
    try {
      await confirmAppointment(id)
      fetchAppointments({ page: pagination.page, limit: pagination.limit })
      loadStatistics()
    } catch (err) {
      console.error('Error confirming appointment:', err)
    }
  }

  const handleCheckIn = async (id: string) => {
    try {
      await checkInAppointment(id)
      fetchAppointments({ page: pagination.page, limit: pagination.limit })
      loadStatistics()
    } catch (err) {
      console.error('Error checking in:', err)
    }
  }

  const handleCancel = async (id: string) => {
    const reason = prompt('Motivo do cancelamento:')
    if (!reason) return

    try {
      await cancelAppointment(id, reason)
      fetchAppointments({ page: pagination.page, limit: pagination.limit })
      loadStatistics()
    } catch (err) {
      console.error('Error cancelling appointment:', err)
    }
  }

  if (loading && !appointments.length) return <LoadingPage />
  if (error && !appointments.length) return <ErrorMessage message={error} />

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Agendamentos</h2>
          <p className="text-muted-foreground">
            Gerencie os agendamentos de consultas
          </p>
        </div>
        <Button className="gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Novo Agendamento
        </Button>
      </div>

      {stats && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Agendamentos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hoje</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.today}</div>
              <p className="text-xs text-muted-foreground">Agendamentos hoje</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próximos</CardTitle>
              <CalendarCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.upcoming}</div>
              <p className="text-xs text-muted-foreground">Futuros</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmados</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.byStatus[AppointmentStatus.CONFIRMED] || 0}
              </div>
              <p className="text-xs text-muted-foreground">Confirmados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Atendimento</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.byStatus[AppointmentStatus.IN_PROGRESS] || 0}
              </div>
              <p className="text-xs text-muted-foreground">Em andamento</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar paciente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as AppointmentStatus)}
              className="rounded-md border border-input bg-background px-3 py-2 w-full sm:w-auto"
            >
              <option value="">Todos os Status</option>
              {Object.values(AppointmentStatus).map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
            <Button onClick={handleSearch} className="gap-2 w-full sm:w-auto">
              <Search className="h-4 w-4" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {appointments.map((appointment) => (
          <Card key={appointment.id}>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base sm:text-lg font-semibold">
                    {appointment.patient.name}
                  </h3>
                  <Badge className={statusColors[appointment.status]}>
                    {statusLabels[appointment.status]}
                  </Badge>
                  <Badge variant="outline">{typeLabels[appointment.type]}</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Data e Hora</p>
                    <p className="font-medium">
                      {format(new Date(appointment.scheduledDate), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Hospital</p>
                    <p className="font-medium">{appointment.hospital.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Médico</p>
                    <p className="font-medium">{appointment.doctor.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Motivo</p>
                    <p className="font-medium">{appointment.reason}</p>
                  </div>
                </div>

                {appointment.notes && (
                  <div className="text-sm">
                    <p className="text-muted-foreground">Observações</p>
                    <p className="text-sm">{appointment.notes}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  {appointment.status === AppointmentStatus.SCHEDULED && (
                    <Button
                      size="sm"
                      onClick={() => handleConfirm(appointment.id)}
                      className="gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Confirmar
                    </Button>
                  )}
                  {appointment.status === AppointmentStatus.CONFIRMED && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCheckIn(appointment.id)}
                      className="gap-2"
                    >
                      <UserCheck className="h-4 w-4" />
                      Check-in
                    </Button>
                  )}
                  {(appointment.status === AppointmentStatus.SCHEDULED ||
                    appointment.status === AppointmentStatus.CONFIRMED) && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleCancel(appointment.id)}
                      className="gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            disabled={pagination.page === 1}
            onClick={() =>
              fetchAppointments({
                page: pagination.page - 1,
                limit: pagination.limit,
              })
            }
          >
            Anterior
          </Button>
          <span className="text-sm">
            Página {pagination.page} de {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={pagination.page === pagination.totalPages}
            onClick={() =>
              fetchAppointments({
                page: pagination.page + 1,
                limit: pagination.limit,
              })
            }
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  )
}
