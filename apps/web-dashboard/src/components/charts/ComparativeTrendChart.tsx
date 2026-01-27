'use client'

import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useAnalytics } from '@/hooks/useAnalytics'
import { LoadingOverlay } from '@/components/ui/loading'
import { subDays, format } from 'date-fns'

interface ComparativeTrendChartProps {
  metric: 'appointments' | 'queue_entries' | 'patients'
  days?: number
  hospitalId?: string
}

export function ComparativeTrendChart({ metric, days = 30, hospitalId }: ComparativeTrendChartProps) {
  const { loading, getTrends } = useAnalytics()
  const [currentData, setCurrentData] = useState<any[]>([])
  const [previousData, setPreviousData] = useState<any[]>([])
  const [comparison, setComparison] = useState<number>(0)

  useEffect(() => {
    loadComparisonData()
  }, [metric, days, hospitalId])

  const loadComparisonData = async () => {
    // Período atual
    const current = await getTrends(metric, days, hospitalId)

    // Período anterior (mesmo número de dias, mas anterior)
    const endDate = subDays(new Date(), days)
    const previousTrends = await getTrends(metric, days, hospitalId)

    if (current && previousTrends) {
      setCurrentData(current)
      setPreviousData(previousTrends)

      // Calcular diferença percentual
      const currentTotal = current.reduce((sum, item) => sum + item.value, 0)
      const previousTotal = previousTrends.reduce((sum, item) => sum + item.value, 0)

      if (previousTotal > 0) {
        const diff = ((currentTotal - previousTotal) / previousTotal) * 100
        setComparison(diff)
      }
    }
  }

  // Combinar dados para visualização lado a lado
  const combinedData = currentData.map((current, index) => ({
    date: current.date,
    atual: current.value,
    anterior: previousData[index]?.value || 0,
  }))

  const metricLabels: Record<string, string> = {
    appointments: 'Agendamentos',
    queue_entries: 'Entradas em Fila',
    patients: 'Novos Pacientes',
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparação de Períodos - {metricLabels[metric]}</CardTitle>
        <CardDescription>
          Últimos {days} dias vs período anterior
          {comparison !== 0 && (
            <span
              className={`ml-2 font-bold ${
                comparison > 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {comparison > 0 ? '+' : ''}{comparison.toFixed(1)}%
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <LoadingOverlay />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={combinedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return `${date.getDate()}/${date.getMonth() + 1}`
                }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                labelFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString('pt-BR')
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="atual"
                name="Período Atual"
                stroke="#8884d8"
                strokeWidth={2}
                activeDot={{ r: 8 }}
              />
              <Line
                type="monotone"
                dataKey="anterior"
                name="Período Anterior"
                stroke="#82ca9d"
                strokeWidth={2}
                strokeDasharray="5 5"
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {/* Estatísticas Comparativas */}
        <div className="mt-4 grid grid-cols-3 gap-4 border-t pt-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Período Atual</p>
            <p className="text-lg font-bold">
              {currentData.reduce((sum, item) => sum + item.value, 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Período Anterior</p>
            <p className="text-lg font-bold">
              {previousData.reduce((sum, item) => sum + item.value, 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Variação</p>
            <p
              className={`text-lg font-bold ${
                comparison > 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {comparison > 0 ? '+' : ''}{comparison.toFixed(1)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
