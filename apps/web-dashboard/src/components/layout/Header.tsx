'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LogOut, User, Menu } from 'lucide-react'

interface HeaderProps {
  onMenuToggle?: () => void
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { user, logout } = useAuth()

  return (
    <header className="fixed left-0 right-0 top-0 z-30 h-16 glass-strong border-x-0 border-t-0 lg:left-64">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          {/* Botão hamburger - mobile only */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden rounded-xl p-2 glass"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-base lg:text-lg font-display font-semibold truncate">
            Bem-vindo, {user?.name || 'Usuário'}
          </h1>
        </div>

        <div className="flex items-center gap-2 lg:gap-4">
          <div className="hidden sm:flex items-center gap-2 text-sm">
            <User className="h-4 w-4" />
            <span className="hidden md:inline text-muted-foreground">{user?.email}</span>
            <Badge variant="secondary">{user?.role}</Badge>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
