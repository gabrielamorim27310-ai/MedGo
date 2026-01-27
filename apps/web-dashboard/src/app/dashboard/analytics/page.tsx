'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Users,
  Building2,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle,
} from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'
import { LoadingPage } from '@/components/ui/loading'
import { ErrorMessage } from '@/components/ui/error'
import { AppointmentTrendChart } from '@/components/charts/AppointmentTrendChart'
import { AppointmentStatusChart } from '@/components/charts/AppointmentStatusChart'
import { AppointmentTypeChart } from '@/components/charts/AppointmentTypeChart'
import { QueuePriorityChart } from '@/components/charts/QueuePriorityChart'
import { ReportExporter } from '@/components/reports/ReportExporter'
import { DateRangeFilter } from '@/components/filters/DateRangeFilter'

export default function AnalyticsPage() {
  const { loading, error, getOverviewMetrics, getAppointmentAnalytics, getQueueAnalytics, getTopHospitals } = useAnalytics()

  const [overview, setOverview] = useState<any>(null)
  const [appointmentStats, setAppointmentStats] = useState<any>(null)
  const [queueStats, setQueueStats] = useState<any>(null)
  const [topHospitals, setTopHospitals] = useState<any[]>([])
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({})

  useEffect(() => {
    loadAllAnalytics()
  }, [dateRange])

  const loadAllAnalytics = async () => {
    const [overviewData, appointmentData, queueData, hospitalsData] = await Promise.all([
      getOverviewMetrics(dateRange.start, dateRange.end),
      getAppointmentAnalytics(undefined, dateRange.start, dateRange.end),
      getQueueAnalytics(undefined, dateRange.start, dateRange.end),
      getTopHospitals(5, dateRange.start, dateRange.end),
    ])

    if (overviewData) setOverview(overviewData)
    if (appointmentData) setAppointmentStats(appointmentData)
    if (queueData) setQueueStats(queueData)
    if (hospitalsData) setTopHospitals(hospitalsData)
  }

  const handleDateRangeChange = (start: string, end: string) => {
    setDateRange({ start, end })
  }

  if (loading && !overview) return <LoadingPage />
  if (error && !overview) return <ErrorMessage message={error} />

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        <p className="text-muted-foreground">
          Métricas e análises do sistema MedGo
        </p>
      </div>

      {/* Filtros de Período */}
      <DateRangeFilter onApply={handleDateRangeChange} />

      {/* Métricas Gerais */}
      {overview && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Pacientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.totalPatients.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Pacientes cadastrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hospitais Ativos</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.totalHospitals}</div>
              <p className="text-xs text-muted-foreground">
                No sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agendamentos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.totalAppointments.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Últimos 30 dias
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Filas Ativas</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.activeQueues}</div>
              <p className="text-xs text-muted-foreground">
                Aguardando atendimento
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gráficos de Tendências */}
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        <AppointmentTrendChart days={30} />
        {appointmentStats && (
          <AppointmentStatusChart data={appointmentStats.statusDistribution} />
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        {appointmentStats && (
          <AppointmentTypeChart data={appointmentStats.typeDistribution} />
        )}
        {queueStats && (
          <QueuePriorityChart data={queueStats.priorityDistribution} />
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Analytics de Agendamentos */}
        {appointmentStats && (
          <Card>
            <CardHeader>
              <CardTitle>Analytics de Agendamentos</CardTitle>
              <CardDescription>Estatísticas dos últimos 30 dias</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-sm font-medium">{appointmentStats.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Duração Média</span>
                  <span className="text-sm font-medium">{appointmentStats.averageDuration} min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Taxa de Falta</span>
                  <span className="text-sm font-medium">{appointmentStats.noShowRate.toFixed(1)}%</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Por Status</p>
                {Object.entries(appointmentStats.statusDistribution).map(([status, count]: [string, any]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{status}</span>
                    <span className="text-xs font-medium">{count}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Por Tipo</p>
                {Object.entries(appointmentStats.typeDistribution).map(([type, count]: [string, any]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{type}</span>
                    <span className="text-xs font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analytics de Filas */}
        {queueStats && (
          <Card>
            <CardHeader>
              <CardTitle>Analytics de Filas</CardTitle>
              <CardDescription>Estatísticas dos últimos 30 dias</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-sm font-medium">{queueStats.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tempo Médio de Espera</span>
                  <span className="text-sm font-medium">{queueStats.averageWaitTime} min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Taxa de Conclusão</span>
                  <span className="text-sm font-medium">{queueStats.completionRate.toFixed(1)}%</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Por Status</p>
                {Object.entries(queueStats.statusDistribution).map(([status, count]: [string, any]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{status}</span>
                    <span className="text-xs font-medium">{count}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Por Prioridade</p>
                {Object.entries(queueStats.priorityDistribution).map(([priority, count]: [string, any]) => (
                  <div key={priority} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{priority}</span>
                    <span className="text-xs font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top Hospitais */}
      {topHospitals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Hospitais</CardTitle>
            <CardDescription>Hospitais com melhor performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topHospitals.map((hospital, index) => (
                <div key={hospital.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-sm font-bold text-primary">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{hospital.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {hospital.city}, {hospital.state}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {hospital.completedAppointments} agendamentos
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {hospital.completedQueueEntries} filas completadas
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exportação de Relatórios */}
      <ReportExporter startDate={dateRange.start} endDate={dateRange.end} />

      <Card>
        <CardHeader>
          <CardTitle>Resumo do Período</CardTitle>
          <CardDescription>Performance geral do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Agendamentos Completos</span>
              </div>
              <p className="text-2xl font-bold">{overview?.completedAppointments || 0}</p>
              <p className="text-xs text-muted-foreground">
                {((overview?.completedAppointments / overview?.totalAppointments) * 100 || 0).toFixed(1)}% do total
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Taxa de Ocupação</span>
              </div>
              <p className="text-2xl font-bold">78%</p>
              <p className="text-xs text-muted-foreground">
                Capacidade utilizada
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Crescimento</span>
              </div>
              <p className="text-2xl font-bold">+12%</p>
              <p className="text-xs text-muted-foreground">
                Comparado ao mês anterior
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
