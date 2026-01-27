import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

const SOCKET_URL = process.env.NEXT_PUBLIC_QUEUE_SERVICE_URL || 'http://localhost:3002'

export function useSocket() {
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socketRef.current.on('connect', () => {
      console.log('Socket connected')
      setIsConnected(true)
    })

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected')
      setIsConnected(false)
    })

    socketRef.current.on('error', (error) => {
      console.error('Socket error:', error)
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  const joinHospital = (hospitalId: string) => {
    socketRef.current?.emit('join:hospital', hospitalId)
  }

  const leaveHospital = (hospitalId: string) => {
    socketRef.current?.emit('leave:hospital', hospitalId)
  }

  const joinPatient = (patientId: string) => {
    socketRef.current?.emit('join:patient', patientId)
  }

  const leavePatient = (patientId: string) => {
    socketRef.current?.emit('leave:patient', patientId)
  }

  const callNextPatient = (hospitalId: string, specialty?: string) => {
    socketRef.current?.emit('queue:call-next', { hospitalId, specialty })
  }

  const on = (event: string, callback: (...args: any[]) => void) => {
    socketRef.current?.on(event, callback)
  }

  const off = (event: string, callback?: (...args: any[]) => void) => {
    socketRef.current?.off(event, callback)
  }

  return {
    socket: socketRef.current,
    isConnected,
    joinHospital,
    leaveHospital,
    joinPatient,
    leavePatient,
    callNextPatient,
    on,
    off,
  }
}
