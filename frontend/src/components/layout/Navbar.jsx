import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function Navbar({ isDark, setIsDark, profileOpen, setProfileOpen, profileRef }) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleSignOut = () => {
    logout()
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo" aria-label="Hustle Home">
          <span className="navbar-logo-icon">H</span>
        </Link>
        <Link to="/" className="org-name navbar-center">Hustle</Link>
        <div className="navbar-right">
          <button
            type="button"
            className="theme-toggle"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', width: 'auto', padding: '0 12px', fontSize: '0.78rem', fontWeight: 600 }}
            onClick={() => navigate('/my-campaigns')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            My Campaigns
          </button>
          <button
            type="button"
            className="theme-toggle"
            onClick={() => setIsDark((d) => !d)}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
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
                <li><button onClick={() => navigate('/profile')}>My Profile</button></li>
                <li><button onClick={() => navigate('/wallet')}>My Wallet</button></li>
                <li><button onClick={() => navigate('/submissions')}>My Submissions</button></li>
                <li><button onClick={() => navigate('/accounts')}>Connected Accounts</button></li>
                <li><button onClick={handleSignOut}>Sign out</button></li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar
