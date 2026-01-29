'use client'

import { useState, useEffect } from 'react'
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
import { QueuePriority } from '@medgo/shared-types'

const queueEntrySchema = z.object({
  hospitalId: z.string().min(1, 'Selecione um hospital'),
  patientId: z.string().min(1, 'Selecione um paciente'),
  priority: z.enum(['EMERGENCY', 'URGENT', 'SEMI_URGENT', 'NORMAL', 'LOW']),
  specialty: z.string().min(2, 'Especialidade é obrigatória'),
  symptoms: z.string().min(5, 'Descreva os sintomas'),
})

type QueueEntryFormData = z.infer<typeof queueEntrySchema>

interface Hospital {
  id: string
  name: string
}

interface Patient {
  id: string
  user: {
    name: string
  }
}

const priorities = [
  { value: 'EMERGENCY', label: 'Emergência', color: 'text-red-500' },
  { value: 'URGENT', label: 'Urgente', color: 'text-orange-500' },
  { value: 'SEMI_URGENT', label: 'Semi-Urgente', color: 'text-yellow-500' },
  { value: 'NORMAL', label: 'Normal', color: 'text-blue-500' },
  { value: 'LOW', label: 'Baixa', color: 'text-gray-500' },
]

const specialties = [
  'Clínica Geral',
  'Cardiologia',
  'Ortopedia',
  'Neurologia',
  'Pediatria',
  'Ginecologia',
  'Oftalmologia',
  'Dermatologia',
  'Otorrinolaringologia',
  'Psiquiatria',
  'Emergência',
  'Outros',
]

export default function NewQueueEntryPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QueueEntryFormData>({
    resolver: zodResolver(queueEntrySchema),
    defaultValues: {
      priority: 'NORMAL',
    },
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [hospitalsRes, patientsRes] = await Promise.all([
          api.get('/hospitals?limit=100'),
          api.get('/patients?limit=100'),
        ])
        setHospitals(hospitalsRes.data?.data || [])
        setPatients(patientsRes.data?.data || [])
      } catch (err) {
        console.error('Error fetching data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const onSubmit = async (data: QueueEntryFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      await api.post('/queues', data)
      router.push('/dashboard/queues')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao adicionar na fila')
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
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Nova Entrada na Fila</h2>
          <p className="text-muted-foreground">
            Adicione um paciente à fila de atendimento
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Entrada</CardTitle>
              <CardDescription>Selecione o hospital e o paciente</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="hospitalId">Hospital *</Label>
                <select
                  id="hospitalId"
                  {...register('hospitalId')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  <option value="">Selecione um hospital...</option>
                  {hospitals.map((hospital) => (
                    <option key={hospital.id} value={hospital.id}>
                      {hospital.name}
                    </option>
                  ))}
                </select>
                {errors.hospitalId && (
                  <p className="text-sm text-destructive">{errors.hospitalId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="patientId">Paciente *</Label>
                <select
                  id="patientId"
                  {...register('patientId')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  <option value="">Selecione um paciente...</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.user?.name || `Paciente #${patient.id.slice(-6)}`}
                    </option>
                  ))}
                </select>
                {errors.patientId && (
                  <p className="text-sm text-destructive">{errors.patientId.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Atendimento</CardTitle>
              <CardDescription>Informações sobre o atendimento necessário</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="specialty">Especialidade *</Label>
                <select
                  id="specialty"
                  {...register('specialty')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  <option value="">Selecione...</option>
                  {specialties.map((specialty) => (
                    <option key={specialty} value={specialty}>
                      {specialty}
                    </option>
                  ))}
                </select>
                {errors.specialty && (
                  <p className="text-sm text-destructive">{errors.specialty.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade *</Label>
                <select
                  id="priority"
                  {...register('priority')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  {priorities.map((priority) => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
                {errors.priority && (
                  <p className="text-sm text-destructive">{errors.priority.message}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="symptoms">Sintomas / Motivo *</Label>
                <textarea
                  id="symptoms"
                  {...register('symptoms')}
                  placeholder="Descreva os sintomas ou motivo do atendimento..."
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground"
                />
                {errors.symptoms && (
                  <p className="text-sm text-destructive">{errors.symptoms.message}</p>
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
              Adicionar à Fila
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
