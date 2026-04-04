import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser } from '../utils/api'
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Password and confirm password do not match.')
      return
    }

    setLoading(true)

    try {
      const response = await registerUser(name, email, password)
      setSuccess('Account created successfully. Check your email for confirmation code.')
      setLoading(false)
      setTimeout(() => {
        navigate('/confirm-email', { state: { email } })
      }, 900)
    } catch (error) {
      setError(error.response?.data?.error || 'Registration failed')
      setLoading(false)
    }
  }

  return (
    <div className="register-page">
      <div className="register-bg">
        <div className="bg-glow" />
        <div className="bg-grid" />
      </div>

      <div className="register-card">
        <div className="register-logo">
          <span className="logo-heart">♥</span>
          <span className="logo-name">CardioAI</span>
        </div>

        <div className="register-headline">Create your account</div>
        <p className="register-sub">Register with your name, email, and password to get started.</p>

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="register-field">
            <label>Name</label>
            <input
              type="text"
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="register-field">
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="register-field">
            <label>Password</label>
            <input
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="register-field">
            <label>Confirm Password</label>
            <input
              type="password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="register-error">⚠ {error}</div>}
          {success && <div className="register-success">✓ {success}</div>}

          <button type="submit" className="register-btn" disabled={loading}>
            {loading ? <><span className="spinner" /> Creating account…</> : 'Create Account →'}
          </button>
        </form>

        <div className="register-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  )
}