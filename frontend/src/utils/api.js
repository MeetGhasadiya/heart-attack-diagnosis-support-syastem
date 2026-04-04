import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
})

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

export const predictRisk = async (features, userId) => {
  const { data } = await api.post('/predict', { features, user_id: userId })
  return data
}

export const getHistory = async (userId) => {
  const { data } = await api.get(`/history/${userId}`)
  return data
}

export default api
