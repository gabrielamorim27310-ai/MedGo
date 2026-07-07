'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Clock, Filter, Plus, Loader2, ChevronLeft, ChevronRight, RefreshCw, MapPin, Ticket } from 'lucide-react'
import { QueuePriority, QueueStatus } from '@acolhe/shared-types'
import { useQueues } from '@/hooks/useQueues'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'

const priorityColors: Record<QueuePriority, 'destructive' | 'warning' | 'secondary' | 'default'> = {
  [QueuePriority.EMERGENCY]: 'destructive',
  [QueuePriority.URGENT]: 'warning',
  [QueuePriority.SEMI_URGENT]: 'secondary',
  [QueuePriority.NORMAL]: 'default',
  [QueuePriority.LOW]: 'default',
}

const priorityLabels: Record<QueuePriority, string> = {
  [QueuePriority.EMERGENCY]: 'Emergência',
  [QueuePriority.URGENT]: 'Urgente',
  [QueuePriority.SEMI_URGENT]: 'Semi-Urgente',
  [QueuePriority.NORMAL]: 'Normal',
  [QueuePriority.LOW]: 'Baixa',
}

const statusColors: Record<QueueStatus, 'default' | 'success' | 'warning' | 'secondary' | 'destructive'> = {
  [QueueStatus.WAITING]: 'warning',
  [QueueStatus.IN_PROGRESS]: 'default',
  [QueueStatus.COMPLETED]: 'success',
  [QueueStatus.CANCELLED]: 'destructive',
  [QueueStatus.NO_SHOW]: 'secondary',
}

const statusLabels: Record<QueueStatus, string> = {
  [QueueStatus.WAITING]: 'Aguardando',
  [QueueStatus.IN_PROGRESS]: 'Em Atendimento',
  [QueueStatus.COMPLETED]: 'Concluído',
  [QueueStatus.CANCELLED]: 'Cancelado',
  [QueueStatus.NO_SHOW]: 'Não Compareceu',
}

interface MyQueueEntry {
  id: string
  hospitalId: string
  priority: QueuePriority
  status: QueueStatus
  specialty: string
  position?: number
  ticketCode?: string
  estimatedWaitTime?: number
  checkInTime: string
  endTime?: string
  hospital?: { id: string; name: string; city?: string; state?: string }
}

