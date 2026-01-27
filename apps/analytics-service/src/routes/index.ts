import { Router } from 'express'
import { AnalyticsController } from '../controllers/AnalyticsController'
import { ReportController } from '../controllers/ReportController'

const router = Router()
const analyticsController = new AnalyticsController()
const reportController = new ReportController()

// Analytics routes
router.get('/overview', analyticsController.getOverview.bind(analyticsController))

router.get(
  '/appointments',
  analyticsController.getAppointmentAnalytics.bind(analyticsController)
)

router.get(
  '/queues',
  analyticsController.getQueueAnalytics.bind(analyticsController)
)

router.get(
  '/hospitals/:hospitalId/performance',
  analyticsController.getHospitalPerformance.bind(analyticsController)
)

router.get('/trends', analyticsController.getTrends.bind(analyticsController))

router.get(
  '/top-hospitals',
  analyticsController.getTopHospitals.bind(analyticsController)
)

// Report routes
router.get(
  '/reports/appointments',
  reportController.generateAppointmentReport.bind(reportController)
)

router.get(
  '/reports/queues',
  reportController.generateQueueReport.bind(reportController)
)

router.get(
  '/reports/hospitals/:hospitalId',
  reportController.generateHospitalReport.bind(reportController)
)

router.get(
  '/reports/comprehensive',
  reportController.generateComprehensiveReport.bind(reportController)
)

export default router
