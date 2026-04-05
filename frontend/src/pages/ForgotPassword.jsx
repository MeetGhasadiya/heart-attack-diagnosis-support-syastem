import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Eye, EyeOff, KeyRound, LoaderCircle, Lock, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import { forgotPasswordRequest, resetPassword } from '../utils/api'
import InputField from '../components/InputField'
import './ForgotPassword.css'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const passwordError = useMemo(() => (!newPassword || newPassword.length >= 6 ? '' : 'Password must be at least 6 characters.'), [newPassword])
  const confirmError = useMemo(() => (!confirmPassword || confirmPassword === newPassword ? '' : 'Passwords do not match.'), [confirmPassword, newPassword])

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await forgotPasswordRequest(email)
      setOtp('')
      setOtpValues(['', '', '', '', '', ''])
      setSuccess(response.message || 'OTP sent successfully')
      toast.success('OTP sent to your email')
      setLoading(false)
      setStep(2)
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to request password reset'
      setError(message)
      toast.error(message)
      setLoading(false)
    }
  }

  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (otp.length !== 6) {
      setError('Please enter the OTP code')
      return
    }

    setStep(3)
  }

  const handleOtpBoxChange = (index, nextValue) => {
    const sanitized = nextValue.replace(/\D/g, '').slice(0, 1)
    const next = [...otpValues]
    next[index] = sanitized
    setOtpValues(next)
    setOtp(next.join(''))

    if (sanitized && index < 5) {
      const input = document.getElementById(`forgot-otp-${index + 1}`)
      input?.focus()
    }
  }

  const handleOtpKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !otpValues[index] && index > 0) {
      const input = document.getElementById(`forgot-otp-${index - 1}`)
      input?.focus()
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (passwordError || confirmError) {
      setError(passwordError || confirmError)
      return
    }

    setLoading(true)

    try {
      await resetPassword(email, otp, newPassword)
      const message = 'Password updated successfully. Redirecting to sign in...'
      setSuccess(message)
      toast.success('Password reset complete')
      setLoading(false)
      setTimeout(() => {
        navigate('/login')
      }, 1000)
    } catch (error) {
      const message = error.response?.data?.error || 'Password reset failed'
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
          <div className="auth-brand-mark"><KeyRound size={18} /></div>
          <div>
            <div className="auth-brand-name">Reset your password</div>
            <div className="auth-brand-sub">Three-step secure recovery flow</div>
          </div>
        </div>

        <div className="stepper">
          {[1, 2, 3].map((item) => <div key={item} className={`stepper-item ${step >= item ? 'active' : ''}`}>{item}</div>)}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.form className="auth-form" onSubmit={handleEmailSubmit} key="step1" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }}>
              <InputField label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" icon={Mail} required autoFocus />
              {error && <div className="form-alert error">{error}</div>}
              <button type="submit" className="primary-btn" disabled={loading}>
                {loading ? <><LoaderCircle size={18} className="spin" /> Sending code</> : 'Send OTP'}
              </button>
            </motion.form>
          )}

          {step === 2 && (
            <motion.form className="auth-form" onSubmit={handleOtpSubmit} key="step2" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }}>
              <div className="otp-grid">
                {otpValues.map((digit, index) => (
                  <input
                    key={index}
                    id={`forgot-otp-${index}`}
                    className="otp-box"
                    type="text"
                    inputMode="numeric"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpBoxChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    autoFocus={index === 0}
                  />
                ))}
              </div>
              <div className="form-hint">Check your email for the OTP code.</div>
              {error && <div className="form-alert error">{error}</div>}
              <div className="auth-actions-row">
                <button type="button" className="secondary-btn" onClick={() => setStep(1)}><ArrowLeft size={16} /> Back</button>
                <button type="submit" className="primary-btn">Verify OTP <ArrowRight size={16} /></button>
              </div>
            </motion.form>
          )}

          {step === 3 && (
            <motion.form className="auth-form" onSubmit={handlePasswordSubmit} key="step3" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }}>
              <InputField label="New password" type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 6 characters" error={passwordError} icon={Lock} required autoFocus rightSlot={(<button type="button" className="icon-toggle" onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>)} />
              <InputField label="Confirm password" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat new password" error={confirmError} icon={Lock} required />
              {error && <div className="form-alert error">{error}</div>}
              {success && <div className="form-alert success">{success}</div>}
              <button type="submit" className="primary-btn" disabled={loading}>
                {loading ? <><LoaderCircle size={18} className="spin" /> Updating</> : 'Update password'}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="auth-links-row center">
          <span>Remembered it?</span>
          <Link to="/login">Back to sign in</Link>
        </div>
      </motion.div>
    </div>
  )
}