'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  Building2,
  MapPin,
  Phone,
  Clock,
  AlertCircle,
  Search,
  ExternalLink,
  Stethoscope,
} from 'lucide-react'
import { api } from '@/lib/api'
import Link from 'next/link'
import { HospitalMap } from '@/components/maps/HospitalMap'

interface Hospital {
  id: string
  name: string
  type: string
  status: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
  latitude?: number | null
  longitude?: number | null
  phone: string
  email: string
  website?: string
  specialties: string[]
  emergency24h: boolean
  acceptedHealthInsurances: string[]
  covered?: boolean
}

interface PatientHealthInsurance {
  healthInsuranceId: string | null
  healthInsurance: {
    id: string
    name: string
  } | null
}

export default function MyHospitalsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [filteredHospitals, setFilteredHospitals] = useState<Hospital[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [patientInsurance, setPatientInsurance] = useState<PatientHealthInsurance | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasNoInsurance, setHasNoInsurance] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Buscar dados do paciente (plano de saúde)
        let insuranceId: string | null = null
        let insuranceName: string | null = null

        try {
          const patientResponse = await api.get('/patients/me')
          if (patientResponse.data?.healthInsurance) {
            setPatientInsurance({
              healthInsuranceId: patientResponse.data.healthInsuranceId,
              healthInsurance: patientResponse.data.healthInsurance,
            })
            insuranceId = patientResponse.data.healthInsuranceId
            insuranceName = patientResponse.data.healthInsurance?.name
          } else {
            setHasNoInsurance(true)
          }
        } catch (err) {
          setHasNoInsurance(true)
        }

        // Buscar todos os hospitais — plano de saúde não é pré-requisito
        // para ver e usar as unidades; ele apenas destaca os conveniados.
        const hospitalsResponse = await api.get('/hospitals?limit=100')
        const allHospitals: Hospital[] = hospitalsResponse.data.data || []

        const withCoverage = allHospitals.map((hospital) => ({
          ...hospital,
          covered:
            !insuranceId && !insuranceName
              ? undefined
              : hospital.acceptedHealthInsurances?.some(
                  (ins: string) =>
                    ins === insuranceId ||
                    ins === insuranceName ||
                    ins.toLowerCase().includes((insuranceName || '').toLowerCase())
                ) ?? false,
        }))

        // Conveniados primeiro, quando há plano
        withCoverage.sort((a, b) => Number(b.covered ?? 0) - Number(a.covered ?? 0))

        setHospitals(withCoverage)
        setFilteredHospitals(withCoverage)
      } catch (err) {
        setError('Erro ao carregar hospitais')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filtrar por termo de busca
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredHospitals(hospitals)
      return
    }

    const term = searchTerm.toLowerCase()
    const filtered = hospitals.filter(
      (h) =>
        h.name.toLowerCase().includes(term) ||
        h.city.toLowerCase().includes(term) ||
        h.neighborhood.toLowerCase().includes(term) ||
        h.specialties?.some((s) => s.toLowerCase().includes(term))
    )
    setFilteredHospitals(filtered)
  }, [searchTerm, hospitals])

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      PUBLIC: 'Público',
      PRIVATE: 'Privado',
      MIXED: 'Misto',
    }
    return types[type] || type
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      PUBLIC: 'bg-blue-500/10 text-blue-600',
      PRIVATE: 'bg-purple-500/10 text-purple-600',
      MIXED: 'bg-orange-500/10 text-orange-600',
    }
    return colors[type] || 'bg-gray-500/10 text-gray-600'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Meus Hospitais</h2>
        <p className="text-muted-foreground">
          {patientInsurance?.healthInsurance
            ? `Unidades disponíveis — conveniadas ao plano ${patientInsurance.healthInsurance.name} em destaque`
            : 'Unidades disponíveis na rede'}
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md">
          {error}
        </div>
      )}

      {hasNoInsurance && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <div>
                <p className="font-medium">Você ainda não vinculou um plano de saúde (opcional)</p>
                <p className="text-sm text-muted-foreground">
                  Dá para usar qualquer unidade sem plano. Se vincular, destacamos os
                  hospitais conveniados e agilizamos a autorização.{' '}
                  <Link href="/dashboard/my-health-insurance" className="text-primary hover:underline">
                    Vincular plano
                  </Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status do plano */}
      {patientInsurance?.healthInsurance && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Plano: {patientInsurance.healthInsurance.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {filteredHospitals.length} hospital(is) disponível(is)
                  </p>
                </div>
              </div>
              <Link href="/dashboard/my-health-insurance">
                <Button variant="outline" size="sm">
                  Ver plano
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, cidade, bairro ou especialidade..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Mapa das unidades */}
      <HospitalMap hospitals={filteredHospitals} />

      {/* Lista de hospitais */}
      {filteredHospitals.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm
                ? 'Nenhum hospital encontrado para sua busca'
                : 'Nenhum hospital disponível para seu plano'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredHospitals.map((hospital) => (
            <Card key={hospital.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">{hospital.name}</CardTitle>
                  <div className="flex gap-1 shrink-0">
                    {hospital.covered === true && (
                      <Badge variant="success" className="text-xs">Conveniado</Badge>
                    )}
                    <Badge className={getTypeColor(hospital.type)}>
                      {getTypeLabel(hospital.type)}
                    </Badge>
                  </div>
                </div>
                <CardDescription className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {hospital.neighborhood}, {hospital.city} - {hospital.state}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {hospital.street}, {hospital.number}
                    {hospital.complement && ` - ${hospital.complement}`}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{hospital.phone}</span>
                </div>

                {hospital.emergency24h && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-green-500" />
                    <span className="text-green-600 font-medium">Emergência 24h</span>
                  </div>
                )}

                {hospital.specialties && hospital.specialties.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Stethoscope className="h-4 w-4" />
                      <span>Especialidades:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {hospital.specialties.slice(0, 4).map((specialty) => (
                        <Badge key={specialty} variant="secondary" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                      {hospital.specialties.length > 4 && (
                        <Badge variant="secondary" className="text-xs">
                          +{hospital.specialties.length - 4}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {hospital.website && (
                  <a
                    href={hospital.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Visitar site
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
