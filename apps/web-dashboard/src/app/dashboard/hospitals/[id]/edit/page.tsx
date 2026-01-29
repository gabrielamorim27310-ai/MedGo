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

const SPECIALTIES_OPTIONS = [
  'Cardiologia',
  'Ortopedia',
  'Neurologia',
  'Pediatria',
  'Ginecologia',
  'Obstetrícia',
  'Oncologia',
  'Urologia',
  'Oftalmologia',
  'Otorrinolaringologia',
  'Dermatologia',
  'Psiquiatria',
  'Endocrinologia',
  'Gastroenterologia',
  'Nefrologia',
  'Pneumologia',
  'Reumatologia',
  'Cirurgia Geral',
  'Cirurgia Plástica',
  'Cirurgia Vascular',
  'Anestesiologia',
  'Radiologia',
  'Medicina de Emergência',
  'Clínica Médica',
  'Geriatria',
  'Hematologia',
  'Infectologia',
  'Medicina Intensiva',
  'Fisioterapia',
  'Fonoaudiologia',
]

const hospitalSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  cnpj: z.string().length(14, 'CNPJ deve ter 14 digitos'),
  type: z.enum(['PUBLIC', 'PRIVATE', 'MIXED']),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']),
  street: z.string().min(3, 'Endereco e obrigatorio'),
  number: z.string().min(1, 'Numero e obrigatorio'),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, 'Bairro e obrigatorio'),
  city: z.string().min(2, 'Cidade e obrigatoria'),
  state: z.string().length(2, 'Estado deve ter 2 letras'),
  zipCode: z.string().length(8, 'CEP deve ter 8 digitos'),
  phone: z.string().min(10, 'Telefone invalido'),
  email: z.string().email('Email invalido'),
  website: z.string().optional(),
  totalBeds: z.coerce.number().min(1, 'Deve ter pelo menos 1 leito'),
  emergencyBeds: z.coerce.number().min(0),
  icuBeds: z.coerce.number().min(0),
  emergency24h: z.boolean().default(false),
})

type HospitalFormData = z.infer<typeof hospitalSchema>

