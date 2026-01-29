'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, Check, CheckCheck, Calendar, Users, Clock, AlertTriangle, Loader2 } from 'lucide-react'
import { useNotifications, Notification } from '@/hooks/useNotifications'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const typeIcons: Record<string, React.ReactNode> = {
  APPOINTMENT_REMINDER: <Calendar className="h-5 w-5 text-blue-500" />,
  QUEUE_UPDATE: <Clock className="h-5 w-5 text-orange-500" />,
  APPOINTMENT_CONFIRMED: <Check className="h-5 w-5 text-green-500" />,
  APPOINTMENT_CANCELLED: <AlertTriangle className="h-5 w-5 text-red-500" />,
  SYSTEM_ALERT: <Bell className="h-5 w-5 text-purple-500" />,
}

const typeLabels: Record<string, string> = {
  APPOINTMENT_REMINDER: 'Lembrete de Consulta',
  QUEUE_UPDATE: 'Atualização de Fila',
  APPOINTMENT_CONFIRMED: 'Consulta Confirmada',
  APPOINTMENT_CANCELLED: 'Consulta Cancelada',
  APPOINTMENT_RESCHEDULED: 'Consulta Reagendada',
  PRESCRIPTION_READY: 'Receita Disponível',
  TEST_RESULT_READY: 'Resultado Disponível',
  SYSTEM_ALERT: 'Alerta do Sistema',
}

function NotificationItem({
  notification,
  onMarkAsRead,
}: {
  notification: Notification
  onMarkAsRead: (id: string) => void
}) {
  const isRead = notification.status === 'READ'

  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
        isRead ? 'bg-background' : 'bg-muted/50 border-primary/20'
      }`}
    >
      <div className="flex-shrink-0 mt-1">
        {typeIcons[notification.type] || <Bell className="h-5 w-5 text-muted-foreground" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-sm font-semibold truncate">{notification.title}</h4>
          <Badge variant={isRead ? 'secondary' : 'default'} className="text-xs">
            {typeLabels[notification.type] || notification.type}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{notification.message}</p>
        <p className="text-xs text-muted-foreground mt-2">
          {formatDistanceToNow(new Date(notification.createdAt), {
            addSuffix: true,
            locale: ptBR,
          })}
        </p>
      </div>

      {!isRead && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onMarkAsRead(notification.id)}
          className="flex-shrink-0"
        >
          <Check className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

export default function NotificationsPage() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications()

  // Sample notifications for when API is not available
  const sampleNotifications: Notification[] = notifications.length > 0 ? notifications : [
    {
      id: '1',
      type: 'APPOINTMENT_REMINDER',
      title: 'Consulta Agendada',
      message: 'Você tem uma consulta marcada para amanhã às 14:00 no Hospital São Lucas.',
      status: 'DELIVERED',
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
      id: '2',
      type: 'QUEUE_UPDATE',
      title: 'Posição na Fila Atualizada',
      message: 'Sua posição na fila de atendimento foi atualizada. Você é o próximo!',
      status: 'DELIVERED',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
      id: '3',
      type: 'APPOINTMENT_CONFIRMED',
      title: 'Consulta Confirmada',
      message: 'Sua consulta com Dr. João Silva foi confirmada para 25/01 às 10:00.',
      status: 'READ',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      readAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    },
    {
      id: '4',
      type: 'SYSTEM_ALERT',
      title: 'Manutenção Programada',
      message: 'O sistema passará por manutenção no dia 28/01 das 02:00 às 04:00.',
      status: 'READ',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      readAt: new Date(Date.now() - 1000 * 60 * 60 * 40).toISOString(),
    },
  ]

  const displayNotifications = notifications.length > 0 ? notifications : sampleNotifications
  const displayUnreadCount = notifications.length > 0
    ? unreadCount
    : sampleNotifications.filter(n => n.status !== 'READ').length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Notificações</h2>
          <p className="text-muted-foreground">
            Gerencie suas notificações e alertas
          </p>
        </div>
        {displayUnreadCount > 0 && (
          <Button variant="outline" className="gap-2 w-full sm:w-auto" onClick={markAllAsRead}>
            <CheckCheck className="h-4 w-4" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayNotifications.length}</div>
            <p className="text-xs text-muted-foreground">Notificações</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Não Lidas</CardTitle>
            <Bell className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayUnreadCount}</div>
            <p className="text-xs text-muted-foreground">Aguardando leitura</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lidas</CardTitle>
            <Check className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {displayNotifications.length - displayUnreadCount}
            </div>
            <p className="text-xs text-muted-foreground">Notificações lidas</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas as Notificações</CardTitle>
          <CardDescription>
            Suas notificações mais recentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : displayNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Nenhuma notificação</h3>
              <p className="text-muted-foreground">
                Você não possui notificações no momento
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
