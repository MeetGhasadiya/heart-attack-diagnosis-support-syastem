import React, { useEffect, useState } from 'react'
import { getHistory } from '../utils/api'
import './History.css'

const RISK_COLORS = { High: '#ff4466', Medium: '#f5c842', Low: '#2de89e' }

export default function History() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState(null)

  useEffect(() => {
    getHistory()
      .then(d => {
        setHistory(d.history || [])
        setDebug(d._debug)
        setMessage(d.message || '')
        console.log('📜 History Response:', d)
      })
      .catch(e => {
        setError(e.response?.data?.error || 'Could not load history')
        setMessage(e.response?.data?.message || '')
        setDebug(e.response?.data?._debug || null)
        console.error('❌ History Error:', e)
      })
      .finally(() => setLoading(false))
  }, [])

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
          {debug && (
            <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '12px', textAlign: 'left', fontFamily: 'monospace' }}>
              <strong>Debug:</strong> Table: {debug.table_name} | User: {debug.user_id?.slice(0, 8)}…
            </div>
          )}
        </div>
      )}

      {!loading && !error && history.length === 0 && (
        <div className="history-empty">
          <div className="empty-icon">◷</div>
          <div className="empty-title">No Records Yet</div>
          <div className="empty-desc">{message || 'Run your first prediction to see history here.'}</div>
          {debug && (
            <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '12px', textAlign: 'left', fontFamily: 'monospace' }}>
              <strong>Debug:</strong> Table: {debug.table_name} | User: {debug.user_id?.slice(0, 8)}… | Records: {debug.total_count}
            </div>
          )}
        </div>
      )}

      {!loading && history.length > 0 && (
        <div className="history-table-wrap">
          <div style={{ padding: '12px', background: 'rgba(45,232,158,0.1)', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', fontFamily: 'monospace' }}>
            ✓ Loaded <strong>{history.length}</strong> prediction{history.length !== 1 ? 's' : ''} for user <strong>{debug?.user_id?.slice(0, 8)}…</strong>
          </div>
          <table className="history-table">
            <thead>
              <tr>
                <th>Prediction ID</th>
                <th>Risk Level</th>
                <th>Risk %</th>
                <th>Model Used</th>
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
                  <td style={{ fontSize: '12px', color: item.model_used === 'True' ? '#2de89e' : '#f5c842' }}>
                    {item.model_used === 'True' ? '✓ AI Model' : '⚠ Mock'}
                  </td>
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
