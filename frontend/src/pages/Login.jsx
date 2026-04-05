import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import './Login.css'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    const result = await login(email, password)
    if (result.ok) {
      navigate('/')
    } else {
      setError(result.error || 'Login failed')
    }
    setLoading(false)
  }

  return (
    <div className="login-page">
      {/* Background decoration */}
      <div className="login-bg">
        <div className="bg-glow" />
        <div className="bg-grid" />
      </div>

      <div className="login-card">
        <div className="login-logo">
          <span className="logo-heart">♥</span>
          <span className="logo-name">CardioAI</span>
        </div>

        <div className="login-headline">Cardiac Risk Intelligence</div>
        <p className="login-sub">Sign in to access AI-powered heart attack diagnosis support</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label>Email</label>
            <input
              type="email"
              placeholder="doctor@hospital.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="login-field">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="login-error">⚠ {error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? <><span className="spinner" /> Signing in…</> : 'Sign In →'}
          </button>
        </form>

        <div className="login-note">
          🔐 Production: Replace with <strong>AWS Cognito</strong> authentication
        </div>

        <div className="login-footer">
          <div><Link to="/forgot-password">Forgot password?</Link></div>
          <div>New here? <Link to="/register">Create an account</Link></div>
        </div>
      </div>
    </div>
  )
}
