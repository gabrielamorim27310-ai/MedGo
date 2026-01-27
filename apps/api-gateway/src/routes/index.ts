import { Router } from 'express'
import authRoutes from './auth.routes'
import userRoutes from './user.routes'
import patientRoutes from './patient.routes'
import hospitalRoutes from './hospital.routes'
import queueRoutes from './queue.routes'
import appointmentRoutes from './appointment.routes'
import healthInsuranceRoutes from './healthInsurance.routes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/users', userRoutes)
router.use('/patients', patientRoutes)
router.use('/hospitals', hospitalRoutes)
router.use('/queues', queueRoutes)
router.use('/appointments', appointmentRoutes)
router.use('/health-insurances', healthInsuranceRoutes)

export default router
