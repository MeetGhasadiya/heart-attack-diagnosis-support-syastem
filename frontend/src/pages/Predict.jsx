import React, { useState } from 'react'
import { predictRisk } from '../utils/api'
import ResultCard from '../components/ResultCard'
import './Predict.css'

const FIELDS = [
  { key: 'age', label: 'Age', type: 'number', min: 1, max: 120, placeholder: 'e.g. 52', hint: 'Years' },
  { key: 'sex', label: 'Sex', type: 'select', options: [{ v: 1, l: 'Male' }, { v: 0, l: 'Female' }] },
  { key: 'cp', label: 'Chest Pain Type', type: 'select', options: [
    { v: 0, l: '0 — Typical Angina' },
    { v: 1, l: '1 — Atypical Angina' },
    { v: 2, l: '2 — Non-Anginal Pain' },
    { v: 3, l: '3 — Asymptomatic' },
  ]},
  { key: 'trestbps', label: 'Resting Blood Pressure', type: 'number', min: 50, max: 300, placeholder: 'e.g. 120', hint: 'mmHg' },
  { key: 'chol', label: 'Serum Cholesterol', type: 'number', min: 50, max: 700, placeholder: 'e.g. 230', hint: 'mg/dl' },
  { key: 'fbs', label: 'Fasting Blood Sugar > 120', type: 'select', options: [{ v: 0, l: 'No' }, { v: 1, l: 'Yes' }] },
  { key: 'restecg', label: 'Resting ECG Results', type: 'select', options: [
    { v: 0, l: '0 — Normal' }, { v: 1, l: '1 — ST-T Abnormality' }, { v: 2, l: '2 — LV Hypertrophy' }
  ]},
  { key: 'thalach', label: 'Max Heart Rate Achieved', type: 'number', min: 50, max: 250, placeholder: 'e.g. 150', hint: 'bpm' },
  { key: 'exang', label: 'Exercise-Induced Angina', type: 'select', options: [{ v: 0, l: 'No' }, { v: 1, l: 'Yes' }] },
  { key: 'oldpeak', label: 'ST Depression (Oldpeak)', type: 'number', min: 0, max: 10, step: 0.1, placeholder: 'e.g. 2.3', hint: 'mm' },
  { key: 'slope', label: 'Slope of Peak ST Segment', type: 'select', options: [
    { v: 0, l: '0 — Upsloping' }, { v: 1, l: '1 — Flat' }, { v: 2, l: '2 — Downsloping' }
  ]},
  { key: 'ca', label: 'No. of Major Vessels (0–3)', type: 'number', min: 0, max: 3, placeholder: 'e.g. 0', hint: 'colored by fluoroscopy' },
  { key: 'thal', label: 'Thalassemia', type: 'select', options: [
    { v: 0, l: '0 — Normal' }, { v: 1, l: '1 — Fixed Defect' }, { v: 2, l: '2 — Reversible Defect' }
  ]},
]

const DEMO_VALUES = { age: 52, sex: 1, cp: 0, trestbps: 125, chol: 212, fbs: 0, restecg: 1, thalach: 168, exang: 0, oldpeak: 1.0, slope: 2, ca: 2, thal: 3 }

export default function Predict() {
  const [form, setForm] = useState({})
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const features = FIELDS.map(f => parseFloat(form[f.key] ?? 0))
    if (features.some(isNaN)) {
      setError('Please fill in all fields before submitting.')
      return
    }
    setLoading(true)
    try {
      const data = await predictRisk(features)
      setResult(data)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err.response?.data?.error || 'API error. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  const loadDemo = () => setForm(DEMO_VALUES)
  const reset = () => { setForm({}); setResult(null); setError('') }

  return (
    <div className="predict-page">
      <div className="page-header">
        <h1>Cardiac Risk Analysis</h1>
        <p>Enter the patient's 13 clinical parameters to generate a prediction</p>
      </div>

      {result && <ResultCard result={result} onReset={reset} />}

      {!result && (
        <form className="predict-form" onSubmit={handleSubmit}>
          <div className="form-toolbar">
            <span className="form-title">Patient Parameters</span>
            <button type="button" className="demo-btn" onClick={loadDemo}>Load Demo Values</button>
          </div>

          <div className="fields-grid">
            {FIELDS.map(f => (
              <div key={f.key} className="field-group">
                <label>{f.label}</label>
                {f.type === 'select' ? (
                  <select
                    value={form[f.key] ?? ''}
                    onChange={e => set(f.key, e.target.value)}
                  >
                    <option value="" disabled>Select…</option>
                    {f.options.map(o => (
                      <option key={o.v} value={o.v}>{o.l}</option>
                    ))}
                  </select>
                ) : (
                  <div className="input-wrap">
                    <input
                      type="number"
                      min={f.min}
                      max={f.max}
                      step={f.step || 1}
                      placeholder={f.placeholder}
                      value={form[f.key] ?? ''}
                      onChange={e => set(f.key, e.target.value)}
                    />
                    {f.hint && <span className="input-hint">{f.hint}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>

          {error && <div className="form-error">⚠ {error}</div>}

          <div className="form-actions">
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <><span className="spinner" /> Analysing…</>
              ) : 'Run Prediction →'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
