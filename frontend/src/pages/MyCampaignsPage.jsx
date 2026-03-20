import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Video, ExternalLink, Clock, CheckCircle } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Sidebar from '../components/layout/Sidebar'
import CampaignFilter from '../components/campaigns/CampaignFilter'
import { PlatformStack } from '../components/shared/PlatformIcons'
import { api } from '../api/client'
import { getMyRegistrations } from '../api/campaignApi'
import { formatCurrency } from '../utils/formatCurrency'
import '../components/campaigns/CampaignCard.css'

const CAT_STYLE = {
  CLIPPING: { bg: 'rgba(239,68,68,0.12)',   text: '#f87171' },
  UGC:      { bg: 'rgba(96,165,250,0.12)',   text: '#60a5fa' },
  MUSIC:    { bg: 'rgba(167,139,250,0.12)',  text: '#a78bfa' },
  LOGO:     { bg: 'rgba(52,211,153,0.12)',   text: '#34d399' },
  OTHER:    { bg: 'rgba(156,163,175,0.12)', text: '#9ca3af' },
}

function MyCampaignsPage({ isDark, setIsDark }) {
  const navigate = useNavigate()
  const [campaignEntries, setCampaignEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState('All')
  const [refreshKey, setRefreshKey] = useState(0)
  const profileRef = useRef(null)

  // Submit modal state
  const [showModal, setShowModal] = useState(false)
  const [modalCampaignId, setModalCampaignId] = useState(null)
  const [modalCampaignTitle, setModalCampaignTitle] = useState('')
  const [submitUrl, setSubmitUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [userAccounts, setUserAccounts] = useState([])
  const [payoutMap, setPayoutMap] = useState({}) // campaignId → payoutStatus

  const openSubmitForCampaign = (campaignId, title) => {
    setModalCampaignId(campaignId); setModalCampaignTitle(title)
    setSubmitUrl(''); setSubmitError(''); setSubmitSuccess(false); setShowModal(true)
  }

  useEffect(() => {
    api('/accounts').then(r => r.json()).then(data => {
      setUserAccounts(Array.isArray(data) ? data.filter(a => a.verificationStatus === 'VERIFIED') : [])
    }).catch(() => setUserAccounts([]))

    // Build campaignId → best payoutStatus map
    api('/earnings/me').then(r => r.json()).then(data => {
      if (!Array.isArray(data)) return
      // Priority: PAID > PROCESSING > PENDING > VOIDED
      const priority = { PAID: 4, PROCESSING: 3, PENDING: 2, VOIDED: 1 }
      const map = {}
      for (const e of data) {
        const cId = e.campaign?.id
        if (!cId) continue
        if (!map[cId] || (priority[e.payoutStatus] || 0) > (priority[map[cId]] || 0)) {
          map[cId] = e.payoutStatus
        }
      }
      setPayoutMap(map)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError('')
      try {
        // Fetch registered campaigns + submissions in parallel
        const [regsRes, subsRes] = await Promise.all([
          getMyRegistrations(),
          api('/submissions/me'),
        ])

        // registrationOrder preserves the latest-first order from the backend
        const registrationOrder = []
        const campaignMap = {}

        // Seed map from registrations (may have 0 submissions), already sorted newest-first by backend
        if (regsRes?.ok) {
          const regs = await regsRes.json()
          if (Array.isArray(regs)) {
            for (const { campaign: camp, registeredAt } of regs) {
              campaignMap[camp.id] = { campaignId: camp.id, submissions: [], campaign: camp, registeredAt }
              registrationOrder.push(camp.id)
            }
          }
        }

        // Add/merge submissions (handles old data with no registration record)
        if (subsRes?.ok) {
          const subs = await subsRes.json()
          if (Array.isArray(subs)) {
            for (const sub of subs) {
              const cId = sub.campaign?.id || sub.campaignId
              if (!campaignMap[cId]) {
                campaignMap[cId] = { campaignId: cId, submissions: [], campaign: sub.campaign || null, registeredAt: null }
                registrationOrder.push(cId)
              }
              campaignMap[cId].submissions.push(sub)
            }
          }
        }

        // Build final list: registered campaigns first (newest first), then any orphan submission-only entries
        const ordered = registrationOrder.map(id => campaignMap[id]).filter(Boolean)
        setCampaignEntries(ordered)
      } catch { setError('Failed to load campaigns') }
      finally { setLoading(false) }
    }
    load()
  }, [refreshKey])

  const handleModalSubmit = async () => {
    setSubmitError('')
    if (!submitUrl.trim()) { setSubmitError('Please enter a video URL'); return }
    const url = submitUrl.toLowerCase()
    let platform = null
    if (url.includes('youtube.com') || url.includes('youtu.be')) platform = 'YOUTUBE'
    else if (url.includes('tiktok.com')) platform = 'TIKTOK'
    else if (url.includes('instagram.com')) platform = 'INSTAGRAM'
    else if (url.includes('x.com') || url.includes('twitter.com')) platform = 'X'
    if (!platform) { setSubmitError('Please enter a valid YouTube, TikTok, Instagram, or X video URL'); return }
    const acct = userAccounts.find(a => a.platform === platform)
    if (!acct) { setSubmitError(`No verified ${platform} account connected. Go to Connected Accounts to add one.`); return }
    setSubmitting(true)
    try {
      const res = await api('/submissions', {
        method: 'POST',
        body: JSON.stringify({ campaignId: parseInt(modalCampaignId), accountId: acct.id, videoUrl: submitUrl.trim() })
      })
      const data = await res.json()
      if (!res.ok) { setSubmitError(data.message || 'Submission failed.'); return }
      setSubmitSuccess(true); setSubmitUrl('')
      setRefreshKey(k => k + 1)
    } catch { setSubmitError('Could not connect to server.') }
    finally { setSubmitting(false) }
  }

  const computeEarnings = (entry) => {
    const rate = entry.campaign?.ratePerMillion || 0
    return entry.submissions.reduce((sum, sub) =>
      sub.status === 'ELIGIBLE' && sub.viewCount > 0
        ? sum + (sub.viewCount / 1_000_000) * rate
        : sum
    , 0)
  }

  const isPaidOut = (entry) =>
    payoutMap[entry.campaignId] === 'PAID' || entry.campaign?.distributed === true

  const filtered = (activeFilter === 'All'
    ? campaignEntries
    : campaignEntries.filter(e => e.campaign?.category === activeFilter)
  ).slice().sort((a, b) => {
    const aPaid = isPaidOut(a) ? 1 : 0
    const bPaid = isPaidOut(b) ? 1 : 0
    return aPaid - bPaid // paid campaigns sink to the end, original order preserved otherwise
  })

  return (
    <div className="home-with-sidebar">
      <Navbar isDark={isDark} setIsDark={setIsDark} profileOpen={profileOpen} setProfileOpen={setProfileOpen} profileRef={profileRef} />
      <Sidebar>
        <CampaignFilter activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
      </Sidebar>

      <div className="main-offset">
        <div style={{ marginBottom: '0.75rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.2rem', letterSpacing: '-0.03em' }}>
            My Campaigns
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
            Campaigns you've participated in
          </p>
        </div>

        {/* Info banner */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
          padding: '0.8rem 1rem',
          background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.18)',
          borderRadius: '12px', marginTop: '1rem', marginBottom: '2rem',
          fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5,
        }}>
          <Clock size={14} style={{ color: '#60a5fa', flexShrink: 0, marginTop: '1px' }} strokeWidth={2} />
          <span>
            Earnings are credited to your{' '}
            <Link to="/wallet" style={{ color: '#60a5fa', fontWeight: 600, textDecoration: 'none' }}>Wallet</Link>
            {' '}after campaign review. All posts are subject to review — earnings are not final until campaign ends.
          </span>
        </div>

        {loading ? (
          <div className="loading">Loading…</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#f87171' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
            <p>{error}</p>
            <button onClick={() => setRefreshKey(k => k + 1)} style={{ padding: '8px 20px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #37ba8c, #2fa97f)', color: '#fff', fontWeight: 600, cursor: 'pointer', marginTop: '0.75rem' }}>
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1.1rem', fontWeight: 700 }}>
              {campaignEntries.length === 0 ? 'No campaigns yet' : 'No campaigns in this category'}
            </h3>
            <p style={{ marginBottom: '1.5rem', fontSize: '0.88rem' }}>
              {campaignEntries.length === 0
                ? "You haven't joined any campaigns yet."
                : 'Try selecting a different filter.'}
            </p>
            {campaignEntries.length === 0 && (
              <Link to="/" style={{ padding: '10px 24px', borderRadius: '10px', background: 'linear-gradient(135deg, #37ba8c, #2fa97f)', color: '#fff', fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}>
                Browse Campaigns →
              </Link>
            )}
          </div>
        ) : (
          /* ── Card Grid ── */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.1rem' }}>
            {filtered.map(entry => {
              const camp = entry.campaign
              const isEnded = camp?.campaignStatus === 'ENDED'
              const cs = CAT_STYLE[camp?.category] || CAT_STYLE.OTHER
              const earnings = computeEarnings(entry)
              const budgetUsed = parseFloat(camp?.budgetUsed || 0)
              const totalBudget = parseFloat(camp?.totalBudget || 1)
              const budgetPct = Math.min(100, (budgetUsed / totalBudget) * 100)
              const initial = camp?.title?.[0]?.toUpperCase() || '?'
              const platforms = camp?.platforms || []

              return (
                <div
                  key={entry.campaignId}
                  className="campaign-card"
                  style={{ cursor: 'pointer', opacity: isEnded ? 0.9 : 1 }}
                  onClick={() => navigate(`/my-campaigns/${entry.campaignId}/submissions`)}
                >
                  {/* ── Image area ── */}
                  <div className="campaign-card-image">
                    {camp?.thumbnailUrl
                      ? <img src={camp.thumbnailUrl} alt={camp.title} className="campaign-card-img" />
                      : <span className="campaign-card-letter">{initial}</span>
                    }

                    {/* Category badge — top left */}
                    <span className="campaign-card-cat" style={{
                      position: 'absolute', top: 11, left: 11, zIndex: 2,
                      background: cs.bg, color: cs.text,
                      backdropFilter: 'blur(8px)',
                      margin: 0,
                    }}>
                      {camp?.category || '—'}
                    </span>

                    {/* Status badge — top right */}
                    <span className={`campaign-card-status-badge ${isEnded ? 'ended' : 'active'}`}>
                      <span className="campaign-card-status-dot" />
                      {camp?.campaignStatus || '—'}
                    </span>

                    {/* Title + platforms overlay — bottom */}
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)',
                      padding: '2rem 0.85rem 0.7rem',
                      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '0.5rem',
                    }}>
                      <h3 style={{
                        margin: 0, fontSize: '0.88rem', fontWeight: 700,
                        color: '#fff', lineHeight: 1.35, flex: 1,
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                      }}>
                        {camp?.title || 'Campaign'}
                      </h3>
                      {platforms.length > 0 && (
                        <div style={{ flexShrink: 0 }}>
                          <PlatformStack platforms={platforms} size={20} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Body ── */}
                  <div className="campaign-card-body" style={{ gap: '0.75rem' }}>

                    {/* My Earnings — centered */}
                    <div style={{
                      padding: '0.75rem 0.9rem',
                      background: earnings > 0
                        ? 'linear-gradient(135deg, rgba(52,211,153,0.12), rgba(16,185,129,0.06))'
                        : 'var(--hover-bg)',
                      border: `1px solid ${earnings > 0 ? 'rgba(52,211,153,0.25)' : 'var(--border-filter)'}`,
                      borderRadius: '12px',
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>My Earnings</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, color: earnings > 0 ? 'var(--green-400)' : 'var(--text-primary)' }}>
                        {formatCurrency(earnings)}
                      </div>
                    </div>

                    {/* Budget bar OR payout status */}
                    {isEnded ? (() => {
                      const status = payoutMap[entry.campaignId]
                      const isPaid = status === 'PAID' || camp?.distributed === true
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                          {isPaid
                            ? <CheckCircle size={13} strokeWidth={2} style={{ color: '#34d399', flexShrink: 0 }} />
                            : <Clock size={13} strokeWidth={2} style={{ color: '#fbbf24', flexShrink: 0 }} />
                          }
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isPaid ? '#34d399' : '#fbbf24' }}>
                            {isPaid ? 'Paid Out' : 'Payment Processing'}
                          </span>
                        </div>
                      )
                    })() : (
                      <div className="campaign-card-budget">
                        <div className="campaign-card-budget-header">
                          <span className="campaign-card-budget-label">Budget Used</span>
                          <span className="campaign-card-budget-pct">{budgetPct.toFixed(0)}%</span>
                        </div>
                        <div className="campaign-card-budget-track">
                          <div className="campaign-card-budget-fill" style={{ width: `${budgetPct}%` }} />
                        </div>
                        <div className="campaign-card-budget-amounts">
                          <span>{formatCurrency(budgetUsed)}</span>
                          <span>{formatCurrency(totalBudget)}</span>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.45rem', marginTop: 'auto' }}>
                      <Link
                        to={`/campaign/${entry.campaignId}`}
                        onClick={e => e.stopPropagation()}
                        title="View campaign details"
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: 38, height: 34,
                          background: 'var(--hover-bg)', border: '1px solid var(--border-filter)',
                          borderRadius: '10px', color: 'var(--text-muted)',
                          textDecoration: 'none', transition: 'border-color 0.2s, color 0.2s',
                          flexShrink: 0,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--green-500)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-filter)'; e.currentTarget.style.color = 'var(--text-muted)' }}
                      >
                        <ExternalLink size={13} strokeWidth={2} />
                      </Link>
                      {/* Submit / View — center, takes remaining space */}
                      {camp?.campaignStatus === 'ACTIVE' ? (
                        <button
                          onClick={e => { e.stopPropagation(); openSubmitForCampaign(entry.campaignId, camp?.title) }}
                          style={{
                            flex: 1, height: 34,
                            background: 'linear-gradient(135deg, #37ba8c, #2fa97f)',
                            border: 'none', borderRadius: '10px',
                            color: '#fff', fontSize: '0.8rem', fontWeight: 700,
                            cursor: 'pointer', fontFamily: 'inherit',
                          }}
                        >
                          + Submit
                        </button>
                      ) : (
                        <div style={{
                          flex: 1, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'var(--hover-bg)', border: '1px solid var(--border-filter)',
                          borderRadius: '10px', color: 'var(--text-muted)',
                          fontSize: '0.72rem', fontWeight: 600,
                        }}>
                          View Submissions
                        </div>
                      )}
                      {/* Submissions count — same fixed size as ExternalLink button */}
                      <div
                        title={`${entry.submissions.length} submission${entry.submissions.length !== 1 ? 's' : ''}`}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                          width: 38, height: 34,
                          background: 'var(--hover-bg)', border: '1px solid var(--border-filter)',
                          borderRadius: '10px', flexShrink: 0,
                        }}
                      >
                        <Video size={11} strokeWidth={2} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                          {entry.submissions.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Submit Modal ── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={e => { if (e.target === e.currentTarget) { setShowModal(false); setSubmitSuccess(false); setSubmitError(''); setSubmitUrl('') } }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-filter)', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            {submitSuccess ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1.2rem', fontWeight: 700 }}>Video Submitted!</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>Your submission has been received.</p>
                <button onClick={() => { setShowModal(false); setSubmitSuccess(false) }} style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #37ba8c, #2fa97f)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                  Done
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Submit Your Video</h3>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{modalCampaignTitle}</p>
                  </div>
                  <button onClick={() => { setShowModal(false); setSubmitError(''); setSubmitUrl('') }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.4rem', lineHeight: 1, padding: '4px' }}>×</button>
                </div>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Video URL</label>
                  <input type="url" placeholder="https://youtube.com/shorts/... or tiktok.com/..." value={submitUrl}
                    onChange={e => { setSubmitUrl(e.target.value); setSubmitError('') }}
                    onKeyDown={e => e.key === 'Enter' && handleModalSubmit()}
                    style={{ width: '100%', padding: '12px 14px', background: 'var(--hover-bg)', border: `1px solid ${submitError ? '#ef4444' : 'var(--border-subtle)'}`, borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                    autoFocus />
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>Supported: YouTube, TikTok, Instagram Reels, X</p>
                </div>
                {submitError && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1.25rem' }}>⚠️ {submitError}</div>}
                {userAccounts.length > 0 && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Your verified accounts:</p>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {userAccounts.map(acc => (
                        <span key={acc.id} style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', background: 'rgba(16,185,129,0.1)', color: 'var(--green-400)', border: '1px solid rgba(16,185,129,0.2)', fontWeight: 600 }}>
                          {acc.platform} · {acc.handle}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {userAccounts.length === 0 && (
                  <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24', padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                    ⚠️ No verified accounts. <a href="/accounts" style={{ color: '#fbbf24', fontWeight: 700 }}>Connect one first →</a>
                  </div>
                )}
                <button onClick={handleModalSubmit} disabled={submitting || userAccounts.length === 0} style={{ width: '100%', padding: '13px', background: submitting || userAccounts.length === 0 ? 'rgba(55,186,140,0.4)' : 'linear-gradient(135deg, #37ba8c, #2fa97f)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.95rem', cursor: submitting || userAccounts.length === 0 ? 'not-allowed' : 'pointer' }}>
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

export default MyCampaignsPage
