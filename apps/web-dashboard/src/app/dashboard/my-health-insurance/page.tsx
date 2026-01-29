'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CreditCard, Building2, Phone, Mail, Globe, CheckCircle } from 'lucide-react'
import { api } from '@/lib/api'

interface HealthInsurance {
  id: string
  name: string
  cnpj: string
  phone: string
  email: string
  website?: string
  plans?: HealthInsurancePlan[]
}

interface HealthInsurancePlan {
  id: string
  name: string
  code: string
  coverageType: string
}

interface PatientHealthInsurance {
  healthInsuranceId: string | null
  healthInsuranceNumber: string | null
  healthInsurance: HealthInsurance | null
}

const myHealthInsuranceSchema = z.object({
  healthInsuranceId: z.string().min(1, 'Selecione uma operadora'),
  healthInsuranceNumber: z.string().min(5, 'Número do cartão deve ter pelo menos 5 caracteres'),
})

type MyHealthInsuranceFormData = z.infer<typeof myHealthInsuranceSchema>

export default function MyHealthInsurancePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [healthInsurances, setHealthInsurances] = useState<HealthInsurance[]>([])
  const [currentInsurance, setCurrentInsurance] = useState<PatientHealthInsurance | null>(null)
  const [selectedInsurance, setSelectedInsurance] = useState<HealthInsurance | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MyHealthInsuranceFormData>({
    resolver: zodResolver(myHealthInsuranceSchema),
  })

  const watchedInsuranceId = watch('healthInsuranceId')

  // Buscar operadoras disponíveis e dados atuais do paciente
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Buscar operadoras cadastradas
        const insurancesResponse = await api.get('/health-insurances?limit=100')
        setHealthInsurances(insurancesResponse.data.data || [])

        // Buscar dados atuais do paciente
        try {
          const patientResponse = await api.get('/patients/me')
          if (patientResponse.data) {
            setCurrentInsurance({
              healthInsuranceId: patientResponse.data.healthInsuranceId,
              healthInsuranceNumber: patientResponse.data.healthInsuranceNumber,
              healthInsurance: patientResponse.data.healthInsurance,
            })

            // Preencher formulário com dados atuais
            if (patientResponse.data.healthInsuranceId) {
              setValue('healthInsuranceId', patientResponse.data.healthInsuranceId)
            }
            if (patientResponse.data.healthInsuranceNumber) {
              setValue('healthInsuranceNumber', patientResponse.data.healthInsuranceNumber)
            }
          }
        } catch (err) {
          // Paciente pode não ter dados ainda
          console.log('Paciente sem dados de plano de saúde')
        }
      } catch (err) {
        setError('Erro ao carregar dados')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [setValue])

  // Atualizar operadora selecionada quando mudar
  useEffect(() => {
    if (watchedInsuranceId) {
      const insurance = healthInsurances.find(hi => hi.id === watchedInsuranceId)
      setSelectedInsurance(insurance || null)
    } else {
      setSelectedInsurance(null)
    }
  }, [watchedInsuranceId, healthInsurances])

  const onSubmit = async (data: MyHealthInsuranceFormData) => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      await api.patch('/patients/me/health-insurance', data)
      setSuccess(true)

      // Atualizar dados locais
      const insurance = healthInsurances.find(hi => hi.id === data.healthInsuranceId)
      setCurrentInsurance({
        healthInsuranceId: data.healthInsuranceId,
        healthInsuranceNumber: data.healthInsuranceNumber,
        healthInsurance: insurance || null,
      })

      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar dados do plano de saúde')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Meu Plano de Saúde</h2>
        <p className="text-muted-foreground">
          Cadastre ou atualize as informações do seu plano de saúde
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 text-green-600 px-4 py-2 rounded-md flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          Dados salvos com sucesso!
        </div>
      )}

      {/* Status atual */}
      {currentInsurance?.healthInsurance && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Plano Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Operadora</p>
                <p className="font-medium">{currentInsurance.healthInsurance.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Número do Cartão</p>
                <p className="font-medium font-mono">{currentInsurance.healthInsuranceNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Telefone da Operadora</p>
                <p className="font-medium">{currentInsurance.healthInsurance.phone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email da Operadora</p>
                <p className="font-medium">{currentInsurance.healthInsurance.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{currentInsurance?.healthInsurance ? 'Atualizar Plano' : 'Cadastrar Plano'}</CardTitle>
            <CardDescription>
              Selecione sua operadora de saúde e informe o número do seu cartão
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="healthInsuranceId">Operadora de Saúde *</Label>
              <select
                id="healthInsuranceId"
                {...register('healthInsuranceId')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">Selecione sua operadora...</option>
                {healthInsurances.map((insurance) => (
                  <option key={insurance.id} value={insurance.id}>
                    {insurance.name}
                  </option>
                ))}
              </select>
              {errors.healthInsuranceId && (
                <p className="text-sm text-destructive">{errors.healthInsuranceId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="healthInsuranceNumber">Número do Cartão *</Label>
              <Input
                id="healthInsuranceNumber"
                {...register('healthInsuranceNumber')}
                placeholder="Digite o número do seu cartão do plano"
              />
              {errors.healthInsuranceNumber && (
                <p className="text-sm text-destructive">{errors.healthInsuranceNumber.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                O número está na frente do seu cartão do plano de saúde
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Informações da operadora selecionada */}
        {selectedInsurance && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informações da Operadora
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium">{selectedInsurance.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedInsurance.email}</p>
                  </div>
                </div>
                {selectedInsurance.website && (
                  <div className="flex items-center gap-2 md:col-span-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Website</p>
                      <a
                        href={selectedInsurance.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline"
                      >
                        {selectedInsurance.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {currentInsurance?.healthInsurance ? 'Atualizar Plano' : 'Cadastrar Plano'}
          </Button>
        </div>
      </form>

      {healthInsurances.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Nenhuma operadora de saúde cadastrada no sistema ainda.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Entre em contato com o suporte para mais informações.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
