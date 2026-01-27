import { Request, Response, NextFunction } from 'express'
import { NotificationService } from '../services/NotificationService'
import { CreateNotificationDTO, UpdateNotificationDTO } from '@medgo/shared-types'

export class NotificationController {
  private notificationService: NotificationService

  constructor() {
    this.notificationService = new NotificationService()
  }

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body as CreateNotificationDTO
      const notification = await this.notificationService.create(data)
      res.status(201).json(notification)
    } catch (error) {
      next(error)
    }
  }

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params
      const data = req.body as UpdateNotificationDTO
      const notification = await this.notificationService.update(id, data)
      res.json(notification)
    } catch (error) {
      next(error)
    }
  }

  markAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params
      const notification = await this.notificationService.markAsRead(id)
      res.json(notification)
    } catch (error) {
      next(error)
    }
  }

  getUserNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params
      const { page = 1, limit = 20 } = req.query

      const result = await this.notificationService.getUserNotifications(
        userId,
        Number(page),
        Number(limit)
      )

      res.json(result)
    } catch (error) {
      next(error)
    }
  }

  getUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params
      const count = await this.notificationService.getUnreadCount(userId)
      res.json({ count })
    } catch (error) {
      next(error)
    }
  }
}
