import { Router } from 'express'
import { QueueController } from '../controllers/QueueController'
import { authenticate, authorize } from '../middlewares/auth'
import { UserRole } from '@medgo/shared-types'

const router = Router()
const queueController = new QueueController()

router.use(authenticate)

router.get('/', queueController.list)
router.post('/', queueController.create)
router.get('/:id', queueController.getById)
router.put('/:id', authorize(UserRole.DOCTOR, UserRole.NURSE, UserRole.HOSPITAL_ADMIN), queueController.update)
router.delete('/:id', authorize(UserRole.HOSPITAL_ADMIN, UserRole.SYSTEM_ADMIN), queueController.delete)
router.get('/hospital/:hospitalId', queueController.getByHospital)
router.get('/hospital/:hospitalId/stats', queueController.getStats)

export default router
