import { prisma } from '../lib/prisma'
import {
  Notification,
  NotificationChannel,
  NotificationStatus,
  CreateNotificationDTO,
  UpdateNotificationDTO,
} from '@medgo/shared-types'
import { EmailService } from './EmailService'
import { notificationQueue } from '../queues/notificationQueue'

export class NotificationService {
  private emailService: EmailService

  constructor() {
    this.emailService = new EmailService()
  }

  async create(data: CreateNotificationDTO): Promise<Notification> {
    const notification = await prisma.notification.create({
      data: {
        ...data,
        status: NotificationStatus.PENDING,
      },
    })

    if (data.scheduledFor && data.scheduledFor > new Date()) {
      const delay = data.scheduledFor.getTime() - Date.now()
      await notificationQueue.add(
        'send-notification',
        { notificationId: notification.id },
        { delay }
      )
    } else {
      await notificationQueue.add('send-notification', { notificationId: notification.id })
    }

    return notification as Notification
  }

  async send(notificationId: string): Promise<void> {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      include: {
        user: true,
      },
    })

    if (!notification) {
      throw new Error('Notification not found')
    }

    try {
      await this.update(notificationId, {
        status: NotificationStatus.SENT,
        sentAt: new Date(),
      })

      switch (notification.channel) {
        case NotificationChannel.EMAIL:
          await this.sendEmail(notification)
          break
        case NotificationChannel.SMS:
          await this.sendSMS(notification)
          break
        case NotificationChannel.PUSH:
          await this.sendPush(notification)
          break
        case NotificationChannel.IN_APP:
          break
        default:
          throw new Error(`Unsupported notification channel: ${notification.channel}`)
      }

      await this.update(notificationId, {
        status: NotificationStatus.DELIVERED,
        deliveredAt: new Date(),
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      await this.update(notificationId, {
        status: NotificationStatus.FAILED,
        error: errorMessage,
      })
      throw error
    }
  }

  private async sendEmail(notification: any): Promise<void> {
    await this.emailService.send(notification, notification.user.email)
  }

  private async sendSMS(notification: any): Promise<void> {
    console.log('SMS sending not implemented yet')
  }

  private async sendPush(notification: any): Promise<void> {
    console.log('Push notification sending not implemented yet')
  }

  async update(id: string, data: UpdateNotificationDTO): Promise<Notification> {
    const notification = await prisma.notification.update({
      where: { id },
      data: data as any,
    })

    return notification as Notification
  }

  async markAsRead(id: string): Promise<Notification> {
    return this.update(id, {
      status: NotificationStatus.READ,
      readAt: new Date(),
    })
  }

  async getUserNotifications(
    userId: string,
    page = 1,
    limit = 20
  ): Promise<{ data: Notification[]; total: number }> {
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where: { userId } }),
    ])

    return {
      data: notifications as Notification[],
      total,
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        status: { not: NotificationStatus.READ },
      },
    })
  }
}
