'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { UserRole } from '@medgo/shared-types'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, ArrowLeft, ExternalLink, Shield, Loader2 } from 'lucide-react'

interface HealthInsurance {
  id: string
  name: string
  website: string | null
  oauthEnabled: boolean
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

const registerSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string().min(6, 'Confirmação de senha é obrigatória'),
  cpf: z.string().min(11, 'CPF deve ter 11 dígitos').max(14, 'CPF inválido'),
  phone: z.string().min(10, 'Telefone deve ter no mínimo 10 dígitos'),
  role: z.nativeEnum(UserRole),

  // Patient fields
  dateOfBirth: z.string().optional(),
  bloodType: z.string().optional(),
  allergies: z.string().optional(),
  chronicConditions: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),
  healthInsuranceNumber: z.string().optional(),
  healthInsuranceId: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
}).refine((data) => {
  if (data.role === UserRole.PATIENT) {
    return !!data.dateOfBirth
  }
  return true
}, {
  message: 'Data de nascimento é obrigatória',
  path: ['dateOfBirth'],
}).refine((data) => {
  if (data.role === UserRole.PATIENT) {
    return !!data.emergencyContactName && data.emergencyContactName.length >= 2
  }
  return true
}, {
  message: 'Nome do contato de emergência é obrigatório',
  path: ['emergencyContactName'],
}).refine((data) => {
  if (data.role === UserRole.PATIENT) {
    return !!data.emergencyContactPhone && data.emergencyContactPhone.length >= 10
  }
  return true
}, {
  message: 'Telefone do contato de emergência é obrigatório',
  path: ['emergencyContactPhone'],
}).refine((data) => {
  if (data.role === UserRole.PATIENT) {
    return !!data.emergencyContactRelationship && data.emergencyContactRelationship.length >= 2
  }
  return true
}, {
  message: 'Parentesco é obrigatório',
  path: ['emergencyContactRelationship'],
})

type RegisterForm = z.infer<typeof registerSchema>

