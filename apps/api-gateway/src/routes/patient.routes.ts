import { Router } from 'express'
import { PatientController } from '../controllers/PatientController'
import { authenticate, authorize } from '../middlewares/auth'
import { UserRole } from '@medgo/shared-types'

const router = Router()
const patientController = new PatientController()

router.use(authenticate)

// Rotas do paciente logado (devem vir antes das rotas com :id)
router.get('/me', patientController.getMe)
router.patch('/me/health-insurance', patientController.updateMyHealthInsurance)
router.get('/me/dependents', patientController.listMyDependents)
router.post('/me/dependents', patientController.createDependent)
router.delete('/me/dependents/:dependentId', patientController.deleteDependent)

router.get('/', authorize(UserRole.DOCTOR, UserRole.NURSE, UserRole.HOSPITAL_ADMIN, UserRole.SYSTEM_ADMIN), patientController.list)
router.post('/', patientController.create)
router.get('/:id', patientController.getById)
router.put('/:id', patientController.update)
router.delete('/:id', authorize(UserRole.SYSTEM_ADMIN), patientController.delete)

export default router
