import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Megaphone, Film, Eye,
  TrendingUp, Clock, RefreshCw, ArrowRight,
} from 'lucide-react'
import AdminLayout from './AdminLayout'
import { getAdminStats } from '../../api/adminApi'

const fmtNum = (n) => {
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

function StatCard({ Icon, iconColor, iconBg, label, value, sub }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-filter)',
      borderRadius: '16px',
      padding: '1.4rem 1.6rem',
      boxShadow: '0 2px 12px var(--shadow-color)',
      transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--green-500)'
        e.currentTarget.style.boxShadow = '0 8px 28px var(--shadow-strong)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border-filter)'
        e.currentTarget.style.boxShadow = '0 2px 12px var(--shadow-color)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: '10px',
        background: iconBg || 'rgba(52,211,153,0.12)',
        color: iconColor || 'var(--green-400)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={18} strokeWidth={2} />
      </div>
      <div>
        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>
          {label}
        </div>
        <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>
          {value}
        </div>
        {sub && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>{sub}</div>
        )}
      </div>
    </div>
  )
}

function ActionRow({ Icon, count, label, color, to }) {
  return (
    <Link
      to={to}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.7rem 0.9rem',
        borderRadius: '10px',
        background: 'var(--hover-bg)',
        border: '1px solid var(--border-subtle)',
        textDecoration: 'none',
        transition: 'border-color 0.2s, background 0.2s',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--green-500)'
        e.currentTarget.style.background = 'rgba(52,211,153,0.06)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)'
        e.currentTarget.style.background = 'var(--hover-bg)'
      }}
    >
      <Icon size={16} strokeWidth={2} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      <span style={{ fontSize: '1.05rem', fontWeight: 800, color, minWidth: '2.5rem' }}>{count}</span>
      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', flex: 1 }}>{label}</span>
      <ArrowRight size={14} strokeWidth={2} style={{ color: 'var(--text-muted)' }} />
    </Link>
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
      setStats(await res.json())
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
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.03em' }}>
            Dashboard
          </h1>
          {lastUpdated && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: '0.2rem 0 0', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Clock size={12} strokeWidth={2} />
              Updated {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={load}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '8px 16px',
            background: loading ? 'rgba(52,211,153,0.15)' : 'linear-gradient(135deg, #37ba8c, #2fa97f)',
            color: loading ? 'var(--green-400)' : '#fff',
            border: loading ? '1px solid rgba(52,211,153,0.3)' : 'none',
            borderRadius: '10px', fontWeight: 600, fontSize: '0.85rem',
            cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
          }}
        >
          <RefreshCw size={14} strokeWidth={2} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '12px 16px', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          ⚠️ {error}
        </div>
      )}

      {loading && !stats ? (
        <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
          <RefreshCw size={28} strokeWidth={1.5} style={{ animation: 'spin 1s linear infinite', marginBottom: '0.75rem' }} />
          <div style={{ fontSize: '0.9rem' }}>Loading stats…</div>
        </div>
      ) : stats && (
        <>
          {/* ── KPI Grid ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <StatCard
              Icon={Users}
              iconBg="rgba(167,139,250,0.12)" iconColor="#a78bfa"
              label="Creators" value={fmtNum(stats.totalCreators)}
            />
            <StatCard
              Icon={Megaphone}
              iconBg="rgba(96,165,250,0.12)" iconColor="#60a5fa"
              label="Campaigns" value={fmtNum(stats.totalCampaigns)}
              sub={`${stats.activeCampaigns} active`}
            />
            <StatCard
              Icon={Film}
              iconBg="rgba(251,191,36,0.12)" iconColor="#fbbf24"
              label="Submissions" value={fmtNum(stats.totalSubmissions)}
              sub={`${stats.pendingSubmissions} pending review`}
            />
            <StatCard
              Icon={Eye}
              iconBg="rgba(52,211,153,0.12)" iconColor="var(--green-400)"
              label="Total Views" value={fmtNum(stats.totalViews)}
            />
          </div>

          {/* ── Bottom Row ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>

            {/* Earnings Overview */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-filter)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 12px var(--shadow-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <TrendingUp size={16} strokeWidth={2} style={{ color: 'var(--green-400)' }} />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Earnings Overview
                </h3>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ flex: 1, padding: '0.85rem 1rem', background: 'var(--hover-bg)', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.3rem' }}>Total</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{fmtCurrency(stats.totalEarnings)}</div>
                </div>
                <div style={{ flex: 1, padding: '0.85rem 1rem', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.3rem' }}>Pending</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fbbf24', letterSpacing: '-0.02em' }}>{fmtCurrency(stats.pendingPayouts)}</div>
                </div>
              </div>

              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>Paid out</span>
                <span style={{ color: 'var(--green-400)', fontWeight: 700 }}>{earningsPct.toFixed(0)}%</span>
              </div>
              <div style={{ width: '100%', height: 8, background: 'var(--border-filter)', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ width: `${earningsPct}%`, height: '100%', borderRadius: '99px', background: 'linear-gradient(90deg, var(--green-400), var(--green-600))', transition: 'width 0.6s ease' }} />
              </div>
            </div>

            {/* Pending Actions */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-filter)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 12px var(--shadow-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <Clock size={16} strokeWidth={2} style={{ color: '#fbbf24' }} />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Pending Actions
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <ActionRow Icon={Film}     count={stats.pendingSubmissions}  label="submissions to review"  color="#fbbf24"            to="/admin/submissions" />
                <ActionRow Icon={TrendingUp} count={stats.eligibleSubmissions} label="eligible submissions"   color="var(--green-400)"   to="/admin/payouts" />
                <ActionRow Icon={Megaphone} count={stats.activeCampaigns}     label="active campaigns"       color="#60a5fa"            to="/admin/campaigns" />
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  )
}

export default AdminDashboardPage
