import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authApi } from '@/api/authApi'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const bootstrapAuth = useCallback(async () => {
    try {
      const data = await authApi.getCurrentUser()
      setUser(data?.user || null)
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    bootstrapAuth()
  }, [bootstrapAuth])

  useEffect(() => {
    const handler = () => setUser(null)
    window.addEventListener('campustrade:unauthorized', handler)
    return () => window.removeEventListener('campustrade:unauthorized', handler)
  }, [])

  const login = async (payload) => {
    const data = await authApi.login(payload)
    setUser(data?.user || null)
    return data
  }

  const register = async (payload) => authApi.register(payload)

  const logout = async () => {
    await authApi.logout()
    setUser(null)
  }

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'admin' || user?.email?.includes('admin'),
      login,
      register,
      logout,
      setUser,
    }),
    [user, isLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
