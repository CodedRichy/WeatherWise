import axios from 'axios'

// Token store lives here — AuthContext.jsx imports setAccessToken to update it
let _accessToken = null

export const getAccessToken = () => _accessToken
export const setAccessToken = (token) => { _accessToken = token }

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  withCredentials: false,
})

// Request interceptor: attach access token to every request
client.interceptors.request.use(config => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor: on 401, try refresh once then retry original request
let isRefreshing = false
let refreshQueue = []

client.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true

      if (isRefreshing) {
        // Queue the request until the in-flight refresh resolves
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject })
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`
          return client(original)
        })
      }

      isRefreshing = true
      try {
        const refreshToken = localStorage.getItem('ww-refresh')
        if (!refreshToken) throw new Error('No refresh token stored')

        const res = await axios.post(
          (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/auth/refresh',
          { refreshToken }
        )
        const { accessToken } = res.data
        setAccessToken(accessToken)

        // Flush the queue with the new token
        refreshQueue.forEach(p => p.resolve(accessToken))
        refreshQueue = []

        original.headers.Authorization = `Bearer ${accessToken}`
        return client(original)
      } catch (e) {
        refreshQueue.forEach(p => p.reject(e))
        refreshQueue = []
        localStorage.removeItem('ww-refresh')
        setAccessToken(null)
        window.location.href = '/'
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(err)
  }
)

export default client
