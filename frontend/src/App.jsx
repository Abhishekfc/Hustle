import { useState, useEffect, useRef } from 'react'
import { Routes, Route, Link, useParams, useNavigate } from 'react-router-dom'
import './App.css'

const API_BASE = '/api'

const FILTER_OPTIONS = ['All', 'UGC', 'Music', 'Clipping', 'Logo']

const FILTER_ICONS = {
  All: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  UGC: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 7l-7 5 7 5V7z" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  ),
  Music: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  ),
  Clipping: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <line x1="12" y1="11" x2="12" y2="17" />
      <line x1="9" y1="14" x2="15" y2="14" />
    </svg>
  ),
  Logo: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
    </svg>
  )
}

const STORAGE_THEME_KEY = 'zuzo-theme'

const MOCK_CARDS = [
  { _id: '1', title: 'Product Review', category: 'UGC', letter: 'P', order: 1 },
  { _id: '2', title: 'Unboxing', category: 'UGC', letter: 'U', order: 2 },
  { _id: '3', title: 'Tutorial', category: 'UGC', letter: 'T', order: 3 },
  { _id: '4', title: 'Background Score', category: 'Music', letter: 'B', order: 4 },
  { _id: '5', title: 'Jingle', category: 'Music', letter: 'J', order: 5 },
  { _id: '6', title: 'Podcast Intro', category: 'Music', letter: 'P', order: 6 },
  { _id: '7', title: 'Highlight Reel', category: 'Clipping', letter: 'H', order: 7 },
  { _id: '8', title: 'Short Form', category: 'Clipping', letter: 'S', order: 8 },
  { _id: '9', title: 'Trailer Cut', category: 'Clipping', letter: 'T', order: 9 },
  { _id: '10', title: 'Brand Mark', category: 'Logo', letter: 'B', order: 10 },
  { _id: '11', title: 'Icon Set', category: 'Logo', letter: 'I', order: 11 },
  { _id: '12', title: 'Wordmark', category: 'Logo', letter: 'W', order: 12 }
]

function CampaignDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [campaign, setCampaign] = useState(undefined)
  const swipeStartRef = useRef({ x: 0, y: 0 })
  const isMouseDownRef = useRef(false)
  const SWIPE_THRESHOLD = 80
  const SWIPE_MAX_VERTICAL = 120

  useEffect(() => {
    let cancelled = false
    setCampaign(undefined)
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/cards/${id}`)
        if (res.ok) {
          const data = await res.json()
          if (!cancelled) setCampaign(data)
          return
        }
      } catch (_) {}
      const found = MOCK_CARDS.find((c) => c._id === id)
      if (!cancelled) setCampaign(found !== undefined ? found : null)
    }
    load()
    return () => { cancelled = true }
  }, [id])

  const goBack = () => navigate('/')

  const handleSwipeStart = (e) => {
    const t = e.touches?.[0] || e
    swipeStartRef.current = { x: t.clientX, y: t.clientY }
    isMouseDownRef.current = true
  }

  const handleSwipeEnd = (e) => {
    const t = e.changedTouches?.[0] || e
    const dx = t.clientX - swipeStartRef.current.x
    const dy = t.clientY - swipeStartRef.current.y
    if (dx > SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_MAX_VERTICAL) goBack()
    isMouseDownRef.current = false
  }

  const handleMouseDown = (e) => {
    swipeStartRef.current = { x: e.clientX, y: e.clientY }
    isMouseDownRef.current = true
  }

  const handleMouseUp = (e) => {
    if (!isMouseDownRef.current) return
    const dx = e.clientX - swipeStartRef.current.x
    const dy = e.clientY - swipeStartRef.current.y
    if (dx > SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_MAX_VERTICAL) goBack()
    isMouseDownRef.current = false
  }

  if (campaign === undefined) {
    return (
      <div className="campaign-detail-page">
        <div className="loading">Loading campaign...</div>
      </div>
    )
  }

  if (campaign === null) {
    return (
      <div className="campaign-detail-page">
        <Link to="/" className="card-detail-back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to campaigns
        </Link>
        <div className="empty-state">
          <p>Campaign not found.</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="card-detail-page card-detail-swipeable campaign-detail-page"
      onTouchStart={handleSwipeStart}
      onTouchEnd={handleSwipeEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => { isMouseDownRef.current = false }}
    >
      <Link to="/" className="card-detail-back">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to campaigns
      </Link>
      <div className="card-detail-hero">
        <div className="card-detail-image">
          <span className="card-letter">{campaign.letter}</span>
        </div>
        <div className="card-detail-heading">
          <span className="card-detail-category">{campaign.category}</span>
          <h1 className="card-detail-title">{campaign.title}</h1>
        </div>
      </div>
      <section className="card-detail-content">
        <h2 className="card-detail-section-title">Campaign details</h2>
        <p className="card-detail-description">
          Add description, notes, and more details for this campaign here.
        </p>
        <div className="card-detail-meta">
          <span>ID: {campaign._id}</span>
          <span>Category: {campaign.category}</span>
        </div>
      </section>
    </div>
  )
}

function HomeContent({ activeFilter, setActiveFilter }) {
  const [cards, setCards] = useState([])
  const [sortBy] = useState('default')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (activeFilter !== 'All') params.append('category', activeFilter)
        if (sortBy !== 'default') params.append('sort', sortBy)
        const url = `${API_BASE}/cards${params.toString() ? '?' + params : ''}`
        const res = await fetch(url)
        if (!res.ok) throw new Error('API not available')
        const data = await res.json()
        if (!cancelled) setCards(data)
      } catch (_) {
        let filtered = MOCK_CARDS
        if (activeFilter !== 'All') filtered = MOCK_CARDS.filter((c) => c.category === activeFilter)
        if (sortBy === 'az') filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title))
        else if (sortBy === 'za') filtered = [...filtered].sort((a, b) => b.title.localeCompare(a.title))
        if (!cancelled) setCards(filtered)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [activeFilter, sortBy])

  return (
    <main className="cards-section">
      {loading ? (
        <div className="loading">Loading cards...</div>
      ) : (
        <div className="card-grid">
          {cards.map((card) => (
            <Link key={card._id} to={`/campaign/${card._id}`} className="card card-clickable">
              <div className="card-image">
                <span className="card-letter">{card.letter}</span>
              </div>
              <div className="card-content">
                <h3 className="card-title">{card.title}</h3>
                <span className="card-category">{card.category}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
      {!loading && cards.length === 0 && (
        <div className="empty-state">
          <p>No campaigns found. Start the backend and seed the database.</p>
        </div>
      )}
    </main>
  )
}

function FilterSidebar({ activeFilter, setActiveFilter }) {
  return (
    <aside className="filter-sidebar" aria-label="Filters">
      <div className="filter-sidebar-inner">
        {FILTER_OPTIONS.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`filter-sidebar-btn ${activeFilter === cat ? 'active' : ''}`}
            onClick={() => setActiveFilter(cat)}
            title={cat}
            aria-label={cat}
            aria-pressed={activeFilter === cat}
          >
            <span className="filter-sidebar-icon">{FILTER_ICONS[cat]}</span>
            <span className="filter-sidebar-label">{cat}</span>
          </button>
        ))}
      </div>
    </aside>
  )
}

function HomePage({ isDark, setIsDark, profileOpen, setProfileOpen, profileRef }) {
  const [activeFilter, setActiveFilter] = useState('All')
  return (
    <div className="home-with-sidebar">
        <header className="navbar">
          <div className="navbar-inner">
            <Link to="/" className="navbar-logo" aria-label="ZuZo Home">
              <span className="navbar-logo-icon">Z</span>
            </Link>
            <Link to="/" className="org-name navbar-center">ZuZo</Link>
            <div className="navbar-right">
              <button
                type="button"
                className="theme-toggle"
                onClick={() => setIsDark((d) => !d)}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                title={isDark ? 'Light mode' : 'Dark mode'}
              >
                {isDark ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5" />
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </button>
              <div className={`profile-wrapper ${profileOpen ? 'open' : ''}`} ref={profileRef}>
              <button
                className="profile-trigger"
                onClick={() => setProfileOpen(!profileOpen)}
                aria-haspopup="true"
                aria-expanded={profileOpen}
              >
                <span className="profile-avatar">U</span>
                <span className="profile-label">Profile</span>
                <svg className="profile-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 4l4 4 4-4" />
                </svg>
              </button>
              {profileOpen && (
                <ul className="profile-dropdown">
                  <li><button>My Profile</button></li>
                  <li><button>My Earnings</button></li>
                  <li><button>Settings</button></li>
                  <li><button>Preferences</button></li>
                  <li><button>Help & Support</button></li>
                  <li><button>Sign out</button></li>
                </ul>
              )}
              </div>
            </div>
          </div>
        </header>
        <FilterSidebar activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
        <div className="main-offset">
          <HomeContent activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
        </div>
    </div>
  )
}

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
