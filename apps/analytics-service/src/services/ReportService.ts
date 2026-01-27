import { AnalyticsService } from './AnalyticsService'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export class ReportService {
  private analyticsService: AnalyticsService

  constructor() {
    this.analyticsService = new AnalyticsService()
  }

  async generateAppointmentReport(
    hospitalId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<string> {
    const analytics = await this.analyticsService.getAppointmentAnalytics(
      hospitalId,
      startDate,
      endDate
    )

    const reportData = {
      title: 'Relatório de Agendamentos',
      generatedAt: format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }),
      period: {
        start: format(analytics.period.start, 'dd/MM/yyyy', { locale: ptBR }),
        end: format(analytics.period.end, 'dd/MM/yyyy', { locale: ptBR }),
      },
      metrics: {
        total: analytics.total,
        averageDuration: `${analytics.averageDuration} minutos`,
        noShowRate: `${analytics.noShowRate.toFixed(2)}%`,
      },
      statusDistribution: analytics.statusDistribution,
      typeDistribution: analytics.typeDistribution,
    }

    return JSON.stringify(reportData, null, 2)
  }

  async generateQueueReport(
    hospitalId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<string> {
    const analytics = await this.analyticsService.getQueueAnalytics(
      hospitalId,
      startDate,
      endDate
    )

    const reportData = {
      title: 'Relatório de Filas de Atendimento',
      generatedAt: format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }),
      period: {
        start: format(analytics.period.start, 'dd/MM/yyyy', { locale: ptBR }),
        end: format(analytics.period.end, 'dd/MM/yyyy', { locale: ptBR }),
      },
      metrics: {
        total: analytics.total,
        averageWaitTime: `${analytics.averageWaitTime} minutos`,
        completionRate: `${analytics.completionRate.toFixed(2)}%`,
      },
      statusDistribution: analytics.statusDistribution,
      priorityDistribution: analytics.priorityDistribution,
    }

    return JSON.stringify(reportData, null, 2)
  }

  async generateHospitalPerformanceReport(
    hospitalId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<string> {
    const performance = await this.analyticsService.getHospitalPerformance(
      hospitalId,
      startDate,
      endDate
    )

    const reportData = {
      title: 'Relatório de Performance Hospitalar',
      generatedAt: format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }),
      hospitalId: performance.hospitalId,
      period: {
        start: format(performance.period.start, 'dd/MM/yyyy', { locale: ptBR }),
        end: format(performance.period.end, 'dd/MM/yyyy', { locale: ptBR }),
      },
      metrics: {
        uniquePatients: performance.uniquePatients,
        averageRating: performance.averageRating.toFixed(2),
        utilizationRate: `${performance.utilizationRate.toFixed(2)}%`,
      },
      appointments: {
        total: performance.appointments.total,
        noShowRate: `${performance.appointments.noShowRate.toFixed(2)}%`,
        averageDuration: `${performance.appointments.averageDuration} minutos`,
      },
      queues: {
        total: performance.queues.total,
        averageWaitTime: `${performance.queues.averageWaitTime} minutos`,
        completionRate: `${performance.queues.completionRate.toFixed(2)}%`,
      },
    }

    return JSON.stringify(reportData, null, 2)
  }

  async generateComprehensiveReport(
    hospitalId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<string> {
    const [overview, appointmentAnalytics, queueAnalytics, topHospitals] = await Promise.all([
      this.analyticsService.getOverviewMetrics(startDate, endDate),
      this.analyticsService.getAppointmentAnalytics(hospitalId, startDate, endDate),
      this.analyticsService.getQueueAnalytics(hospitalId, startDate, endDate),
      this.analyticsService.getTopPerformingHospitals(5, startDate, endDate),
    ])

    const reportData = {
      title: 'Relatório Completo do Sistema MedGo',
      generatedAt: format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }),
      period: {
        start: format(overview.period.start, 'dd/MM/yyyy', { locale: ptBR }),
        end: format(overview.period.end, 'dd/MM/yyyy', { locale: ptBR }),
      },
      overview: {
        totalPatients: overview.totalPatients,
        totalHospitals: overview.totalHospitals,
        totalAppointments: overview.totalAppointments,
        totalQueueEntries: overview.totalQueueEntries,
        activeQueues: overview.activeQueues,
        completedAppointments: overview.completedAppointments,
      },
      appointments: {
        total: appointmentAnalytics.total,
        averageDuration: `${appointmentAnalytics.averageDuration} minutos`,
        noShowRate: `${appointmentAnalytics.noShowRate.toFixed(2)}%`,
        statusDistribution: appointmentAnalytics.statusDistribution,
        typeDistribution: appointmentAnalytics.typeDistribution,
      },
      queues: {
        total: queueAnalytics.total,
        averageWaitTime: `${queueAnalytics.averageWaitTime} minutos`,
        completionRate: `${queueAnalytics.completionRate.toFixed(2)}%`,
        statusDistribution: queueAnalytics.statusDistribution,
        priorityDistribution: queueAnalytics.priorityDistribution,
      },
      topHospitals: topHospitals.map((hospital) => ({
        name: hospital.name,
        location: `${hospital.city}, ${hospital.state}`,
        completedAppointments: hospital.completedAppointments,
        completedQueueEntries: hospital.completedQueueEntries,
      })),
    }

    return JSON.stringify(reportData, null, 2)
  }

  generateCSVFromData(data: any[], headers: string[]): string {
    const headerRow = headers.join(',')
    const rows = data.map((row) =>
      headers.map((header) => `"${row[header] || ''}"`).join(',')
    )

    return [headerRow, ...rows].join('\n')
  }

  async generateAppointmentCSV(
    hospitalId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<string> {
    const analytics = await this.analyticsService.getAppointmentAnalytics(
      hospitalId,
      startDate,
      endDate
    )

    const data = Object.entries(analytics.statusDistribution).map(([status, count]) => ({
      status,
      count,
      percentage: ((count as number / analytics.total) * 100).toFixed(2),
    }))

    return this.generateCSVFromData(data, ['status', 'count', 'percentage'])
  }
}
