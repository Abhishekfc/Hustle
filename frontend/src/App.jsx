import { useEffect, useRef, useState } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import './App.css'
import CampaignDetail from './components/CampaignDetail'
import HomePage from './components/Home/HomePage'
import { STORAGE_THEME_KEY } from './constants/theme'

function App() {
  const [profileOpen, setProfileOpen] = useState(false)
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem(STORAGE_THEME_KEY)
    if (stored !== null) return stored === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const profileRef = useRef(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    localStorage.setItem(STORAGE_THEME_KEY, isDark ? 'dark' : 'light')
  }, [isDark])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  return (
    <div className="app">
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              isDark={isDark}
              setIsDark={setIsDark}
              profileOpen={profileOpen}
              setProfileOpen={setProfileOpen}
              profileRef={profileRef}
            />
          }
        />
        <Route
          path="/campaign/:id"
          element={
            <>
              <header className="header header-minimal">
                <div className="header-inner">
                  <Link to="/" className="header-back-link">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    ZuZo
                  </Link>
                </div>
              </header>
              <CampaignDetail />
            </>
          }
        />
      </Routes>
    </div>
  )
}

export default App
