import React, { useEffect, useState } from 'react'
import { getHistory } from '../utils/api'
import { useAuth } from '../hooks/useAuth'
import './History.css'

const RISK_COLORS = { High: '#ff4466', Medium: '#f5c842', Low: '#2de89e' }

export default function History() {
  const { user } = useAuth()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getHistory(user?.id)
      .then(d => setHistory(d.history || []))
      .catch(e => setError(e.response?.data?.error || 'Could not load history'))
      .finally(() => setLoading(false))
  }, [user])

  return (
    <div className="history-page">
      <div className="page-header">
        <h1>Prediction History</h1>
        <p>All past cardiac risk assessments stored in DynamoDB</p>
      </div>

      {loading && <div className="history-loading"><span className="spinner-lg" /> Loading records…</div>}

      {error && (
        <div className="history-empty">
          <div className="empty-icon">☁</div>
          <div className="empty-title">DynamoDB Not Connected</div>
          <div className="empty-desc">{error}<br />Configure AWS credentials in <code>.env</code> to enable history.</div>
        </div>
      )}

      {!loading && !error && history.length === 0 && (
        <div className="history-empty">
          <div className="empty-icon">◷</div>
          <div className="empty-title">No Records Yet</div>
          <div className="empty-desc">Run your first prediction to see history here.</div>
        </div>
      )}

      {!loading && history.length > 0 && (
        <div className="history-table-wrap">
          <table className="history-table">
            <thead>
              <tr>
                <th>Prediction ID</th>
                <th>Risk Level</th>
                <th>Risk %</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item, i) => (
                <tr key={i}>
                  <td className="mono">{item.prediction_id?.slice(0, 8) || '—'}…</td>
                  <td>
                    <span className="risk-badge" style={{ color: RISK_COLORS[item.risk_level] || 'white' }}>
                      {item.risk_level || '—'}
                    </span>
                  </td>
                  <td>{item.risk_percentage ? `${parseFloat(item.risk_percentage).toFixed(1)}%` : '—'}</td>
                  <td>{item.timestamp ? new Date(item.timestamp).toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
