import React, { createContext, useContext, useState, useEffect, useRef } from 'react'

const AuthContext = createContext(null)

// Access token lives in memory only — never in localStorage
let _accessToken = null

export function getAccessToken() {
  return _accessToken
}

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
        _accessToken = data.accessToken
        if (data.refreshToken) {
          localStorage.setItem('ww-refresh', data.refreshToken)
        }
        setUser(data.user)
      })
      .catch(() => {
        // Refresh failed — clear stored token, stay logged out
        localStorage.removeItem('ww-refresh')
        _accessToken = null
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
    _accessToken = data.accessToken
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
    _accessToken = data.accessToken
    if (data.refreshToken) {
      localStorage.setItem('ww-refresh', data.refreshToken)
    }
    setUser(data.user)
  }

  function logout() {
    _accessToken = null
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
