import React from 'react'
import './ResultCard.css'

const RISK_CONFIG = {
  High: { color: '#ff4466', bg: 'rgba(255,68,102,0.1)', border: 'rgba(255,68,102,0.3)', icon: '⚠', label: 'HIGH RISK' },
  Medium: { color: '#f5c842', bg: 'rgba(245,200,66,0.1)', border: 'rgba(245,200,66,0.3)', icon: '◈', label: 'MEDIUM RISK' },
  Low: { color: '#2de89e', bg: 'rgba(45,232,158,0.1)', border: 'rgba(45,232,158,0.3)', icon: '✓', label: 'LOW RISK' },
}

export default function ResultCard({ result, onReset }) {
  const cfg = RISK_CONFIG[result.risk_level] || RISK_CONFIG.Medium
  const pct = Math.round(result.risk_percentage)

  return (
    <div className="result-card" style={{ '--risk-color': cfg.color, '--risk-bg': cfg.bg, '--risk-border': cfg.border }}>
      {/* Header */}
      <div className="result-header">
        <div className="result-badge">
          <span className="result-icon">{cfg.icon}</span>
          <span className="result-label">{cfg.label}</span>
        </div>
        <button className="reset-btn" onClick={onReset}>← New Analysis</button>
      </div>

      {/* Main metric */}
      <div className="result-main">
        <div className="risk-gauge">
          <svg viewBox="0 0 200 120" className="gauge-svg">
            <defs>
              <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2de89e" />
                <stop offset="50%" stopColor="#f5c842" />
                <stop offset="100%" stopColor="#ff4466" />
              </linearGradient>
            </defs>
            {/* Track */}
            <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" strokeLinecap="round" />
            {/* Fill */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="url(#gaugeGrad)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray="251"
              strokeDashoffset={251 - (pct / 100) * 251}
              style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
            />
            {/* Needle */}
            <line
              x1="100" y1="100"
              x2={100 + 65 * Math.cos(Math.PI * (1 - pct / 100))}
              y2={100 - 65 * Math.sin(Math.PI * (1 - pct / 100))}
              stroke={cfg.color}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="100" cy="100" r="5" fill={cfg.color} />
          </svg>
          <div className="gauge-value" style={{ color: cfg.color }}>{pct}<span>%</span></div>
          <div className="gauge-label">Risk Score</div>
        </div>

        <div className="result-details">
          <div className="detail-row">
            <span className="detail-key">Risk Level</span>
            <span className="detail-val" style={{ color: cfg.color }}>{result.risk_level}</span>
          </div>
          <div className="detail-row">
            <span className="detail-key">Probability</span>
            <span className="detail-val">{result.risk_percentage.toFixed(1)}%</span>
          </div>
          <div className="detail-row">
            <span className="detail-key">Timestamp</span>
            <span className="detail-val">{new Date(result.timestamp).toLocaleString()}</span>
          </div>
          <div className="detail-row">
            <span className="detail-key">Patient ID</span>
            <span className="detail-val mono">{result.user_id?.slice(0, 8)}…</span>
          </div>
          {result._debug && (
            <>
              <div className="detail-row" style={{ borderTop: '1px solid rgba(255,255,255,0.2)', marginTop: '12px', paddingTop: '12px' }}>
                <span className="detail-key">Model Status</span>
                <span className="detail-val" style={{ color: result._debug.model_used ? '#2de89e' : '#f5c842' }}>
                  {result._debug.model_used ? '✓ AI Model' : '⚠ Mock Data'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-key">Saved to DB</span>
                <span className="detail-val" style={{ color: result._debug.saved_to_dynamodb ? '#2de89e' : '#ff4466' }}>
                  {result._debug.saved_to_dynamodb ? '✓ Yes' : '✗ No'}
                </span>
              </div>
              {result._debug.dynamodb_error && (
                <div className="detail-row">
                  <span className="detail-key">DB Error</span>
                  <span className="detail-val mono" style={{ fontSize: '11px', color: '#ff8899' }}>
                    {result._debug.dynamodb_error?.substring(0, 40)}...
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Advice */}
      <div className="advice-section">
        <div className="advice-title">Medical Recommendations</div>
        <ul className="advice-list">
          {result.advice?.map((a, i) => (
            <li key={i} className="advice-item">
              <span className="advice-dot" style={{ background: cfg.color }} />
              {a}
            </li>
          ))}
        </ul>
      </div>

      <div className="result-disclaimer">
        ⚕ This tool is for decision support only. Always consult a qualified cardiologist for diagnosis and treatment.
      </div>
    </div>
  )
}
