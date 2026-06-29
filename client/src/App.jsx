import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import Navbar from './components/ui/Navbar.jsx'
import AuthModal from './components/ui/AuthModal.jsx'

const Home = lazy(() => import('./pages/Home.jsx'))
const Compare = lazy(() => import('./pages/Compare.jsx'))
const Activities = lazy(() => import('./pages/Activities.jsx'))
const Profile = lazy(() => import('./pages/Profile.jsx'))

function Spinner() {
  return (
    <div className="spinner-container">
      <div className="spinner" aria-label="Loading" />
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <Spinner />
  if (!user) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <AuthModal />
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/activities" element={<Activities />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          {/* Catch-all: redirect unknown paths to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppRoutes />
      </ThemeProvider>
    </AuthProvider>
  )
}
