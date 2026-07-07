'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Logo } from '@/components/branding/Logo'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState<string>('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Link de verificação inválido: token ausente.')
      return
    }

    const verify = async () => {
      try {
        const response = await api.post('/auth/verify-email', { token })
        setStatus('success')
        setMessage(response.data.message || 'E-mail verificado com sucesso!')
      } catch (err: any) {
        setStatus('error')
        setMessage(
          err?.response?.data?.message ||
            'Não foi possível verificar seu e-mail. O link pode ter expirado.'
        )
      }
    }

    verify()
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mb-4 flex justify-center">
              <Logo size={40} withWordmark />
            </div>

            {status === 'loading' && (
              <>
                <div className="w-16 h-16 rounded-full glass flex items-center justify-center mx-auto">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
                <h2 className="text-2xl font-bold">Verificando seu e-mail...</h2>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="w-16 h-16 rounded-full glass bg-success/15 flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
                <h2 className="text-2xl font-bold text-success">E-mail verificado!</h2>
                <p className="text-muted-foreground">{message}</p>
                <Button className="w-full" size="lg" onClick={() => (window.location.href = '/login')}>
                  Ir para o login
                </Button>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="w-16 h-16 rounded-full glass bg-destructive/15 flex items-center justify-center mx-auto">
                  <XCircle className="h-8 w-8 text-destructive" />
                </div>
                <h2 className="text-2xl font-bold text-destructive">Verificação falhou</h2>
                <p className="text-muted-foreground">{message}</p>
                <p className="text-sm text-muted-foreground">
                  Você pode solicitar um novo link na tela de login.
                </p>
                <Link href="/login" className="block">
                  <Button variant="outline" className="w-full" size="lg">
                    Voltar para o login
                  </Button>
                </Link>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function VerifyEmailFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailContent />
    </Suspense>
  )
}
