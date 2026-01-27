import { z } from 'zod'
import { AppointmentType, AppointmentStatus } from '@medgo/shared-types'

export const createAppointmentSchema = z.object({
  body: z.object({
    patientId: z.string().uuid('ID do paciente inválido'),
    hospitalId: z.string().uuid('ID do hospital inválido'),
    doctorId: z.string().uuid('ID do médico inválido'),
    specialtyId: z.string().uuid('ID da especialidade inválido').optional(),
    type: z.nativeEnum(AppointmentType),
    scheduledDate: z.string().datetime('Data inválida'),
    duration: z.number().min(15, 'Duração mínima de 15 minutos').optional(),
    reason: z.string().min(3, 'Motivo deve ter no mínimo 3 caracteres'),
    notes: z.string().optional(),
    isFirstVisit: z.boolean().optional(),
  }),
})

export const updateAppointmentSchema = z.object({
  body: z.object({
    scheduledDate: z.string().datetime('Data inválida').optional(),
    duration: z.number().min(15, 'Duração mínima de 15 minutos').optional(),
    reason: z.string().min(3, 'Motivo deve ter no mínimo 3 caracteres').optional(),
    notes: z.string().optional(),
    status: z.nativeEnum(AppointmentStatus).optional(),
  }),
})

export const cancelAppointmentSchema = z.object({
  body: z.object({
    reason: z.string().min(3, 'Motivo do cancelamento é obrigatório'),
  }),
})

export const rescheduleAppointmentSchema = z.object({
  body: z.object({
    scheduledDate: z.string().datetime('Data inválida'),
    reason: z.string().min(3, 'Motivo do reagendamento é obrigatório'),
  }),
})

export const completeAppointmentSchema = z.object({
  body: z.object({
    notes: z.string().optional(),
  }),
})

export const getAvailableSlotsSchema = z.object({
  query: z.object({
    hospitalId: z.string().uuid('ID do hospital inválido'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data no formato YYYY-MM-DD'),
    doctorId: z.string().uuid('ID do médico inválido').optional(),
    specialtyId: z.string().uuid('ID da especialidade inválido').optional(),
  }),
})
