import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, Eye, EyeOff, LoaderCircle, Mail, Lock, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { registerUser } from '../utils/api'
import InputField from '../components/InputField'
import './Register.css'

export default function Register() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const validations = useMemo(() => ({
    name: name.trim().length >= 2 ? '' : 'Enter your full name.',
    email: !email ? '' : /\S+@\S+\.\S+/.test(email) ? '' : 'Enter a valid email address.',
    password: !password ? '' : password.length >= 6 ? '' : 'Password must be at least 6 characters.',
    confirmPassword: !confirmPassword ? '' : confirmPassword === password ? '' : 'Passwords do not match.',
  }), [name, email, password, confirmPassword])

  const passwordStrength = useMemo(() => {
    const score = [password.length >= 6, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length
    if (score <= 1) return { label: 'Weak', width: '25%', color: '#EF4444' }
    if (score === 2 || score === 3) return { label: 'Medium', width: '60%', color: '#F59E0B' }
    return { label: 'Strong', width: '100%', color: '#10B981' }
  }, [password])

  const canSubmit = Boolean(name && email && password && confirmPassword && !Object.values(validations).some(Boolean) && !loading)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (Object.values(validations).some(Boolean)) {
      setError(Object.values(validations).find(Boolean) || 'Please fix the highlighted errors.')
      return
    }

    setLoading(true)

    try {
      await registerUser(name.trim(), email.trim(), password)
      const message = 'Account created successfully. Check your email for the verification code.'
      setSuccess(message)
      toast.success(message)
      setLoading(false)
      setTimeout(() => {
        navigate('/confirm-email', { state: { email } })
      }, 900)
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed'
      setError(message)
      toast.error(message)
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-orb auth-orb-one" />
      <div className="auth-orb auth-orb-two" />
      <motion.div className="auth-card glass-card wide" initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.45 }}>
        <div className="auth-brand">
          <div className="auth-brand-mark"><User size={18} /></div>
          <div>
            <div className="auth-brand-name">Create your account</div>
            <div className="auth-brand-sub">Secure access for clinicians and care teams</div>
          </div>
        </div>

        <p className="auth-sub">Register with your name, email, and password to get started.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <InputField label="Full name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" error={validations.name} icon={User} autoFocus required />
          <InputField label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" error={validations.email} icon={Mail} required />
          <InputField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            error={validations.password}
            icon={Lock}
            required
            rightSlot={(
              <button type="button" className="icon-toggle" onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            )}
          />

          <div className="password-meter">
            <div className="password-meter-bar" style={{ width: passwordStrength.width, background: passwordStrength.color }} />
          </div>
          <div className="password-meter-label">Password strength: {passwordStrength.label}</div>

          <InputField
            label="Confirm password"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat your password"
            error={validations.confirmPassword}
            icon={Check}
            required
          />

          {error && <div className="form-alert error">{error}</div>}
          {success && <motion.div className="form-alert success" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>{success}</motion.div>}

          <button type="submit" className="primary-btn" disabled={!canSubmit}>
            {loading ? <><LoaderCircle size={18} className="spin" /> Creating account</> : 'Create account'}
          </button>
        </form>

        <div className="auth-links-row center">
          <span>Already have an account?</span>
          <Link to="/login">Sign in</Link>
        </div>
      </motion.div>
    </div>
  )
}