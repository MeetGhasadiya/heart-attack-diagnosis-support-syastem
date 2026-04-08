import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Predict from './pages/Predict'
import History from './pages/History'
import ResultDetails from './pages/ResultDetails'
import Login from './pages/Login'
import Register from './pages/Register'
import ConfirmEmail from './pages/ConfirmEmail'
import ForgotPassword from './pages/ForgotPassword'
import { AuthProvider, useAuth } from './hooks/useAuth'

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

function ScrollToTop() {
  const location = useLocation()

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname])

  return null
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="sync">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/register" element={<Register />} />
        <Route path="/confirm-email" element={<ConfirmEmail />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="predict" element={<Predict />} />
          <Route path="history" element={<History />} />
          <Route path="history/:predictionId" element={<ResultDetails />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3600,
            style: {
              borderRadius: '16px',
              padding: '14px 16px',
              background: 'rgba(255, 255, 255, 0.95)',
              color: '#0f172a',
              boxShadow: '0 20px 40px rgba(15, 23, 42, 0.14)',
              border: '1px solid rgba(148, 163, 184, 0.18)',
            },
            success: {
              iconTheme: { primary: '#10B981', secondary: '#ecfdf5' },
            },
            error: {
              iconTheme: { primary: '#EF4444', secondary: '#fef2f2' },
            },
          }}
        />
        <motion.div className="app-shell" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
          <AnimatedRoutes />
        </motion.div>
      </BrowserRouter>
    </AuthProvider>
  )
}
