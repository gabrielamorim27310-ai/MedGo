'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Route } from 'next'
import { useAuth } from '@/contexts/AuthContext'
import {
  Activity,
  LayoutDashboard,
  Users,
  Building2,
  Clock,
  Calendar,
  Shield,
  Bell,
  Settings,
  BarChart3,
  TrendingUp,
  CreditCard,
  MapPin,
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
]

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  const userRole = user?.role as UserRole | undefined

  // Filtrar itens de menu baseado no role do usuário
  const filteredMenuItems = menuItems.filter((item) => {
    // Se não tem roles definidas, todos podem ver
    if (!item.roles) return true
    // Se o usuário não está logado, não mostra itens com restrição
    if (!userRole) return false
    // Verifica se o role do usuário está na lista permitida
    return item.roles.includes(userRole)
  })

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Activity className="h-6 w-6 text-primary" />
        <span className="text-xl font-bold">MedGo</span>
      </div>

      <nav className="space-y-1 p-4">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.title}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
