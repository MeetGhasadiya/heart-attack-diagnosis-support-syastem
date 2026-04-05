import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, BarChart3, Clock3, Sparkles, ShieldCheck, Activity, History as HistoryIcon } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import './Dashboard.css'

const stats = [
  { label: 'Total predictions', value: '—', icon: BarChart3, color: '#2563EB' },
  { label: 'High-risk alerts', value: '—', icon: ShieldCheck, color: '#EF4444' },
  { label: 'Low-risk clearances', value: '—', icon: Sparkles, color: '#10B981' },
  { label: 'Last assessment', value: 'Never', icon: Clock3, color: '#F59E0B' },
]

const features = [
  { title: 'ML Prediction', desc: 'Risk scoring from the cardiac model pipeline', icon: Activity },
  { title: 'Clinical guidance', desc: 'Actionable advice with severity-aware color coding', icon: ShieldCheck },
  { title: 'Secure access', desc: 'Token-based auth stored locally for the active session', icon: Sparkles },
  { title: 'History trail', desc: 'Every prediction tracked for review and auditing', icon: HistoryIcon },
]

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="dashboard-page">
      <motion.section className="hero-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="hero-copy">
          <div className="hero-label">Trusted clinical interface</div>
          <h1>Welcome back, {user?.name || 'Clinician'}</h1>
          <p>Run a high-confidence cardiac risk assessment from a polished, audit-friendly workflow designed for medical teams.</p>
          <div className="hero-actions">
            <button className="primary-btn hero-btn" onClick={() => navigate('/predict')}>
              Start prediction <ArrowRight size={16} />
            </button>
            <button className="secondary-btn hero-secondary" onClick={() => navigate('/history')}>
              View history
            </button>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-orb hero-orb-a" />
          <div className="hero-orb hero-orb-b" />
          <div className="hero-monitor">
            <div className="monitor-top" />
            <div className="monitor-curve" />
            <div className="monitor-pulse" />
          </div>
        </div>
      </motion.section>

      <div className="stats-grid">
        {stats.map((item, index) => {
          const Icon = item.icon

          return (
            <motion.div key={item.label} className="stat-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
              <div className="stat-icon" style={{ color: item.color }}><Icon size={18} /></div>
              <div className="stat-value">{item.value}</div>
              <div className="stat-label">{item.label}</div>
            </motion.div>
          )
        })}
      </div>

      <div className="section-title">System capabilities</div>
      <div className="features-grid">
        {features.map((feature, index) => {
          const Icon = feature.icon

          return (
            <motion.div key={feature.title} className="feature-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + index * 0.05 }}>
              <div className="feature-icon"><Icon size={18} /></div>
              <div className="feature-title">{feature.title}</div>
              <div className="feature-desc">{feature.desc}</div>
            </motion.div>
          )
        })}
      </div>

      <div className="arch-card">
        <div className="arch-title">Workflow path</div>
        <div className="arch-flow">
          {['Login', 'Dashboard', 'Prediction', 'Risk analysis', 'History'].map((step, index, items) => (
            <React.Fragment key={step}>
              <div className="arch-step">{step}</div>
              {index < items.length - 1 && <div className="arch-arrow">→</div>}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}
