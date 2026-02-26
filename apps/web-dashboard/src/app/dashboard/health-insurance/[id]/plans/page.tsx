'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Plus, Loader2, Trash2, Pencil, X, Check } from 'lucide-react'
import { api } from '@/lib/api'
import { RoleGuard } from '@/components/auth/RoleGuard'

interface Plan {
  id: string
  name: string
  code: string
  coverageType: string
  monthlyPrice: number
  coPaymentConsultation: number
  coPaymentExam: number
  coPaymentEmergency: number
  coverageEmergencyRoom: boolean
  coverageHospitalization: boolean
  coverageSurgery: boolean
  coverageExams: boolean
  coverageTelemedicine: boolean
  coverageSpecialties: string[]
  status: string
}

interface Insurance {
  id: string
  name: string
}

const coverageTypeLabels: Record<string, string> = {
  BASIC: 'Básico',
  STANDARD: 'Padrão',
  PREMIUM: 'Premium',
  FULL: 'Completo',
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

export default function PlansPage() {
  const router = useRouter()
  const params = useParams()
  const insuranceId = params.id as string

  const [plans, setPlans] = useState<Plan[]>([])
  const [insurance, setInsurance] = useState<Insurance | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    coverageType: 'STANDARD',
    monthlyPrice: 0,
    coPaymentConsultation: 0,
    coPaymentExam: 0,
    coPaymentEmergency: 0,
    coverageEmergencyRoom: true,
    coverageHospitalization: true,
    coverageSurgery: false,
    coverageExams: true,
    coverageTelemedicine: false,
    coverageSpecialties: '',
    status: 'ACTIVE',
  })

  const selectClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

  const fetchPlans = useCallback(async () => {
    setLoading(true)
    try {
      const [plansRes, insuranceRes] = await Promise.all([
        api.get(`/health-insurances/${insuranceId}/plans`),
        api.get(`/health-insurances/${insuranceId}`),
      ])
      setPlans(plansRes.data.data || plansRes.data || [])
      setInsurance(insuranceRes.data)
    } catch (err) {
      console.error('Error fetching plans:', err)
    } finally {
      setLoading(false)
    }
  }, [insuranceId])

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  const resetForm = () => {
    setFormData({
      name: '', code: '', coverageType: 'STANDARD',
      monthlyPrice: 0, coPaymentConsultation: 0, coPaymentExam: 0, coPaymentEmergency: 0,
      coverageEmergencyRoom: true, coverageHospitalization: true, coverageSurgery: false,
      coverageExams: true, coverageTelemedicine: false, coverageSpecialties: '', status: 'ACTIVE',
    })
    setEditingPlan(null)
    setShowForm(false)
  }

  const handleEdit = (plan: Plan) => {
    setFormData({
      name: plan.name,
      code: plan.code,
      coverageType: plan.coverageType,
      monthlyPrice: plan.monthlyPrice,
      coPaymentConsultation: plan.coPaymentConsultation,
      coPaymentExam: plan.coPaymentExam,
      coPaymentEmergency: plan.coPaymentEmergency,
      coverageEmergencyRoom: plan.coverageEmergencyRoom,
      coverageHospitalization: plan.coverageHospitalization,
      coverageSurgery: plan.coverageSurgery,
      coverageExams: plan.coverageExams,
      coverageTelemedicine: plan.coverageTelemedicine,
      coverageSpecialties: plan.coverageSpecialties.join(', '),
      status: plan.status,
    })
    setEditingPlan(plan)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const payload = {
        ...formData,
        coverageSpecialties: formData.coverageSpecialties.split(',').map(s => s.trim()).filter(Boolean),
      }

      if (editingPlan) {
        await api.put(`/health-insurances/${insuranceId}/plans/${editingPlan.id}`, payload)
      } else {
        await api.post(`/health-insurances/${insuranceId}/plans`, payload)
      }

      resetForm()
      fetchPlans()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar plano')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (planId: string, planName: string) => {
    if (!confirm(`Excluir o plano "${planName}"?`)) return

    try {
      await api.delete(`/health-insurances/${insuranceId}/plans/${planId}`)
      fetchPlans()
    } catch (err) {
      console.error('Error deleting plan:', err)
    }
  }

  return (
    <RoleGuard allowedRoles={['SYSTEM_ADMIN', 'HEALTH_INSURANCE_ADMIN']}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Planos {insurance ? `- ${insurance.name}` : ''}
            </h2>
            <p className="text-muted-foreground">
              Gerencie os planos desta operadora
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => { resetForm(); setShowForm(true) }} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Plano
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingPlan ? 'Editar Plano' : 'Novo Plano'}</CardTitle>
              <CardDescription>Preencha os dados do plano</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Nome do Plano *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Plano Individual"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Código *</Label>
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="PLN-001"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Cobertura *</Label>
                    <select
                      value={formData.coverageType}
                      onChange={(e) => setFormData({ ...formData, coverageType: e.target.value })}
                      className={selectClass}
                    >
                      <option value="BASIC">Básico</option>
                      <option value="STANDARD">Padrão</option>
                      <option value="PREMIUM">Premium</option>
                      <option value="FULL">Completo</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Mensalidade (R$) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.monthlyPrice}
                      onChange={(e) => setFormData({ ...formData, monthlyPrice: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Copag. Consulta (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.coPaymentConsultation}
                      onChange={(e) => setFormData({ ...formData, coPaymentConsultation: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Copag. Exame (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.coPaymentExam}
                      onChange={(e) => setFormData({ ...formData, coPaymentExam: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Copag. Emergência (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.coPaymentEmergency}
                      onChange={(e) => setFormData({ ...formData, coPaymentEmergency: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Coberturas</Label>
                  <div className="flex flex-wrap gap-4">
                    {[
                      { key: 'coverageEmergencyRoom', label: 'Pronto-Socorro' },
                      { key: 'coverageHospitalization', label: 'Internação' },
                      { key: 'coverageSurgery', label: 'Cirurgia' },
                      { key: 'coverageExams', label: 'Exames' },
                      { key: 'coverageTelemedicine', label: 'Telemedicina' },
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={formData[key as keyof typeof formData] as boolean}
                          onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                          className="h-4 w-4 rounded border-input"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Especialidades Cobertas</Label>
                  <Input
                    value={formData.coverageSpecialties}
                    onChange={(e) => setFormData({ ...formData, coverageSpecialties: e.target.value })}
                    placeholder="Cardiologia, Dermatologia, Pediatria..."
                  />
                  <p className="text-xs text-muted-foreground">Separe por vírgulas</p>
                </div>

                {error && (
                  <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>
                )}

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    <X className="h-4 w-4 mr-2" /> Cancelar
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                    {editingPlan ? 'Salvar' : 'Criar Plano'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : plans.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              <p>Nenhum plano cadastrado para esta operadora</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <CardDescription>Código: {plan.code}</CardDescription>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge className={statusColors[plan.status]}>
                        {statusLabels[plan.status]}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tipo</span>
                    <Badge variant="outline">{coverageTypeLabels[plan.coverageType]}</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Mensalidade</span>
                    <span className="font-semibold text-lg">R$ {plan.monthlyPrice.toFixed(2)}</span>
                  </div>

                  <div className="space-y-1 text-sm">
                    <p className="font-medium">Coparticipação:</p>
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                      <div>Consulta<br /><span className="font-medium text-foreground">R$ {plan.coPaymentConsultation.toFixed(2)}</span></div>
                      <div>Exame<br /><span className="font-medium text-foreground">R$ {plan.coPaymentExam.toFixed(2)}</span></div>
                      <div>Emerg.<br /><span className="font-medium text-foreground">R$ {plan.coPaymentEmergency.toFixed(2)}</span></div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {plan.coverageEmergencyRoom && <Badge variant="secondary" className="text-xs">PS</Badge>}
                    {plan.coverageHospitalization && <Badge variant="secondary" className="text-xs">Internação</Badge>}
                    {plan.coverageSurgery && <Badge variant="secondary" className="text-xs">Cirurgia</Badge>}
                    {plan.coverageExams && <Badge variant="secondary" className="text-xs">Exames</Badge>}
                    {plan.coverageTelemedicine && <Badge variant="secondary" className="text-xs">Telemedicina</Badge>}
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(plan)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(plan.id, plan.name)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
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
