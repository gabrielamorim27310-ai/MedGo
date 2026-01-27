'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Download, FileText, FileSpreadsheet } from 'lucide-react'
import axios from 'axios'

const ANALYTICS_API_URL = process.env.NEXT_PUBLIC_ANALYTICS_URL || 'http://localhost:3004/api'

interface ReportExporterProps {
  hospitalId?: string
  startDate?: string
  endDate?: string
}

export function ReportExporter({ hospitalId, startDate, endDate }: ReportExporterProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const downloadReport = async (reportType: string, format: 'json' | 'csv' = 'json') => {
    setLoading(reportType)

    try {
      const params = new URLSearchParams()
      if (hospitalId) params.append('hospitalId', hospitalId)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (format === 'csv') params.append('format', 'csv')

      const response = await axios.get(
        `${ANALYTICS_API_URL}/reports/${reportType}?${params.toString()}`,
        {
          responseType: 'blob',
        }
      )

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url

      const extension = format === 'csv' ? 'csv' : 'json'
      const filename = `${reportType}-report-${Date.now()}.${extension}`
      link.setAttribute('download', filename)

      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Error downloading report:', error)
      alert('Erro ao baixar relatório')
    } finally {
      setLoading(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exportar Relatórios</CardTitle>
        <CardDescription>Baixe relatórios completos em JSON ou CSV</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Relatório de Agendamentos</span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => downloadReport('appointments', 'json')}
                disabled={loading === 'appointments'}
              >
                <Download className="h-3 w-3 mr-1" />
                JSON
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => downloadReport('appointments', 'csv')}
                disabled={loading === 'appointments'}
              >
                <FileSpreadsheet className="h-3 w-3 mr-1" />
                CSV
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Relatório de Filas</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => downloadReport('queues')}
              disabled={loading === 'queues'}
            >
              <Download className="h-3 w-3 mr-1" />
              JSON
            </Button>
          </div>

          {hospitalId && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Performance do Hospital</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => downloadReport(`hospitals/${hospitalId}`)}
                disabled={loading === `hospitals/${hospitalId}`}
              >
                <Download className="h-3 w-3 mr-1" />
                JSON
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Relatório Completo</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => downloadReport('comprehensive')}
              disabled={loading === 'comprehensive'}
            >
              <Download className="h-3 w-3 mr-1" />
              JSON
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>• JSON: Formato estruturado para análise programática</p>
          <p>• CSV: Formato tabular para Excel/Planilhas</p>
        </div>
      </CardContent>
    </Card>
  )
}
