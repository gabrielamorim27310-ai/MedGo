'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { UserRole } from '@acolhe/shared-types'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/branding/Logo'
import { Loader2 } from 'lucide-react'

interface HospitalOption {
  id: string
  name: string
  city: string
}

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

const roleLabels: Record<string, string> = {
  PATIENT: 'Paciente',
  DOCTOR: 'Médico',
  NURSE: 'Enfermeiro(a)',
  RECEPTIONIST: 'Recepcionista',
  HOSPITAL_ADMIN: 'Administrador Hospitalar',
  HEALTH_INSURANCE_ADMIN: 'Administrador de Plano de Saúde',
}

const profileSchema = z
  .object({
    role: z.string(),
    cpf: z.string().min(11, 'CPF deve ter 11 dígitos').max(14, 'CPF inválido'),
    phone: z.string().min(10, 'Telefone deve ter no mínimo 10 dígitos'),
    dateOfBirth: z.string().optional(),
    bloodType: z.string().optional(),
    professionalLicense: z.string().optional(),
    hospitalId: z.string().optional(),
  })
  .refine((d) => d.role !== 'PATIENT' || !!d.dateOfBirth, {
    message: 'Data de nascimento é obrigatória',
    path: ['dateOfBirth'],
  })
  .refine(
    (d) => !['DOCTOR', 'NURSE'].includes(d.role) || !!d.professionalLicense?.trim(),
    { message: 'Registro profissional é obrigatório', path: ['professionalLicense'] }
  )

type ProfileForm = z.infer<typeof profileSchema>

export default function CompleteProfilePage() {
  const { user, updateUser } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hospitals, setHospitals] = useState<HospitalOption[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { role: 'PATIENT' },
  })

  const selectedRole = watch('role')
  const isPatient = selectedRole === 'PATIENT'
  const isProfessional = ['DOCTOR', 'NURSE'].includes(selectedRole)
  const needsHospital = ['DOCTOR', 'NURSE', 'RECEPTIONIST', 'HOSPITAL_ADMIN'].includes(selectedRole)

  useEffect(() => {
    api
      .get('/hospitals?limit=100')
      .then((res) => setHospitals(res.data.data || []))
      .catch(() => setHospitals([]))
  }, [])

  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`
  }

  const onSubmit = async (data: ProfileForm) => {
    try {
      setError(null)
      setIsLoading(true)

      const response = await api.post('/auth/me/complete-profile', {
        role: data.role,
        cpf: data.cpf.replace(/\D/g, ''),
        phone: data.phone.replace(/\D/g, ''),
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : undefined,
        bloodType: data.bloodType || undefined,
        professionalLicense: data.professionalLicense || undefined,
        hospitalId: data.hospitalId || undefined,
      })

      const { user: updatedUser, token, refreshToken } = response.data

      localStorage.setItem('user', JSON.stringify(updatedUser))
      localStorage.setItem('token', token)
      localStorage.setItem('refreshToken', refreshToken)
      document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`
      updateUser(updatedUser)

      window.location.href = '/dashboard'
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Não foi possível salvar seu perfil. Tente novamente.')
      setIsLoading(false)
    }
  }

  const selectClass =
    'flex h-10 w-full rounded-xl glass-subtle px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 transition-colors'

  return (
    <div className="min-h-screen flex items-center justify-center py-8">
      <div className="w-full max-w-lg mx-4">
        <div className="mx-auto mb-[-14px] relative z-10 w-fit">
          <div className="glass glass-sheen rounded-2xl px-8 py-4">
            <Logo size={40} withWordmark />
          </div>
        </div>

        <Card className="pt-8">
          <CardHeader className="space-y-1 flex flex-col items-center">
            <CardTitle className="text-2xl">Quase lá{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!</CardTitle>
            <CardDescription className="text-center">
              Sua conta Google foi conectada. Complete seu perfil para
              começar a usar a Acolhe.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">Você é...</Label>
                <select id="role" className={selectClass} {...register('role')} disabled={isLoading}>
                  {Object.entries(roleLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    maxLength={14}
                    {...register('cpf')}
                    onChange={(e) => {
                      const formatted = formatCPF(e.target.value)
                      e.target.value = formatted
                      setValue('cpf', formatted)
                    }}
                    disabled={isLoading}
                  />
                  {errors.cpf && <p className="text-sm text-destructive">{errors.cpf.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    placeholder="(11) 99999-9999"
                    {...register('phone')}
                    disabled={isLoading}
                  />
                  {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                </div>
              </div>

              {isPatient && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Data de Nascimento *</Label>
                    <Input id="dateOfBirth" type="date" {...register('dateOfBirth')} disabled={isLoading} />
                    {errors.dateOfBirth && (
                      <p className="text-sm text-destructive">{errors.dateOfBirth.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bloodType">Tipo Sanguíneo</Label>
                    <select id="bloodType" className={selectClass} {...register('bloodType')} disabled={isLoading}>
                      {bloodTypes.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {isProfessional && (
                <div className="space-y-2">
                  <Label htmlFor="professionalLicense">
                    {selectedRole === 'DOCTOR' ? 'CRM *' : 'COREN *'}
                  </Label>
                  <Input
                    id="professionalLicense"
                    placeholder={selectedRole === 'DOCTOR' ? 'CRM/SP 123456' : 'COREN/SP 123456'}
                    {...register('professionalLicense')}
                    disabled={isLoading}
                  />
                  {errors.professionalLicense && (
                    <p className="text-sm text-destructive">{errors.professionalLicense.message}</p>
                  )}
                </div>
              )}

              {needsHospital && (
                <div className="space-y-2">
                  <Label htmlFor="hospitalId">Hospital / Clínica onde atua</Label>
                  <select id="hospitalId" className={selectClass} {...register('hospitalId')} disabled={isLoading}>
                    <option value="">Selecione...</option>
                    {hospitals.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} — {h.city}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl glass-subtle bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Salvando...
                  </>
                ) : (
                  'Concluir cadastro'
                )}
              </Button>

              <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
                Você pode vincular seu plano de saúde depois, em &quot;Meu Plano&quot; — ele
                não é obrigatório para usar a plataforma.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
