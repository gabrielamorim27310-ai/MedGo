const NOTIFICATION_SERVICE_URL =
  process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003/api'

interface DispatchPayload {
  userId: string
  type: string
  channel?: string
  title: string
  message: string
  data?: Record<string, unknown>
}

/**
 * Integração fila → notificações: envia eventos da fila virtual para o
 * notification-service via HTTP. Falhas são registradas mas nunca
 * interrompem o fluxo da fila (fire-and-forget).
 */
export class NotificationDispatcher {
  async dispatch(payload: DispatchPayload): Promise<void> {
    try {
      const response = await fetch(`${NOTIFICATION_SERVICE_URL}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'IN_APP', ...payload }),
      })

      if (!response.ok) {
        console.error(
          `[NotificationDispatcher] notification-service respondeu ${response.status}`
        )
      }
    } catch (error) {
      console.error('[NotificationDispatcher] falha ao despachar notificação:', error)
    }
  }

  async queueCheckIn(userId: string, params: {
    hospitalName: string
    ticketCode: string
    position: number
    estimatedWaitTime: number
  }): Promise<void> {
    await this.dispatch({
      userId,
      type: 'QUEUE_UPDATE',
      title: `Senha ${params.ticketCode} — check-in confirmado`,
      message: `Você entrou na fila do ${params.hospitalName}. Posição: ${params.position}. Espera estimada: ${params.estimatedWaitTime} min.`,
      data: params,
    })
  }

  async queuePositionUpdate(userId: string, params: {
    ticketCode?: string | null
    position: number
    estimatedWaitTime: number
  }): Promise<void> {
    await this.dispatch({
      userId,
      type: 'QUEUE_UPDATE',
      title: params.position <= 3 ? 'Prepare-se: sua vez está chegando' : 'Atualização da fila',
      message: `Sua posição agora é ${params.position}. Espera estimada: ${params.estimatedWaitTime} min.`,
      data: params,
    })
  }

  async queueCalled(userId: string, params: {
    hospitalName: string
    ticketCode?: string | null
    roomNumber?: string | null
  }): Promise<void> {
    const room = params.roomNumber ? ` Dirija-se à sala ${params.roomNumber}.` : ' Dirija-se à recepção.'
    await this.dispatch({
      userId,
      type: 'QUEUE_UPDATE',
      title: `É a sua vez${params.ticketCode ? ` — senha ${params.ticketCode}` : ''}!`,
      message: `Você foi chamado no ${params.hospitalName}.${room}`,
      data: params,
    })
  }
}
