import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
})

function getAuthToken() {
  try {
    const stored = JSON.parse(localStorage.getItem('cardioai_user') || 'null')
    return stored?.accessToken || stored?.idToken || ''
  } catch {
    return ''
  }
}

export const registerUser = async (name, email, password) => {
  const { data } = await api.post('/register', { name, email, password })
  return data
}

export const confirmSignup = async (email, code) => {
  const { data } = await api.post('/confirm-signup', { email, code })
  return data
}

export const loginUser = async (email, password) => {
  const { data } = await api.post('/login', { email, password })
  return data
}

export const forgotPasswordRequest = async (email) => {
  const { data } = await api.post('/forgot-password', { email })
  return data
}

export const resetPassword = async (email, code, new_password) => {
  const { data } = await api.post('/confirm-password', { email, code, new_password })
  return data
}

export const predictRisk = async (features) => {
  const token = getAuthToken()
  const { data } = await api.post('/predict', { features }, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  })
  return data
}

export const getHistory = async () => {
  const token = getAuthToken()
  const { data } = await api.get('/history', {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  })
  return data
}

export default api
