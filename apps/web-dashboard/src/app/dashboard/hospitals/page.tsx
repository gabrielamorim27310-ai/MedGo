'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Building2, Bed, Users, Plus, MapPin, Search, Loader2, ChevronLeft, ChevronRight, Trash2, Pencil } from 'lucide-react'
import { HospitalType, HospitalStatus } from '@medgo/shared-types'
import { useHospitals } from '@/hooks/useHospitals'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { api } from '@/lib/api'

const typeColors: Record<HospitalType, 'default' | 'secondary' | 'outline'> = {
  [HospitalType.PUBLIC]: 'default',
  [HospitalType.PRIVATE]: 'secondary',
  [HospitalType.MIXED]: 'outline',
}

const typeLabels: Record<HospitalType, string> = {
  [HospitalType.PUBLIC]: 'Público',
  [HospitalType.PRIVATE]: 'Privado',
  [HospitalType.MIXED]: 'Misto',
}

const statusColors: Record<HospitalStatus, 'success' | 'destructive' | 'warning'> = {
  [HospitalStatus.ACTIVE]: 'success',
  [HospitalStatus.INACTIVE]: 'destructive',
  [HospitalStatus.MAINTENANCE]: 'warning',
}

const statusLabels: Record<HospitalStatus, string> = {
  [HospitalStatus.ACTIVE]: 'Ativo',
  [HospitalStatus.INACTIVE]: 'Inativo',
  [HospitalStatus.MAINTENANCE]: 'Em Manutenção',
}

export default function HospitalsPage() {
  const { hospitals, pagination, loading, error, searchTerm, handleSearch, handlePageChange, refetch } = useHospitals()
  const [searchInput, setSearchInput] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(searchInput)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o hospital "${name}"? Esta acao nao pode ser desfeita.`)) return
    try {
      setDeleting(id)
      await api.delete(`/hospitals/${id}`)
      refetch()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao excluir hospital')
    } finally {
      setDeleting(null)
    }
  }

  // Calculate summary stats from real data
  const totalBeds = hospitals.reduce((sum, h) => sum + (h.totalBeds || 0), 0)
  const availableBeds = hospitals.reduce((sum, h) => sum + (h.availableBeds || 0), 0)
  const icuBeds = hospitals.reduce((sum, h) => sum + (h.icuBeds || 0), 0)
  const activeHospitals = hospitals.filter(h => h.status === HospitalStatus.ACTIVE).length

  return (
    <RoleGuard allowedRoles={['SYSTEM_ADMIN', 'HOSPITAL_ADMIN']}>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Hospitais</h2>
          <p className="text-muted-foreground">
            Gerencie os hospitais cadastrados no sistema
          </p>
        </div>
        <Button className="gap-2" onClick={() => window.location.href = '/dashboard/hospitals/new'}>
          <Plus className="h-4 w-4" />
          Novo Hospital
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Hospitais</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{pagination.total}</div>
                <p className="text-xs text-muted-foreground">
                  {activeHospitals} ativos
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leitos Disponíveis</CardTitle>
            <Bed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{availableBeds.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  De {totalBeds.toLocaleString()} leitos totais
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leitos UTI</CardTitle>
            <Bed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{icuBeds.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Total de UTI cadastrados
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ocupação Média</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {totalBeds > 0 ? Math.round(((totalBeds - availableBeds) / totalBeds) * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Taxa de ocupação
                </p>
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
            placeholder="Buscar hospitais..."
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

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : hospitals.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Nenhum hospital encontrado</h3>
          <p className="text-muted-foreground">
            {searchTerm ? 'Tente uma busca diferente' : 'Cadastre o primeiro hospital'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {hospitals.map((hospital) => (
              <Card key={hospital.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle>{hospital.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {hospital.city}, {hospital.state}
                      </CardDescription>
                    </div>
                    <Badge variant={statusColors[hospital.status as HospitalStatus] || 'default'}>
                      {statusLabels[hospital.status as HospitalStatus] || hospital.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tipo</span>
                    <Badge variant={typeColors[hospital.type as HospitalType] || 'outline'}>
                      {typeLabels[hospital.type as HospitalType] || hospital.type}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Leitos Disponíveis</span>
                      <span className="font-medium">
                        {hospital.availableBeds || 0} / {hospital.totalBeds || 0}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{
                          width: `${hospital.totalBeds ? ((hospital.availableBeds || 0) / hospital.totalBeds) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Emergência</p>
                      <p className="font-medium">{hospital.emergencyBeds || 0} leitos</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">UTI</p>
                      <p className="font-medium">{hospital.icuBeds || 0} leitos</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm text-muted-foreground">
                      {hospital.cnpj}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = `/dashboard/hospitals/${hospital.id}/edit`}
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        disabled={deleting === hospital.id}
                        onClick={() => handleDelete(hospital.id, hospital.name)}
                      >
                        {deleting === hospital.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2">
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
      </div>
    </RoleGuard>
  )
}
