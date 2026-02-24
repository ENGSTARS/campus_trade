import axios from 'axios'

const requestTimeoutMs = Number(
  import.meta.env.VITE_API_TIMEOUT_MS ?? (import.meta.env.DEV ? 3500 : 8000),
)

export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  withCredentials: true,
  timeout: Number.isFinite(requestTimeoutMs) && requestTimeoutMs > 0 ? requestTimeoutMs : 3500,
})

axiosClient.interceptors.request.use(
  (config) => {
    const campus = localStorage.getItem('campustrade-campus')
    if (campus) config.headers['X-Campus'] = campus
    return config
  },
  (error) => Promise.reject(error),
)

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      window.dispatchEvent(new CustomEvent('campustrade:unauthorized'))
    }
    return Promise.reject(error)
  },
)
