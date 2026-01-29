'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { User, LoginDTO, AuthResponse } from '@medgo/shared-types'
import { api } from '@/lib/api'

interface AuthContextData {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginDTO) => Promise<void>
  logout: () => void
  updateUser: (updatedUser: User) => void
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadStoredUser = () => {
      const storedUser = localStorage.getItem('user')
      const token = localStorage.getItem('token')

      if (storedUser && token) {
        setUser(JSON.parse(storedUser))
        // Sync cookie with localStorage token
        document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`
      }
      setIsLoading(false)
    }

    loadStoredUser()
  }, [])

  const login = async (credentials: LoginDTO) => {
    try {
      const response = await api.post<AuthResponse>('/auth/login', credentials)
      const { user, token, refreshToken } = response.data

      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('token', token)
      localStorage.setItem('refreshToken', refreshToken)

      // Set cookie for middleware authentication
      document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}` // 7 days

      setUser(user)
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
  }

  const logout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    // Remove cookie
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
