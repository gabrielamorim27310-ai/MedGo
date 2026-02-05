'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { LoginDTO } from '@medgo/shared-types'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, ExternalLink } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [healthInsuranceUrl, setHealthInsuranceUrl] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    try {
      setError(null)
      setIsLoading(true)
      const result = await login(data as LoginDTO)

      // Se paciente tem plano de saúde com site, mostrar opção de redirecionamento
      if (result.healthInsuranceWebsite) {
        setHealthInsuranceUrl(result.healthInsuranceWebsite)
        setIsLoading(false)
      } else {
        // Use window.location to force full page reload with new cookie
        window.location.href = '/dashboard'
      }
    } catch (err) {
      setError('Email ou senha inválidos')
      setIsLoading(false)
    }
  }

  const goToDashboard = () => {
    window.location.href = '/dashboard'
  }

  const goToHealthInsurance = () => {
    if (healthInsuranceUrl) {
      // Abre o site do plano em nova aba e vai para o dashboard
      window.open(healthInsuranceUrl, '_blank')
      window.location.href = '/dashboard'
    }
  }

  // Tela de escolha após login de paciente com plano
  if (healthInsuranceUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="space-y-1 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">MedGo</h1>
            </div>
            <CardTitle className="text-2xl text-center">Login realizado!</CardTitle>
            <CardDescription className="text-center">
              Você possui um plano de saúde vinculado. Deseja acessar o portal do plano?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={goToHealthInsurance}
              className="w-full gap-2"
              size="lg"
            >
              <ExternalLink className="h-4 w-4" />
              Acessar Portal do Plano de Saúde
            </Button>
            <Button
              onClick={goToDashboard}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Ir para o Dashboard MedGo
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">MedGo</h1>
          </div>
          <CardTitle className="text-2xl">Bem-vindo</CardTitle>
          <CardDescription>
            Entre com suas credenciais para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
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

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
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

            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>

            <div className="text-center space-y-2">
              <Link
                href="/forgot-password"
                className="text-sm text-muted-foreground hover:text-primary block"
              >
                Esqueceu sua senha?
              </Link>
              <p className="text-sm text-muted-foreground">
                Não tem uma conta?{' '}
                <Link href="/register" className="text-primary hover:underline">
                  Cadastre-se
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

