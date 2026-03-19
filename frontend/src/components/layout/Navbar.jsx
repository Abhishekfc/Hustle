import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LayoutGrid, Sun, Moon, Settings } from 'lucide-react'

function Navbar({ isDark, setIsDark, profileOpen, setProfileOpen, profileRef }) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo" aria-label="Hustle Home">
          <span className="navbar-logo-icon">H</span>
        </Link>
        <Link to="/" className="org-name navbar-center">Hustle</Link>
        <div className="navbar-right">
          {/* My Campaigns shortcut */}
          <button
            type="button"
            className="theme-toggle"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', width: 'auto', padding: '0 12px', fontSize: '0.78rem', fontWeight: 600 }}
            onClick={() => navigate('/my-campaigns')}
          >
            <LayoutGrid size={14} strokeWidth={2} />
            My Campaigns
          </button>

          {/* Theme toggle */}
          <button
            type="button"
            className="theme-toggle"
            onClick={() => setIsDark((d) => !d)}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark
              ? <Sun size={18} strokeWidth={1.75} />
              : <Moon size={18} strokeWidth={1.75} />
            }
          </button>

          {/* Profile dropdown */}
          <div className={`profile-wrapper ${profileOpen ? 'open' : ''}`} ref={profileRef}>
            <button
              className="profile-trigger"
              onClick={() => setProfileOpen(!profileOpen)}
              aria-haspopup="true"
              aria-expanded={profileOpen}
            >
              <span className="profile-avatar">
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </span>
              <span className="profile-label">{user?.username || 'Profile'}</span>
              <svg className="profile-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 4l4 4 4-4" />
              </svg>
            </button>
            {profileOpen && (
              <ul className="profile-dropdown">
                {user?.role === 'ADMIN' && (
                  <li>
                    <button onClick={() => navigate('/admin')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Settings size={14} strokeWidth={2} style={{ opacity: 0.7 }} />
                      Admin Panel
                    </button>
                  </li>
                )}
                <li><button onClick={() => navigate('/profile')}>My Profile</button></li>
                <li><button onClick={() => navigate('/wallet')}>My Wallet</button></li>
                <li><button onClick={() => navigate('/submissions')}>My Submissions</button></li>
                <li><button onClick={() => navigate('/accounts')}>Connected Accounts</button></li>
                <li><button onClick={logout} style={{ color: '#f87171' }}>Sign out</button></li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar
