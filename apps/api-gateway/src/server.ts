import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { errorHandler } from './middlewares/errorHandler'
import { notFound } from './middlewares/notFound'
import { auditTrail } from './middlewares/audit'
import routes from './routes'

dotenv.config()

const app: express.Express = express()
const PORT = process.env.PORT || 3001

// Middlewares
app.use(helmet())
app.use(cors({
  // Lista separada por vírgula (ex.: localhost + domínio da Vercel)
  origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map((o) => o.trim()),
  credentials: true,
}))
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'api-gateway', timestamp: new Date() })
})

// Trilha de auditoria LGPD sobre recursos com dados pessoais
app.use('/api', auditTrail)

// Routes
app.use('/api', routes)

// Error handlers
app.use(notFound)
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`)
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`)
})

export default app
