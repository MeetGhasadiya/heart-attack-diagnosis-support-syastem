import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, ChevronUp, History as HistoryIcon, LoaderCircle, Search, Filter } from 'lucide-react'
import { getHistory } from '../utils/api'
import './History.css'

const RISK_COLORS = { High: '#EF4444', Medium: '#F59E0B', Low: '#10B981' }

export default function History() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState(null)
  const [query, setQuery] = useState('')
  const [riskFilter, setRiskFilter] = useState('All')
  const [expandedRow, setExpandedRow] = useState(null)

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

  const filteredHistory = history.filter((item) => {
    const matchesQuery = !query || [item.prediction_id, item.risk_level, item.timestamp].some((value) => String(value || '').toLowerCase().includes(query.toLowerCase()))
    const matchesRisk = riskFilter === 'All' || String(item.risk_level || '').toLowerCase() === riskFilter.toLowerCase()
    return matchesQuery && matchesRisk
  })

  return (
    <div className="history-page">
      <motion.section className="page-header premium-header" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <div className="page-kicker">Audit trail</div>
          <h1>Prediction history</h1>
          <p>All past cardiac risk assessments stored for review and follow-up.</p>
        </div>
      </motion.section>

      <div className="history-toolbar glass-card">
        <div className="search-box">
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search predictions" />
        </div>
        <div className="filter-box">
          <Filter size={16} />
          <select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)}>
            <option value="All">All risk levels</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {loading && <div className="history-loading"><LoaderCircle size={18} className="spin" /> Loading records…</div>}

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
          <div className="empty-icon"><HistoryIcon size={34} /></div>
          <div className="empty-title">No Records Yet</div>
          <div className="empty-desc">{message || 'Run your first prediction to see history here.'}</div>
          {debug && (
            <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '12px', textAlign: 'left', fontFamily: 'monospace' }}>
              <strong>Debug:</strong> Table: {debug.table_name} | User: {debug.user_id?.slice(0, 8)}… | Records: {debug.total_count}
            </div>
          )}
        </div>
      )}

      {!loading && filteredHistory.length > 0 && (
        <motion.div className="history-table-wrap glass-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="history-meta">
            Loaded <strong>{filteredHistory.length}</strong> prediction{filteredHistory.length !== 1 ? 's' : ''}
            {debug?.user_id ? <> for user <strong>{debug.user_id.slice(0, 8)}…</strong></> : null}
          </div>

          <div className="history-cards">
            {filteredHistory.map((item, index) => (
              <motion.button
                key={`${item.prediction_id || index}`}
                type="button"
                className="history-row"
                onClick={() => setExpandedRow(expandedRow === index ? null : index)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="history-row-main">
                  <div>
                    <div className="history-row-title">{item.prediction_id?.slice(0, 10) || 'Prediction'}…</div>
                    <div className="history-row-sub">{item.timestamp ? new Date(item.timestamp).toLocaleString() : '—'}</div>
                  </div>
                  <div className="history-row-stats">
                    <span className="risk-badge" style={{ color: RISK_COLORS[item.risk_level] || '#2563EB' }}>{item.risk_level || '—'}</span>
                    <span className="history-pct">{item.risk_percentage ? `${parseFloat(item.risk_percentage).toFixed(1)}%` : '—'}</span>
                  </div>
                  {expandedRow === index ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>

                {expandedRow === index && (
                  <div className="history-row-details">
                    <div>Model: {item.model_used === 'True' ? 'AI model' : 'Mock'}</div>
                    <div>Prediction ID: {item.prediction_id || '—'}</div>
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
