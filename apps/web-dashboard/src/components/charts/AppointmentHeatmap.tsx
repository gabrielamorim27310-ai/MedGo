'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface HeatmapData {
  day: string
  hour: number
  value: number
}

interface AppointmentHeatmapProps {
  data?: HeatmapData[]
}

// Dados mock para demonstração
const mockData: HeatmapData[] = [
  // Segunda-feira
  { day: 'Seg', hour: 8, value: 12 },
  { day: 'Seg', hour: 9, value: 18 },
  { day: 'Seg', hour: 10, value: 22 },
  { day: 'Seg', hour: 11, value: 20 },
  { day: 'Seg', hour: 14, value: 15 },
  { day: 'Seg', hour: 15, value: 19 },
  { day: 'Seg', hour: 16, value: 17 },
  { day: 'Seg', hour: 17, value: 10 },
  // Terça-feira
  { day: 'Ter', hour: 8, value: 14 },
  { day: 'Ter', hour: 9, value: 20 },
  { day: 'Ter', hour: 10, value: 25 },
  { day: 'Ter', hour: 11, value: 22 },
  { day: 'Ter', hour: 14, value: 18 },
  { day: 'Ter', hour: 15, value: 21 },
  { day: 'Ter', hour: 16, value: 19 },
  { day: 'Ter', hour: 17, value: 12 },
  // Quarta-feira
  { day: 'Qua', hour: 8, value: 16 },
  { day: 'Qua', hour: 9, value: 23 },
  { day: 'Qua', hour: 10, value: 28 },
  { day: 'Qua', hour: 11, value: 25 },
  { day: 'Qua', hour: 14, value: 20 },
  { day: 'Qua', hour: 15, value: 24 },
  { day: 'Qua', hour: 16, value: 22 },
  { day: 'Qua', hour: 17, value: 15 },
  // Quinta-feira
  { day: 'Qui', hour: 8, value: 13 },
  { day: 'Qui', hour: 9, value: 19 },
  { day: 'Qui', hour: 10, value: 24 },
  { day: 'Qui', hour: 11, value: 21 },
  { day: 'Qui', hour: 14, value: 17 },
  { day: 'Qui', hour: 15, value: 20 },
  { day: 'Qui', hour: 16, value: 18 },
  { day: 'Qui', hour: 17, value: 11 },
  // Sexta-feira
  { day: 'Sex', hour: 8, value: 15 },
  { day: 'Sex', hour: 9, value: 21 },
  { day: 'Sex', hour: 10, value: 26 },
  { day: 'Sex', hour: 11, value: 23 },
  { day: 'Sex', hour: 14, value: 19 },
  { day: 'Sex', hour: 15, value: 22 },
  { day: 'Sex', hour: 16, value: 20 },
  { day: 'Sex', hour: 17, value: 13 },
]

export function AppointmentHeatmap({ data = mockData }: AppointmentHeatmapProps) {
  const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex']
  const hours = [8, 9, 10, 11, 14, 15, 16, 17]

  const maxValue = Math.max(...data.map((d) => d.value))

  const getColor = (value: number): string => {
    const intensity = value / maxValue
    if (intensity >= 0.8) return 'bg-blue-600'
    if (intensity >= 0.6) return 'bg-blue-500'
    if (intensity >= 0.4) return 'bg-blue-400'
    if (intensity >= 0.2) return 'bg-blue-300'
    return 'bg-blue-200'
  }

  const getValue = (day: string, hour: number): number => {
    const item = data.find((d) => d.day === day && d.hour === hour)
    return item?.value || 0
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mapa de Calor - Agendamentos por Horário</CardTitle>
        <CardDescription>Visualização dos horários com mais agendamentos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Cabeçalho - Horas */}
            <div className="flex mb-1">
              <div className="w-16"></div>
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="flex-1 text-center text-xs font-medium text-muted-foreground px-1"
                >
                  {hour}h
                </div>
              ))}
            </div>

            {/* Corpo - Dias e Valores */}
            {days.map((day) => (
              <div key={day} className="flex mb-1">
                <div className="w-16 flex items-center text-xs font-medium text-muted-foreground">
                  {day}
                </div>
                {hours.map((hour) => {
                  const value = getValue(day, hour)
                  return (
                    <div key={`${day}-${hour}`} className="flex-1 px-1">
                      <div
                        className={`h-12 rounded flex items-center justify-center text-xs font-medium text-white ${getColor(
                          value
                        )} hover:opacity-80 transition-opacity cursor-pointer`}
                        title={`${day} ${hour}h: ${value} agendamentos`}
                      >
                        {value > 0 ? value : ''}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legenda */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <span className="text-xs text-muted-foreground">Menos</span>
          <div className="flex gap-1">
            <div className="w-6 h-4 rounded bg-blue-200"></div>
            <div className="w-6 h-4 rounded bg-blue-300"></div>
            <div className="w-6 h-4 rounded bg-blue-400"></div>
            <div className="w-6 h-4 rounded bg-blue-500"></div>
            <div className="w-6 h-4 rounded bg-blue-600"></div>
          </div>
          <span className="text-xs text-muted-foreground">Mais</span>
        </div>

        {/* Insights */}
        <div className="mt-4 text-sm text-muted-foreground">
          <p className="font-medium mb-1">Insights:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Horários de pico: 10h-11h (manhã) e 15h-16h (tarde)</li>
            <li>Dia mais movimentado: Quarta-feira</li>
            <li>Considere ajustar a equipe nos horários de pico</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
