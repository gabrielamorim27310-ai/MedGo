'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2, Plus, X } from 'lucide-react'
import { api } from '@/lib/api'
import { RoleGuard } from '@/components/auth/RoleGuard'

const dependentSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  cpf: z.string().length(11, 'CPF deve ter 11 digitos'),
  dateOfBirth: z.string().min(1, 'Data de nascimento e obrigatoria'),
  relationship: z.enum(['SPOUSE', 'CHILD', 'PARENT', 'SIBLING', 'OTHER']),
  bloodType: z.enum(['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE']).optional(),
  healthInsuranceNumber: z.string().optional(),
})

type DependentFormData = z.infer<typeof dependentSchema>

export default function NewDependentPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [allergies, setAllergies] = useState<string[]>([])
  const [chronicConditions, setChronicConditions] = useState<string[]>([])
  const [newAllergy, setNewAllergy] = useState('')
  const [newCondition, setNewCondition] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DependentFormData>({
    resolver: zodResolver(dependentSchema),
    defaultValues: {
      relationship: 'CHILD',
    },
  })

  const addAllergy = () => {
    if (newAllergy.trim() && !allergies.includes(newAllergy.trim())) {
      setAllergies([...allergies, newAllergy.trim()])
      setNewAllergy('')
    }
  }

  const removeAllergy = (allergy: string) => {
    setAllergies(allergies.filter((a) => a !== allergy))
  }

  const addCondition = () => {
    if (newCondition.trim() && !chronicConditions.includes(newCondition.trim())) {
      setChronicConditions([...chronicConditions, newCondition.trim()])
      setNewCondition('')
    }
  }

  const removeCondition = (condition: string) => {
    setChronicConditions(chronicConditions.filter((c) => c !== condition))
  }

  const onSubmit = async (data: DependentFormData) => {
    try {
      setIsSubmitting(true)
      setError(null)

      await api.post('/patients/me/dependents', {
        ...data,
        allergies,
        chronicConditions,
      })

      router.push('/dashboard/dependents')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao cadastrar dependente')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <RoleGuard allowedRoles={['PATIENT']}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Novo Dependente</h2>
            <p className="text-muted-foreground">
              Cadastre um novo dependente no seu plano de saude
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Dados Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle>Dados Pessoais</CardTitle>
              <CardDescription>Informacoes basicas do dependente</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input id="name" {...register('name')} placeholder="Nome completo do dependente" />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF *</Label>
                <Input id="cpf" {...register('cpf')} placeholder="00000000000" maxLength={11} />
                {errors.cpf && <p className="text-sm text-destructive">{errors.cpf.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Data de Nascimento *</Label>
                <Input id="dateOfBirth" type="date" {...register('dateOfBirth')} />
                {errors.dateOfBirth && <p className="text-sm text-destructive">{errors.dateOfBirth.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="relationship">Parentesco *</Label>
                <select
                  id="relationship"
                  {...register('relationship')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="SPOUSE">Conjuge</option>
                  <option value="CHILD">Filho(a)</option>
                  <option value="PARENT">Pai/Mae</option>
                  <option value="SIBLING">Irmao(a)</option>
                  <option value="OTHER">Outro</option>
                </select>
                {errors.relationship && <p className="text-sm text-destructive">{errors.relationship.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bloodType">Tipo Sanguineo</Label>
                <select
                  id="bloodType"
                  {...register('bloodType')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Selecione...</option>
                  <option value="A_POSITIVE">A+</option>
                  <option value="A_NEGATIVE">A-</option>
                  <option value="B_POSITIVE">B+</option>
                  <option value="B_NEGATIVE">B-</option>
                  <option value="AB_POSITIVE">AB+</option>
                  <option value="AB_NEGATIVE">AB-</option>
                  <option value="O_POSITIVE">O+</option>
                  <option value="O_NEGATIVE">O-</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="healthInsuranceNumber">Numero da Carteirinha</Label>
                <Input
                  id="healthInsuranceNumber"
                  {...register('healthInsuranceNumber')}
                  placeholder="Numero da carteirinha do plano"
                />
              </div>
            </CardContent>
          </Card>

          {/* Informacoes de Saude */}
          <Card>
            <CardHeader>
              <CardTitle>Informacoes de Saude</CardTitle>
              <CardDescription>Alergias e condicoes cronicas (opcional)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Alergias */}
              <div className="space-y-2">
                <Label>Alergias</Label>
                <div className="flex gap-2">
                  <Input
                    value={newAllergy}
                    onChange={(e) => setNewAllergy(e.target.value)}
                    placeholder="Digite uma alergia"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
                  />
                  <Button type="button" variant="outline" onClick={addAllergy}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {allergies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {allergies.map((allergy) => (
                      <span
                        key={allergy}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-destructive/10 text-destructive text-sm"
                      >
                        {allergy}
                        <button type="button" onClick={() => removeAllergy(allergy)}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Condicoes Cronicas */}
              <div className="space-y-2">
                <Label>Condicoes Cronicas</Label>
                <div className="flex gap-2">
                  <Input
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value)}
                    placeholder="Digite uma condicao cronica"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCondition())}
                  />
                  <Button type="button" variant="outline" onClick={addCondition}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {chronicConditions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {chronicConditions.map((condition) => (
                      <span
                        key={condition}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/10 text-amber-600 text-sm"
                      >
                        {condition}
                        <button type="button" onClick={() => removeCondition(condition)}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cadastrar Dependente
            </Button>
          </div>
        </form>
      </div>
    </RoleGuard>
  )
}
