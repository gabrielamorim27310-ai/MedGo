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

interface AppointmentTrendChartProps {
  hospitalId?: string
  days?: number
}

export function AppointmentTrendChart({ hospitalId, days = 30 }: AppointmentTrendChartProps) {
  const { loading, getTrends } = useAnalytics()
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [hospitalId, days])

  const loadData = async () => {
    const trends = await getTrends('appointments', days, hospitalId)
    if (trends) {
      setData(trends)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendência de Agendamentos</CardTitle>
        <CardDescription>Últimos {days} dias</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <LoadingOverlay />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
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
                dataKey="value"
                name="Agendamentos"
                stroke="#8884d8"
                strokeWidth={2}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
