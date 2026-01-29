// @ts-nocheck
import { Request, Response } from 'express'
import { ReportService } from '../services/ReportService'

export class ReportController {
  private reportService: ReportService

  constructor() {
    this.reportService = new ReportService()
  }

  async generateAppointmentReport(req: Request, res: Response) {
    try {
      const { hospitalId, startDate, endDate, format } = req.query

      const start = startDate ? new Date(startDate as string) : undefined
      const end = endDate ? new Date(endDate as string) : undefined

      if (format === 'csv') {
        const csvData = await this.reportService.generateAppointmentCSV(
          hospitalId as string,
          start,
          end
        )

        res.setHeader('Content-Type', 'text/csv')
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=appointment-report-${Date.now()}.csv`
        )
        return res.send(csvData)
      }

      const report = await this.reportService.generateAppointmentReport(
        hospitalId as string,
        start,
        end
      )

      res.setHeader('Content-Type', 'application/json')
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=appointment-report-${Date.now()}.json`
      )
      res.send(report)
    } catch (error) {
      console.error('Error generating appointment report:', error)
      res.status(500).json({ message: 'Error generating appointment report' })
    }
  }

  async generateQueueReport(req: Request, res: Response) {
    try {
      const { hospitalId, startDate, endDate } = req.query

      const start = startDate ? new Date(startDate as string) : undefined
      const end = endDate ? new Date(endDate as string) : undefined

      const report = await this.reportService.generateQueueReport(
        hospitalId as string,
        start,
        end
      )

      res.setHeader('Content-Type', 'application/json')
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=queue-report-${Date.now()}.json`
      )
      res.send(report)
    } catch (error) {
      console.error('Error generating queue report:', error)
      res.status(500).json({ message: 'Error generating queue report' })
    }
  }

  async generateHospitalReport(req: Request, res: Response) {
    try {
      const { hospitalId } = req.params
      const { startDate, endDate } = req.query

      const start = startDate ? new Date(startDate as string) : undefined
      const end = endDate ? new Date(endDate as string) : undefined

      const report = await this.reportService.generateHospitalPerformanceReport(
        hospitalId,
        start,
        end
      )

      res.setHeader('Content-Type', 'application/json')
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=hospital-report-${hospitalId}-${Date.now()}.json`
      )
      res.send(report)
    } catch (error) {
      console.error('Error generating hospital report:', error)
      res.status(500).json({ message: 'Error generating hospital report' })
    }
  }

  async generateComprehensiveReport(req: Request, res: Response) {
    try {
      const { hospitalId, startDate, endDate } = req.query

      const start = startDate ? new Date(startDate as string) : undefined
      const end = endDate ? new Date(endDate as string) : undefined

      const report = await this.reportService.generateComprehensiveReport(
        hospitalId as string,
        start,
        end
      )

      res.setHeader('Content-Type', 'application/json')
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=comprehensive-report-${Date.now()}.json`
      )
      res.send(report)
    } catch (error) {
      console.error('Error generating comprehensive report:', error)
      res.status(500).json({ message: 'Error generating comprehensive report' })
    }
  }
}
