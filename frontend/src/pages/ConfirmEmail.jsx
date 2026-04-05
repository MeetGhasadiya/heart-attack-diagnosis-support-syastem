import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, LoaderCircle, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import { confirmSignup } from '../utils/api'
import './ConfirmEmail.css'

export default function ConfirmEmail() {
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email || ''

  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [values, setValues] = useState(['', '', '', '', '', ''])

  useEffect(() => {
    if (code.length === 6) {
      setValues(code.split(''))
    }
  }, [code])

  const handleBoxChange = (index, nextValue) => {
    const sanitized = nextValue.replace(/\D/g, '').slice(0, 1)
    const next = [...values]
    next[index] = sanitized
    setValues(next)
    setCode(next.join(''))

    if (sanitized && index < 5) {
      const input = document.getElementById(`otp-${index + 1}`)
      input?.focus()
    }
  }

  const codeValue = useMemo(() => values.join(''), [values])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (codeValue.length !== 6) {
      setError('Please enter the confirmation code')
      return
    }

    setLoading(true)

    try {
      await confirmSignup(email, codeValue.trim())
      const message = 'Email confirmed successfully. Redirecting to sign in...'
      setSuccess(message)
      toast.success('Email confirmed successfully')
      setLoading(false)

      setTimeout(() => {
        navigate('/login')
      }, 1200)
    } catch (error) {
      const message = error.response?.data?.error || 'Confirmation failed'
      setError(message)
      toast.error(message)
      setLoading(false)
    }
  }

  if (!email) {
    return (
      <div className="auth-page">
        <div className="auth-card glass-card">
          <div className="form-alert error">No email found. Return to registration.</div>
          <Link to="/register" className="primary-btn inline-btn">Back to register</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-orb auth-orb-one" />
      <div className="auth-orb auth-orb-two" />
      <motion.div className="auth-card glass-card" initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.45 }}>
        <div className="auth-brand">
          <div className="auth-brand-mark"><Mail size={18} /></div>
          <div>
            <div className="auth-brand-name">Confirm your email</div>
            <div className="auth-brand-sub">Verify the code sent to your inbox</div>
          </div>
        </div>

        <p className="auth-sub">We sent a confirmation code to <strong>{email}</strong>. Check your inbox and enter the code below.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="otp-grid">
            {values.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                className="otp-box"
                type="text"
                inputMode="numeric"
                maxLength="1"
                value={digit}
                onChange={(e) => handleBoxChange(index, e.target.value)}
                autoFocus={index === 0}
              />
            ))}
          </div>

          {error && <div className="form-alert error">{error}</div>}
          {success && <motion.div className="form-alert success" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}><CheckCircle2 size={16} /> {success}</motion.div>}

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? <><LoaderCircle size={18} className="spin" /> Verifying</> : 'Confirm email'}
          </button>
        </form>

        <div className="auth-links-row center">
          <span>Didn't receive the code?</span>
          <Link to="/register">Register again</Link>
        </div>
      </motion.div>
    </div>
  )
}
