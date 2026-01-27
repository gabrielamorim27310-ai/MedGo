import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { NotificationWorker } from './workers/NotificationWorker'
import notificationRoutes from './routes/notification.routes'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3003

// Initialize Notification Worker
const notificationWorker = new NotificationWorker()
notificationWorker.start()

// Middlewares
app.use(helmet())
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true,
}))
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'notification-service', timestamp: new Date() })
})

// Routes
app.use('/api/notifications', notificationRoutes)

app.listen(PORT, () => {
  console.log(`🚀 Notification Service running on port ${PORT}`)
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...')
  await notificationWorker.stop()
  process.exit(0)
})

export default app
