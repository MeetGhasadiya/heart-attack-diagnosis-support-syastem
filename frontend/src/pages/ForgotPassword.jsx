import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { forgotPasswordRequest, resetPassword } from '../utils/api'
import './ForgotPassword.css'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await forgotPasswordRequest(email)
      setSuccess(response.message)
      setLoading(false)
      setStep(2)
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to request password reset')
      setLoading(false)
    }
  }

  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!otp.trim()) {
      setError('Please enter the OTP code')
      return
    }

    setStep(3)
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Password and confirm password do not match.')
      return
    }

    setLoading(true)

    try {
      await resetPassword(email, otp, newPassword)
      setSuccess('Password updated successfully. Redirecting to sign in...')
      setLoading(false)
      setTimeout(() => {
        navigate('/login')
      }, 1000)
    } catch (error) {
      setError(error.response?.data?.error || 'Password reset failed')
      setLoading(false)
    }
  }

  return (
    <div className="forgot-page">
      <div className="forgot-bg">
        <div className="bg-glow" />
        <div className="bg-grid" />
      </div>

      <div className="forgot-card">
        <div className="forgot-logo">
          <span className="logo-heart">♥</span>
          <span className="logo-name">CardioAI</span>
        </div>

        <div className="forgot-headline">Reset your password</div>
        <p className="forgot-sub">Verify your email, enter the OTP, then create a new password.</p>

        <div className="forgot-steps">
          <span className={step >= 1 ? 'active' : ''}>1 Email</span>
          <span className={step >= 2 ? 'active' : ''}>2 OTP</span>
          <span className={step >= 3 ? 'active' : ''}>3 New Password</span>
        </div>

        {step === 1 && (
          <form className="forgot-form" onSubmit={handleEmailSubmit}>
            <div className="forgot-field">
              <label>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            {error && <div className="forgot-error">⚠ {error}</div>}

            <button type="submit" className="forgot-btn" disabled={loading}>
              {loading ? <><span className="spinner" /> Sending code…</> : 'Send OTP →'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form className="forgot-form" onSubmit={handleOtpSubmit}>
            <div className="forgot-field">
              <label>OTP</label>
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="forgot-note">
              Check your email for the OTP code
            </div>

            {error && <div className="forgot-error">⚠ {error}</div>}

            <div className="forgot-actions">
              <button type="button" className="forgot-secondary" onClick={() => setStep(1)}>
                Back
              </button>
              <button type="submit" className="forgot-btn" disabled={loading}>
                {loading ? <><span className="spinner" /> Verifying…</> : 'Verify OTP →'}
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form className="forgot-form" onSubmit={handlePasswordSubmit}>
            <div className="forgot-field">
              <label>New Password</label>
              <input
                type="password"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="forgot-field">
              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {error && <div className="forgot-error">⚠ {error}</div>}
            {success && <div className="forgot-success">✓ {success}</div>}

            <button type="submit" className="forgot-btn" disabled={loading}>
              {loading ? <><span className="spinner" /> Updating…</> : 'Update Password →'}
            </button>
          </form>
        )}

        <div className="forgot-footer">
          Remembered it? <Link to="/login">Back to sign in</Link>
        </div>
      </div>
    </div>
  )
}