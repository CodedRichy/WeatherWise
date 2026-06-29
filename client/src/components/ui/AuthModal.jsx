import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext.jsx'

const INITIAL_FIELDS = { name: '', email: '', password: '', confirmPassword: '' }

export default function AuthModal() {
  const { login, register } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState('login')
  const [fields, setFields] = useState(INITIAL_FIELDS)
  const [fieldErrors, setFieldErrors] = useState({})
  const [generalError, setGeneralError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Listen for the custom event dispatched by Navbar
  useEffect(() => {
    function handleOpen(e) {
      setMode(e.detail === 'register' || e.detail?.mode === 'register' ? 'register' : 'login')
      setFields(INITIAL_FIELDS)
      setFieldErrors({})
      setGeneralError('')
      setIsOpen(true)
    }
    window.addEventListener('ww:open-auth', handleOpen)
    return () => window.removeEventListener('ww:open-auth', handleOpen)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setFields(INITIAL_FIELDS)
    setFieldErrors({})
    setGeneralError('')
  }, [])

  function switchMode(next) {
    setMode(next)
    setFields(INITIAL_FIELDS)
    setFieldErrors({})
    setGeneralError('')
  }

  function handleChange(e) {
    const { name, value } = e.target
    setFields((f) => ({ ...f, [name]: value }))
    setFieldErrors((fe) => ({ ...fe, [name]: '' }))
  }

  function validate() {
    const errors = {}
    if (mode === 'register' && !fields.name.trim()) {
      errors.name = 'Name is required'
    }
    if (!fields.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(fields.email)) {
      errors.email = 'Enter a valid email'
    }
    if (!fields.password) {
      errors.password = 'Password is required'
    } else if (fields.password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }
    if (mode === 'register') {
      if (!fields.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password'
      } else if (fields.password !== fields.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match'
      }
    }
    return errors
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setGeneralError('')

    const errors = validate()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setSubmitting(true)
    try {
      if (mode === 'login') {
        await login(fields.email, fields.password)
      } else {
        await register(fields.name, fields.email, fields.password)
      }
      close()
    } catch (err) {
      setGeneralError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) close()
      }}
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'login' ? 'Sign in' : 'Create account'}
    >
      <div className="modal">
        <button className="modal-close" onClick={close} aria-label="Close">
          &times;
        </button>

        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 700 }}>
          {mode === 'login' ? 'Sign In' : 'Create Account'}
        </h2>

        <form onSubmit={handleSubmit} noValidate>
          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="auth-name">Name</label>
              <input
                id="auth-name"
                type="text"
                name="name"
                value={fields.name}
                onChange={handleChange}
                placeholder="Your name"
                autoComplete="name"
                disabled={submitting}
              />
              {fieldErrors.name && <p className="form-error">{fieldErrors.name}</p>}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              type="email"
              name="email"
              value={fields.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              disabled={submitting}
            />
            {fieldErrors.email && <p className="form-error">{fieldErrors.email}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              name="password"
              value={fields.password}
              onChange={handleChange}
              placeholder={mode === 'register' ? 'At least 6 characters' : 'Your password'}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              disabled={submitting}
            />
            {fieldErrors.password && <p className="form-error">{fieldErrors.password}</p>}
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="auth-confirm">Confirm Password</label>
              <input
                id="auth-confirm"
                type="password"
                name="confirmPassword"
                value={fields.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat your password"
                autoComplete="new-password"
                disabled={submitting}
              />
              {fieldErrors.confirmPassword && (
                <p className="form-error">{fieldErrors.confirmPassword}</p>
              )}
            </div>
          )}

          {generalError && (
            <p className="form-error" style={{ marginBottom: '0.75rem' }}>
              {generalError}
            </p>
          )}

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    width: 16,
                    height: 16,
                    border: '2px solid rgba(255,255,255,0.4)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 0.7s linear infinite',
                  }}
                />
                {mode === 'login' ? 'Signing in…' : 'Creating account…'}
              </span>
            ) : mode === 'login' ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          {mode === 'login' ? (
            <>
              Don&apos;t have an account?{' '}
              <button
                onClick={() => switchMode('register')}
                style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 'inherit', textDecoration: 'underline', padding: 0 }}
              >
                Register
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                onClick={() => switchMode('login')}
                style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 'inherit', textDecoration: 'underline', padding: 0 }}
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
