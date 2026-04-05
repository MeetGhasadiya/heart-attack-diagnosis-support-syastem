import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, ShieldCheck, LoaderCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
import InputField from '../components/InputField'
import './Login.css'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const emailError = useMemo(() => {
    if (!email) return ''
    return /\S+@\S+\.\S+/.test(email) ? '' : 'Enter a valid email address.'
  }, [email])

  const passwordError = useMemo(() => {
    if (!password) return ''
    return password.length >= 6 ? '' : 'Password must be at least 6 characters.'
  }, [password])

  const canSubmit = Boolean(email && password && !emailError && !passwordError && !loading)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (emailError || passwordError) {
      setError(emailError || passwordError)
      return
    }

    setLoading(true)
    
    const result = await login(email, password)
    if (result.ok) {
      toast.success('Signed in successfully')
      navigate('/')
    } else {
      setError(result.error || 'Login failed')
      toast.error(result.error || 'Login failed')
    }
    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-orb auth-orb-one" />
      <div className="auth-orb auth-orb-two" />
      <motion.div className="auth-card glass-card" initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.45 }}>
        <div className="auth-brand">
          <div className="auth-brand-mark"><ShieldCheck size={18} /></div>
          <div>
            <div className="auth-brand-name">AI Heart Attack</div>
            <div className="auth-brand-sub">Diagnosis Support System</div>
          </div>
        </div>

        <div className="auth-headline">Welcome back</div>
        <p className="auth-sub">Sign in to access secure AI-powered cardiac risk assessment.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <InputField
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="doctor@hospital.com"
            error={emailError}
            icon={Mail}
            autoFocus
            required
          />

          <InputField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            error={passwordError}
            icon={Lock}
            required
            rightSlot={(
              <button type="button" className="icon-toggle" onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            )}
          />

          {error && <div className="form-alert error">{error}</div>}

          <button type="submit" className="primary-btn" disabled={!canSubmit}>
            {loading ? <><LoaderCircle size={18} className="spin" /> Signing in</> : 'Sign in'}
          </button>

          <div className="auth-links-row">
            <Link to="/forgot-password">Forgot password?</Link>
            <Link to="/register">Create account</Link>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
