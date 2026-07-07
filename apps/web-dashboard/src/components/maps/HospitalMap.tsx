'use client'

import { useEffect, useRef, useState } from 'react'
import type { Map as LeafletMap } from 'leaflet'
import { api } from '@/lib/api'

export interface MapHospital {
  id: string
  name: string
  latitude?: number | null
  longitude?: number | null
  street?: string
  number?: string
  neighborhood?: string
  emergency24h?: boolean
  covered?: boolean
}

interface QueueInfo {
  estimatedWaitTime: number
  totalWaiting: number
}

interface HospitalMapProps {
  hospitals: MapHospital[]
  className?: string
  /** Clique no marcador seleciona a unidade (ex.: formulário de check-in) */
  onSelectHospital?: (hospitalId: string) => void
  selectedHospitalId?: string
}

// Centro de São Paulo — usado quando o usuário nega a geolocalização
const FALLBACK_CENTER: [number, number] = [-23.5505, -46.6333]

// Gravidade da fila pela espera estimada (minutos)
function severityColor(wait: number | undefined): string {
  if (wait === undefined) return '#64748B' // sem dados
  if (wait <= 30) return '#2E9E5B' // tranquila
  if (wait <= 90) return '#E9A13B' // moderada
  return '#D9433B' // cheia
}

/**
 * Mapa das unidades (Leaflet + OpenStreetMap — sem chave de API).
 * Marcadores coloridos pela gravidade da fila em tempo real, tooltip com
 * nome + espera estimada, indicador da localização do usuário e zoom
 * com o scroll do mouse.
 */
