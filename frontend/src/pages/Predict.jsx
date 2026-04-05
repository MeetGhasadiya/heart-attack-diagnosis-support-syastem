import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, ArrowRight, Sparkles, UserRound, HeartPulse, Gauge, LoaderCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { predictRisk } from '../utils/api'
import ResultCard from '../components/ResultCard'
import InputField from '../components/InputField'
import './Predict.css'

const FIELDS = [
  { key: 'age', label: 'Age', type: 'number', min: 1, max: 120, placeholder: 'e.g. 52', section: 'Personal Info', hint: 'Years' },
  { key: 'sex', label: 'Sex', type: 'select', section: 'Personal Info', options: [{ value: 1, label: 'Male' }, { value: 0, label: 'Female' }] },
  { key: 'cp', label: 'Chest pain type', type: 'select', section: 'Medical Data', options: [
    { value: 0, label: 'Typical angina' },
    { value: 1, label: 'Atypical angina' },
    { value: 2, label: 'Non-anginal pain' },
    { value: 3, label: 'Asymptomatic' },
  ]},
  { key: 'trestbps', label: 'Resting blood pressure', type: 'number', min: 50, max: 300, placeholder: 'e.g. 120', section: 'Medical Data', hint: 'mmHg' },
  { key: 'chol', label: 'Serum cholesterol', type: 'number', min: 50, max: 700, placeholder: 'e.g. 230', section: 'Medical Data', hint: 'mg/dl' },
  { key: 'fbs', label: 'Fasting blood sugar > 120', type: 'select', section: 'Medical Data', options: [{ value: 0, label: 'No' }, { value: 1, label: 'Yes' }] },
  { key: 'restecg', label: 'Resting ECG results', type: 'select', section: 'Medical Data', options: [
    { value: 0, label: 'Normal' }, { value: 1, label: 'ST-T abnormality' }, { value: 2, label: 'LV hypertrophy' }
  ]},
  { key: 'thalach', label: 'Max heart rate achieved', type: 'number', min: 50, max: 250, placeholder: 'e.g. 150', section: 'Medical Data', hint: 'bpm' },
  { key: 'exang', label: 'Exercise-induced angina', type: 'select', section: 'Medical Data', options: [{ value: 0, label: 'No' }, { value: 1, label: 'Yes' }] },
  { key: 'oldpeak', label: 'ST depression (oldpeak)', type: 'number', min: 0, max: 10, step: 0.1, placeholder: 'e.g. 2.3', section: 'Medical Data', hint: 'mm' },
  { key: 'slope', label: 'Slope of peak ST segment', type: 'select', section: 'Medical Data', options: [
    { value: 0, label: 'Upsloping' }, { value: 1, label: 'Flat' }, { value: 2, label: 'Downsloping' }
  ]},
  { key: 'ca', label: 'Major vessels (0–3)', type: 'number', min: 0, max: 3, placeholder: 'e.g. 0', section: 'Medical Data', hint: 'fluoroscopy' },
  { key: 'thal', label: 'Thalassemia', type: 'select', section: 'Medical Data', options: [
    { value: 0, label: 'Normal' }, { value: 1, label: 'Fixed defect' }, { value: 2, label: 'Reversible defect' }
  ]},
]

const DEMO_VALUES = { age: 52, sex: 1, cp: 0, trestbps: 125, chol: 212, fbs: 0, restecg: 1, thalach: 168, exang: 0, oldpeak: 1.0, slope: 2, ca: 2, thal: 3 }

export default function Predict() {
  const [form, setForm] = useState({})
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fieldErrors = useMemo(() => {
    const next = {}
    FIELDS.forEach((field) => {
      const raw = form[field.key]
      if (raw === '' || raw === undefined || raw === null) {
        next[field.key] = 'Required'
        return
      }

      const value = Number(raw)
      if (Number.isNaN(value)) {
        next[field.key] = 'Enter a valid number'
        return
      }

      if (field.min !== undefined && value < field.min) next[field.key] = `Min ${field.min}`
      if (field.max !== undefined && value > field.max) next[field.key] = `Max ${field.max}`
    })
    return next
  }, [form])

  const isFormValid = Object.keys(fieldErrors).length === 0

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!isFormValid) {
      setError('Please fix the highlighted fields before submitting.')
      toast.error('Please complete all 13 fields')
      return
    }

    const features = FIELDS.map((field) => Number(form[field.key]))
    setLoading(true)
    try {
      const data = await predictRisk(features)
      setResult(data)
      toast.success('Prediction generated successfully')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      const message = err.response?.data?.error || 'API error. Is the backend running?'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const loadDemo = () => setForm(DEMO_VALUES)
  const reset = () => { setForm({}); setResult(null); setError('') }

  const groupedFields = FIELDS.reduce((accumulator, field) => {
    accumulator[field.section] = accumulator[field.section] || []
    accumulator[field.section].push(field)
    return accumulator
  }, {})

  return (
    <div className="predict-page">
      <motion.section className="page-header premium-header" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <div className="page-kicker">Clinical workflow</div>
          <h1>Cardiac risk analysis</h1>
          <p>Enter the patient’s 13 clinical parameters to generate an AI-powered risk estimate and guidance.</p>
        </div>
        <button type="button" className="secondary-btn hero-secondary" onClick={loadDemo}>
          <Sparkles size={16} /> Load demo values
        </button>
      </motion.section>

      {result && <ResultCard result={result} onReset={reset} />}

      {!result && (
        <motion.form className="predict-form glass-card" onSubmit={handleSubmit} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="form-toolbar">
            <div>
              <div className="form-title">Patient parameters</div>
              <div className="form-subtitle">All fields are required before prediction.</div>
            </div>
            <div className={`form-chip ${isFormValid ? 'ok' : 'pending'}`}>
              <Gauge size={14} /> {Object.keys(fieldErrors).length ? `${FIELDS.length - Object.keys(fieldErrors).length}/${FIELDS.length} complete` : 'Ready to predict'}
            </div>
          </div>

          <div className="fields-groups">
            {Object.entries(groupedFields).map(([groupName, fields]) => (
              <div key={groupName} className="field-section">
                <div className="field-section-title">{groupName}</div>
                <div className="fields-grid">
                  {fields.map((field) => (
                    <InputField
                      key={field.key}
                      label={field.label}
                      value={form[field.key] ?? ''}
                      onChange={(event) => set(field.key, event.target.value)}
                      error={fieldErrors[field.key]}
                      helpText={field.hint}
                      as={field.type === 'select' ? 'select' : 'input'}
                      type={field.type === 'number' ? 'number' : field.type}
                      min={field.min}
                      max={field.max}
                      step={field.step || 1}
                      options={field.options}
                      required
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {error && <div className="form-alert error">{error}</div>}

          <div className="form-actions">
            <button type="submit" className="primary-btn predict-btn" disabled={loading || !isFormValid}>
              {loading ? <><LoaderCircle size={18} className="spin" /> Analysing</> : <>Run prediction <ArrowRight size={16} /></>}
            </button>
          </div>
        </motion.form>
      )}
    </div>
  )
}
