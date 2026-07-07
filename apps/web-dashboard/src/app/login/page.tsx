'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { LoginDTO } from '@acolhe/shared-types'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/branding/Logo'
import { ExternalLink, MailCheck, Loader2 } from 'lucide-react'

declare global {
  interface Window {
    google?: any
  }
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { login, loginWithGoogle } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [healthInsuranceUrl, setHealthInsuranceUrl] = useState<string | null>(null)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const googleButtonRef = useRef<HTMLDivElement>(null)
  const lastEmailRef = useRef<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const handleGoogleCredential = useCallback(
    async (response: { credential: string }) => {
      try {
        setError(null)
        setIsLoading(true)
        const user = await loginWithGoogle(response.credential)
        // Conta recém-criada via Google ainda não tem CPF/nascimento:
        // completa o perfil antes de entrar no painel.
        window.location.href = user?.cpf ? '/dashboard' : '/complete-profile'
      } catch (err) {
        setError('Não foi possível entrar com o Google. Tente novamente.')
        setIsLoading(false)
      }
    },
    [loginWithGoogle]
  )

  const initGoogleButton = useCallback(() => {
    if (!GOOGLE_CLIENT_ID || !window.google || !googleButtonRef.current) return

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
    })

    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: 'outline',
      size: 'large',
      shape: 'pill',
      width: 320,
      text: 'continue_with',
      locale: 'pt-BR',
    })
  }, [handleGoogleCredential])

  // O onLoad do <Script> só dispara no primeiro carregamento do app.
  // Em navegação SPA (ex.: /register → /login), o script já existe e o
  // botão precisa ser renderizado de novo aqui.
  useEffect(() => {
    if (window.google) {
      initGoogleButton()
    }
  }, [initGoogleButton])

  const onSubmit = async (data: LoginForm) => {
    try {
      setError(null)
      setNeedsVerification(false)
      setIsLoading(true)
      lastEmailRef.current = data.email
      const result = await login(data as LoginDTO)

      // Se paciente tem plano de saúde com site, mostrar opção de redirecionamento
      if (result.healthInsuranceWebsite) {
        setHealthInsuranceUrl(result.healthInsuranceWebsite)
        setIsLoading(false)
      } else {
        // Use window.location to force full page reload with new cookie
        window.location.href = '/dashboard'
      }
    } catch (err: any) {
      if (err?.response?.status === 403) {
        // Conta existe, mas o e-mail ainda não foi confirmado (Resend)
        setNeedsVerification(true)
        setResendStatus('idle')
      } else {
        setError('Email ou senha inválidos')
      }
      setIsLoading(false)
    }
  }

  const resendVerification = async () => {
    try {
      setResendStatus('sending')
      await api.post('/auth/verify-email/resend', { email: lastEmailRef.current })
      setResendStatus('sent')
    } catch {
      setResendStatus('idle')
      setError('Não foi possível reenviar o link. Tente novamente.')
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
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="space-y-1 flex flex-col items-center">
            <div className="mb-2">
              <Logo size={44} withWordmark />
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
              Ir para o painel Acolhe
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      {GOOGLE_CLIENT_ID && (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onLoad={initGoogleButton}
        />
      )}

      <div className="w-full max-w-md mx-4">
        {/* Senha de guichê de vidro com a marca */}
        <div className="mx-auto mb-[-14px] relative z-10 w-fit">
          <div className="glass glass-sheen rounded-2xl px-8 py-4">
            <Logo size={40} withWordmark />
          </div>
        </div>

        <Card className="pt-8">
          <CardHeader className="space-y-1 flex flex-col items-center">
            <CardTitle className="text-2xl">Bem-vindo</CardTitle>
            <CardDescription>
              Retire sua senha: entre para acompanhar sua fila
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

              {needsVerification && (
                <div className="p-4 rounded-xl glass-subtle space-y-3">
                  <div className="flex items-start gap-2 text-sm text-foreground">
                    <MailCheck className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>
                      Seu e-mail ainda não foi verificado. Confira sua caixa de
                      entrada (e o spam) ou solicite um novo link.
                    </span>
                  </div>
                  {resendStatus === 'sent' ? (
                    <p className="text-sm text-success font-medium">
                      Novo link enviado! Verifique seu e-mail.
                    </p>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={resendVerification}
                      disabled={resendStatus === 'sending'}
                    >
                      {resendStatus === 'sending' && (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      )}
                      Reenviar link de verificação
                    </Button>
                  )}
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl glass-subtle bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>

              {GOOGLE_CLIENT_ID && (
                <>
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-border/70" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">ou</span>
                    <div className="h-px flex-1 bg-border/70" />
                  </div>

                  <div className="flex justify-center">
                    <div ref={googleButtonRef} />
                  </div>

                  <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
                    Ao continuar com o Google, você concorda com a nossa política
                    de privacidade (LGPD).
                  </p>
                </>
              )}

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

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Acolhe — sua vez chega até você.
        </p>
      </div>
    </div>
  )
}
