'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Shield, Search, Plus, Loader2, ChevronLeft, ChevronRight, Users, Pencil, Trash2 } from 'lucide-react'
import { useHealthInsurances } from '@/hooks/useHealthInsurances'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { api } from '@/lib/api'

const statusColors: Record<string, 'success' | 'destructive' | 'warning'> = {
  ACTIVE: 'success',
  INACTIVE: 'destructive',
  SUSPENDED: 'warning',
}

const statusLabels: Record<string, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  SUSPENDED: 'Suspenso',
}

export default function HealthInsurancePage() {
  const { healthInsurances, pagination, loading, error, searchTerm, handleSearch, handlePageChange, refetch } = useHealthInsurances()
  const [searchInput, setSearchInput] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(searchInput)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir a operadora "${name}"? Esta acao nao pode ser desfeita.`)) return
    try {
      setDeleting(id)
      await api.delete(`/health-insurances/${id}`)
      refetch()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao excluir operadora')
    } finally {
      setDeleting(null)
    }
  }

  // Calculate stats
  const totalPatients = healthInsurances.reduce((sum, hi) => sum + (hi._count?.patients || 0), 0)
  const totalPlans = healthInsurances.reduce((sum, hi) => sum + (hi.plans?.length || 0), 0)

  return (
    <RoleGuard allowedRoles={['SYSTEM_ADMIN', 'HEALTH_INSURANCE_ADMIN']}>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Planos de Saúde</h2>
          <p className="text-muted-foreground">
            Gerencie as operadoras e planos de saúde
          </p>
        </div>
        <Button className="gap-2" onClick={() => window.location.href = '/dashboard/health-insurance/new'}>
          <Plus className="h-4 w-4" />
          Nova Operadora
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Operadoras</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{pagination.total}</div>
                <p className="text-xs text-muted-foreground">Operadoras cadastradas</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Planos</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalPlans}</div>
                <p className="text-xs text-muted-foreground">Planos disponíveis</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Beneficiários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalPatients}</div>
                <p className="text-xs text-muted-foreground">Pacientes com plano</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <form onSubmit={onSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou CNPJ..."
            className="pl-8"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Button type="submit" variant="secondary">Buscar</Button>
      </form>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Operadoras de Saúde</CardTitle>
          <CardDescription>Lista de todas as operadoras cadastradas</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : healthInsurances.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Nenhuma operadora encontrada</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Tente uma busca diferente' : 'Cadastre a primeira operadora'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Cidade/UF</TableHead>
                    <TableHead>Planos</TableHead>
                    <TableHead>Beneficiários</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {healthInsurances.map((insurance) => (
                    <TableRow key={insurance.id}>
                      <TableCell className="font-medium">{insurance.name}</TableCell>
                      <TableCell>{insurance.cnpj}</TableCell>
                      <TableCell>{insurance.city}/{insurance.state}</TableCell>
                      <TableCell>{insurance.plans?.length || 0}</TableCell>
                      <TableCell>{insurance._count?.patients || 0}</TableCell>
                      <TableCell>
                        <Badge variant={statusColors[insurance.status] || 'default'}>
                          {statusLabels[insurance.status] || insurance.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.location.href = `/dashboard/health-insurance/${insurance.id}/edit`}
                          >
                            <Pencil className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            disabled={deleting === insurance.id}
                            onClick={() => handleDelete(insurance.id, insurance.name)}
                          >
                            {deleting === insurance.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

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
    </RoleGuard>
  )
}
