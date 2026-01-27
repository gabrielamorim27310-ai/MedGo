import { Router } from 'express'
import { AuthController } from '../controllers/AuthController'
import { validate } from '../middlewares/validator'
import { loginSchema, registerSchema } from '../validators/auth.validator'

const router = Router()
const authController = new AuthController()

router.post('/login', validate(loginSchema), authController.login)
router.post('/register', validate(registerSchema), authController.register)
router.post('/refresh', authController.refresh)
router.post('/logout', authController.logout)
router.post('/forgot-password', authController.forgotPassword)
router.post('/reset-password', authController.resetPassword)

export default router
