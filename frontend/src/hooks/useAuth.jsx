import React, { createContext, useContext, useState } from 'react'
import { loginUser } from '../utils/api'

const AuthContext = createContext(null)
const CURRENT_USER_KEY = 'cardioai_user'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem(CURRENT_USER_KEY)
    return stored ? JSON.parse(stored) : null
  })

  const login = async (email, password) => {
    try {
      const response = await loginUser(email, password)
      const userData = { 
        id: response.id_token || email, 
        email, 
        name: email.split('@')[0],
        accessToken: response.access_token,
        idToken: response.id_token
      }
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData))
      setUser(userData)
      return { ok: true }
    } catch (error) {
      const message = error.response?.data?.error || error.message || 'Login failed'
      console.error('Login failed:', message)
      return { ok: false, error: message }
    }
  }

  const logout = () => {
    localStorage.removeItem(CURRENT_USER_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
