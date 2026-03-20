import { axiosClient } from './axiosClient'
import { withFallback } from './fallback'
import { mockProfile } from '@/utils/mockData'

const SESSION_KEY = 'campustrade-session-user'
const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

function saveSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

function saveTokens(data) {
  if (data?.access) localStorage.setItem(ACCESS_TOKEN_KEY, data.access)
  if (data?.refresh) localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh)
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
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

function hasStoredAuth() {
  return Boolean(localStorage.getItem(ACCESS_TOKEN_KEY) || getSession())
}

export const authApi = {
  async register(payload) {
    return withFallback(
      () => axiosClient.post('/auth/register/', payload),
      {
        user: {
          ...mockProfile,
          fullName: payload.fullName,
          email: payload.email,
          campus: payload.campus,
          role: 'student',
        },
        message: 'Registration successful. You can now log in.',
      },
    )
  },
  async login(payload) {
    const isAdmin = payload.email?.toLowerCase().includes('admin')
    const data = await withFallback(() => axiosClient.post('/auth/login/', payload), {
      user: {
        ...mockProfile,
        email: payload.email,
        role: isAdmin ? 'admin' : 'student',
      },
      message: 'Welcome back',
    })
    saveTokens(data)
    saveSession(data.user)
    return data
  },
  getCurrentUser() {
    if (!hasStoredAuth()) {
      return Promise.resolve({ user: null })
    }
    return withFallback(() => axiosClient.get('/me/'), { user: getSession() }, { dedupeKey: 'auth:me' })
  },
  async logout() {
    clearSession()
    return { success: true }
  },
}
