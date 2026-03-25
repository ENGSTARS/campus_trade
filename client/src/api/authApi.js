import { axiosClient } from './axiosClient'

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
    const normalizedPayload = {
      email: payload.email,
      password: payload.password,
      confirm_password: payload.confirmPassword,
    }

    if (payload.fullName?.trim()) normalizedPayload.full_name = payload.fullName.trim()
    if (payload.campus?.trim()) normalizedPayload.campus = payload.campus.trim()
    if (payload.bio?.trim()) normalizedPayload.bio = payload.bio.trim()
    if (payload.contact?.trim()) normalizedPayload.contact = payload.contact.trim()

    const response = await axiosClient.post('/register/', normalizedPayload)
    return response?.data ?? response
  },
  async login(payload) {
    const response = await axiosClient.post('/auth/login/', payload)
    const data = response?.data ?? response
    saveTokens(data)
    saveSession(data.user)
    return data
  },
  getCurrentUser() {
    if (!hasStoredAuth()) {
      return Promise.resolve({ user: null })
    }
    return axiosClient
      .get('/me/')
      .then((response) => response?.data ?? response)
      .catch((error) => {
        const sessionUser = getSession()
        if (sessionUser && !error?.response) {
          return { user: sessionUser }
        }
        throw error
      })
  },
  async logout() {
    clearSession()
    return { success: true }
  },
}
