'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { LogOut, User, Menu } from 'lucide-react'

interface HeaderProps {
  onMenuToggle?: () => void
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { user, logout } = useAuth()

  return (
    <header className="fixed left-0 right-0 top-0 z-30 h-16 border-b bg-background lg:left-64">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          {/* Botão hamburger - mobile only */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden rounded-md p-2 hover:bg-accent"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-base lg:text-lg font-semibold truncate">
            Bem-vindo, {user?.name || 'Usuário'}
          </h1>
        </div>

        <div className="flex items-center gap-2 lg:gap-4">
          <div className="hidden sm:flex items-center gap-2 text-sm">
            <User className="h-4 w-4" />
            <span className="hidden md:inline">{user?.email}</span>
            <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
              {user?.role}
            </span>
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
