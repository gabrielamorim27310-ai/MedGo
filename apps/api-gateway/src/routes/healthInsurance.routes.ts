import { Router } from 'express'
import { HealthInsuranceController } from '../controllers/HealthInsuranceController'
import { authenticate, authorize } from '../middlewares/auth'
import { UserRole } from '@medgo/shared-types'

const router = Router()
const controller = new HealthInsuranceController()

// Public endpoints (sem autenticação) - para página de registro
router.get('/public', controller.listPublic.bind(controller))
router.get('/:id/oauth/initiate', controller.initiateOAuth.bind(controller))
router.get('/oauth/callback', controller.handleOAuthCallback.bind(controller))

// Protected endpoints (com autenticação)
router.use(authenticate)

// Read operations - any authenticated user
router.get('/', controller.list.bind(controller))
router.get('/:id', controller.getById.bind(controller))
router.get('/:id/plans', controller.listPlans.bind(controller))

// Write operations - admin only
router.use(authorize(UserRole.SYSTEM_ADMIN, UserRole.HEALTH_INSURANCE_ADMIN))
router.post('/', controller.create.bind(controller))
router.put('/:id', controller.update.bind(controller))
router.delete('/:id', controller.delete.bind(controller))
router.post('/:id/plans', controller.createPlan.bind(controller))
router.put('/:id/plans/:planId', controller.updatePlan.bind(controller))
router.delete('/:id/plans/:planId', controller.deletePlan.bind(controller))

export default router
