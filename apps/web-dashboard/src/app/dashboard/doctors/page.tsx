'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Stethoscope, Search, Loader2, Phone, Mail } from 'lucide-react'
import { api } from '@/lib/api'
import { RoleGuard } from '@/components/auth/RoleGuard'

interface Doctor {
  id: string
  name: string
  email: string
  cpf: string
  phone: string
  status: string
  hospitalId: string | null
  createdAt: string
}

const statusLabels: Record<string, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  SUSPENDED: 'Suspenso',
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-500',
  INACTIVE: 'bg-gray-500',
  SUSPENDED: 'bg-red-500',
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 })

  const fetchDoctors = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params: any = { page, limit: 20, role: 'DOCTOR' }
      if (search) params.search = search

      const response = await api.get('/users', { params })
      setDoctors(response.data.data || [])
      setPagination({
        page: response.data.pagination?.page || 1,
        total: response.data.pagination?.total || 0,
        pages: response.data.pagination?.pages || 0,
      })
    } catch (err) {
      console.error('Error fetching doctors:', err)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    fetchDoctors()
  }, [fetchDoctors])

  return (
    <RoleGuard allowedRoles={['SYSTEM_ADMIN', 'HOSPITAL_ADMIN']}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Médicos</h2>
            <p className="text-muted-foreground">
              Gerencie o corpo médico do sistema
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-muted-foreground" />
            <span className="text-lg font-semibold">{pagination.total} médicos</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Buscar Médicos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchDoctors(1)}
                />
              </div>
              <Button onClick={() => fetchDoctors(1)} className="gap-2 w-full sm:w-auto">
                <Search className="h-4 w-4" />
                Buscar
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : doctors.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              <Stethoscope className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Nenhum médico encontrado</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {doctors.map((doctor) => (
              <Card key={doctor.id}>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Stethoscope className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{doctor.name}</h3>
                          <p className="text-xs text-muted-foreground">CPF: {doctor.cpf}</p>
                        </div>
                      </div>
                      <Badge className={statusColors[doctor.status]}>
                        {statusLabels[doctor.status]}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{doctor.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{doctor.phone}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        ID: <span className="font-mono">{doctor.id}</span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              disabled={pagination.page === 1}
              onClick={() => fetchDoctors(pagination.page - 1)}
            >
              Anterior
            </Button>
            <span className="text-sm">
              Página {pagination.page} de {pagination.pages}
            </span>
            <Button
              variant="outline"
              disabled={pagination.page === pagination.pages}
              onClick={() => fetchDoctors(pagination.page + 1)}
            >
              Próxima
            </Button>
          </div>
        )}
      </div>
    </RoleGuard>
  )
}
