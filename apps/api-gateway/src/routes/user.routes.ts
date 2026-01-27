import { Router } from 'express'
import { UserController } from '../controllers/UserController'
import { authenticate, authorize } from '../middlewares/auth'
import { UserRole } from '@medgo/shared-types'

const router = Router()
const userController = new UserController()

router.use(authenticate)

router.get('/', authorize(UserRole.SYSTEM_ADMIN, UserRole.HOSPITAL_ADMIN), userController.list)
router.get('/me', userController.getProfile)
router.get('/:id', userController.getById)
router.put('/:id', userController.update)
router.delete('/:id', authorize(UserRole.SYSTEM_ADMIN), userController.delete)

export default router
