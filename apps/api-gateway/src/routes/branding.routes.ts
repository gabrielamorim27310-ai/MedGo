import { Router } from 'express'
import { BrandingController } from '../controllers/BrandingController'
import { authenticate, authorize } from '../middlewares/auth'
import { UserRole } from '@acolhe/shared-types'

const router = Router()
const brandingController = new BrandingController()

// Público: o frontend do tenant carrega o tema por slug antes do login
router.get('/:slug', brandingController.getBySlug)

router.use(authenticate)
router.use(authorize(UserRole.SYSTEM_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.HEALTH_INSURANCE_ADMIN))

router.get('/', brandingController.list)
router.put('/', brandingController.upsert)
router.delete('/:slug', authorize(UserRole.SYSTEM_ADMIN), brandingController.delete)

export default router
