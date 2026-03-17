import { useRef, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Navbar from '../../components/layout/Navbar'

const adminNavItems = [
  { path: '/admin', label: 'Dashboard', icon: '📊', exact: true },
  { path: '/admin/campaigns', label: 'Campaigns', icon: '📢' },
  { path: '/admin/submissions', label: 'Submissions', icon: '🎬' },
  { path: '/admin/payouts', label: 'Payouts', icon: '💰' },
  { path: '/admin/withdrawals', label: 'Withdrawals', icon: '💳' },
  { path: '/admin/users', label: 'Users', icon: '👥' },
]

function AdminLayout({ children, isDark, setIsDark }) {
  const { user } = useAuth()
  const location = useLocation()
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)

  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'ADMIN') return <Navigate to="/" replace />

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path
    return location.pathname.startsWith(item.path)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <Navbar
        isDark={isDark}
        setIsDark={setIsDark}
        profileOpen={profileOpen}
        setProfileOpen={setProfileOpen}
        profileRef={profileRef}
      />

      <div style={{ display: 'flex', paddingTop: '64px' }}>
        {/* Admin Sidebar */}
        <aside style={{
          position: 'fixed',
          top: '64px',
          left: 0,
          width: '220px',
          height: 'calc(100vh - 64px)',
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--border-subtle)',
          padding: '1.5rem 0.75rem',
          overflowY: 'auto',
          zIndex: 100,
        }}>
          <div style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--text-muted)',
            padding: '0 0.75rem',
            marginBottom: '0.75rem',
          }}>
            Admin Panel
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {adminNavItems.map((item) => {
              const active = isActive(item)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: active ? 700 : 500,
                    color: active ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
                    background: active ? 'var(--sidebar-active-bg)' : 'transparent',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    if (!active) e.currentTarget.style.background = 'var(--hover-bg)'
                  }}
                  onMouseLeave={e => {
                    if (!active) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <span style={{ fontSize: '1rem', lineHeight: 1 }}>{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main style={{
          marginLeft: '220px',
          flex: 1,
          padding: '2rem',
          minHeight: 'calc(100vh - 64px)',
          maxWidth: 'calc(100vw - 220px)',
        }}>
          {children}
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
