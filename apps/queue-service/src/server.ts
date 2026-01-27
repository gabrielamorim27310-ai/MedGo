import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { QueueManager } from './services/QueueManager'
import { initializeSocketHandlers } from './socket/handlers'
import queueRoutes from './routes/queue.routes'

dotenv.config()

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
})

const PORT = process.env.PORT || 3002

// Initialize Queue Manager
export const queueManager = new QueueManager(io)

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
  res.json({ status: 'ok', service: 'queue-service', timestamp: new Date() })
})

// Routes
app.use('/api/queues', queueRoutes)

// Initialize Socket.IO handlers
initializeSocketHandlers(io)

httpServer.listen(PORT, () => {
  console.log(`🚀 Queue Service running on port ${PORT}`)
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔌 WebSocket server is running`)
})

export default app