export function HospitalMap({
  hospitals,
  className,
  onSelectHospital,
  selectedHospitalId,
}: HospitalMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null)
  const [geoDenied, setGeoDenied] = useState(false)
  const [queueInfo, setQueueInfo] = useState<Record<string, QueueInfo>>({})

  // Localização do usuário (uma vez)
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoDenied(true)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPosition([pos.coords.latitude, pos.coords.longitude]),
      () => setGeoDenied(true),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    )
  }, [])

  // Situação das filas: uma única chamada ao /hospitals/nearby, que já
  // agrega espera estimada e total aguardando por unidade
  useEffect(() => {
    const [lat, lng] = userPosition ?? FALLBACK_CENTER
    api
      .get(`/hospitals/nearby?latitude=${lat}&longitude=${lng}&radiusKm=150&limit=100`)
      .then((res) => {
        const info: Record<string, QueueInfo> = {}
        for (const h of res.data?.data ?? []) {
          info[h.id] = {
            estimatedWaitTime: h.estimatedWaitTime ?? 0,
            totalWaiting: h.totalWaiting ?? 0,
          }
        }
        setQueueInfo(info)
      })
      .catch(() => setQueueInfo({}))
  }, [userPosition])

  useEffect(() => {
    const located = hospitals.filter(
      (h) => typeof h.latitude === 'number' && typeof h.longitude === 'number'
    )

    if (!containerRef.current || located.length === 0) return

    let cancelled = false

    const init = async () => {
      // CSS do Leaflet via CDN (uma vez por sessão)
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link')
        link.id = 'leaflet-css'
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }

      const L = (await import('leaflet')).default

      if (cancelled || !containerRef.current) return

      // Recria o mapa a cada mudança relevante
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }

      const map = L.map(containerRef.current, {
        scrollWheelZoom: true,
      })
      mapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      const bounds = L.latLngBounds([])

      located.forEach((h) => {
        const info = queueInfo[h.id]
        const isSelected = h.id === selectedHospitalId
        const color = severityColor(info?.estimatedWaitTime)

        const marker = L.circleMarker([h.latitude!, h.longitude!], {
          radius: isSelected ? 14 : 10,
          color: isSelected ? '#0E7268' : '#ffffff',
          weight: isSelected ? 3 : 2,
          fillColor: color,
          fillOpacity: 0.95,
        }).addTo(map)

        // Nome + espera aparecem ao passar o mouse; no toque, o popup
        // (clique) traz as mesmas informações
        const waitLabel = info ? ` · ~${info.estimatedWaitTime} min` : ''
        marker.bindTooltip(`${h.name}${waitLabel}`, {
          direction: 'top',
          offset: [0, -12],
          className: 'hospital-map-label',
        })

        const address = [h.street, h.number].filter(Boolean).join(', ')
        marker.bindPopup(
          `<strong>${h.name}</strong><br/>` +
            `${address}${h.neighborhood ? ` — ${h.neighborhood}` : ''}<br/>` +
            (info
              ? `⏱ Espera: ~${info.estimatedWaitTime} min · ${info.totalWaiting} na fila<br/>`
              : '') +
            `${h.emergency24h ? '🕐 Emergência 24h<br/>' : ''}` +
            `${h.covered === true ? '✅ Conveniado ao seu plano<br/>' : ''}` +
            (onSelectHospital
              ? `<a href="#" data-select-hospital="${h.id}"><strong>Selecionar esta unidade →</strong></a><br/>`
              : '') +
            `<a href="https://www.google.com/maps/dir/?api=1&destination=${h.latitude},${h.longitude}" target="_blank" rel="noopener">Como chegar →</a>`
        )

        if (onSelectHospital) {
          marker.on('click', () => onSelectHospital(h.id))
        }

        bounds.extend([h.latitude!, h.longitude!])
      })

      // Indicador da localização do usuário
      if (userPosition) {
        L.circle(userPosition, {
          radius: 300,
          color: '#2563EB',
          weight: 1,
          fillColor: '#3B82F6',
          fillOpacity: 0.12,
        }).addTo(map)

        L.circleMarker(userPosition, {
          radius: 8,
          color: '#ffffff',
          weight: 3,
          fillColor: '#2563EB',
          fillOpacity: 1,
        })
          .addTo(map)
          .bindTooltip('Você está aqui', { direction: 'bottom', offset: [0, 10] })

        bounds.extend(userPosition)
      }

      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 })

      // Link "Selecionar esta unidade" dentro do popup
      if (onSelectHospital) {
        map.on('popupopen', (e: any) => {
          const el = e.popup.getElement()?.querySelector('[data-select-hospital]')
          if (el) {
            el.addEventListener('click', (ev: Event) => {
              ev.preventDefault()
              onSelectHospital(el.getAttribute('data-select-hospital')!)
              map.closePopup()
            })
          }
        })
      }
    }

    init()

    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [hospitals, queueInfo, userPosition, selectedHospitalId, onSelectHospital])

  const hasLocated = hospitals.some(
    (h) => typeof h.latitude === 'number' && typeof h.longitude === 'number'
  )

  if (!hasLocated) return null

  return (
    <div className={className}>
      <div className="relative">
        <div
          ref={containerRef}
          className="h-[420px] w-full rounded-2xl glass overflow-hidden z-0"
        />

        {/* Legenda da gravidade das filas */}
        <div className="absolute bottom-3 left-3 z-[500] glass-strong rounded-xl px-3 py-2 text-xs space-y-1">
          <p className="font-semibold">Situação da fila</p>
          <p className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: '#2E9E5B' }} />
            Tranquila (até 30 min)
          </p>
          <p className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: '#E9A13B' }} />
            Moderada (30–90 min)
          </p>
          <p className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: '#D9433B' }} />
            Cheia (mais de 90 min)
          </p>
          {userPosition && (
            <p className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-white" style={{ background: '#2563EB' }} />
              Você está aqui
            </p>
          )}
        </div>

        {geoDenied && !userPosition && (
          <div className="absolute top-3 right-3 z-[500] glass-strong rounded-xl px-3 py-1.5 text-xs text-muted-foreground">
            Ative a localização para ver sua posição no mapa
          </div>
        )}
      </div>
    </div>
  )
}
