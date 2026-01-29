'use client'

import { useState } from 'react'
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
import { Clock, Filter, Plus, Loader2, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { QueuePriority, QueueStatus } from '@medgo/shared-types'
import { useQueues } from '@/hooks/useQueues'

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

export default function QueuesPage() {
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
