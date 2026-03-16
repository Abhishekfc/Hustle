import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import '../components/Login/Login.css'

const LoginPage = () => {
  const { login, register } = useAuth()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(email, password, username)
      }
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="saas-login-page">
      <div className="bg-noise"></div>
      <div className="bg-glow"></div>
      <div className="background-hustle-text">HUSTLE</div>

      <div className="login-container">
        <div className="login-header">
          <h2>{mode === 'login' ? 'Welcome back' : 'Start your Hustle today'}</h2>
          <p>{mode === 'login' ? 'Sign in to your account' : 'Create your account'}</p>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            color: '#dc2626', padding: '10px 14px', borderRadius: '10px',
            fontSize: '14px', marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="input-group">
              <label htmlFor="username">Username</label>
              <input id="username" type="text" placeholder="yourhandle" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
          )}
          <div className="input-group">
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="divider"><span>or</span></div>

        <div style={{ textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
            style={{ background: 'none', border: 'none', color: '#37ba8c', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
          >
            {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>

        <div className="login-footer">
          <p>By continuing, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.</p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
