import { z } from 'zod'
import { UserRole } from '@acolhe/shared-types'

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  }),
})

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
    name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    cpf: z.string().regex(/^\d{11}$/, 'CPF inválido'),
    phone: z.string().regex(/^\d{10,11}$/, 'Telefone inválido'),
    role: z.nativeEnum(UserRole),
    hospitalId: z.string().uuid().optional(),
    healthInsuranceId: z.string().uuid().optional(),
    // CRM (médico) / COREN (enfermeiro)
    professionalLicense: z.string().max(30).optional(),
    // LGPD: consentimento explícito é obrigatório no cadastro
    lgpdConsent: z.literal(true, {
      errorMap: () => ({
        message: 'É necessário aceitar a política de privacidade (LGPD)',
      }),
    }),
    lgpdConsentVersion: z.string().optional(),
  }),
})
