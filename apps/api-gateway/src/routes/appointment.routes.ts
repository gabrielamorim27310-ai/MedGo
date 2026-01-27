import { Router } from 'express'
import { AppointmentController } from '../controllers/AppointmentController'
import { authenticate, authorize } from '../middlewares/auth'
import { validate } from '../middlewares/validator'
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  cancelAppointmentSchema,
  rescheduleAppointmentSchema,
  completeAppointmentSchema,
  getAvailableSlotsSchema,
} from '../validators/appointment.validator'
import { UserRole } from '@medgo/shared-types'

const router = Router()
const appointmentController = new AppointmentController()

router.get(
  '/available-slots',
  authenticate,
  validate(getAvailableSlotsSchema),
  appointmentController.getAvailableSlots
)

router.get(
  '/statistics',
  authenticate,
  authorize([UserRole.SYSTEM_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR]),
  appointmentController.getStatistics
)

router.post(
  '/',
  authenticate,
  authorize([
    UserRole.SYSTEM_ADMIN,
    UserRole.HOSPITAL_ADMIN,
    UserRole.RECEPTIONIST,
    UserRole.DOCTOR,
    UserRole.PATIENT,
  ]),
  validate(createAppointmentSchema),
  appointmentController.create
)

router.get(
  '/',
  authenticate,
  appointmentController.findAll
)

router.get(
  '/:id',
  authenticate,
  appointmentController.findOne
)

router.put(
  '/:id',
  authenticate,
  authorize([
    UserRole.SYSTEM_ADMIN,
    UserRole.HOSPITAL_ADMIN,
    UserRole.RECEPTIONIST,
    UserRole.DOCTOR,
  ]),
  validate(updateAppointmentSchema),
  appointmentController.update
)

router.delete(
  '/:id',
  authenticate,
  authorize([UserRole.SYSTEM_ADMIN, UserRole.HOSPITAL_ADMIN]),
  appointmentController.delete
)

router.post(
  '/:id/confirm',
  authenticate,
  authorize([
    UserRole.SYSTEM_ADMIN,
    UserRole.HOSPITAL_ADMIN,
    UserRole.RECEPTIONIST,
    UserRole.PATIENT,
  ]),
  appointmentController.confirm
)

router.post(
  '/:id/cancel',
  authenticate,
  validate(cancelAppointmentSchema),
  appointmentController.cancel
)

router.post(
  '/:id/reschedule',
  authenticate,
  validate(rescheduleAppointmentSchema),
  appointmentController.reschedule
)

router.post(
  '/:id/check-in',
  authenticate,
  authorize([
    UserRole.SYSTEM_ADMIN,
    UserRole.HOSPITAL_ADMIN,
    UserRole.RECEPTIONIST,
    UserRole.PATIENT,
  ]),
  appointmentController.checkIn
)

router.post(
  '/:id/complete',
  authenticate,
  authorize([UserRole.SYSTEM_ADMIN, UserRole.DOCTOR]),
  validate(completeAppointmentSchema),
  appointmentController.complete
)

export default router
