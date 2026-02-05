'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Activity, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OAuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const oauthError = searchParams.get('error')

      if (oauthError) {
        setError(`Erro de autenticação: ${oauthError}`)
        setStatus('error')
        return
      }

      if (!code || !state) {
        setError('Parâmetros de callback inválidos')
        setStatus('error')
        return
      }

      try {
        const response = await api.get(`/health-insurances/oauth/callback`, {
          params: { code, state }
        })

        const data = response.data

        if (data.success) {
          setStatus('success')

          // Encode the data and redirect to register page
          const oauthData = encodeURIComponent(JSON.stringify({
            healthInsuranceId: data.healthInsuranceId,
            healthInsuranceName: data.healthInsuranceName,
            userData: data.userData,
          }))

          setTimeout(() => {
            router.push(`/register?oauth_data=${oauthData}`)
          }, 1500)
        } else {
          setError('Erro ao processar dados do plano de saúde')
          setStatus('error')
        }
      } catch (err: any) {
        console.error('OAuth callback error:', err)
        setError(err.response?.data?.message || 'Erro ao processar autenticação')
        setStatus('error')
      }
    }

    handleCallback()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Activity className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">MedGo</h1>
            </div>

            {status === 'loading' && (
              <>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                </div>
                <h2 className="text-xl font-semibold">Processando...</h2>
                <p className="text-muted-foreground">
                  Importando seus dados do plano de saúde
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-green-600">Dados importados!</h2>
                <p className="text-muted-foreground">
                  Redirecionando para o cadastro...
                </p>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-red-600">Erro</h2>
                <p className="text-muted-foreground">{error}</p>
                <Button
                  onClick={() => router.push('/register')}
                  className="mt-4"
                >
                  Voltar para o cadastro
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
