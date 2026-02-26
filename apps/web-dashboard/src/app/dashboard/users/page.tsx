'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users, Search, Shield, Trash2, UserCog, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { format } from 'date-fns'

interface User {
  id: string
  name: string
  email: string
  cpf: string
  phone: string
  role: string
  status: string
  createdAt: string
}

const roleLabels: Record<string, string> = {
  PATIENT: 'Paciente',
  DOCTOR: 'Médico',
  NURSE: 'Enfermeiro(a)',
  RECEPTIONIST: 'Recepcionista',
  HOSPITAL_ADMIN: 'Admin Hospitalar',
  SYSTEM_ADMIN: 'Admin Sistema',
  HEALTH_INSURANCE_ADMIN: 'Admin Plano',
}

const roleColors: Record<string, string> = {
  PATIENT: 'bg-blue-100 text-blue-800',
  DOCTOR: 'bg-green-100 text-green-800',
  NURSE: 'bg-purple-100 text-purple-800',
  RECEPTIONIST: 'bg-yellow-100 text-yellow-800',
  HOSPITAL_ADMIN: 'bg-orange-100 text-orange-800',
  SYSTEM_ADMIN: 'bg-red-100 text-red-800',
  HEALTH_INSURANCE_ADMIN: 'bg-teal-100 text-teal-800',
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

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 })
  const [updatingUser, setUpdatingUser] = useState<string | null>(null)

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params: any = { page, limit: 20 }
      if (search) params.search = search
      if (roleFilter) params.role = roleFilter

      const response = await api.get('/users', { params })
      setUsers(response.data.data || [])
      setPagination({
        page: response.data.pagination?.page || 1,
        total: response.data.pagination?.total || 0,
        pages: response.data.pagination?.pages || 0,
      })
    } catch (err) {
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }, [search, roleFilter])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleStatusChange = async (userId: string, newStatus: string) => {
    setUpdatingUser(userId)
    try {
      await api.put(`/users/${userId}`, { status: newStatus })
      fetchUsers(pagination.page)
    } catch (err) {
      console.error('Error updating user:', err)
    } finally {
      setUpdatingUser(null)
    }
  }

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${userName}"? Esta ação não pode ser desfeita.`)) return

    try {
      await api.delete(`/users/${userId}`)
      fetchUsers(pagination.page)
    } catch (err) {
      console.error('Error deleting user:', err)
    }
  }

  const selectClass = "flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

  return (
    <RoleGuard allowedRoles={['SYSTEM_ADMIN']}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Gerenciamento de Usuários</h2>
            <p className="text-muted-foreground">
              Gerencie todos os usuários do sistema
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="text-lg font-semibold">{pagination.total} usuários</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por nome, email ou CPF..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className={`${selectClass} w-full sm:w-auto`}
              >
                <option value="">Todos os Perfis</option>
                {Object.entries(roleLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <Button onClick={() => fetchUsers(1)} className="gap-2 w-full sm:w-auto">
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
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Usuário</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">CPF</th>
                  <th className="text-left p-3 font-medium">Perfil</th>
                  <th className="text-left p-3 font-medium hidden sm:table-cell">Status</th>
                  <th className="text-left p-3 font-medium hidden lg:table-cell">Criado em</th>
                  <th className="text-right p-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-accent/50">
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">{user.cpf}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role] || 'bg-gray-100 text-gray-800'}`}>
                        {roleLabels[user.role] || user.role}
                      </span>
                    </td>
                    <td className="p-3 hidden sm:table-cell">
                      <Badge className={statusColors[user.status]}>
                        {statusLabels[user.status] || user.status}
                      </Badge>
                    </td>
                    <td className="p-3 hidden lg:table-cell text-muted-foreground">
                      {format(new Date(user.createdAt), 'dd/MM/yyyy')}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {user.status === 'ACTIVE' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange(user.id, 'SUSPENDED')}
                            disabled={updatingUser === user.id}
                            title="Suspender"
                          >
                            {updatingUser === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Shield className="h-4 w-4 text-orange-500" />
                            )}
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange(user.id, 'ACTIVE')}
                            disabled={updatingUser === user.id}
                            title="Ativar"
                          >
                            {updatingUser === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <UserCog className="h-4 w-4 text-green-500" />
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(user.id, user.name)}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              disabled={pagination.page === 1}
              onClick={() => fetchUsers(pagination.page - 1)}
            >
              Anterior
            </Button>
            <span className="text-sm">
              Página {pagination.page} de {pagination.pages}
            </span>
            <Button
              variant="outline"
              disabled={pagination.page === pagination.pages}
              onClick={() => fetchUsers(pagination.page + 1)}
            >
              Próxima
            </Button>
          </div>
        )}
      </div>
    </RoleGuard>
  )
}
