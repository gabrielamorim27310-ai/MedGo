import { Router } from 'express'
import { queueManager } from '../server'

const router = Router()

router.get('/stats/:hospitalId', async (req, res, next) => {
  try {
    const { hospitalId } = req.params
    const stats = await queueManager.getQueueStats(hospitalId)
    res.json(stats)
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
