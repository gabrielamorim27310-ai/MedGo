'use client'

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface AppointmentStatusChartProps {
  data: Record<string, number>
}

const COLORS = {
  SCHEDULED: '#0088FE',
  CONFIRMED: '#00C49F',
  CHECKED_IN: '#FFBB28',
  IN_PROGRESS: '#FF8042',
  COMPLETED: '#8884D8',
  CANCELLED: '#FF6B6B',
  NO_SHOW: '#FFA07A',
  RESCHEDULED: '#9370DB',
}

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Agendado',
  CONFIRMED: 'Confirmado',
  CHECKED_IN: 'Check-in',
  IN_PROGRESS: 'Em Atendimento',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
  NO_SHOW: 'Faltou',
  RESCHEDULED: 'Reagendado',
}

export function AppointmentStatusChart({ data }: AppointmentStatusChartProps) {
  const chartData = Object.entries(data).map(([status, value]) => ({
    name: STATUS_LABELS[status] || status,
    value,
    status,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição por Status</CardTitle>
        <CardDescription>Agendamentos por status</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[entry.status as keyof typeof COLORS] || '#999999'}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