const roleLabels: Record<UserRole, string> = {
  [UserRole.PATIENT]: 'Paciente',
  [UserRole.DOCTOR]: 'Médico',
  [UserRole.NURSE]: 'Enfermeiro(a)',
  [UserRole.RECEPTIONIST]: 'Recepcionista',
  [UserRole.HOSPITAL_ADMIN]: 'Administrador Hospitalar',
  [UserRole.SYSTEM_ADMIN]: 'Administrador do Sistema',
  [UserRole.HEALTH_INSURANCE_ADMIN]: 'Administrador de Plano de Saúde',
}

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [healthInsurances, setHealthInsurances] = useState<HealthInsurance[]>([])
  const [loadingInsurances, setLoadingInsurances] = useState(true)
  const [selectedInsurance, setSelectedInsurance] = useState<HealthInsurance | null>(null)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: UserRole.PATIENT,
    },
  })

  const selectedRole = watch('role')
  const isPatient = selectedRole === UserRole.PATIENT

  // Fetch health insurances on mount
  useEffect(() => {
    const fetchInsurances = async () => {
      try {
        const response = await api.get('/health-insurances/public')
        setHealthInsurances(response.data.data || [])
      } catch (err) {
        console.error('Error fetching health insurances:', err)
      } finally {
        setLoadingInsurances(false)
      }
    }

    fetchInsurances()
  }, [])

  // Handle OAuth callback data from URL params
  useEffect(() => {
    const oauthData = searchParams.get('oauth_data')
    if (oauthData) {
      try {
        const data = JSON.parse(decodeURIComponent(oauthData))
        if (data.userData) {
          if (data.userData.name) setValue('name', data.userData.name)
          if (data.userData.email) setValue('email', data.userData.email)
          if (data.userData.cpf) setValue('cpf', formatCPF(data.userData.cpf))
          if (data.userData.phone) setValue('phone', formatPhone(data.userData.phone))
          if (data.userData.dateOfBirth) setValue('dateOfBirth', data.userData.dateOfBirth.split('T')[0])
          if (data.userData.healthInsuranceNumber) setValue('healthInsuranceNumber', data.userData.healthInsuranceNumber)
        }
        if (data.healthInsuranceId) {
          setValue('healthInsuranceId', data.healthInsuranceId)
          const insurance = healthInsurances.find(h => h.id === data.healthInsuranceId)
          if (insurance) setSelectedInsurance(insurance)
        }
        // Clean URL
        window.history.replaceState({}, '', '/register')
      } catch (err) {
        console.error('Error parsing OAuth data:', err)
      }
    }
  }, [searchParams, setValue, healthInsurances])

  const handleHealthInsuranceOAuth = async (insurance: HealthInsurance) => {
    setOauthLoading(insurance.id)
    try {
      const response = await api.get(`/health-insurances/${insurance.id}/oauth/initiate`)
      const data = response.data

      if (data.type === 'redirect' && data.url) {
        // Simple redirect without OAuth - opens in new tab
        window.open(data.url, '_blank')
        setSelectedInsurance(insurance)
        setValue('healthInsuranceId', insurance.id)
      } else if (data.type === 'oauth' && data.authUrl) {
        // OAuth flow - redirect in same window
        // Store current form state before redirecting
        localStorage.setItem('register_form_backup', JSON.stringify({
          insurance: insurance,
        }))
        window.location.href = data.authUrl
      }
    } catch (err) {
      console.error('Error initiating OAuth:', err)
      setError('Erro ao conectar com o plano de saúde')
    } finally {
      setOauthLoading(null)
    }
  }

  const onSubmit = async (data: RegisterForm) => {
    try {
      setError(null)
      setIsLoading(true)

      const payload: any = {
        name: data.name,
        email: data.email,
        password: data.password,
        cpf: data.cpf.replace(/\D/g, ''),
        phone: data.phone.replace(/\D/g, ''),
        role: data.role,
      }

      // Adicionar campos de paciente se for PATIENT
      if (data.role === UserRole.PATIENT) {
        payload.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : undefined
        payload.bloodType = data.bloodType || undefined
        payload.allergies = data.allergies ? data.allergies.split(',').map((s: string) => s.trim()) : []
        payload.chronicConditions = data.chronicConditions ? data.chronicConditions.split(',').map((s: string) => s.trim()) : []
        payload.emergencyContactName = data.emergencyContactName
        payload.emergencyContactPhone = data.emergencyContactPhone
        payload.emergencyContactRelationship = data.emergencyContactRelationship
        payload.healthInsuranceNumber = data.healthInsuranceNumber || undefined
        payload.healthInsuranceId = data.healthInsuranceId || undefined
      }

      await api.post('/auth/register', payload)
      setSuccess(true)

      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError('Email ou CPF já cadastrado')
      } else {
        setError('Erro ao criar conta. Tente novamente.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`
  }

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 2) return `(${digits}`
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
  }

  const selectClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Activity className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-green-600">Conta criada com sucesso!</h2>
              <p className="text-muted-foreground">
                Redirecionando para o login...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <Card className="w-full max-w-2xl mx-4">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-8 w-8 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold">MedGo</h1>
          </div>
          <CardTitle className="text-xl sm:text-2xl">Criar Conta</CardTitle>
          <CardDescription>
            Preencha os dados abaixo para criar sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Tipo de Usuário - primeiro para condicionar campos */}
            <div className="space-y-2">
              <Label htmlFor="role">Tipo de Usuário</Label>
              <select
                id="role"
                className={selectClass}
                {...register('role')}
                disabled={isLoading}
              >
                {Object.entries(roleLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              {errors.role && (
                <p className="text-sm text-destructive">{errors.role.message}</p>
              )}
            </div>

            {/* Health Insurance Selection - only for patients */}
            {isPatient && healthInsurances.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Vincular Plano de Saúde</h3>
                <p className="text-sm text-muted-foreground">
                  Conecte com seu plano de saúde para importar seus dados automaticamente
                </p>

                {loadingInsurances ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {healthInsurances.map((insurance) => (
                      <Button
                        key={insurance.id}
                        type="button"
                        variant={selectedInsurance?.id === insurance.id ? "default" : "outline"}
                        className="h-auto py-3 justify-start gap-3"
                        onClick={() => handleHealthInsuranceOAuth(insurance)}
                        disabled={oauthLoading !== null || isLoading}
                      >
                        {oauthLoading === insurance.id ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Shield className="h-5 w-5" />
                        )}
                        <div className="text-left">
                          <div className="font-medium">{insurance.name}</div>
                          <div className="text-xs opacity-70">
                            {selectedInsurance?.id === insurance.id ? 'Vinculado' : 'Clique para vincular'}
                          </div>
                        </div>
                        {insurance.oauthEnabled && <ExternalLink className="h-4 w-4 ml-auto" />}
                      </Button>
                    ))}
                  </div>
                )}

                {selectedInsurance && (
                  <div className="p-3 rounded-md bg-green-50 text-green-700 text-sm flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Plano vinculado: {selectedInsurance.name}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-auto h-6 text-xs"
                      onClick={() => {
                        setSelectedInsurance(null)
                        setValue('healthInsuranceId', '')
                      }}
                    >
                      Remover
                    </Button>
                  </div>
                )}

                <input type="hidden" {...register('healthInsuranceId')} />
              </div>
            )}

            {/* Dados Pessoais */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Dados Pessoais</h3>

              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome completo"
                  {...register('name')}
                  disabled={isLoading}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  {...register('email')}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    type="text"
                    placeholder="000.000.000-00"
                    {...register('cpf')}
                    onChange={(e) => {
                      const formatted = formatCPF(e.target.value)
                      e.target.value = formatted
                      setValue('cpf', formatted)
                    }}
                    maxLength={14}
                    disabled={isLoading}
                  />
                  {errors.cpf && (
                    <p className="text-sm text-destructive">{errors.cpf.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    type="text"
                    placeholder="(00) 00000-0000"
                    {...register('phone')}
                    onChange={(e) => {
                      const formatted = formatPhone(e.target.value)
                      e.target.value = formatted
                      setValue('phone', formatted)
                    }}
                    maxLength={15}
                    disabled={isLoading}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Senha *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...register('password')}
                    disabled={isLoading}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    {...register('confirmPassword')}
                    disabled={isLoading}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Campos de Paciente - só aparecem se role = PATIENT */}
            {isPatient && (
              <>
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Informações Médicas</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Data de Nascimento *</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        {...register('dateOfBirth')}
                        disabled={isLoading}
                      />
                      {errors.dateOfBirth && (
                        <p className="text-sm text-destructive">{errors.dateOfBirth.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bloodType">Tipo Sanguíneo</Label>
                      <select
                        id="bloodType"
                        className={selectClass}
                        {...register('bloodType')}
                        disabled={isLoading}
                      >
                        {bloodTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="healthInsuranceNumber">Número do Plano de Saúde</Label>
                    <Input
                      id="healthInsuranceNumber"
                      {...register('healthInsuranceNumber')}
                      placeholder="123456789"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="allergies">Alergias</Label>
                    <Input
                      id="allergies"
                      {...register('allergies')}
                      placeholder="Penicilina, Dipirona, Látex"
                      disabled={isLoading}
                    />
                    <p className="text-xs text-muted-foreground">Separe por vírgulas</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="chronicConditions">Condições Crônicas</Label>
                    <Input
                      id="chronicConditions"
                      {...register('chronicConditions')}
                      placeholder="Diabetes, Hipertensão"
                      disabled={isLoading}
                    />
                    <p className="text-xs text-muted-foreground">Separe por vírgulas</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Contato de Emergência</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContactName">Nome *</Label>
                      <Input
                        id="emergencyContactName"
                        {...register('emergencyContactName')}
                        placeholder="Maria da Silva"
                        disabled={isLoading}
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
                        placeholder="(00) 00000-0000"
                        disabled={isLoading}
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
                        placeholder="Mãe, Pai, Cônjuge..."
                        disabled={isLoading}
                      />
                      {errors.emergencyContactRelationship && (
                        <p className="text-sm text-destructive">{errors.emergencyContactRelationship.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Criando conta...' : 'Criar Conta'}
            </Button>

            <div className="text-center">
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para o login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
