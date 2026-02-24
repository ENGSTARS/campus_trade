import { axiosClient } from './axiosClient'
import { withFallback } from './fallback'
import { mockProfile } from '@/utils/mockData'

const SESSION_KEY = 'campustrade-session-user'

function saveSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

function getSession() {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

export const authApi = {
  async register(payload) {
    const isAdmin = payload.email?.toLowerCase().includes('admin')
    const data = await withFallback(() => axiosClient.post('/auth/register', payload), {
      user: {
        ...mockProfile,
        fullName: payload.fullName,
        email: payload.email,
        campus: payload.campus,
        role: isAdmin ? 'admin' : 'student',
      },
      message: 'Verification email sent',
    })
    saveSession(data.user)
    return data
  },
  async login(payload) {
    const isAdmin = payload.email?.toLowerCase().includes('admin')
    const data = await withFallback(() => axiosClient.post('/auth/login', payload), {
      user: {
        ...mockProfile,
        email: payload.email,
        role: isAdmin ? 'admin' : 'student',
      },
      message: 'Welcome back',
    })
    saveSession(data.user)
    return data
  },
  getCurrentUser() {
    return withFallback(() => axiosClient.get('/auth/me'), { user: getSession() }, { dedupeKey: 'auth:me' })
  },
  async logout() {
    const data = await withFallback(() => axiosClient.post('/auth/logout'), { success: true })
    clearSession()
    return data
  },
}
