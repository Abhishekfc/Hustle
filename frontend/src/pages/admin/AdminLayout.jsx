import { useRef, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Navbar from '../../components/layout/Navbar'
import {
  LayoutDashboard,
  Megaphone,
  Film,
  Wallet,
  CreditCard,
  Users,
} from 'lucide-react'

const adminNavItems = [
  { path: '/admin',              label: 'Dashboard',   Icon: LayoutDashboard, exact: true },
  { path: '/admin/campaigns',    label: 'Campaigns',   Icon: Megaphone },
  { path: '/admin/submissions',  label: 'Submissions', Icon: Film },
  { path: '/admin/payouts',      label: 'Payouts',     Icon: Wallet },
  { path: '/admin/withdrawals',  label: 'Withdrawals', Icon: CreditCard },
  { path: '/admin/users',        label: 'Users',       Icon: Users },
]

function AdminLayout({ children, isDark, setIsDark }) {
  const { user } = useAuth()
  const location = useLocation()
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)

  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'ADMIN') return <Navigate to="/" replace />

  const isActive = (item) =>
    item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path)

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
        {/* ── Admin Sidebar ── */}
        <aside style={{
          position: 'fixed',
          top: '64px',
          left: 0,
          width: '220px',
          height: 'calc(100vh - 64px)',
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--border-subtle)',
          padding: '1.25rem 0.75rem 1.5rem',
          overflowY: 'auto',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}>
          {/* Section label */}
          <div style={{
            fontSize: '0.62rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'var(--text-muted)',
            padding: '0 0.5rem',
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
                    gap: '0.65rem',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    fontSize: '0.85rem',
                    fontWeight: active ? 600 : 500,
                    color: active ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
                    background: active ? 'var(--sidebar-active-bg)' : 'transparent',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--hover-bg)' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                >
                  <item.Icon size={16} strokeWidth={active ? 2.5 : 2} />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* ── Main Content ── */}
        <main style={{
          marginLeft: '220px',
          flex: 1,
          padding: '2rem 2.25rem',
          minHeight: 'calc(100vh - 64px)',
          maxWidth: 'calc(100vw - 220px)',
          boxSizing: 'border-box',
        }}>
          {children}
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