/** Visão do paciente: senha ativa em destaque + histórico de filas. */
function PatientQueuesView() {
  const [active, setActive] = useState<MyQueueEntry[]>([])
  const [history, setHistory] = useState<MyQueueEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMyQueues = async () => {
    try {
      setError(null)
      const response = await api.get('/queues/me')
      setActive(response.data.active || [])
      setHistory(response.data.history || [])
    } catch {
      setError('Não foi possível carregar suas filas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMyQueues()
    // Posição muda em tempo real: atualiza a cada 30s
    const interval = setInterval(fetchMyQueues, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Minhas Filas</h2>
          <p className="text-muted-foreground">
            Acompanhe sua senha em tempo real e o histórico de atendimentos
          </p>
        </div>
        <Button className="gap-2" onClick={() => (window.location.href = '/dashboard/queues/new')}>
          <Plus className="h-4 w-4" />
          Entrar em uma fila
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-xl glass-subtle">{error}</div>
      )}

      {/* Senhas ativas */}
      {active.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Ticket className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Você não está em nenhuma fila</h3>
            <p className="text-muted-foreground">
              Faça o check-in em um hospital para receber sua senha digital
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {active.map((entry) => (
            <Card key={entry.id} className="overflow-hidden">
              <div className="tint-teal px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-primary-foreground/80">Sua senha</p>
                  <p className="font-display text-4xl font-bold text-primary-foreground">
                    {entry.ticketCode || '—'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-widest text-primary-foreground/80">Posição</p>
                  <p className="font-display text-4xl font-bold text-primary-foreground">
                    {entry.position ? `${entry.position}º` : '—'}
                  </p>
                </div>
              </div>
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MapPin className="h-4 w-4 text-primary" />
                  {entry.hospital?.name}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Espera estimada: {entry.estimatedWaitTime ?? 0} min · {entry.specialty}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Badge variant={priorityColors[entry.priority] || 'default'}>
                    {priorityLabels[entry.priority] || entry.priority}
                  </Badge>
                  <Badge variant={statusColors[entry.status] || 'default'}>
                    {statusLabels[entry.status] || entry.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground ml-auto">
                    Check-in às{' '}
                    {new Date(entry.checkInTime).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Histórico */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Filas</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">
              Nenhum atendimento anterior por aqui ainda.
            </p>
          ) : (
            <div className="overflow-x-auto -mx-6 px-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Hospital</TableHead>
                    <TableHead>Especialidade</TableHead>
                    <TableHead>Senha</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {new Date(entry.checkInTime).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="font-medium">{entry.hospital?.name || '-'}</TableCell>
                      <TableCell>{entry.specialty}</TableCell>
                      <TableCell>{entry.ticketCode || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={priorityColors[entry.priority] || 'default'}>
                          {priorityLabels[entry.priority] || entry.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusColors[entry.status] || 'default'}>
                          {statusLabels[entry.status] || entry.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function QueuesPage() {
  const { user } = useAuth()

  if (user?.role === 'PATIENT') {
    return <PatientQueuesView />
  }

  return <StaffQueuesView />
}

function StaffQueuesView() {
  const { queues, pagination, loading, error, handlePageChange, refetch } = useQueues(1, 20)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refetch()
    setIsRefreshing(false)
  }

  // Calculate stats from current data
  const waitingCount = queues.filter(q => q.status === QueueStatus.WAITING).length
  const emergencyCount = queues.filter(q =>
    q.priority === QueuePriority.EMERGENCY || q.priority === QueuePriority.URGENT
  ).length
  const avgWaitTime = queues.length > 0
    ? Math.round(queues.reduce((sum, q) => sum + (q.estimatedWaitTime || 0), 0) / queues.length)
    : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Filas de Atendimento</h2>
          <p className="text-muted-foreground">
            Gerencie as filas de atendimento dos hospitais
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filtrar</span>
          </Button>
          <Button className="gap-2 flex-1 sm:flex-none" onClick={() => window.location.href = '/dashboard/queues/new'}>
            <Plus className="h-4 w-4" />
            Nova Entrada
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total na Fila</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{pagination.total}</div>
                <p className="text-xs text-muted-foreground">
                  {waitingCount} aguardando atendimento
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio de Espera</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{avgWaitTime} min</div>
                <p className="text-xs text-muted-foreground">
                  Estimativa média
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgentes/Emergências</CardTitle>
            <Clock className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{emergencyCount}</div>
                <p className="text-xs text-muted-foreground">
                  Atendimento prioritário
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filas Ativas</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : queues.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Nenhuma entrada na fila</h3>
              <p className="text-muted-foreground">
                As filas estão vazias no momento
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto -mx-6 px-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Hospital</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Posição</TableHead>
                    <TableHead>Tempo Estimado</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queues.map((queue) => (
                    <TableRow key={queue.id}>
                      <TableCell className="font-medium">
                        {queue.patient?.user?.name || 'Paciente #' + queue.patientId?.slice(-6)}
                      </TableCell>
                      <TableCell>
                        {queue.hospital?.name || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={priorityColors[queue.priority as QueuePriority] || 'default'}>
                          {priorityLabels[queue.priority as QueuePriority] || queue.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusColors[queue.status as QueueStatus] || 'default'}>
                          {statusLabels[queue.status as QueueStatus] || queue.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{queue.position || '-'}º</TableCell>
                      <TableCell>{queue.estimatedWaitTime || 0} min</TableCell>
                      <TableCell>
                        {queue.checkInTime
                          ? new Date(queue.checkInTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {pagination.page} de {pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages}
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
