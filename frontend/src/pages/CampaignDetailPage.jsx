import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getCampaignById, getLeaderboard, registerForCampaign, checkIsRegistered } from '../api/campaignApi'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/shared/StatusBadge'
import Badge from '../components/shared/Badge'
import Navbar from '../components/layout/Navbar'
import { formatCurrency } from '../utils/formatCurrency'
import { formatViews } from '../utils/formatViews'

/* ── Platform SVG Icons ───────────────────────────────────────── */
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.27 8.27 0 004.84 1.55V6.79a4.85 4.85 0 01-1.07-.1z"/>
  </svg>
)
const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="#FF0000">
    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
)
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="url(#igGrad)">
    <defs>
      <linearGradient id="igGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#f09433"/><stop offset="25%" stopColor="#e6683c"/><stop offset="50%" stopColor="#dc2743"/><stop offset="75%" stopColor="#cc2366"/><stop offset="100%" stopColor="#bc1888"/>
      </linearGradient>
    </defs>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
)
const XIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)

const PlatformStack = ({ platforms }) => {
  const icons = { YOUTUBE: YouTubeIcon, TIKTOK: TikTokIcon, INSTAGRAM: InstagramIcon, X: XIcon }
  const list = platforms?.length > 0 ? platforms : ['YOUTUBE', 'TIKTOK', 'INSTAGRAM', 'X']
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {list.map((p, i) => {
        const Icon = icons[p]
        return Icon ? (
          <div key={p} style={{
            width: 26, height: 26, borderRadius: '50%',
            background: '#1a2420', border: '2px solid var(--bg-card)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginLeft: i === 0 ? 0 : -8, zIndex: list.length - i,
            color: '#fff', position: 'relative'
          }}>
            <Icon />
          </div>
        ) : null
      })}
    </div>
  )
}

/* ── Leaderboard Component ────────────────────────────────────── */
const RANK_CONFIG = {
  1: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', label: '🥇', shadow: '0 0 20px rgba(245,158,11,0.15)' },
  2: { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.25)', label: '🥈', shadow: '0 0 20px rgba(148,163,184,0.1)' },
  3: { color: '#cd7c3a', bg: 'rgba(205,124,58,0.1)',  border: 'rgba(205,124,58,0.25)',  label: '🥉', shadow: '0 0 20px rgba(205,124,58,0.1)'  },
}

