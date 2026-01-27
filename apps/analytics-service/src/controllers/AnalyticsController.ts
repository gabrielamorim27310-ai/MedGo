import { Request, Response } from 'express'
import { AnalyticsService } from '../services/AnalyticsService'

export class AnalyticsController {
  private analyticsService: AnalyticsService

  constructor() {
    this.analyticsService = new AnalyticsService()
  }

  async getOverview(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query

      const start = startDate ? new Date(startDate as string) : undefined
      const end = endDate ? new Date(endDate as string) : undefined

      const metrics = await this.analyticsService.getOverviewMetrics(start, end)

      res.json(metrics)
    } catch (error) {
      console.error('Error fetching overview metrics:', error)
      res.status(500).json({ message: 'Error fetching overview metrics' })
    }
  }

  async getAppointmentAnalytics(req: Request, res: Response) {
    try {
      const { hospitalId, startDate, endDate } = req.query

      const start = startDate ? new Date(startDate as string) : undefined
      const end = endDate ? new Date(endDate as string) : undefined

      const analytics = await this.analyticsService.getAppointmentAnalytics(
        hospitalId as string,
        start,
        end
      )

      res.json(analytics)
    } catch (error) {
      console.error('Error fetching appointment analytics:', error)
      res.status(500).json({ message: 'Error fetching appointment analytics' })
    }
  }

  async getQueueAnalytics(req: Request, res: Response) {
    try {
      const { hospitalId, startDate, endDate } = req.query

      const start = startDate ? new Date(startDate as string) : undefined
      const end = endDate ? new Date(endDate as string) : undefined

      const analytics = await this.analyticsService.getQueueAnalytics(
        hospitalId as string,
        start,
        end
      )

      res.json(analytics)
    } catch (error) {
      console.error('Error fetching queue analytics:', error)
      res.status(500).json({ message: 'Error fetching queue analytics' })
    }
  }

  async getHospitalPerformance(req: Request, res: Response) {
    try {
      const { hospitalId } = req.params
      const { startDate, endDate } = req.query

      const start = startDate ? new Date(startDate as string) : undefined
      const end = endDate ? new Date(endDate as string) : undefined

      const performance = await this.analyticsService.getHospitalPerformance(
        hospitalId,
        start,
        end
      )

      res.json(performance)
    } catch (error) {
      console.error('Error fetching hospital performance:', error)
      res.status(500).json({ message: 'Error fetching hospital performance' })
    }
  }

  async getTrends(req: Request, res: Response) {
    try {
      const { metric, days, hospitalId } = req.query

      if (!metric) {
        return res.status(400).json({ message: 'Metric parameter is required' })
      }

      const numDays = days ? parseInt(days as string) : 30
      const trends = await this.analyticsService.getTrendData(
        metric as string,
        numDays,
        hospitalId as string
      )

      res.json({ metric, days: numDays, data: trends })
    } catch (error) {
      console.error('Error fetching trends:', error)
      res.status(500).json({ message: 'Error fetching trends' })
    }
  }

  async getTopHospitals(req: Request, res: Response) {
    try {
      const { limit, startDate, endDate } = req.query

      const numLimit = limit ? parseInt(limit as string) : 10
      const start = startDate ? new Date(startDate as string) : undefined
      const end = endDate ? new Date(endDate as string) : undefined

      const hospitals = await this.analyticsService.getTopPerformingHospitals(
        numLimit,
        start,
        end
      )

      res.json({ total: hospitals.length, data: hospitals })
    } catch (error) {
      console.error('Error fetching top hospitals:', error)
      res.status(500).json({ message: 'Error fetching top hospitals' })
    }
  }
}
