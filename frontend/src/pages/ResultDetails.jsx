import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, LoaderCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import ResultCard from '../components/ResultCard'
import { getHistoryItem } from '../utils/api'
import './Predict.css'

export default function ResultDetails() {
  const { predictionId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [result, setResult] = useState(location.state?.item || null)
  const [loading, setLoading] = useState(!location.state?.item)
  const [error, setError] = useState('')

  useEffect(() => {
    if (result || !predictionId) {
      return
    }

    let active = true

    getHistoryItem(predictionId)
      .then((data) => {
        if (!active) {
          return
        }

        if (data?.item) {
          setResult(data.item)
          return
        }

        setError(data?.message || 'Prediction record not found')
      })
      .catch((err) => {
        if (!active) {
          return
        }

        setError(err.response?.data?.error || 'Could not load prediction result')
        toast.error(err.response?.data?.error || 'Could not load prediction result')
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [predictionId, result])

  return (
    <div className="predict-page">
      <motion.section className="page-header premium-header" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <div className="page-kicker">History result</div>
          <h1>Prediction result</h1>
          <p>Review the stored summary and clinical guidance for this specific assessment.</p>
        </div>

        <button type="button" className="secondary-btn hero-secondary" onClick={() => navigate('/history')}>
          <ArrowLeft size={16} /> Back to history
        </button>
      </motion.section>

      {loading && (
        <div className="history-loading">
          <LoaderCircle size={18} className="spin" /> Loading result…
        </div>
      )}

      {error && !loading && (
        <div className="history-empty">
          <div className="empty-title">Unable to load result</div>
          <div className="empty-desc">{error}</div>
        </div>
      )}

      {result && (
        <ResultCard
          result={result}
          onReset={() => navigate('/predict')}
        />
      )}
    </div>
  )
}