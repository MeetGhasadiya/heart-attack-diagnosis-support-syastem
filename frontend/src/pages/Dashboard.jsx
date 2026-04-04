import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import './Dashboard.css'

const stats = [
  { label: 'Total Analyses', value: '—', icon: '◈', color: 'var(--accent)' },
  { label: 'High Risk Flagged', value: '—', icon: '⚠', color: 'var(--red)' },
  { label: 'Low Risk Cleared', value: '—', icon: '✓', color: 'var(--green)' },
  { label: 'Last Scan', value: 'Never', icon: '◷', color: 'var(--yellow)' },
]

const features = [
  { title: 'ML Prediction', desc: 'Random Forest model trained on UCI Heart Disease data', icon: '🧠' },
  { title: 'Risk Engine', desc: 'Medical rule-based advice for High / Medium / Low risk', icon: '⚕️' },
  { title: 'Secure Auth', desc: 'AWS Cognito JWT-based login & registration', icon: '🔐' },
  { title: 'Cloud Storage', desc: 'Prediction history stored in DynamoDB', icon: '☁️' },
]

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Welcome back, {user?.name} 👋</h1>
        <p>AI-powered heart attack risk assessment system</p>
      </div>

      {/* Hero CTA */}
      <div className="hero-card">
        <div className="hero-content">
          <div className="hero-label">READY FOR ANALYSIS</div>
          <h2>Run a New Cardiac Risk Assessment</h2>
          <p>Enter 13 clinical parameters and get instant AI-powered risk prediction with personalised medical advice.</p>
          <button className="hero-btn" onClick={() => navigate('/predict')}>
            Start Analysis →
          </button>
        </div>
        <div className="hero-visual">
          <div className="ecg-line"></div>
          <div className="heart-glow">♥</div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ color: s.color }}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Features */}
      <div className="section-title">System Capabilities</div>
      <div className="features-grid">
        {features.map(f => (
          <div key={f.title} className="feature-card">
            <div className="feature-icon">{f.icon}</div>
            <div className="feature-title">{f.title}</div>
            <div className="feature-desc">{f.desc}</div>
          </div>
        ))}
      </div>

      {/* Architecture reminder */}
      <div className="arch-card">
        <div className="arch-title">System Architecture</div>
        <div className="arch-flow">
          {['User', 'S3', 'Cognito', 'API Gateway', 'EC2 + Flask', 'DynamoDB'].map((step, i, arr) => (
            <React.Fragment key={step}>
              <div className="arch-step">{step}</div>
              {i < arr.length - 1 && <div className="arch-arrow">→</div>}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}
