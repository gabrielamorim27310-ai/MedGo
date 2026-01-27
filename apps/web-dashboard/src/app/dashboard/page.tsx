'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Building2, Clock, Calendar, Loader2 } from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'
import { api } from '@/lib/api'

interface OverviewData {
  totalPatients: number
  totalHospitals: number
  totalAppointments: number
  activeQueues: number
}

interface TopHospital {
  id: string
  name: string
  city: string
  state: string
  completedAppointments: number
  completedQueueEntries: number
}

export default function DashboardPage() {
  const { getOverviewMetrics, getTopHospitals } = useAnalytics()
  const [overview, setOverview] = useState<OverviewData>({
    totalPatients: 0,
    totalHospitals: 0,
    totalAppointments: 0,
    activeQueues: 0,
  })
  const [topHospitals, setTopHospitals] = useState<TopHospital[]>([])
  const [loading, setLoading] = useState(true)

useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Try analytics service first
        const metrics = await getOverviewMetrics()
        if (metrics) {
          setOverview({
            totalPatients: metrics.totalPatients,
            totalHospitals: metrics.totalHospitals,
            totalAppointments: metrics.totalAppointments,
            activeQueues: metrics.activeQueues,
          })
        } else {
          // Fallback: fetch counts directly from API gateway
          const [patientsRes, hospitalsRes, appointmentsRes, queuesRes] = await Promise.all([
            api.get('/patients?limit=1').catch(() => ({ data: { pagination: { total: 0 } } })),
            api.get('/hospitals?limit=1').catch(() => ({ data: { pagination: { total: 0 } } })),
            api.get('/appointments?limit=1').catch(() => ({ data: { pagination: { total: 0 } } })),
            api.get('/queues?limit=1').catch(() => ({ data: { pagination: { total: 0 } } })),
          ])

          setOverview({
            totalPatients: patientsRes.data?.pagination?.total || 0,
            totalHospitals: hospitalsRes.data?.pagination?.total || 0,
            totalAppointments: appointmentsRes.data?.pagination?.total || 0,
            activeQueues: queuesRes.data?.pagination?.total || 0,
          })
        }

        // Fetch top hospitals
        const topHospitalsData = await getTopHospitals(5)
        if (topHospitalsData) {
          setTopHospitals(topHospitalsData)
        } else {
          // Fallback: fetch hospitals from API gateway
          const hospitalsRes = await api.get('/hospitals?limit=5').catch(() => ({ data: { data: [] } }))
          setTopHospitals(hospitalsRes.data?.data || [])
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Visão geral do sistema MedGo
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Pacientes
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{overview.totalPatients.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Pacientes cadastrados
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Hospitais Ativos
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{overview.totalHospitals.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Hospitais na rede
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Filas Ativas
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{overview.activeQueues.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Filas em andamento
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Agendamentos
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{overview.totalAppointments.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Agendamentos realizados
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Acesso Rápido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <a href="/dashboard/patients" className="flex items-center p-3 rounded-lg hover:bg-muted transition-colors">
                <Users className="h-5 w-5 mr-3 text-blue-500" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Gerenciar Pacientes
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Cadastrar, editar e visualizar pacientes
                  </p>
                </div>
              </a>
              <a href="/dashboard/hospitals" className="flex items-center p-3 rounded-lg hover:bg-muted transition-colors">
                <Building2 className="h-5 w-5 mr-3 text-green-500" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Gerenciar Hospitais
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Administrar hospitais da rede
                  </p>
                </div>
              </a>
              <a href="/dashboard/queues" className="flex items-center p-3 rounded-lg hover:bg-muted transition-colors">
                <Clock className="h-5 w-5 mr-3 text-orange-500" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Filas de Atendimento
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Monitorar filas em tempo real
                  </p>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Top Hospitais</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : topHospitals.length > 0 ? (
              <div className="space-y-4">
                {topHospitals.map((hospital) => (
                  <div key={hospital.id} className="flex items-center">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {hospital.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {hospital.city}, {hospital.state}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum hospital cadastrado
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
