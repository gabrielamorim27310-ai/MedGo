import { Server, Socket } from 'socket.io'
import { queueManager } from '../server'

export function initializeSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`)

    socket.on('join:hospital', (hospitalId: string) => {
      socket.join(`hospital:${hospitalId}`)
      console.log(`Socket ${socket.id} joined hospital room: ${hospitalId}`)
    })

    socket.on('join:patient', (patientId: string) => {
      socket.join(`patient:${patientId}`)
      console.log(`Socket ${socket.id} joined patient room: ${patientId}`)
    })

    socket.on('leave:hospital', (hospitalId: string) => {
      socket.leave(`hospital:${hospitalId}`)
      console.log(`Socket ${socket.id} left hospital room: ${hospitalId}`)
    })

    socket.on('leave:patient', (patientId: string) => {
      socket.leave(`patient:${patientId}`)
      console.log(`Socket ${socket.id} left patient room: ${patientId}`)
    })

    socket.on('queue:call-next', async ({ hospitalId, specialty }) => {
      try {
        const entry = await queueManager.callNextPatient(hospitalId, specialty)
        socket.emit('queue:next-called', entry)
      } catch (error) {
        socket.emit('error', { message: 'Failed to call next patient' })
      }
    })

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`)
    })
  })
}
