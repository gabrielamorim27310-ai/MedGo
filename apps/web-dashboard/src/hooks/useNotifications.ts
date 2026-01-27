import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'READ'
  createdAt: string
  readAt?: string
  data?: Record<string, any>
}

interface NotificationsResponse {
  data: Notification[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get<NotificationsResponse>('/notifications')
      const data = response.data?.data || []
      setNotifications(data)
      setUnreadCount(data.filter(n => n.status !== 'READ').length)
    } catch (err: any) {
      // Notifications API might not exist yet, don't show error
      console.log('Notifications API not available yet')
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }, [])

  const markAsRead = useCallback(async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`)
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, status: 'READ' as const, readAt: new Date().toISOString() } : n))
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      await api.put('/notifications/read-all')
      setNotifications(prev =>
        prev.map(n => ({ ...n, status: 'READ' as const, readAt: new Date().toISOString() }))
      )
      setUnreadCount(0)
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  }
}
