import axios from 'axios'

const requestTimeoutMs = Number(
  import.meta.env.VITE_API_TIMEOUT_MS ?? (import.meta.env.DEV ? 3500 : 8000),
)

export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api', // ← fixed port
  withCredentials: true,
  timeout: Number.isFinite(requestTimeoutMs) && requestTimeoutMs > 0
    ? requestTimeoutMs
    : 3500,
})

// ── Request interceptor ──────────────────────────────────────────
axiosClient.interceptors.request.use(
  (config) => {
    // Attach JWT access token to every request
    const token = localStorage.getItem('access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`

    // Your existing campus header
    const campus = localStorage.getItem('campustrade-campus')
    if (campus) config.headers['X-Campus'] = campus

    return config
  },
  (error) => Promise.reject(error),
)

// ── Response interceptor ─────────────────────────────────────────
let isRefreshing = false        // prevent multiple simultaneous refresh calls
let failedQueue = []            // queue requests that failed while refreshing

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    error ? prom.reject(error) : prom.resolve(token)
  })
  failedQueue = []
}

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    if (error?.response?.status === 401 && !original._retry) {
      // If already refreshing, queue this request until refresh completes
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`
            return axiosClient(original)
          })
          .catch((err) => Promise.reject(err))
      }

      original._retry = true
      isRefreshing = true

      const refresh = localStorage.getItem('refresh_token')

      if (!refresh) {
        // No refresh token — fire your existing event and bail
        window.dispatchEvent(new CustomEvent('campustrade:unauthorized'))
        return Promise.reject(error)
      }

      try {
        // Call Django refresh endpoint
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/auth/refresh/`,
          { refresh },
        )

        // Store new access token
        localStorage.setItem('access_token', data.access)

        // Update default header for future requests
        axiosClient.defaults.headers.common.Authorization = `Bearer ${data.access}`

        processQueue(null, data.access)

        // Retry the original failed request
        original.headers.Authorization = `Bearer ${data.access}`
        return axiosClient(original)

      } catch (refreshError) {
        processQueue(refreshError, null)

        // Refresh failed — clear tokens and fire your event
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.dispatchEvent(new CustomEvent('campustrade:unauthorized'))

        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)