import { Router, type Router as RouterType } from 'express'
import { queueManager } from '../server'

const router: RouterType = Router()

// Check-in: adiciona paciente à fila virtual (posição, senha, estimativa e eventos em tempo real)
router.post('/', async (req, res, next) => {
  try {
    const entry = await queueManager.addToQueue(req.body)
    res.status(201).json(entry)
  } catch (error) {
    next(error)
  }
})

router.patch('/:id', async (req, res, next) => {
  try {
    const entry = await queueManager.updateQueueEntry(req.params.id, req.body)
    res.json(entry)
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    await queueManager.removeFromQueue(req.params.id)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

router.get('/stats/:hospitalId', async (req, res, next) => {
  try {
    const { hospitalId } = req.params
    const stats = await queueManager.getQueueStats(hospitalId)
    res.json(stats)
  } catch (error) {
    next(error)
  }
})

// Estimativa de espera para quem ainda vai chegar (recomendação de unidades)
router.get('/estimate/:hospitalId', async (req, res, next) => {
  try {
    const { hospitalId } = req.params
    const priority = (req.query.priority as any) || 'NORMAL'
    const estimate = await queueManager.estimateForNewArrival(hospitalId, priority)
    res.json({ hospitalId, priority, ...estimate })
  } catch (error) {
    next(error)
  }
})

router.post('/call-next', async (req, res, next) => {
  try {
    const { hospitalId, specialty } = req.body
    const entry = await queueManager.callNextPatient(hospitalId, specialty)
    res.json(entry)
  } catch (error) {
    next(error)
  }
})

export default router
