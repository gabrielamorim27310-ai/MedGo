'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Route } from 'next'
import { useAuth } from '@/contexts/AuthContext'
import { Logo } from '@/components/branding/Logo'
import {
  LayoutDashboard,
  Users,
  Building2,
  Clock,
  Calendar,
  Shield,
  Bell,
  BarChart3,
  TrendingUp,
  CreditCard,
  MapPin,
  Settings,
  X,
  Stethoscope,
} from 'lucide-react'

type UserRole = 'PATIENT' | 'DOCTOR' | 'NURSE' | 'HOSPITAL_ADMIN' | 'SYSTEM_ADMIN' | 'HEALTH_INSURANCE_ADMIN'

interface MenuItem {
  title: string
  href: Route
  icon: typeof LayoutDashboard
  roles?: UserRole[] // Se não definido, todos podem ver
}

// Menu items com controle de acesso por role
const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard' as Route,
    icon: LayoutDashboard,
  },
  {
    title: 'Dashboard Executivo',
    href: '/dashboard/executive' as Route,
    icon: TrendingUp,
    roles: ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN'],
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics' as Route,
    icon: BarChart3,
    roles: ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR'],
  },
  {
    title: 'Filas',
    href: '/dashboard/queues' as Route,
    icon: Clock,
    roles: ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'PATIENT'],
  },
  {
    title: 'Usuários',
    href: '/dashboard/users' as Route,
    icon: Users,
    roles: ['SYSTEM_ADMIN'],
  },
  {
    title: 'Pacientes',
    href: '/dashboard/patients' as Route,
    icon: Users,
    roles: ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE'],
  },
  // Menu do Paciente - Meus Hospitais
  {
    title: 'Meus Hospitais',
    href: '/dashboard/my-hospitals' as Route,
    icon: MapPin,
    roles: ['PATIENT'],
  },
  // Menu Admin - Hospitais
  {
    title: 'Hospitais',
    href: '/dashboard/hospitals' as Route,
    icon: Building2,
    roles: ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN'],
  },
  {
    title: 'Médicos',
    href: '/dashboard/doctors' as Route,
    icon: Stethoscope,
    roles: ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN'],
  },
  {
    title: 'Agendamentos',
    href: '/dashboard/appointments' as Route,
    icon: Calendar,
  },
  // Menu do Paciente - Meu Plano
  {
    title: 'Meu Plano',
    href: '/dashboard/my-health-insurance' as Route,
    icon: CreditCard,
    roles: ['PATIENT'],
  },
  // Menu do Paciente - Dependentes
  {
    title: 'Dependentes',
    href: '/dashboard/dependents' as Route,
    icon: Users,
    roles: ['PATIENT'],
  },
  // Menu Admin - Operadoras
  {
    title: 'Operadoras',
    href: '/dashboard/health-insurance' as Route,
    icon: Shield,
    roles: ['SYSTEM_ADMIN', 'HEALTH_INSURANCE_ADMIN'],
  },
  {
    title: 'Notificações',
    href: '/dashboard/notifications' as Route,
    icon: Bell,
  },
  {
    title: 'Configurações',
    href: '/dashboard/settings' as Route,
    icon: Settings,
  },
]

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()

  const userRole = user?.role as UserRole | undefined

  // Filtrar itens de menu baseado no role do usuário
  const filteredMenuItems = menuItems.filter((item) => {
    if (!item.roles) return true
    if (!userRole) return false
    return item.roles.includes(userRole)
  })

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar: painel de vidro escuro verde-acqua */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen w-64 transition-transform duration-300 ease-in-out',
          'border-r border-white/10 bg-[hsl(186_45%_11%/0.82)] backdrop-blur-2xl backdrop-saturate-150',
          'shadow-[4px_0_24px_rgba(8,30,28,0.25)]',
          'lg:translate-x-0 lg:z-40',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <Logo size={32} withWordmark onDark />
          {/* Botão fechar no mobile */}
          <button
            onClick={onClose}
            className="lg:hidden rounded-lg p-1 text-white/60 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-1.5 p-4 overflow-y-auto h-[calc(100vh-4rem)]">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150',
                  isActive
                    ? // Vidro aceso com aro âmbar
                      'bg-white/[0.12] text-white glow-ring backdrop-blur-md'
                    : 'text-[#B9D6D0]/80 hover:bg-white/[0.08] hover:text-white'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.title}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
