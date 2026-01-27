'use client'

import {
  RadialBarChart,
  RadialBar,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface PerformanceGaugeChartProps {
  title: string
  value: number
  maxValue?: number
  description?: string
  color?: string
}

export function PerformanceGaugeChart({
  title,
  value,
  maxValue = 100,
  description,
  color = '#8884d8',
}: PerformanceGaugeChartProps) {
  const percentage = (value / maxValue) * 100

  const data = [
    {
      name: title,
      value: percentage,
      fill: getColorByPercentage(percentage),
    },
  ]

  function getColorByPercentage(percent: number): string {
    if (percent >= 80) return '#22c55e' // Verde
    if (percent >= 60) return '#eab308' // Amarelo
    if (percent >= 40) return '#f97316' // Laranja
    return '#ef4444' // Vermelho
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <ResponsiveContainer width="100%" height={200}>
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="80%"
              barSize={10}
              data={data}
              startAngle={180}
              endAngle={0}
            >
              <RadialBar
                background
                dataKey="value"
              />
            </RadialBarChart>
          </ResponsiveContainer>

          <div className="text-center mt-2">
            <p className="text-3xl font-bold">{percentage.toFixed(1)}%</p>
            <p className="text-sm text-muted-foreground">
              {value} de {maxValue}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
