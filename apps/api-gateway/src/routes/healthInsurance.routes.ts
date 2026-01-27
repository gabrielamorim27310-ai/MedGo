import { Router } from 'express'
import { HealthInsuranceController } from '../controllers/HealthInsuranceController'

const router = Router()
const controller = new HealthInsuranceController()

// Health Insurance CRUD
router.get('/', controller.list.bind(controller))
router.get('/:id', controller.getById.bind(controller))
router.post('/', controller.create.bind(controller))
router.put('/:id', controller.update.bind(controller))
router.delete('/:id', controller.delete.bind(controller))

// Plans management
router.get('/:id/plans', controller.listPlans.bind(controller))
router.post('/:id/plans', controller.createPlan.bind(controller))
router.put('/:id/plans/:planId', controller.updatePlan.bind(controller))
router.delete('/:id/plans/:planId', controller.deletePlan.bind(controller))

export default router
