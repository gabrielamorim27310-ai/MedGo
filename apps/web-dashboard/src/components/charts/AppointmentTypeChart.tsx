'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface AppointmentTypeChartProps {
  data: Record<string, number>
}

const TYPE_LABELS: Record<string, string> = {
  IN_PERSON: 'Presencial',
  TELEMEDICINE: 'Telemedicina',
}

export function AppointmentTypeChart({ data }: AppointmentTypeChartProps) {
  const chartData = Object.entries(data).map(([type, value]) => ({
    name: TYPE_LABELS[type] || type,
    value,
    percentage: 0,
  }))

  const total = chartData.reduce((sum, item) => sum + item.value, 0)
  chartData.forEach((item) => {
    item.percentage = total > 0 ? (item.value / total) * 100 : 0
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tipos de Agendamento</CardTitle>
        <CardDescription>Presencial vs Telemedicina</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="value"
                name="Agendamentos"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>

          <div className="space-y-2">
            {chartData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor: index === 0 ? '#8884d8' : '#82ca9d',
                    }}
                  />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{item.value}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
