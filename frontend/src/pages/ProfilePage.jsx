import { useEffect, useRef, useState } from 'react'
import Navbar from '../components/layout/Navbar'
import StatusBadge from '../components/shared/StatusBadge'
import { api } from '../api/client'
import { formatViews } from '../utils/formatViews'
import { formatCurrency } from '../utils/formatCurrency'
import { useAuth } from '../context/AuthContext'
import './DashboardPage.css'

function ProfilePage({ isDark, setIsDark }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)

  useEffect(() => {
    api('/profile/me')
      .then(res => res.json())
      .then(data => setProfile(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const displayName = profile?.username || user?.username || 'Creator'
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <div className="dash-layout-nosidebar">
      <Navbar isDark={isDark} setIsDark={setIsDark} profileOpen={profileOpen} setProfileOpen={setProfileOpen} profileRef={profileRef} />
      <div className="dash-main">
        <div className="dash-page">
          <div className="dash-page-header">
            <div>
              <h1 className="dash-page-title">Profile</h1>
              <p className="dash-page-subtitle">Your creator profile and statistics</p>
            </div>
          </div>
          {loading ? (
            <div className="loading">Loading profile…</div>
          ) : (
            <div className="profile-container">
              <div className="profile-card-main">
                <div className="profile-avatar-large">{initials}</div>
                <div className="profile-info">
                  <h2 className="profile-name">{profile?.username || displayName}</h2>
                  <p className="profile-email">{profile?.email || ''}</p>
                  <div style={{ marginTop: '0.4rem' }}>
                    <StatusBadge status={profile?.role || 'CREATOR'} />
                  </div>
                  {profile?.createdAt && (
                    <p className="profile-joined">
                      Member since {new Date(profile.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>

              <div className="wallet-stats-grid">
                <div className="wallet-stat-card wallet-stat-balance">
                  <span className="wallet-stat-label">Total Views Generated</span>
                  <span className="wallet-stat-value green">{formatViews(profile?.totalViewsGenerated || 0)}</span>
                </div>
                <div className="wallet-stat-card">
                  <span className="wallet-stat-label">Username</span>
                  <span className="wallet-stat-value" style={{ fontSize: '1.25rem' }}>@{profile?.username || displayName}</span>
                </div>
                <div className="wallet-stat-card">
                  <span className="wallet-stat-label">Role</span>
                  <span className="wallet-stat-value" style={{ fontSize: '1.25rem' }}>{profile?.role || 'CREATOR'}</span>
                </div>
                <div className="wallet-stat-card">
                  <span className="wallet-stat-label">Account ID</span>
                  <span className="wallet-stat-value" style={{ fontSize: '1.25rem' }}>#{profile?.id || '—'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
