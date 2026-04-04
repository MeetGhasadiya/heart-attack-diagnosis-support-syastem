import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!code.trim()) {
      setError('Please enter the confirmation code')
      return
    }

    setLoading(true)

    try {
      const response = await confirmSignup(email, code.trim())
      setSuccess('✓ Email confirmed successfully! Redirecting to sign in...')
      setLoading(false)

      setTimeout(() => {
        navigate('/login')
      }, 1200)
    } catch (error) {
      setError(error.response?.data?.error || 'Confirmation failed')
      setLoading(false)
    }
  }

  if (!email) {
    return (
      <div className="confirm-page">
        <div className="confirm-card">
          <div className="confirm-error-box">
            ⚠ No email found. Return to registration.
          </div>
          <Link to="/register" className="confirm-link">
            Back to Register
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="confirm-page">
      <div className="confirm-bg">
        <div className="bg-glow" />
        <div className="bg-grid" />
      </div>

      <div className="confirm-card">
        <div className="confirm-logo">
          <span className="logo-heart">♥</span>
          <span className="logo-name">CardioAI</span>
        </div>

        <div className="confirm-headline">Confirm your email</div>
        <p className="confirm-sub">
          We sent a confirmation code to <strong>{email}</strong>. Check your email (including spam folder) and enter the code below.
        </p>

        <form className="confirm-form" onSubmit={handleSubmit}>
          <div className="confirm-field">
            <label>Confirmation Code</label>
            <input
              type="text"
              placeholder="Enter 6-digit code from email"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength="6"
              required
              autoFocus
            />
          </div>

          {error && <div className="confirm-error">⚠ {error}</div>}
          {success && <div className="confirm-success">{success}</div>}

          <button type="submit" className="confirm-btn" disabled={loading}>
            {loading ? <><span className="spinner" /> Verifying…</> : 'Confirm Email →'}
          </button>
        </form>

        <div className="confirm-info">
          📧 Didn't receive the code? Check your spam folder or <Link to="/register">register again</Link>
        </div>

        <div className="confirm-footer">
          Already confirmed? <Link to="/login">Sign in here</Link>
        </div>
      </div>
    </div>
  )
}
