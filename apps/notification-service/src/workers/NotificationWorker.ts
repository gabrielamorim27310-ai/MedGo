import { notificationQueue } from '../queues/notificationQueue'
import { NotificationService } from '../services/NotificationService'

export class NotificationWorker {
  private notificationService: NotificationService

  constructor() {
    this.notificationService = new NotificationService()
  }

  start() {
    console.log('📬 Notification worker started')

    notificationQueue.process('send-notification', async (job) => {
      const { notificationId } = job.data

      console.log(`Processing notification ${notificationId}`)

      try {
        await this.notificationService.send(notificationId)
        console.log(`Notification ${notificationId} sent successfully`)
      } catch (error) {
        console.error(`Failed to send notification ${notificationId}:`, error)
        throw error
      }
    })
  }

  async stop() {
    console.log('Stopping notification worker...')
    await notificationQueue.close()
    console.log('Notification worker stopped')
  }
}
