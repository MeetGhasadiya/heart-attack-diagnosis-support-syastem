import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, BarChart3, Clock3, Sparkles, ShieldCheck, Activity, History as HistoryIcon } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { getHistory } from '../utils/api'
import './Dashboard.css'

const features = [
  { title: 'ML Prediction', desc: 'Risk scoring from the cardiac model pipeline', icon: Activity },
  { title: 'Clinical guidance', desc: 'Actionable advice with severity-aware color coding', icon: ShieldCheck },
  { title: 'Secure access', desc: 'Token-based auth stored locally for the active session', icon: Sparkles },
  { title: 'History trail', desc: 'Every prediction tracked for review and auditing', icon: HistoryIcon },
]

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [summary, setSummary] = useState({
    total_predictions: 0,
    high_risk_alerts: 0,
    low_risk_clearances: 0,
    last_assessment: null,
  })

  useEffect(() => {
    let active = true

    getHistory()
      .then((data) => {
        if (!active) {
          return
        }

        const apiSummary = data?.summary || {}
        const history = Array.isArray(data?.history) ? data.history : []

        if (apiSummary && Object.keys(apiSummary).length > 0) {
          setSummary({
            total_predictions: Number(apiSummary.total_predictions || 0),
            high_risk_alerts: Number(apiSummary.high_risk_alerts || 0),
            low_risk_clearances: Number(apiSummary.low_risk_clearances || 0),
            last_assessment: apiSummary.last_assessment || null,
          })
          return
        }

        const high = history.filter((item) => String(item?.risk_level || '').toLowerCase() === 'high').length
        const low = history.filter((item) => String(item?.risk_level || '').toLowerCase() === 'low').length
        const last = history
          .map((item) => item?.timestamp)
          .filter(Boolean)
          .sort()
          .at(-1) || null

        setSummary({
          total_predictions: history.length,
          high_risk_alerts: high,
          low_risk_clearances: low,
          last_assessment: last,
        })
      })
      .catch(() => {
        if (active) {
          setSummary({
            total_predictions: 0,
            high_risk_alerts: 0,
            low_risk_clearances: 0,
            last_assessment: null,
          })
        }
      })

    return () => {
      active = false
    }
  }, [])

  const stats = useMemo(() => {
    const lastAssessmentLabel = summary.last_assessment
      ? new Date(summary.last_assessment).toLocaleString()
      : 'Never'

    return [
      { label: 'Total predictions', value: String(summary.total_predictions), icon: BarChart3, color: '#2563EB' },
      { label: 'High-risk alerts', value: String(summary.high_risk_alerts), icon: ShieldCheck, color: '#EF4444' },
      { label: 'Low-risk clearances', value: String(summary.low_risk_clearances), icon: Sparkles, color: '#10B981' },
      { label: 'Last assessment', value: lastAssessmentLabel, icon: Clock3, color: '#F59E0B' },
    ]
  }, [summary])

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
            <svg viewBox="0 0 420 120" className="monitor-ecg" aria-hidden="true">
              <path
                className="monitor-ecg-track"
                d="M10 78 L72 78 L92 72 L110 82 L128 44 L146 100 L166 66 L188 78 L240 78 L260 74 L278 82 L296 56 L314 90 L334 72 L356 78 L410 78"
              />
              <path
                className="monitor-ecg-line"
                d="M10 78 L72 78 L92 72 L110 82 L128 44 L146 100 L166 66 L188 78 L240 78 L260 74 L278 82 L296 56 L314 90 L334 72 L356 78 L410 78"
              />
            </svg>
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

    </div>
  )
}
