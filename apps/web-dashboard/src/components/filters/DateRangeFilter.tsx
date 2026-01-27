'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from 'lucide-react'
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns'

interface DateRangeFilterProps {
  onApply: (startDate: string, endDate: string) => void
}

export function DateRangeFilter({ onApply }: DateRangeFilterProps) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const handleQuickSelect = (days: number) => {
    const end = new Date()
    const start = subDays(end, days)

    setStartDate(format(start, 'yyyy-MM-dd'))
    setEndDate(format(end, 'yyyy-MM-dd'))

    onApply(start.toISOString(), end.toISOString())
  }

  const handleMonthSelect = (monthsAgo: number) => {
    const date = subMonths(new Date(), monthsAgo)
    const start = startOfMonth(date)
    const end = endOfMonth(date)

    setStartDate(format(start, 'yyyy-MM-dd'))
    setEndDate(format(end, 'yyyy-MM-dd'))

    onApply(start.toISOString(), end.toISOString())
  }

  const handleCustomApply = () => {
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)

      if (start > end) {
        alert('Data inicial não pode ser maior que data final')
        return
      }

      onApply(start.toISOString(), end.toISOString())
    }
  }

  const handleClear = () => {
    setStartDate('')
    setEndDate('')
    onApply('', '')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Filtros de Período
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Select Buttons */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Seleção Rápida</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickSelect(7)}
            >
              Últimos 7 dias
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickSelect(15)}
            >
              Últimos 15 dias
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickSelect(30)}
            >
              Últimos 30 dias
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickSelect(90)}
            >
              Últimos 90 dias
            </Button>
          </div>
        </div>

        {/* Month Select */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Por Mês</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleMonthSelect(0)}
            >
              Mês Atual
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleMonthSelect(1)}
            >
              Mês Passado
            </Button>
          </div>
        </div>

        {/* Custom Date Range */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Período Customizado</Label>
          <div className="grid gap-2">
            <div>
              <Label htmlFor="startDate" className="text-xs">
                Data Inicial
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate" className="text-xs">
                Data Final
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={handleCustomApply}
                disabled={!startDate || !endDate}
              >
                Aplicar
              </Button>
              <Button size="sm" variant="outline" onClick={handleClear}>
                Limpar
              </Button>
            </div>
          </div>
        </div>

        {/* Current Selection Display */}
        {(startDate || endDate) && (
          <div className="text-xs text-muted-foreground border-t pt-3">
            <p className="font-medium mb-1">Período Selecionado:</p>
            {startDate && (
              <p>
                Início:{' '}
                {format(new Date(startDate), "dd/MM/yyyy")}
              </p>
            )}
            {endDate && (
              <p>
                Fim:{' '}
                {format(new Date(endDate), "dd/MM/yyyy")}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
