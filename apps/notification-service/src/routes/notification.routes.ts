import { Router, type Router as RouterType } from 'express'
import { NotificationController } from '../controllers/NotificationController'

const router: RouterType = Router()
const notificationController = new NotificationController()

router.post('/', notificationController.create)
router.get('/user/:userId', notificationController.getUserNotifications)
router.get('/user/:userId/unread-count', notificationController.getUnreadCount)
router.put('/:id/read', notificationController.markAsRead)
router.put('/:id', notificationController.update)

export default router
