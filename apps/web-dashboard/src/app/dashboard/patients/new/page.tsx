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
import { ArrowLeft, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'

const patientSchema = z.object({
  // User data
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  cpf: z.string().length(11, 'CPF deve ter 11 dígitos'),
  phone: z.string().min(10, 'Telefone inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),

  // Patient specific data
  dateOfBirth: z.string().min(1, 'Data de nascimento é obrigatória'),
  bloodType: z.string().optional(),
  allergies: z.string().optional(),
  chronicConditions: z.string().optional(),

  // Emergency contact
  emergencyContactName: z.string().min(2, 'Nome do contato é obrigatório'),
  emergencyContactPhone: z.string().min(10, 'Telefone do contato é obrigatório'),
  emergencyContactRelationship: z.string().min(2, 'Parentesco é obrigatório'),

  // Health insurance (optional)
  healthInsuranceNumber: z.string().optional(),
})

type PatientFormData = z.infer<typeof patientSchema>

const bloodTypes = [
  { value: '', label: 'Selecione...' },
  { value: 'A_POSITIVE', label: 'A+' },
  { value: 'A_NEGATIVE', label: 'A-' },
  { value: 'B_POSITIVE', label: 'B+' },
  { value: 'B_NEGATIVE', label: 'B-' },
  { value: 'AB_POSITIVE', label: 'AB+' },
  { value: 'AB_NEGATIVE', label: 'AB-' },
  { value: 'O_POSITIVE', label: 'O+' },
  { value: 'O_NEGATIVE', label: 'O-' },
]

export default function NewPatientPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
  })

  const onSubmit = async (data: PatientFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const payload = {
        // User info
        name: data.name,
        email: data.email,
        cpf: data.cpf,
        phone: data.phone,
        password: data.password,
        role: 'PATIENT',

        // Patient info
        dateOfBirth: new Date(data.dateOfBirth).toISOString(),
        bloodType: data.bloodType || undefined,
        allergies: data.allergies ? data.allergies.split(',').map(s => s.trim()) : [],
        chronicConditions: data.chronicConditions ? data.chronicConditions.split(',').map(s => s.trim()) : [],
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        emergencyContactRelationship: data.emergencyContactRelationship,
        healthInsuranceNumber: data.healthInsuranceNumber || undefined,
      }

      await api.post('/patients', payload)
      router.push('/dashboard/patients')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao cadastrar paciente')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Novo Paciente</h2>
          <p className="text-muted-foreground">
            Cadastre um novo paciente no sistema
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
            <CardTitle>Dados Pessoais</CardTitle>
            <CardDescription>Informações básicas do paciente</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input id="name" {...register('name')} placeholder="João da Silva" />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" {...register('email')} placeholder="joao@email.com" />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF *</Label>
              <Input id="cpf" {...register('cpf')} placeholder="12345678901" maxLength={11} />
              {errors.cpf && <p className="text-sm text-destructive">{errors.cpf.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone *</Label>
              <Input id="phone" {...register('phone')} placeholder="11999999999" />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha de Acesso *</Label>
              <Input id="password" type="password" {...register('password')} placeholder="******" />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Data de Nascimento *</Label>
              <Input id="dateOfBirth" type="date" {...register('dateOfBirth')} />
              {errors.dateOfBirth && <p className="text-sm text-destructive">{errors.dateOfBirth.message}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações Médicas</CardTitle>
            <CardDescription>Dados de saúde do paciente</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bloodType">Tipo Sanguíneo</Label>
              <select
                id="bloodType"
                {...register('bloodType')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                {bloodTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="healthInsuranceNumber">Número do Plano de Saúde</Label>
              <Input
                id="healthInsuranceNumber"
                {...register('healthInsuranceNumber')}
                placeholder="123456789"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="allergies">Alergias</Label>
              <Input
                id="allergies"
                {...register('allergies')}
                placeholder="Penicilina, Dipirona, Látex"
              />
              <p className="text-xs text-muted-foreground">Separe por vírgulas</p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="chronicConditions">Condições Crônicas</Label>
              <Input
                id="chronicConditions"
                {...register('chronicConditions')}
                placeholder="Diabetes, Hipertensão"
              />
              <p className="text-xs text-muted-foreground">Separe por vírgulas</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contato de Emergência</CardTitle>
            <CardDescription>Pessoa a ser contatada em caso de emergência</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="emergencyContactName">Nome *</Label>
              <Input
                id="emergencyContactName"
                {...register('emergencyContactName')}
                placeholder="Maria da Silva"
              />
              {errors.emergencyContactName && (
                <p className="text-sm text-destructive">{errors.emergencyContactName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyContactPhone">Telefone *</Label>
              <Input
                id="emergencyContactPhone"
                {...register('emergencyContactPhone')}
                placeholder="11999999999"
              />
              {errors.emergencyContactPhone && (
                <p className="text-sm text-destructive">{errors.emergencyContactPhone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyContactRelationship">Parentesco *</Label>
              <Input
                id="emergencyContactRelationship"
                {...register('emergencyContactRelationship')}
                placeholder="Esposa"
              />
              {errors.emergencyContactRelationship && (
                <p className="text-sm text-destructive">{errors.emergencyContactRelationship.message}</p>
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
            Cadastrar Paciente
          </Button>
        </div>
      </form>
    </div>
  )
}
