import Queue from 'bull'

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

export const notificationQueue = new Queue('notifications', REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
})

notificationQueue.on('error', (error) => {
  console.error('Queue error:', error)
})

notificationQueue.on('failed', (job, error) => {
  console.error(`Job ${job.id} failed:`, error)
})

notificationQueue.on('completed', (job) => {
  console.log(`Job ${job.id} completed`)
})