export default function EditHospitalPage() {
  const router = useRouter()
  const params = useParams()
  const hospitalId = params.id as string
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([])
  const [customSpecialty, setCustomSpecialty] = useState('')
  const [customSpecialties, setCustomSpecialties] = useState<string[]>([])

  const allSelected = SPECIALTIES_OPTIONS.every((s) => selectedSpecialties.includes(s))

  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties((prev) =>
      prev.includes(specialty) ? prev.filter((s) => s !== specialty) : [...prev, specialty]
    )
  }

  const toggleAll = () => {
    if (allSelected) {
      setSelectedSpecialties((prev) => prev.filter((s) => !SPECIALTIES_OPTIONS.includes(s)))
    } else {
      setSelectedSpecialties((prev) => {
        const custom = prev.filter((s) => !SPECIALTIES_OPTIONS.includes(s))
        return [...SPECIALTIES_OPTIONS, ...custom]
      })
    }
  }

  const addCustomSpecialty = () => {
    const trimmed = customSpecialty.trim()
    if (trimmed && !selectedSpecialties.includes(trimmed) && !SPECIALTIES_OPTIONS.includes(trimmed)) {
      setCustomSpecialties((prev) => [...prev, trimmed])
      setSelectedSpecialties((prev) => [...prev, trimmed])
      setCustomSpecialty('')
    }
  }

  const removeCustomSpecialty = (specialty: string) => {
    setCustomSpecialties((prev) => prev.filter((s) => s !== specialty))
    setSelectedSpecialties((prev) => prev.filter((s) => s !== specialty))
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HospitalFormData>({
    resolver: zodResolver(hospitalSchema),
  })

  useEffect(() => {
    const fetchHospital = async () => {
      try {
        setLoading(true)
        const response = await api.get(`/hospitals/${hospitalId}`)
        const hospital = response.data

        reset({
          name: hospital.name,
          cnpj: hospital.cnpj,
          type: hospital.type,
          status: hospital.status,
          street: hospital.street,
          number: hospital.number,
          complement: hospital.complement || '',
          neighborhood: hospital.neighborhood,
          city: hospital.city,
          state: hospital.state,
          zipCode: hospital.zipCode,
          phone: hospital.phone,
          email: hospital.email,
          website: hospital.website || '',
          totalBeds: hospital.totalBeds,
          emergencyBeds: hospital.emergencyBeds,
          icuBeds: hospital.icuBeds,
          emergency24h: hospital.emergency24h,
        })
        const specs: string[] = hospital.specialties || []
        setSelectedSpecialties(specs)
        setCustomSpecialties(specs.filter((s: string) => !SPECIALTIES_OPTIONS.includes(s)))
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erro ao carregar hospital')
      } finally {
        setLoading(false)
      }
    }

    if (hospitalId) fetchHospital()
  }, [hospitalId, reset])

  const onSubmit = async (data: HospitalFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const payload = {
        ...data,
        specialties: selectedSpecialties,
      }

      await api.put(`/hospitals/${hospitalId}`, payload)
      router.push('/dashboard/hospitals')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao atualizar hospital')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <RoleGuard allowedRoles={['SYSTEM_ADMIN', 'HOSPITAL_ADMIN']}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </RoleGuard>
    )
  }

  return (
    <RoleGuard allowedRoles={['SYSTEM_ADMIN', 'HOSPITAL_ADMIN']}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Editar Hospital</h2>
            <p className="text-muted-foreground">
              Atualize os dados do hospital
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
              <CardTitle>Informacoes Basicas</CardTitle>
              <CardDescription>Dados principais do hospital</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Hospital *</Label>
                <Input id="name" {...register('name')} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input id="cnpj" {...register('cnpj')} maxLength={14} />
                {errors.cnpj && <p className="text-sm text-destructive">{errors.cnpj.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo *</Label>
                <select
                  id="type"
                  {...register('type')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  <option value="PUBLIC">Publico</option>
                  <option value="PRIVATE">Privado</option>
                  <option value="MIXED">Misto</option>
                </select>
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
                  <option value="MAINTENANCE">Em Manutencao</option>
                </select>
              </div>

            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Especialidades</CardTitle>
              <CardDescription>Selecione as especialidades oferecidas pelo hospital</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b">
                <input
                  type="checkbox"
                  id="specialty-all"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="specialty-all" className="text-sm font-semibold cursor-pointer">
                  Selecionar Todas
                </Label>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {SPECIALTIES_OPTIONS.map((specialty) => (
                  <div key={specialty} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`specialty-${specialty}`}
                      checked={selectedSpecialties.includes(specialty)}
                      onChange={() => toggleSpecialty(specialty)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor={`specialty-${specialty}`} className="text-sm font-normal cursor-pointer">
                      {specialty}
                    </Label>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-3">
                <Label className="text-sm font-semibold">Outras Especialidades</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite uma especialidade..."
                    value={customSpecialty}
                    onChange={(e) => setCustomSpecialty(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomSpecialty() } }}
                  />
                  <Button type="button" variant="secondary" onClick={addCustomSpecialty}>
                    Adicionar
                  </Button>
                </div>
                {customSpecialties.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {customSpecialties.map((specialty) => (
                      <span
                        key={specialty}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                      >
                        {specialty}
                        <button
                          type="button"
                          onClick={() => removeCustomSpecialty(specialty)}
                          className="hover:text-destructive ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {selectedSpecialties.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {selectedSpecialties.length} especialidade(s) selecionada(s)
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Endereco</CardTitle>
              <CardDescription>Localizacao do hospital</CardDescription>
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

          <Card>
            <CardHeader>
              <CardTitle>Contato</CardTitle>
              <CardDescription>Informacoes de contato do hospital</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
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

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="website">Website</Label>
                <Input id="website" {...register('website')} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Capacidade</CardTitle>
              <CardDescription>Quantidade de leitos disponiveis</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="totalBeds">Total de Leitos *</Label>
                <Input id="totalBeds" type="number" {...register('totalBeds')} />
                {errors.totalBeds && <p className="text-sm text-destructive">{errors.totalBeds.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyBeds">Leitos de Emergencia</Label>
                <Input id="emergencyBeds" type="number" {...register('emergencyBeds')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="icuBeds">Leitos de UTI</Label>
                <Input id="icuBeds" type="number" {...register('icuBeds')} />
              </div>

              <div className="space-y-2 md:col-span-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="emergency24h"
                    {...register('emergency24h')}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="emergency24h">Emergencia 24 horas</Label>
                </div>
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
