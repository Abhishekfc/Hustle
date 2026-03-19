import { createContext, useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login as loginApi, register as registerApi, googleLogin as googleLoginApi } from '../api/authApi'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('hustle_user')
    return u ? JSON.parse(u) : null
  })
  const navigate = useNavigate()

  const login = async (email, password) => {
    const res = await loginApi({ email, password })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Login failed')
    localStorage.setItem('hustle_token', data.token)
    localStorage.setItem('hustle_user', JSON.stringify({ username: data.username, role: data.role }))
    setUser({ username: data.username, role: data.role })
    navigate('/')
  }

  const register = async (email, password, username) => {
    const res = await registerApi({ email, password, username })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Registration failed')
    localStorage.setItem('hustle_token', data.token)
    localStorage.setItem('hustle_user', JSON.stringify({ username: data.username, role: data.role }))
    setUser({ username: data.username, role: data.role })
    navigate('/')
  }

  const googleLogin = async (email, name) => {
    const res = await googleLoginApi(email, name)
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Google login failed')
    localStorage.setItem('hustle_token', data.token)
    localStorage.setItem('hustle_user', JSON.stringify({ username: data.username, role: data.role }))
    setUser({ username: data.username, role: data.role })
    navigate('/')
  }

  const logout = () => {
    localStorage.removeItem('hustle_token')
    localStorage.removeItem('hustle_user')
    setUser(null)
    navigate('/login')
  }

  return (
    <AuthContext.Provider value={{ user, login, register, googleLogin, logout, isAdmin: user?.role === 'ADMIN' }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
