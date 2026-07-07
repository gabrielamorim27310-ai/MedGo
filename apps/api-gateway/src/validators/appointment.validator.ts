import { z } from 'zod'
import { AppointmentType, AppointmentStatus } from '@acolhe/shared-types'

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
    diagnosis: z.string().optional(),
    prescription: z.string().optional(),
    // Prontuário eletrônico integrado (padrão TISS)
    cid10: z
      .string()
      .regex(/^[A-Z][0-9]{2}(\.[0-9]{1,2})?$/, 'CID-10 inválido (ex.: J45.0)')
      .optional(),
    tussProcedures: z
      .array(
        z.object({
          code: z.string().min(3, 'Código TUSS inválido'),
          description: z.string().min(3, 'Descrição do procedimento obrigatória'),
          quantity: z.number().int().min(1).default(1),
        })
      )
      .optional(),
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
