'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { RoleGuard } from '@/components/auth/RoleGuard'

const healthInsuranceSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  cnpj: z.string().length(14, 'CNPJ deve ter 14 digitos'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
  phone: z.string().min(8, 'Telefone invalido'),
  email: z.string().email('Email invalido'),
  website: z.string().optional(),
  street: z.string().min(3, 'Endereco e obrigatorio'),
  number: z.string().min(1, 'Numero e obrigatorio'),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, 'Bairro e obrigatorio'),
  city: z.string().min(2, 'Cidade e obrigatoria'),
  state: z.string().length(2, 'Estado deve ter 2 letras'),
  zipCode: z.string().length(8, 'CEP deve ter 8 digitos'),
})

type HealthInsuranceFormData = z.infer<typeof healthInsuranceSchema>

export default function EditHealthInsurancePage() {
  const router = useRouter()
  const params = useParams()
  const insuranceId = params.id as string
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HealthInsuranceFormData>({
    resolver: zodResolver(healthInsuranceSchema),
  })

  useEffect(() => {
    const fetchInsurance = async () => {
      try {
        setLoading(true)
        const response = await api.get(`/health-insurances/${insuranceId}`)
        const insurance = response.data

        reset({
          name: insurance.name,
          cnpj: insurance.cnpj,
          status: insurance.status,
          phone: insurance.phone,
          email: insurance.email,
          website: insurance.website || '',
          street: insurance.street,
          number: insurance.number,
          complement: insurance.complement || '',
          neighborhood: insurance.neighborhood,
          city: insurance.city,
          state: insurance.state,
          zipCode: insurance.zipCode,
        })
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erro ao carregar operadora')
      } finally {
        setLoading(false)
      }
    }

    if (insuranceId) fetchInsurance()
  }, [insuranceId, reset])

  const onSubmit = async (data: HealthInsuranceFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      await api.put(`/health-insurances/${insuranceId}`, data)
      router.push('/dashboard/health-insurance')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao atualizar operadora')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <RoleGuard allowedRoles={['SYSTEM_ADMIN', 'HEALTH_INSURANCE_ADMIN']}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </RoleGuard>
    )
  }

  return (
    <RoleGuard allowedRoles={['SYSTEM_ADMIN', 'HEALTH_INSURANCE_ADMIN']}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Editar Operadora</h2>
            <p className="text-muted-foreground">
              Atualize os dados da operadora de saude
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informacoes da Operadora</CardTitle>
              <CardDescription>Dados cadastrais da operadora</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Operadora *</Label>
                <Input id="name" {...register('name')} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input id="cnpj" {...register('cnpj')} maxLength={14} />
                {errors.cnpj && <p className="text-sm text-destructive">{errors.cnpj.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <select
                  id="status"
                  {...register('status')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  <option value="ACTIVE">Ativo</option>
                  <option value="INACTIVE">Inativo</option>
                  <option value="SUSPENDED">Suspenso</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone *</Label>
                <Input id="phone" {...register('phone')} />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" {...register('email')} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input id="website" {...register('website')} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Endereco</CardTitle>
              <CardDescription>Endereco da sede da operadora</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="street">Logradouro *</Label>
                <Input id="street" {...register('street')} />
                {errors.street && <p className="text-sm text-destructive">{errors.street.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="number">Numero *</Label>
                <Input id="number" {...register('number')} />
                {errors.number && <p className="text-sm text-destructive">{errors.number.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input id="complement" {...register('complement')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro *</Label>
                <Input id="neighborhood" {...register('neighborhood')} />
                {errors.neighborhood && <p className="text-sm text-destructive">{errors.neighborhood.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Cidade *</Label>
                <Input id="city" {...register('city')} />
                {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Estado *</Label>
                <Input id="state" {...register('state')} maxLength={2} />
                {errors.state && <p className="text-sm text-destructive">{errors.state.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="zipCode">CEP *</Label>
                <Input id="zipCode" {...register('zipCode')} maxLength={8} />
                {errors.zipCode && <p className="text-sm text-destructive">{errors.zipCode.message}</p>}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alteracoes
            </Button>
          </div>
        </form>
      </div>
    </RoleGuard>
  )
}
