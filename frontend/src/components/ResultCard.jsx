import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, ChevronDown, ChevronUp, CircleCheckBig, ShieldAlert, Sparkles } from 'lucide-react'
import './ResultCard.css'

const RISK_CONFIG = {
  High: {
    tone: 'danger',
    color: '#EF4444',
    surface: 'rgba(239, 68, 68, 0.08)',
    border: 'rgba(239, 68, 68, 0.24)',
    label: 'HIGH RISK',
    icon: AlertTriangle,
  },
  Medium: {
    tone: 'warning',
    color: '#F59E0B',
    surface: 'rgba(245, 158, 11, 0.08)',
    border: 'rgba(245, 158, 11, 0.24)',
    label: 'MEDIUM RISK',
    icon: ShieldAlert,
  },
  Low: {
    tone: 'success',
    color: '#10B981',
    surface: 'rgba(16, 185, 129, 0.08)',
    border: 'rgba(16, 185, 129, 0.24)',
    label: 'LOW RISK',
    icon: CircleCheckBig,
  },
}

function normalizeRiskLevel(level) {
  return String(level || 'Medium').trim().toLowerCase()
}

export default function ResultCard({ result, onReset }) {
  const [expanded, setExpanded] = useState(true)
  const level = normalizeRiskLevel(result.risk_level)
  const cfg = level === 'high' ? RISK_CONFIG.High : level === 'low' ? RISK_CONFIG.Low : RISK_CONFIG.Medium
  const pct = Math.max(0, Math.min(100, Number(result.risk_percentage) || 0))
  const Icon = cfg.icon
  const suggestionList = Array.isArray(result.suggestion) && result.suggestion.length > 0
    ? result.suggestion
    : typeof result.suggestion === 'string'
      ? result.suggestion.split(/\r?\n|\|/).map((item) => item.trim()).filter(Boolean)
      : null

  const advice = suggestionList && suggestionList.length > 0
    ? suggestionList
    : Array.isArray(result.advice) && result.advice.length > 0
      ? result.advice
    : ['Review the patient with a clinician.', 'Escalate urgently if symptoms worsen.', 'Use the result as decision support only.']

  return (
    <motion.section
      className={`result-card ${cfg.tone}`}
      style={{ '--risk-color': cfg.color, '--risk-surface': cfg.surface, '--risk-border': cfg.border }}
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <div className="result-hero">
        <div className="result-badge">
          <span className="result-badge-icon">
            <Icon size={18} />
          </span>
          <div>
            <div className="result-label">{cfg.label}</div>
            <div className="result-note">AI-generated clinical support summary</div>
          </div>
        </div>

        <button type="button" className="result-reset" onClick={onReset}>
          <Sparkles size={16} />
          New prediction
        </button>
      </div>

      <div className="result-body">
        <motion.div
          className="risk-ring"
          animate={cfg.tone === 'danger' ? { scale: [1, 1.02, 1] } : { scale: 1 }}
          transition={{ duration: 1.8, repeat: cfg.tone === 'danger' ? Infinity : 0, repeatType: 'mirror' }}
        >
          <svg viewBox="0 0 220 220" className="ring-svg">
            <defs>
              <linearGradient id="riskGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#EF4444" />
              </linearGradient>
            </defs>
            <circle cx="110" cy="110" r="82" className="ring-track" />
            <motion.circle
              cx="110"
              cy="110"
              r="82"
              className="ring-progress"
              stroke="url(#riskGradient)"
              strokeDasharray={515}
              initial={{ strokeDashoffset: 515 }}
              animate={{ strokeDashoffset: 515 - (pct / 100) * 515 }}
              transition={{ duration: 1.3, ease: 'easeOut' }}
            />
          </svg>

          <div className="ring-copy">
            <motion.div className="ring-value" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}>
              {pct.toFixed(1)}%
            </motion.div>
            <div className="ring-caption">Estimated cardiac risk</div>
          </div>
        </motion.div>

        <div className="result-summary">
          <div className="summary-card">
            <span className="summary-key">Risk level</span>
            <span className="summary-value" style={{ color: cfg.color }}>{result.risk_level || 'Medium'}</span>
          </div>
          <div className="summary-card">
            <span className="summary-key">Prediction confidence</span>
            <span className="summary-value">{pct >= 70 ? 'Elevated' : pct >= 40 ? 'Moderate' : 'Controlled'}</span>
          </div>
          <div className="summary-card">
            <span className="summary-key">Timestamp</span>
            <span className="summary-value">{result.timestamp ? new Date(result.timestamp).toLocaleString() : 'Now'}</span>
          </div>
          <div className="summary-card">
            <span className="summary-key">Patient token</span>
            <span className="summary-value mono">{result.user_id ? `${result.user_id.slice(0, 10)}…` : 'Unavailable'}</span>
          </div>
        </div>
      </div>

      <button type="button" className="result-expand" onClick={() => setExpanded((value) => !value)}>
        <span>Clinical guidance</span>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            className="advice-section"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          >
            <div className="advice-grid">
              {advice.map((item, index) => (
                <motion.div
                  key={`${item}-${index}`}
                  className="advice-item"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <span className="advice-bullet" style={{ background: cfg.color }} />
                  <span>{item}</span>
                </motion.div>
              ))}
            </div>

            <div className="result-disclaimer">
              This system supports clinical judgment and does not replace a specialist evaluation, ECG review, or emergency care when indicated.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}
