import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, History as HistoryIcon, LoaderCircle, Filter } from 'lucide-react'
import { getHistory } from '../utils/api'
import { useAuth } from '../hooks/useAuth'
import './History.css'

const RISK_COLORS = { High: '#EF4444', Medium: '#F59E0B', Low: '#10B981' }

export default function History() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState(null)
  const [riskFilter, setRiskFilter] = useState('All')
  const { user } = useAuth()
  const navigate = useNavigate()

  const displayName = user?.name || user?.email?.split('@')[0] || 'User'

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

  const sortedHistory = useMemo(() => {
    return [...history].sort((left, right) => {
      const leftTime = new Date(left.timestamp || 0).getTime()
      const rightTime = new Date(right.timestamp || 0).getTime()
      return rightTime - leftTime
    })
  }, [history])

  const filteredHistory = sortedHistory.filter((item) => {
    const matchesRisk = riskFilter === 'All' || String(item.risk_level || '').toLowerCase() === riskFilter.toLowerCase()
    return matchesRisk
  })

  return (
    <div className="history-page">
     
      <div className="history-toolbar glass-card">
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
              <strong>Debug:</strong> Table: {debug.table_name} | User: {displayName}
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
              <strong>Debug:</strong> Table: {debug.table_name} | User: {displayName} | Records: {debug.total_count}
            </div>
          )}
        </div>
      )}

      {!loading && filteredHistory.length > 0 && (
        <motion.div className="history-table-wrap glass-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="history-meta">
            Loaded <strong>{filteredHistory.length}</strong> prediction{filteredHistory.length !== 1 ? 's' : ''}
            <> for user <strong>{displayName}</strong></>
          </div>

          <div className="history-cards">
            {filteredHistory.map((item, index) => (
              <motion.button
                key={`${item.prediction_id || index}`}
                type="button"
                className="history-row"
                onClick={() => navigate(`/history/${item.prediction_id}`, { state: { item } })}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="history-row-main">
                  <div>
                    <div className="history-row-title">
                      {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'Recorded result'}
                    </div>
                    <div className="history-row-sub">
                      {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                    </div>
                  </div>
                  <div className="history-row-stats">
                    <span className="risk-badge" style={{ color: RISK_COLORS[item.risk_level] || '#2563EB' }}>{item.risk_level || '—'}</span>
                    <span className="history-pct">{item.risk_percentage ? `${parseFloat(item.risk_percentage).toFixed(1)}%` : '—'}</span>
                  </div>
                  <ChevronRight size={16} />
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
