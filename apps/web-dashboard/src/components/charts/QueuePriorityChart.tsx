'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface QueuePriorityChartProps {
  data: Record<string, number>
}

const PRIORITY_LABELS: Record<string, string> = {
  EMERGENCY: 'Emergência',
  URGENT: 'Urgente',
  SEMI_URGENT: 'Semi-Urgente',
  ROUTINE: 'Rotina',
  LOW_PRIORITY: 'Baixa Prioridade',
}

const PRIORITY_COLORS: Record<string, string> = {
  EMERGENCY: '#DC2626',
  URGENT: '#EA580C',
  SEMI_URGENT: '#F59E0B',
  ROUTINE: '#10B981',
  LOW_PRIORITY: '#3B82F6',
}

export function QueuePriorityChart({ data }: QueuePriorityChartProps) {
  const chartData = Object.entries(data).map(([priority, value]) => ({
    name: PRIORITY_LABELS[priority] || priority,
    value,
    priority,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filas por Prioridade</CardTitle>
        <CardDescription>Distribuição de pacientes por prioridade</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" name="Pacientes">
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={PRIORITY_COLORS[entry.priority as keyof typeof PRIORITY_COLORS] || '#999999'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
