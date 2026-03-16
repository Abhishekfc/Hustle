import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getCampaignById, getLeaderboard } from '../api/campaignApi'
import { api } from '../api/client'
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
function CampaignLeaderboard({ campaignId }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    getLeaderboard(campaignId)
      .then(res => { if (!res.ok) throw new Error(); return res.json() })
      .then(data => setRows(Array.isArray(data) ? data.slice(0, 10) : []))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false))
  }, [campaignId])

  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' }

  return (
    <div className="detail-section">
      <h2 className="detail-section-title">Creator Leaderboard</h2>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-filter)', borderRadius: '16px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading leaderboard…</div>
        ) : failed || rows.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎯</div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Be the first to submit and appear on the leaderboard!</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {failed ? 'Leaderboard coming soon.' : 'Register and submit your video to appear here.'}
            </div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-filter)' }}>
                {['Rank', 'Creator', 'Videos', 'Views', 'Earnings'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-filter)', background: r.rank === 1 ? 'rgba(16,185,129,0.06)' : 'transparent' }}>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700, fontSize: '1.1rem' }}>{medals[r.rank] || `#${r.rank}`}</td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{r.username}</td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{r.videosSubmitted}</td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{formatViews(r.totalViews)}</td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--green-400)' }}>{formatCurrency(r.totalEarned)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

/* ── Main Page ────────────────────────────────────────────────── */
function CampaignDetailPage({ isDark, setIsDark }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [campaign, setCampaign] = useState(undefined)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)

  // Submit modal state
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [submitUrl, setSubmitUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [userAccounts, setUserAccounts] = useState([])

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

  // Load verified connected accounts
  useEffect(() => {
    api('/accounts').then(r => r.json()).then(data => {
      setUserAccounts(Array.isArray(data) ? data.filter(a => a.verificationStatus === 'VERIFIED') : [])
    }).catch(() => setUserAccounts([]))
  }, [])

  // Submit handler — automatically match URL to connected account
  const handleSubmit = async () => {
    setSubmitError('')
    if (!submitUrl.trim()) { setSubmitError('Please enter a video URL'); return }

    // Detect platform from URL
    const url = submitUrl.toLowerCase()
    let matchedPlatform = null
    if (url.includes('youtube.com') || url.includes('youtu.be')) matchedPlatform = 'YOUTUBE'
    else if (url.includes('tiktok.com')) matchedPlatform = 'TIKTOK'
    else if (url.includes('instagram.com')) matchedPlatform = 'INSTAGRAM'
    else if (url.includes('x.com') || url.includes('twitter.com')) matchedPlatform = 'X'

    if (!matchedPlatform) {
      setSubmitError('Please enter a valid YouTube, TikTok, Instagram, or X video URL')
      return
    }

    // Find matching verified account for this platform
    const matchedAccount = userAccounts.find(a => a.platform === matchedPlatform)
    if (!matchedAccount) {
      setSubmitError(
        `You don't have a verified ${matchedPlatform} account connected. ` +
        `Go to Connected Accounts to add one.`
      )
      return
    }

    setSubmitting(true)
    try {
      const res = await api('/submissions', {
        method: 'POST',
        body: JSON.stringify({
          campaignId: parseInt(id),
          accountId: matchedAccount.id,
          videoUrl: submitUrl.trim()
        })
      })
      const data = await res.json()
      if (!res.ok) {
        setSubmitError(data.message || 'Submission failed. Please try again.')
        return
      }
      setSubmitSuccess(true)
      setSubmitUrl('')
    } catch {
      setSubmitError('Could not connect to server. Please try again.')
    } finally {
      setSubmitting(false)
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
          {/* Left side: icon + title + badges + platform icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1, minWidth: 0 }}>
            <div className="detail-hero-image">
              <span className="card-letter">{campaign.title?.[0]?.toUpperCase()}</span>
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
          {/* Right side: rate */}
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

        {/* ── Stats grid (3 items only) ── */}
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

        {/* ── Submit Video Button or Campaign Status Message ── */}
        {campaign.campaignStatus === 'ACTIVE' ? (
          <div style={{ textAlign: 'center', margin: '2.5rem 0' }}>
            <button
              onClick={() => setShowSubmitModal(true)}
              style={{
                padding: '14px 40px',
                background: 'linear-gradient(135deg, #37ba8c, #2fa97f)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(55, 186, 140, 0.3)',
                transition: 'all 0.2s ease',
                letterSpacing: '0.02em'
              }}
              onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
            >
              🎬 Submit Your Video
            </button>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.6rem' }}>
              Only verified connected accounts are accepted
            </p>
          </div>
        ) : (
          <div style={{ textAlign: 'center', margin: '2.5rem 0' }}>
            <div style={{
              display: 'inline-block',
              padding: '12px 28px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-filter)',
              borderRadius: '12px',
              color: 'var(--text-muted)',
              fontSize: '0.9rem'
            }}>
              {campaign.campaignStatus === 'ENDED' ? '🏁 This campaign has ended' : '⏳ This campaign hasn\'t started yet'}
            </div>
          </div>
        )}

        {/* ── Leaderboard ── */}
        <CampaignLeaderboard campaignId={id} />
      </div>

      {/* ── Submit Video Modal ── */}
      {showSubmitModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem'
        }} onClick={(e) => { if (e.target === e.currentTarget) { setShowSubmitModal(false); setSubmitSuccess(false); setSubmitError(''); setSubmitUrl('') }}}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-filter)',
            borderRadius: '20px',
            padding: '2rem',
            width: '100%',
            maxWidth: '480px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
          }}>
            {submitSuccess ? (
              /* Success state */
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1.3rem' }}>
                  Video Submitted!
                </h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                  Your submission has been received. View it in My Campaigns.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                  <button
                    onClick={() => { setShowSubmitModal(false); setSubmitSuccess(false) }}
                    style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Close
                  </button>
                  <a href="/my-campaigns" style={{
                    padding: '10px 20px', borderRadius: '10px', border: 'none',
                    background: 'linear-gradient(135deg, #37ba8c, #2fa97f)',
                    color: '#fff', fontWeight: 600, textDecoration: 'none',
                    display: 'inline-flex', alignItems: 'center'
                  }}>
                    View in My Campaigns →
                  </a>
                </div>
              </div>
            ) : (
              /* Input state */
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Submit Your Video
                    </h3>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {campaign?.title}
                    </p>
                  </div>
                  <button
                    onClick={() => { setShowSubmitModal(false); setSubmitError(''); setSubmitUrl('') }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.4rem', lineHeight: 1, padding: '4px' }}
                  >×</button>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Video URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://youtube.com/shorts/... or tiktok.com/..."
                    value={submitUrl}
                    onChange={e => { setSubmitUrl(e.target.value); setSubmitError('') }}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    style={{
                      width: '100%', padding: '12px 14px',
                      background: 'var(--bg-page)',
                      border: `1px solid ${submitError ? '#ef4444' : 'var(--border-subtle)'}`,
                      borderRadius: '10px', color: 'var(--text-primary)',
                      fontSize: '0.9rem', outline: 'none',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box'
                    }}
                    autoFocus
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                    Supported: YouTube, TikTok, Instagram Reels, X (Twitter)
                  </p>
                </div>

                {submitError && (
                  <div style={{
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                    color: '#f87171', padding: '10px 14px', borderRadius: '10px',
                    fontSize: '0.85rem', marginBottom: '1.25rem'
                  }}>
                    ⚠️ {submitError}
                  </div>
                )}

                {/* Show which accounts are connected */}
                {userAccounts.length > 0 && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                      Your verified accounts:
                    </p>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {userAccounts.map(acc => (
                        <span key={acc.id} style={{
                          padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem',
                          background: 'rgba(16,185,129,0.1)', color: 'var(--green-400)',
                          border: '1px solid rgba(16,185,129,0.2)', fontWeight: 600
                        }}>
                          {acc.platform} · {acc.handle}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {userAccounts.length === 0 && (
                  <div style={{
                    background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)',
                    color: '#fbbf24', padding: '10px 14px', borderRadius: '10px',
                    fontSize: '0.85rem', marginBottom: '1.25rem'
                  }}>
                    ⚠️ No verified accounts. <a href="/accounts" style={{ color: '#fbbf24', fontWeight: 700 }}>Connect one first →</a>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={submitting || userAccounts.length === 0}
                  style={{
                    width: '100%', padding: '13px',
                    background: submitting || userAccounts.length === 0
                      ? 'rgba(55,186,140,0.4)'
                      : 'linear-gradient(135deg, #37ba8c, #2fa97f)',
                    color: '#fff', border: 'none', borderRadius: '10px',
                    fontWeight: 700, fontSize: '0.95rem',
                    cursor: submitting || userAccounts.length === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  {submitting ? '⏳ Submitting...' : '🚀 Submit Video'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default CampaignDetailPage
