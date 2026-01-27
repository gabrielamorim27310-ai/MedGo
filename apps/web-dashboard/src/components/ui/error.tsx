import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from './button'
import { Alert, AlertDescription, AlertTitle } from './alert'
import { cn } from '@/lib/utils'

interface ErrorProps {
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorMessage({ message = 'Ocorreu um erro', onRetry, className }: ErrorProps) {
  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Erro</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="ml-2 gap-2"
          >
            <RefreshCw className="h-3 w-3" />
            Tentar novamente
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

export function ErrorPage({ message, onRetry }: ErrorProps) {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 p-4">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <h2 className="text-2xl font-bold">Erro ao carregar</h2>
      <p className="text-muted-foreground">{message || 'Ocorreu um erro inesperado'}</p>
      {onRetry && (
        <Button onClick={onRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </Button>
      )}
    </div>
  )
}
