import { Router } from 'express'
import { AuthController } from '../controllers/AuthController'
import { validate } from '../middlewares/validator'
import { authenticate } from '../middlewares/auth'
import { loginSchema, registerSchema } from '../validators/auth.validator'

const router = Router()
const authController = new AuthController()

router.post('/login', validate(loginSchema), authController.login)
router.post('/register', validate(registerSchema), authController.register)
router.post('/refresh', authController.refresh)
router.post('/logout', authController.logout)
router.post('/forgot-password', authController.forgotPassword)
router.post('/reset-password', authController.resetPassword)

// SSO Google (Google Identity Services → ID token)
router.post('/google', authController.googleSignIn)

// Verificação de e-mail (Resend)
router.post('/verify-email', authController.verifyEmail)
router.post('/verify-email/resend', authController.resendVerification)

// LGPD — direitos do titular
router.get('/me/export', authenticate, authController.exportMyData)
router.post('/me/consent', authenticate, authController.updateConsent)

// Completar perfil (contas criadas via SSO Google)
router.post('/me/complete-profile', authenticate, authController.completeProfile)

export default router
