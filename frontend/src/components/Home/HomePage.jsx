import { useState } from 'react'
import { Link } from 'react-router-dom'
import FilterSidebar from './FilterSidebar'
import HomeContent from './HomeContent'

function HomePage({ isDark, setIsDark, profileOpen, setProfileOpen, profileRef }) {
  const [activeFilter, setActiveFilter] = useState('All')

  return (
    <div className="home-with-sidebar">
      <header className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="navbar-logo" aria-label="ZuZo Home">
            <span className="navbar-logo-icon">Z</span>
          </Link>
          <Link to="/" className="org-name navbar-center">
            ZuZo
          </Link>
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
                  <li>
                    <button>My Profile</button>
                  </li>
                  <li>
                    <button>My Earnings</button>
                  </li>
                  <li>
                    <button>Settings</button>
                  </li>
                  <li>
                    <button>Preferences</button>
                  </li>
                  <li>
                    <button>Help & Support</button>
                  </li>
                  <li>
                    <button>Sign out</button>
                  </li>
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

export default HomePage

