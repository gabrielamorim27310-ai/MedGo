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
import { ArrowLeft, Loader2, Clock } from 'lucide-react'
import { api } from '@/lib/api'
import { AppointmentType } from '@medgo/shared-types'

const specialties = [
  'Cardiologia', 'Dermatologia', 'Endocrinologia', 'Gastroenterologia',
  'Ginecologia', 'Neurologia', 'Oftalmologia', 'Ortopedia',
  'Otorrinolaringologia', 'Pediatria', 'Psiquiatria', 'Urologia',
  'Clínica Geral', 'Cirurgia Geral', 'Pneumologia', 'Reumatologia',
  'Oncologia', 'Nefrologia', 'Hematologia', 'Infectologia',
]

const appointmentSchema = z.object({
  hospitalId: z.string().min(1, 'Selecione um hospital'),
  patientId: z.string().min(1, 'Selecione um paciente'),
  doctorId: z.string().min(1, 'Informe o ID do médico'),
  type: z.nativeEnum(AppointmentType),
  specialty: z.string().min(1, 'Selecione uma especialidade'),
  scheduledDate: z.string().min(1, 'Data é obrigatória'),
  scheduledTime: z.string().min(1, 'Horário é obrigatório'),
  duration: z.coerce.number().min(15, 'Mínimo 15 minutos').max(240, 'Máximo 4 horas'),
  reason: z.string().min(3, 'Motivo deve ter pelo menos 3 caracteres'),
  notes: z.string().optional(),
})

type AppointmentFormData = z.infer<typeof appointmentSchema>

interface Hospital {
  id: string
  name: string
  specialties: string[]
}

interface Patient {
  id: string
  user: { name: string; cpf: string }
}

export default function NewAppointmentPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      type: AppointmentType.IN_PERSON,
      duration: 30,
    },
  })

  const selectedHospital = watch('hospitalId')
  const selectedDate = watch('scheduledDate')

  const selectClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"

  // Load hospitals and patients
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [hospitalsRes, patientsRes] = await Promise.all([
          api.get('/hospitals'),
          api.get('/patients?limit=100'),
        ])
        setHospitals(hospitalsRes.data.data || hospitalsRes.data || [])
        setPatients(patientsRes.data.data || patientsRes.data || [])
      } catch (err) {
        console.error('Error loading data:', err)
      }
    }
    fetchData()
  }, [])

  // Load available slots when hospital and date are selected
  useEffect(() => {
    if (selectedHospital && selectedDate) {
      const fetchSlots = async () => {
        setLoadingSlots(true)
        try {
          const response = await api.get('/appointments/available-slots', {
            params: { hospitalId: selectedHospital, date: selectedDate }
          })
          setAvailableSlots(response.data.availableSlots || [])
        } catch (err) {
          console.error('Error loading slots:', err)
        } finally {
          setLoadingSlots(false)
        }
      }
      fetchSlots()
    }
  }, [selectedHospital, selectedDate])

  const onSubmit = async (data: AppointmentFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const scheduledDate = new Date(`${data.scheduledDate}T${data.scheduledTime}:00`)

      await api.post('/appointments', {
        hospitalId: data.hospitalId,
        patientId: data.patientId,
        doctorId: data.doctorId,
        type: data.type,
        specialty: data.specialty,
        scheduledDate: scheduledDate.toISOString(),
        duration: data.duration,
        reason: data.reason,
      })

      router.push('/dashboard/appointments')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar agendamento')
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
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Novo Agendamento</h2>
          <p className="text-muted-foreground">
            Crie um novo agendamento de consulta
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
            <CardTitle>Informações da Consulta</CardTitle>
            <CardDescription>Selecione o hospital, paciente e especialidade</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hospitalId">Hospital *</Label>
              <select
                id="hospitalId"
                {...register('hospitalId')}
                className={selectClass}
              >
                <option value="">Selecione um hospital...</option>
                {hospitals.map((hospital) => (
                  <option key={hospital.id} value={hospital.id}>
                    {hospital.name}
                  </option>
                ))}
              </select>
              {errors.hospitalId && <p className="text-sm text-destructive">{errors.hospitalId.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="patientId">Paciente *</Label>
              <select
                id="patientId"
                {...register('patientId')}
                className={selectClass}
              >
                <option value="">Selecione um paciente...</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.user?.name || 'Sem nome'} - {patient.user?.cpf || ''}
                  </option>
                ))}
              </select>
              {errors.patientId && <p className="text-sm text-destructive">{errors.patientId.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="doctorId">ID do Médico *</Label>
              <Input
                id="doctorId"
                {...register('doctorId')}
                placeholder="ID do médico responsável"
              />
              {errors.doctorId && <p className="text-sm text-destructive">{errors.doctorId.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialty">Especialidade *</Label>
              <select
                id="specialty"
                {...register('specialty')}
                className={selectClass}
              >
                <option value="">Selecione uma especialidade...</option>
                {specialties.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
              {errors.specialty && <p className="text-sm text-destructive">{errors.specialty.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Consulta *</Label>
              <select
                id="type"
                {...register('type')}
                className={selectClass}
              >
                <option value={AppointmentType.IN_PERSON}>Presencial</option>
                <option value={AppointmentType.TELEMEDICINE}>Telemedicina</option>
                <option value={AppointmentType.EMERGENCY}>Emergência</option>
              </select>
              {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duração (minutos) *</Label>
              <Input
                id="duration"
                type="number"
                {...register('duration')}
                min={15}
                max={240}
                step={15}
              />
              {errors.duration && <p className="text-sm text-destructive">{errors.duration.message}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data e Horário</CardTitle>
            <CardDescription>Selecione quando a consulta será realizada</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="scheduledDate">Data *</Label>
              <Input
                id="scheduledDate"
                type="date"
                {...register('scheduledDate')}
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.scheduledDate && <p className="text-sm text-destructive">{errors.scheduledDate.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduledTime">Horário *</Label>
              <Input
                id="scheduledTime"
                type="time"
                {...register('scheduledTime')}
                min="08:00"
                max="18:00"
              />
              {errors.scheduledTime && <p className="text-sm text-destructive">{errors.scheduledTime.message}</p>}
            </div>

            {selectedHospital && selectedDate && (
              <div className="md:col-span-2 space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Horários disponíveis
                </Label>
                {loadingSlots ? (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {availableSlots.slice(0, 20).map((slot) => {
                      const time = new Date(slot)
                      const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`
                      return (
                        <Button
                          key={slot}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setValue('scheduledTime', timeStr)}
                        >
                          {timeStr}
                        </Button>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum horário disponível</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalhes</CardTitle>
            <CardDescription>Motivo da consulta e observações</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo da Consulta *</Label>
              <Input
                id="reason"
                {...register('reason')}
                placeholder="Descreva o motivo da consulta"
              />
              {errors.reason && <p className="text-sm text-destructive">{errors.reason.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <textarea
                id="notes"
                {...register('notes')}
                placeholder="Observações adicionais..."
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Agendamento
          </Button>
        </div>
      </form>
    </div>
  )
}