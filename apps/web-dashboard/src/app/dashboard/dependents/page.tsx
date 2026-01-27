'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Loader2,
  Plus,
  Users,
  Search,
  Pencil,
  Trash2,
  AlertCircle,
} from 'lucide-react'
import { api } from '@/lib/api'
import Link from 'next/link'
import { RoleGuard } from '@/components/auth/RoleGuard'

interface Dependent {
  id: string
  name: string
  cpf: string
  dateOfBirth: string
  relationship: string
  bloodType: string | null
  allergies: string[]
  chronicConditions: string[]
  healthInsuranceNumber: string | null
}

export default function DependentsPage() {
  const [loading, setLoading] = useState(true)
  const [dependents, setDependents] = useState<Dependent[]>([])
  const [filteredDependents, setFilteredDependents] = useState<Dependent[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchDependents()
  }, [])

  const fetchDependents = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/patients/me/dependents')
      const data = response.data || []
      setDependents(data)
      setFilteredDependents(data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar dependentes')
      setDependents([])
      setFilteredDependents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredDependents(dependents)
      return
    }

    const term = searchTerm.toLowerCase()
    const filtered = dependents.filter(
      (d) =>
        d.name.toLowerCase().includes(term) ||
        d.cpf.includes(term)
    )
    setFilteredDependents(filtered)
  }, [searchTerm, dependents])

  const handleDelete = async (id: string) => {
    try {
      setDeleting(id)
      await api.delete(`/patients/me/dependents/${id}`)
      setDependents(dependents.filter((d) => d.id !== id))
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao excluir dependente')
    } finally {
      setDeleting(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatCpf = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  const getRelationshipLabel = (relationship: string) => {
    const labels: Record<string, string> = {
      SPOUSE: 'Conjuge',
      CHILD: 'Filho(a)',
      PARENT: 'Pai/Mae',
      SIBLING: 'Irmao(a)',
      OTHER: 'Outro',
    }
    return labels[relationship] || relationship
  }

  const getRelationshipColor = (relationship: string) => {
    const colors: Record<string, string> = {
      SPOUSE: 'bg-pink-500/10 text-pink-600',
      CHILD: 'bg-blue-500/10 text-blue-600',
      PARENT: 'bg-purple-500/10 text-purple-600',
      SIBLING: 'bg-green-500/10 text-green-600',
      OTHER: 'bg-gray-500/10 text-gray-600',
    }
    return colors[relationship] || 'bg-gray-500/10 text-gray-600'
  }

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birth = new Date(dateOfBirth)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  return (
    <RoleGuard allowedRoles={['PATIENT']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Meus Dependentes</h2>
            <p className="text-muted-foreground">
              Gerencie os dependentes do seu plano de saude
            </p>
          </div>
          <Link href="/dashboard/dependents/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Dependente
            </Button>
          </Link>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Busca */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredDependents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? 'Nenhum dependente encontrado' : 'Nenhum dependente cadastrado'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? 'Tente uma busca diferente'
                  : 'Adicione dependentes para que eles possam usar o plano de saude'}
              </p>
              {!searchTerm && (
                <Link href="/dashboard/dependents/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Dependente
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDependents.map((dependent) => (
              <Card key={dependent.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{dependent.name}</CardTitle>
                      <CardDescription>
                        {formatCpf(dependent.cpf)}
                      </CardDescription>
                    </div>
                    <Badge className={getRelationshipColor(dependent.relationship)}>
                      {getRelationshipLabel(dependent.relationship)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Nascimento</p>
                      <p className="font-medium">{formatDate(dependent.dateOfBirth)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Idade</p>
                      <p className="font-medium">{calculateAge(dependent.dateOfBirth)} anos</p>
                    </div>
                  </div>

                  {dependent.bloodType && (
                    <div className="text-sm">
                      <p className="text-muted-foreground">Tipo Sanguineo</p>
                      <p className="font-medium">{dependent.bloodType.replace('_', ' ')}</p>
                    </div>
                  )}

                  {dependent.healthInsuranceNumber && (
                    <div className="text-sm">
                      <p className="text-muted-foreground">Carteirinha</p>
                      <p className="font-medium">{dependent.healthInsuranceNumber}</p>
                    </div>
                  )}

                  {dependent.allergies?.length > 0 && (
                    <div className="text-sm">
                      <p className="text-muted-foreground mb-1">Alergias</p>
                      <div className="flex flex-wrap gap-1">
                        {dependent.allergies.slice(0, 3).map((allergy, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {allergy}
                          </Badge>
                        ))}
                        {dependent.allergies.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{dependent.allergies.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Link href={`/dashboard/dependents/${dependent.id}/edit`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Pencil className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      disabled={deleting === dependent.id}
                      onClick={() => {
                        if (confirm(`Tem certeza que deseja excluir ${dependent.name}? Esta acao nao pode ser desfeita.`)) {
                          handleDelete(dependent.id)
                        }
                      }}
                    >
                      {deleting === dependent.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </RoleGuard>
  )
}
