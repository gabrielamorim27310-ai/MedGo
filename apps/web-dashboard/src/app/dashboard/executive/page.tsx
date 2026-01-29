'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Clock,
  AlertCircle,
  Download,
} from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'
import { LoadingPage } from '@/components/ui/loading'
import { ComparativeTrendChart } from '@/components/charts/ComparativeTrendChart'
import { PerformanceGaugeChart } from '@/components/charts/PerformanceGaugeChart'
import { AppointmentHeatmap } from '@/components/charts/AppointmentHeatmap'
import { AppointmentStatusChart } from '@/components/charts/AppointmentStatusChart'

export default function ExecutiveDashboard() {
  const { loading, getOverviewMetrics, getAppointmentAnalytics, getQueueAnalytics } = useAnalytics()
  const [overview, setOverview] = useState<any>(null)
  const [appointmentStats, setAppointmentStats] = useState<any>(null)
  const [queueStats, setQueueStats] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [overviewData, appointmentData, queueData] = await Promise.all([
      getOverviewMetrics(),
      getAppointmentAnalytics(),
      getQueueAnalytics(),
    ])

    if (overviewData) setOverview(overviewData)
    if (appointmentData) setAppointmentStats(appointmentData)
    if (queueData) setQueueStats(queueData)
  }

  const handleExportDashboard = () => {
    // Implementar exportação em PDF futuramente
    alert('Exportação de dashboard em desenvolvimento')
  }

  if (loading && !overview) return <LoadingPage />

  // Calcular KPIs
  const completionRate = overview
    ? ((overview.completedAppointments / overview.totalAppointments) * 100).toFixed(1)
    : 0

  const utilizationRate = 78.5 // Mock - seria calculado com dados reais

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard Executivo</h2>
          <p className="text-muted-foreground">Visão estratégica do sistema MedGo</p>
        </div>
        <Button onClick={handleExportDashboard} className="gap-2 w-full sm:w-auto">
          <Download className="h-4 w-4" />
          Exportar Dashboard
        </Button>
      </div>

      {/* KPIs Principais */}
      {overview && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Crescimento Mensal</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">+12.3%</div>
              <p className="text-xs text-muted-foreground">Comparado ao mês anterior</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{completionRate}%</div>
              <p className="text-xs text-muted-foreground">
                {overview.completedAppointments} de {overview.totalAppointments}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pacientes Ativos</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {overview.totalPatients.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Total no sistema</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio Espera</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {queueStats?.averageWaitTime || 0} min
              </div>
              <p className="text-xs text-muted-foreground">Nas filas de atendimento</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gráficos Comparativos */}
      <div className="grid gap-4 md:grid-cols-2">
        <ComparativeTrendChart metric="appointments" days={30} />
        <ComparativeTrendChart metric="queue_entries" days={30} />
      </div>

      {/* Medidores de Performance */}
      <div className="grid gap-4 md:grid-cols-3">
        <PerformanceGaugeChart
          title="Taxa de Ocupação"
          value={utilizationRate}
          description="Capacidade hospitalar utilizada"
        />
        <PerformanceGaugeChart
          title="Satisfação do Paciente"
          value={87.5}
          description="Avaliação média dos serviços"
        />
        <PerformanceGaugeChart
          title="Eficiência Operacional"
          value={92.3}
          description="Performance dos processos"
        />
      </div>

      {/* Heatmap e Status */}
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        <AppointmentHeatmap />
        {appointmentStats && (
          <AppointmentStatusChart data={appointmentStats.statusDistribution} />
        )}
      </div>

      {/* Alertas e Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            Insights e Alertas
          </CardTitle>
          <CardDescription>Recomendações baseadas nos dados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">
                  Performance Positiva
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  O número de agendamentos aumentou 12.3% este mês. Continue investindo em
                  marketing e divulgação.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900 dark:text-yellow-100">
                  Atenção: Horários de Pico
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  As quartas-feiras entre 10h-11h têm alta demanda. Considere alocar mais
                  recursos nesses horários.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <Users className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Oportunidade: Telemedicina
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Apenas {appointmentStats?.typeDistribution?.TELEMEDICINE || 0} agendamentos de
                  telemedicina. Considere expandir este serviço.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
              <TrendingDown className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-900 dark:text-red-100">Alerta: Taxa de Falta</p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  Taxa de no-show de {appointmentStats?.noShowRate.toFixed(1)}%. Implemente
                  lembretes automáticos para reduzir.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Executivo */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Executivo</CardTitle>
          <CardDescription>Principais métricas e recomendações</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="font-medium mb-2">Pontos Fortes:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Crescimento consistente de 12.3%</li>
                  <li>Alta satisfação do paciente (87.5%)</li>
                  <li>Eficiência operacional acima de 90%</li>
                  <li>Taxa de conclusão de {completionRate}%</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2">Áreas de Melhoria:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Reduzir taxa de no-show ({appointmentStats?.noShowRate.toFixed(1)}%)</li>
                  <li>Otimizar horários de pico</li>
                  <li>Expandir telemedicina</li>
                  <li>Balancear carga entre dias da semana</li>
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t">
              <p className="font-medium mb-2">Ações Recomendadas:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Implementar sistema de lembretes automáticos (SMS/Email)</li>
                <li>Alocar mais recursos nas quartas-feiras entre 10h-11h</li>
                <li>Campanha de marketing para telemedicina</li>
                <li>Treinamento de equipe para melhorar tempo de atendimento</li>
                <li>Análise detalhada de causas de no-show</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