function LeaderboardPodium({ row }) {
  const cfg = RANK_CONFIG[row.rank]
  const initials = row.username?.slice(0, 2).toUpperCase() || '??'
  return (
    <div style={{
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderRadius: '16px',
      padding: '1.25rem 1rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.6rem',
      boxShadow: cfg.shadow,
      flex: 1,
      minWidth: 0,
      position: 'relative',
    }}>
      <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', fontSize: '1.6rem', lineHeight: 1 }}>
        {cfg.label}
      </div>
      <div style={{
        width: 52, height: 52, borderRadius: '50%',
        background: `linear-gradient(135deg, ${cfg.color}30, ${cfg.color}15)`,
        border: `2px solid ${cfg.color}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1rem', fontWeight: 800, color: cfg.color,
        marginTop: '0.5rem',
      }}>
        {initials}
      </div>
      <div style={{ textAlign: 'center', minWidth: 0, width: '100%' }}>
        <div style={{
          fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {row.username}
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
          {row.submissionCount} video{row.submissionCount !== 1 ? 's' : ''}
        </div>
      </div>
      <div style={{
        fontWeight: 800, fontSize: '1.05rem', color: cfg.color,
        letterSpacing: '-0.02em',
      }}>
        {formatCurrency(row.totalEarned)}
      </div>
    </div>
  )
}

function CampaignLeaderboard({ campaignId }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLeaderboard(campaignId)
      .then(res => { if (!res.ok) throw new Error(); return res.json() })
      .then(data => setRows(Array.isArray(data) ? data : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false))
  }, [campaignId])

  const podium = rows.slice(0, 3)
  const rest   = rows.slice(3)

  return (
    <div className="detail-section">
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
        <div style={{
          width: 34, height: 34, borderRadius: '10px',
          background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0,
        }}>🏆</div>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Creator Leaderboard
          </h2>
          <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Ranked by estimated earnings from eligible submissions
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-filter)',
          borderRadius: '16px', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)',
        }}>
          Loading leaderboard…
        </div>
      ) : rows.length === 0 ? (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-filter)',
          borderRadius: '16px', padding: '3rem', textAlign: 'center',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎯</div>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            No one's on the board yet
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            Submit an eligible video to claim the top spot
          </div>
        </div>
      ) : (
        <div>
          {/* Podium — top 3 */}
          {podium.length > 0 && (
            <div style={{
              display: 'flex', gap: '0.75rem', marginBottom: '0.75rem',
              paddingTop: '1.25rem',
            }}>
              {podium.map(r => <LeaderboardPodium key={r.rank} row={r} />)}
            </div>
          )}

          {/* Rows 4+ */}
          {rest.length > 0 && (
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-filter)',
              borderRadius: '14px', overflow: 'hidden',
            }}>
              {rest.map((r, i) => (
                <div key={r.rank} style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '0.85rem 1.1rem',
                  borderBottom: i < rest.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--hover-bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Rank */}
                  <div style={{
                    width: 28, textAlign: 'center', fontWeight: 700,
                    fontSize: '0.82rem', color: 'var(--text-muted)', flexShrink: 0,
                  }}>
                    #{r.rank}
                  </div>

                  {/* Avatar */}
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.78rem', fontWeight: 800, color: 'var(--green-400)',
                  }}>
                    {r.username?.slice(0, 2).toUpperCase()}
                  </div>

                  {/* Username */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {r.username}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {r.submissionCount} video{r.submissionCount !== 1 ? 's' : ''} · {formatViews(r.totalViews)} views
                    </div>
                  </div>

                  {/* Earnings */}
                  <div style={{
                    fontWeight: 700, fontSize: '0.9rem', color: 'var(--green-400)',
                    flexShrink: 0,
                  }}>
                    {formatCurrency(r.totalEarned)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Main Page ────────────────────────────────────────────────── */
function CampaignDetailPage({ isDark, setIsDark }) {
  const { id } = useParams()
  const { user } = useAuth()
  const [campaign, setCampaign] = useState(undefined)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)

  // Registration state
  const [registered, setRegistered] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [registerError, setRegisterError] = useState('')

  // Load campaign
  useEffect(() => {
    let cancelled = false
    setCampaign(undefined)
    const load = async () => {
      try {
        const res = await getCampaignById(id)
        if (res.ok) { const data = await res.json(); if (!cancelled) setCampaign(data); return }
      } catch {}
      if (!cancelled) setCampaign(null)
    }
    load()
    return () => { cancelled = true }
  }, [id])

  // Check registration status (only when logged in)
  useEffect(() => {
    if (!user) return
    checkIsRegistered(id)
      .then(res => res?.ok ? res.json() : false)
      .then(val => setRegistered(val === true))
      .catch(() => {})
  }, [id, user])

  const handleRegister = async () => {
    setRegistering(true)
    setRegisterError('')
    try {
      const res = await registerForCampaign(id)
      if (!res || !res.ok) {
        const data = await res?.json().catch(() => ({}))
        setRegisterError(data?.message || 'Registration failed. Please try again.')
        return
      }
      setRegistered(true)
    } catch {
      setRegisterError('Could not connect to server. Please try again.')
    } finally {
      setRegistering(false)
    }
  }

  const budgetPercent = campaign ? Math.min(100, ((campaign.budgetUsed || 0) / (campaign.totalBudget || 1)) * 100) : 0

  if (campaign === undefined) {
    return (
      <div className="app">
        <Navbar isDark={isDark} setIsDark={setIsDark} profileOpen={profileOpen} setProfileOpen={setProfileOpen} profileRef={profileRef} />
        <div className="campaign-detail-page page-container"><div className="loading">Loading campaign...</div></div>
      </div>
    )
  }

  if (campaign === null) {
    return (
      <div className="app">
        <Navbar isDark={isDark} setIsDark={setIsDark} profileOpen={profileOpen} setProfileOpen={setProfileOpen} profileRef={profileRef} />
        <div className="campaign-detail-page page-container">
          <Link to="/" className="card-detail-back">← Back to campaigns</Link>
          <div className="empty-state"><p>Campaign not found.</p></div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <Navbar isDark={isDark} setIsDark={setIsDark} profileOpen={profileOpen} setProfileOpen={setProfileOpen} profileRef={profileRef} />
      <div className="campaign-detail-page page-container">
        <Link to="/" className="card-detail-back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Back to campaigns
        </Link>

        {/* ── Hero card ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--bg-card)', border: '1px solid var(--border-filter)',
          borderRadius: '20px', padding: '2rem 2.5rem',
          marginBottom: '2rem', gap: '2rem', flexWrap: 'wrap',
          boxShadow: '0 4px 24px var(--shadow-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1, minWidth: 0 }}>
            <div className="detail-hero-image" style={{ overflow: 'hidden', flexShrink: 0 }}>
              {campaign.thumbnailUrl
                ? <img src={campaign.thumbnailUrl} alt={campaign.title} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                : <span className="card-letter">{campaign.title?.[0]?.toUpperCase()}</span>
              }
            </div>
            <div className="detail-hero-info">
              <div className="detail-hero-badges">
                <Badge label={campaign.category} />
                <StatusBadge status={campaign.campaignStatus} />
                <PlatformStack platforms={campaign.platforms} />
              </div>
              <h1 className="detail-hero-title" style={{ margin: 0 }}>{campaign.title}</h1>
            </div>
          </div>
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--green-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
              Rate per 1M Views
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--green-400)', lineHeight: 1, letterSpacing: '-0.03em' }}>
              {formatCurrency(campaign.ratePerMillion)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              per 1M views
            </div>
          </div>
        </div>

        {/* ── Stats grid ── */}
        <div className="detail-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="detail-stat-card">
            <span className="detail-stat-label">Total Budget</span>
            <span className="detail-stat-value">{formatCurrency(campaign.totalBudget)}</span>
          </div>
          <div className="detail-stat-card">
            <span className="detail-stat-label">Budget Used</span>
            <span className="detail-stat-value">{formatCurrency(campaign.budgetUsed)}</span>
          </div>
          <div className="detail-stat-card">
            <span className="detail-stat-label">Ends At</span>
            <span className="detail-stat-value">{campaign.endsAt ? new Date(campaign.endsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
          </div>
        </div>

        {/* ── Budget bar ── */}
        <div className="detail-budget-bar">
          <div className="detail-budget-label">Budget Progress ({budgetPercent.toFixed(0)}%)</div>
          <div className="detail-budget-track">
            <div className="detail-budget-fill" style={{ width: `${budgetPercent}%` }}></div>
          </div>
        </div>

        {/* ── Description ── */}
        {campaign.description && (
          <div className="detail-section">
            <h2 className="detail-section-title">Description</h2>
            <p className="detail-section-text">{campaign.description}</p>
          </div>
        )}

        {/* ── Register / Status section ── */}
        <div style={{ margin: '2.5rem 0' }}>
          {campaign.campaignStatus === 'ACTIVE' ? (
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-filter)',
              borderRadius: '16px', padding: '1.75rem 2rem',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: '1.5rem', flexWrap: 'wrap',
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                  {registered ? 'You\'re registered for this campaign' : 'Join this campaign'}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {registered
                    ? 'Go to My Campaigns to submit your videos and track your earnings.'
                    : 'Register to participate and submit your videos from the My Campaigns page.'}
                </div>
                {registerError && (
                  <div style={{ fontSize: '0.8rem', color: '#f87171', marginTop: '0.5rem' }}>
                    ⚠️ {registerError}
                  </div>
                )}
              </div>

              {!user ? (
                <Link to="/login" style={{
                  padding: '11px 28px', borderRadius: '12px', fontWeight: 700,
                  fontSize: '0.9rem', textDecoration: 'none', flexShrink: 0,
                  background: 'linear-gradient(135deg, #37ba8c, #2fa97f)', color: '#fff',
                  boxShadow: '0 4px 16px rgba(55,186,140,0.25)',
                }}>
                  Login to Register
                </Link>
              ) : registered ? (
                <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '11px 20px', borderRadius: '12px',
                    background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)',
                    color: '#34d399', fontWeight: 700, fontSize: '0.9rem',
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    Registered
                  </div>
                  <Link to="/my-campaigns" style={{
                    padding: '11px 20px', borderRadius: '12px', fontWeight: 700,
                    fontSize: '0.9rem', textDecoration: 'none', flexShrink: 0,
                    background: 'linear-gradient(135deg, #37ba8c, #2fa97f)', color: '#fff',
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                  }}>
                    Submit Video →
                  </Link>
                </div>
              ) : (
                <button
                  onClick={handleRegister}
                  disabled={registering}
                  style={{
                    padding: '11px 32px', borderRadius: '12px', border: 'none',
                    background: registering ? 'rgba(55,186,140,0.4)' : 'linear-gradient(135deg, #37ba8c, #2fa97f)',
                    color: '#fff', fontWeight: 700, fontSize: '0.9rem',
                    cursor: registering ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', flexShrink: 0,
                    boxShadow: registering ? 'none' : '0 4px 16px rgba(55,186,140,0.25)',
                    transition: 'all 0.2s',
                  }}
                >
                  {registering ? 'Registering…' : '+ Register for Campaign'}
                </button>
              )}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '1.25rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-filter)',
              borderRadius: '12px',
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
            }}>
              {campaign.campaignStatus === 'ENDED' ? '🏁 This campaign has ended' : '⏳ This campaign hasn\'t started yet'}
            </div>
          )}
        </div>

        {/* ── Leaderboard ── */}
        <CampaignLeaderboard campaignId={id} />
      </div>
    </div>
  )
}

export default CampaignDetailPage
