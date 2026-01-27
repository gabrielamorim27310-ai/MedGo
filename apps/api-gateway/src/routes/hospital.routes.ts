import { Router } from 'express'
import { HospitalController } from '../controllers/HospitalController'
import { authenticate, authorize } from '../middlewares/auth'
import { UserRole } from '@medgo/shared-types'

const router = Router()
const hospitalController = new HospitalController()

router.get('/', hospitalController.list)
router.get('/:id', hospitalController.getById)

router.use(authenticate)
router.use(authorize(UserRole.HOSPITAL_ADMIN, UserRole.SYSTEM_ADMIN))

router.post('/', hospitalController.create)
router.put('/:id', hospitalController.update)
router.delete('/:id', authorize(UserRole.SYSTEM_ADMIN), hospitalController.delete)

export default router
