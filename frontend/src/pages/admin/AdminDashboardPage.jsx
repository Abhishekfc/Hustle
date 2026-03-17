import { useEffect, useState } from 'react'
import AdminLayout from './AdminLayout'
import { getAdminStats } from '../../api/adminApi'

const fmt = (n) => {
  if (n === undefined || n === null) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

const fmtCurrency = (n) => {
  if (!n && n !== 0) return '₹0'
  const num = typeof n === 'string' ? parseFloat(n) : n
  if (num >= 1_00_000) return '₹' + (num / 1_00_000).toFixed(1) + 'L'
  if (num >= 1_000) return '₹' + (num / 1_000).toFixed(1) + 'K'
  return '₹' + num.toFixed(0)
}

function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-filter)',
      borderRadius: '14px',
      padding: '1.25rem 1.5rem',
      boxShadow: '0 4px 20px var(--shadow-color)',
      transition: 'border-color 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--green-500)'
        e.currentTarget.style.boxShadow = '0 6px 28px var(--shadow-strong)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border-filter)'
        e.currentTarget.style.boxShadow = '0 4px 20px var(--shadow-color)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '1.25rem' }}>{icon}</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 800, color: accent || 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>{sub}</div>
      )}
    </div>
  )
}

function AdminDashboardPage({ isDark, setIsDark }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getAdminStats()
      if (!res.ok) throw new Error('Failed to load stats')
      const data = await res.json()
      setStats(data)
      setLastUpdated(new Date())
    } catch (e) {
      setError(e.message || 'Failed to load stats')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const earningsPct = stats
    ? Math.min(100, ((parseFloat(stats.totalEarnings) - parseFloat(stats.pendingPayouts)) / Math.max(1, parseFloat(stats.totalEarnings))) * 100)
    : 0

  return (
    <AdminLayout isDark={isDark} setIsDark={setIsDark}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.03em' }}>
            Admin Dashboard
          </h1>
          {lastUpdated && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={load}
          disabled={loading}
          style={{
            padding: '8px 18px',
            background: loading ? 'rgba(55,186,140,0.3)' : 'linear-gradient(135deg, #37ba8c, #2fa97f)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {loading ? '⟳ Loading…' : '↻ Refresh'}
        </button>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          color: '#f87171', padding: '12px 16px', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.9rem'
        }}>
          ⚠️ {error}
        </div>
      )}

      {loading && !stats ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⟳</div>
          Loading stats…
        </div>
      ) : stats && (
        <>
          {/* Top Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <StatCard icon="👥" label="Creators" value={fmt(stats.totalCreators)} />
            <StatCard
              icon="📢"
              label="Campaigns"
              value={fmt(stats.totalCampaigns)}
              sub={`${stats.activeCampaigns} active`}
              accent="var(--green-400)"
            />
            <StatCard
              icon="🎬"
              label="Submissions"
              value={fmt(stats.totalSubmissions)}
              sub={`${stats.pendingSubmissions} pending review`}
            />
            <StatCard icon="👁" label="Total Views" value={fmt(stats.totalViews)} accent="var(--green-400)" />
          </div>

          {/* Bottom Two Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {/* Earnings Overview */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-filter)',
              borderRadius: '14px',
              padding: '1.5rem',
              boxShadow: '0 4px 20px var(--shadow-color)',
            }}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                💸 Earnings Overview
              </h3>
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Earnings</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {fmtCurrency(stats.totalEarnings)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Pending Payouts</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fbbf24' }}>
                    {fmtCurrency(stats.pendingPayouts)}
                  </span>
                </div>
                <div style={{ width: '100%', height: 8, background: 'var(--border-filter)', borderRadius: '99px' }}>
                  <div style={{
                    width: `${earningsPct}%`,
                    height: '100%',
                    borderRadius: '99px',
                    background: 'linear-gradient(90deg, var(--green-400), var(--green-600))',
                    transition: 'width 0.5s ease',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span>Paid out</span>
                  <span>{earningsPct.toFixed(0)}%</span>
                </div>
              </div>
            </div>

            {/* Pending Actions */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-filter)',
              borderRadius: '14px',
              padding: '1.5rem',
              boxShadow: '0 4px 20px var(--shadow-color)',
            }}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                ⚡ Pending Actions
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <ActionRow
                  icon="🎬"
                  count={stats.pendingSubmissions}
                  label="submissions to review"
                  color="#fbbf24"
                  href="/admin/submissions"
                />
                <ActionRow
                  icon="💰"
                  count={stats.eligibleSubmissions}
                  label="eligible submissions"
                  color="var(--green-400)"
                  href="/admin/payouts"
                />
                <ActionRow
                  icon="📢"
                  count={stats.activeCampaigns}
                  label="active campaigns"
                  color="#60a5fa"
                  href="/admin/campaigns"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  )
}

function ActionRow({ icon, count, label, color, href }) {
  return (
    <a
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.6rem 0.75rem',
        borderRadius: '8px',
        background: 'var(--hover-bg)',
        border: '1px solid var(--border-subtle)',
        textDecoration: 'none',
        transition: 'border-color 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--green-500)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
    >
      <span style={{ fontSize: '1.1rem' }}>{icon}</span>
      <span style={{ fontSize: '1.1rem', fontWeight: 800, color, minWidth: '2rem' }}>{count}</span>
      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{label}</span>
    </a>
  )
}

export default AdminDashboardPage
