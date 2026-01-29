'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Settings, User, Lock, Loader2, CheckCircle } from 'lucide-react'

const profileSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone deve ter no mínimo 10 dígitos'),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string().min(6, 'Nova senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string().min(6, 'Confirmação é obrigatória'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
})

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

const roleLabels: Record<string, string> = {
  PATIENT: 'Paciente',
  DOCTOR: 'Médico',
  NURSE: 'Enfermeiro(a)',
  RECEPTIONIST: 'Recepcionista',
  HOSPITAL_ADMIN: 'Administrador Hospitalar',
  SYSTEM_ADMIN: 'Administrador do Sistema',
  HEALTH_INSURANCE_ADMIN: 'Administrador de Plano de Saúde',
}

const statusLabels: Record<string, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  SUSPENDED: 'Suspenso',
}

export default function SettingsPage() {
  const { user, updateUser } = useAuth()
  const [profileSaving, setProfileSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  })

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  useEffect(() => {
    if (user) {
      resetProfile({
        name: user.name,
        email: user.email,
        phone: user.phone,
      })
    }
  }, [user, resetProfile])

  const onProfileSubmit = async (data: ProfileForm) => {
    if (!user) return
    setProfileSaving(true)
    setProfileError(null)
    setProfileSuccess(false)

    try {
      const response = await api.put(`/users/${user.id}`, data)
      updateUser(response.data)
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch (err: any) {
      setProfileError(err.response?.data?.message || 'Erro ao atualizar perfil')
    } finally {
      setProfileSaving(false)
    }
  }

  const onPasswordSubmit = async (data: PasswordForm) => {
    if (!user) return
    setPasswordSaving(true)
    setPasswordError(null)
    setPasswordSuccess(false)

    try {
      await api.put(`/users/${user.id}/password`, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
      setPasswordSuccess(true)
      resetPassword()
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Erro ao alterar senha')
    } finally {
      setPasswordSaving(false)
    }
  }

  const formatCPF = (cpf: string) => {
    if (!cpf || cpf.length !== 11) return cpf
    return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Configurações</h2>
        <p className="text-muted-foreground">
          Gerencie seu perfil e preferências
        </p>
      </div>

      {/* Informações da Conta */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Informações da Conta</CardTitle>
          </div>
          <CardDescription>Dados da sua conta (somente leitura)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">CPF</p>
              <p className="font-medium">{user?.cpf ? formatCPF(user.cpf) : '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Tipo de Usuário</p>
              <Badge variant="outline">{roleLabels[user?.role || ''] || user?.role}</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={user?.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {statusLabels[user?.status || ''] || user?.status}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Membro desde</p>
              <p className="font-medium">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('pt-BR')
                  : '-'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editar Perfil */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Editar Perfil</CardTitle>
          </div>
          <CardDescription>Atualize suas informações pessoais</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  {...registerProfile('name')}
                  disabled={profileSaving}
                />
                {profileErrors.name && (
                  <p className="text-sm text-destructive">{profileErrors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...registerProfile('email')}
                  disabled={profileSaving}
                />
                {profileErrors.email && (
                  <p className="text-sm text-destructive">{profileErrors.email.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  {...registerProfile('phone')}
                  disabled={profileSaving}
                />
                {profileErrors.phone && (
                  <p className="text-sm text-destructive">{profileErrors.phone.message}</p>
                )}
              </div>
            </div>

            {profileError && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {profileError}
              </div>
            )}

            {profileSuccess && (
              <div className="p-3 rounded-md bg-green-50 text-green-700 text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Perfil atualizado com sucesso!
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={profileSaving}>
                {profileSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Alterar Senha */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Alterar Senha</CardTitle>
          </div>
          <CardDescription>Atualize sua senha de acesso</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Senha Atual</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="••••••••"
                  {...registerPassword('currentPassword')}
                  disabled={passwordSaving}
                />
                {passwordErrors.currentPassword && (
                  <p className="text-sm text-destructive">{passwordErrors.currentPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  {...registerPassword('newPassword')}
                  disabled={passwordSaving}
                />
                {passwordErrors.newPassword && (
                  <p className="text-sm text-destructive">{passwordErrors.newPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  {...registerPassword('confirmPassword')}
                  disabled={passwordSaving}
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-sm text-destructive">{passwordErrors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            {passwordError && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 rounded-md bg-green-50 text-green-700 text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Senha alterada com sucesso!
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit" variant="outline" disabled={passwordSaving}>
                {passwordSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Alterar Senha
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
