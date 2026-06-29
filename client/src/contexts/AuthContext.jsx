import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { setAccessToken, getAccessToken } from '../api/apiClient.js'

const AuthContext = createContext(null)

// Token store lives in apiClient.js — imported above so both modules stay in sync
export { getAccessToken }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  // Prevent double-refresh in StrictMode
  const refreshAttempted = useRef(false)

  // On mount: attempt silent refresh if a refresh token is stored
  useEffect(() => {
    if (refreshAttempted.current) return
    refreshAttempted.current = true

    const storedRefresh = localStorage.getItem('ww-refresh')
    if (!storedRefresh) {
      setIsLoading(false)
      return
    }

    fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: storedRefresh }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Refresh failed')
        return res.json()
      })
      .then((data) => {
        setAccessToken(data.accessToken)
        if (data.refreshToken) {
          localStorage.setItem('ww-refresh', data.refreshToken)
        }
        setUser(data.user)
      })
      .catch(() => {
        // Refresh failed — clear stored token, stay logged out
        localStorage.removeItem('ww-refresh')
        setAccessToken(null)
        setUser(null)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  async function login(email, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Login failed')
    }
    const data = await res.json()
    setAccessToken(data.accessToken)
    if (data.refreshToken) {
      localStorage.setItem('ww-refresh', data.refreshToken)
    }
    setUser(data.user)
  }

  async function register(name, email, password) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Registration failed')
    }
    const data = await res.json()
    setAccessToken(data.accessToken)
    if (data.refreshToken) {
      localStorage.setItem('ww-refresh', data.refreshToken)
    }
    setUser(data.user)
  }

  function logout() {
    setAccessToken(null)
    localStorage.removeItem('ww-refresh')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, register, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
