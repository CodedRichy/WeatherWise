import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Show, useAuth } from '@clerk/react'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import Navbar from './components/ui/Navbar.jsx'

const Home = lazy(() => import('./pages/Home.jsx'))
const Compare = lazy(() => import('./pages/Compare.jsx'))
const Activities = lazy(() => import('./pages/Activities.jsx'))
const History = lazy(() => import('./pages/History.jsx'))
const Profile = lazy(() => import('./pages/Profile.jsx'))
const NotFound = lazy(() => import('./pages/NotFound.jsx'))

function Spinner() {
  return (
    <div className="spinner-container">
      <div className="spinner" aria-label="Loading" />
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { isSignedIn, isLoaded } = useAuth()
  if (!isLoaded) return <Spinner />
  if (!isSignedIn) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/history" element={<History />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppRoutes />
    </ThemeProvider>
  )
}
