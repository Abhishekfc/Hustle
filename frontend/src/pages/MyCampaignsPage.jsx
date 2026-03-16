import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Sidebar from '../components/layout/Sidebar'
import CampaignFilter from '../components/campaigns/CampaignFilter'
import { api } from '../api/client'
import { formatCurrency } from '../utils/formatCurrency'

/* ── Color Helpers ───────────────────────────────────────────── */
const getCategoryColor = (category) => {
  const map = {
    CLIPPING: { bg: 'rgba(239,68,68,0.18)', text: '#ef4444' },
    UGC: { bg: 'rgba(96,165,250,0.15)', text: '#60a5fa' },
    MUSIC: { bg: 'rgba(239,68,68,0.18)', text: '#ef4444' },
    GENERAL: { bg: 'rgba(96,165,250,0.15)', text: '#60a5fa' },
    LOGO: { bg: 'rgba(52,211,153,0.15)', text: '#34d399' },
    OTHER: { bg: 'rgba(156,163,175,0.15)', text: '#9ca3af' },
  }
  return map[category] || map.OTHER
}

function MyCampaignsPage({ isDark, setIsDark }) {
  const [campaignEntries, setCampaignEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState('All')
  const profileRef = useRef(null)

  // Submit modal state
  const [showModal, setShowModal] = useState(false)
  const [modalCampaignId, setModalCampaignId] = useState(null)
  const [modalCampaignTitle, setModalCampaignTitle] = useState('')
  const [submitUrl, setSubmitUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [userAccounts, setUserAccounts] = useState([])

  const openSubmitForCampaign = (campaignId, title) => {
    setModalCampaignId(campaignId)
    setModalCampaignTitle(title)
    setSubmitUrl('')
    setSubmitError('')
    setSubmitSuccess(false)
    setShowModal(true)
  }

  // Load verified connected accounts
  useEffect(() => {
    api('/accounts').then(r => r.json()).then(data => {
      setUserAccounts(Array.isArray(data) ? data.filter(a => a.verificationStatus === 'VERIFIED') : [])
    }).catch(() => setUserAccounts([]))
  }, [])

  // Load submissions grouped by campaign
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const subsRes = await api('/submissions/me')
        const subs = await subsRes.json()
        if (!Array.isArray(subs)) { setLoading(false); return }

        const campaignMap = {}
        for (const sub of subs) {
          const cId = sub.campaign?.id || sub.campaignId
          if (!campaignMap[cId]) {
            campaignMap[cId] = {
              campaignId: cId,
              campaignTitle: sub.campaign?.title || sub.campaignTitle,
              submissions: [],
              campaign: sub.campaign || null
            }
          }
          campaignMap[cId].submissions.push(sub)
        }

        const entries = Object.values(campaignMap)
        const enriched = await Promise.all(
          entries.map(async (entry) => {
            if (entry.campaign && entry.campaign.title) return entry
            try {
              const campRes = await api(`/campaigns/${entry.campaignId}`)
              const camp = await campRes.json()
              return { ...entry, campaign: camp }
            } catch {
              return { ...entry, campaign: null }
            }
          })
        )

        setCampaignEntries(enriched)
      } catch (e) {
        setError('Failed to load campaigns')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [refreshKey])

  // Submit handler
  const handleModalSubmit = async () => {
    setSubmitError('')
    if (!submitUrl.trim()) { setSubmitError('Please enter a video URL'); return }

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
          campaignId: parseInt(modalCampaignId),
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
      setRefreshKey(k => k + 1)
    } catch {
      setSubmitError('Could not connect to server. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Compute earnings for a campaign entry using backend formula:
  // earnings = (viewCount / 1,000,000) * ratePerMillion
  const computeEarnings = (entry) => {
    const ratePerMillion = entry.campaign?.ratePerMillion || 0
    let total = 0
    for (const sub of entry.submissions) {
      if (sub.status === 'ELIGIBLE' && sub.viewCount > 0) {
        total += (sub.viewCount / 1_000_000) * ratePerMillion
      }
    }
    return total
  }

  // Get payment status
  const getPaymentStatus = (entry) => {
    const campStatus = entry.campaign?.campaignStatus
    if (campStatus === 'ACTIVE') return null
    if (campStatus === 'ENDED') {
      const hasEarnings = computeEarnings(entry) > 0
      if (hasEarnings) return { label: '✓ Paid Out', color: '#34d399' }
      return { label: '⏳ Processing', color: '#fbbf24' }
    }
    return null
  }

  // Filter campaigns by category
  const filteredEntries = activeFilter === 'All'
    ? campaignEntries
    : campaignEntries.filter(e => e.campaign?.category === activeFilter)

  return (
    <div className="home-with-sidebar">
      <Navbar isDark={isDark} setIsDark={setIsDark} profileOpen={profileOpen} setProfileOpen={setProfileOpen} profileRef={profileRef} />
      <Sidebar>
        <CampaignFilter activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
      </Sidebar>
      <div className="main-offset">
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem', letterSpacing: '-0.03em' }}>My Campaigns</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Campaigns you've participated in</p>
        </div>

        {/* Info Banner */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.6rem',
          padding: '0.7rem 1rem',
          background: 'rgba(96,165,250,0.1)',
          border: '1px solid rgba(96,165,250,0.2)',
          borderRadius: '10px',
          marginBottom: '1.5rem',
          fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5
        }}>
          <span style={{ color: '#60a5fa', fontSize: '0.85rem', flexShrink: 0 }}>ℹ️</span>
          <span>
            Earnings will be credited to your Wallet. Please go to the{' '}
            <Link to="/wallet" style={{ color: '#60a5fa', fontWeight: 600, textDecoration: 'none' }}>Balance</Link>
            {' '}page to withdraw your earnings. All posts are subject to review and earnings are not final.
          </span>
        </div>

        {loading ? (
          <div className="loading">Loading…</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#f87171' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
            <p>{error}</p>
            <button
              onClick={() => setRefreshKey(k => k + 1)}
              style={{
                padding: '8px 20px', borderRadius: '10px', border: 'none',
                background: 'linear-gradient(135deg, #37ba8c, #2fa97f)',
                color: '#fff', fontWeight: 600, cursor: 'pointer', marginTop: '0.5rem'
              }}
            >
              Retry
            </button>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              {campaignEntries.length === 0 ? 'No campaigns yet' : 'No campaigns in this category'}
            </h3>
            <p style={{ marginBottom: '1.5rem' }}>
              {campaignEntries.length === 0
                ? "You haven't joined any campaigns yet. Browse campaigns to get started."
                : 'Try selecting a different filter from the sidebar.'}
            </p>
            {campaignEntries.length === 0 && (
              <Link to="/" style={{
                padding: '10px 24px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #37ba8c, #2fa97f)',
                color: '#fff', fontWeight: 600, textDecoration: 'none', display: 'inline-block'
              }}>
                Browse Campaigns →
              </Link>
            )}
          </div>
        ) : (
          /* Campaign Cards Grid */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '1.25rem'
          }}>
            {filteredEntries.map(entry => {
              const camp = entry.campaign
              const catColor = getCategoryColor(camp?.category)
              const earnings = computeEarnings(entry)
              const paymentStatus = getPaymentStatus(entry)
              const budgetPercent = camp ? Math.min(100, ((camp.budgetUsed || 0) / (camp.totalBudget || 1)) * 100) : 0

              return (
                <div key={entry.campaignId} style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-filter)',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px var(--shadow-color)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 28px var(--shadow-strong)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px var(--shadow-color)' }}
                >
                  {/* Thumbnail Area */}
                  <div style={{
                    height: 110,
                    position: 'relative',
                    background: camp?.thumbnailUrl
                      ? `url(${camp.thumbnailUrl}) center/cover no-repeat`
                      : 'linear-gradient(145deg, var(--green-400), var(--green-700))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {!camp?.thumbnailUrl && (
                      <span style={{
                        width: 48, height: 48, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.5rem', fontWeight: 800, color: 'rgba(255,255,255,0.9)'
                      }}>
                        {camp?.title?.[0]?.toUpperCase() || '?'}
                      </span>
                    )}
                    {/* Category badge */}
                    {camp?.category && (
                      <span style={{
                        position: 'absolute', bottom: 8, left: 8,
                        padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700,
                        background: catColor.bg, color: catColor.text,
                        backdropFilter: 'blur(8px)',
                        border: `1px solid ${catColor.text}30`
                      }}>
                        {camp.category}
                      </span>
                    )}
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: '0.75rem 0.85rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Title */}
                    <h3 style={{
                      margin: '0 0 0.5rem', fontSize: '0.85rem', fontWeight: 700,
                      color: 'var(--text-primary)', lineHeight: 1.3,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}>
                      {camp?.title || entry.campaignTitle}
                    </h3>

                    {/* Earnings */}
                    <div style={{ textAlign: 'center', marginBottom: '0.4rem' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.15rem' }}>
                        Your Earnings
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                        {formatCurrency(earnings)}
                      </div>
                      {paymentStatus && (
                        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: paymentStatus.color, marginTop: '0.15rem' }}>
                          {paymentStatus.label}
                        </div>
                      )}
                    </div>

                    {/* Completion progress */}
                    <div style={{ marginBottom: '0.5rem' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--green-400)', marginBottom: '0.2rem' }}>
                        {budgetPercent.toFixed(1)}%
                      </div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                        campaign completion
                      </div>
                      <div style={{ width: '100%', height: 5, background: 'var(--border-filter)', borderRadius: '99px' }}>
                        <div style={{
                          width: `${budgetPercent}%`, height: '100%', borderRadius: '99px',
                          background: 'linear-gradient(90deg, var(--green-400), var(--green-600))',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem', fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                        <span>{formatCurrency(camp?.budgetUsed || 0)}</span>
                        <span>{formatCurrency(camp?.totalBudget || 0)}</span>
                      </div>
                    </div>

                    {/* Campaign ended message */}
                    {camp?.campaignStatus === 'ENDED' && (
                      <div style={{
                        fontSize: '0.68rem', color: 'var(--text-muted)',
                        textAlign: 'center', marginBottom: '0.5rem', lineHeight: 1.4
                      }}>
                        Campaign has ended.{' '}
                        {paymentStatus?.label === '✓ Paid Out'
                          ? 'Earnings have been paid out.'
                          : 'Payout is being processed.'}
                      </div>
                    )}

                    {/* Spacer */}
                    <div style={{ flex: 1 }} />

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.35rem' }}>
                      {/* Your Submissions — navigates to separate page */}
                      <Link
                        to={`/my-campaigns/${entry.campaignId}/submissions`}
                        style={{
                          width: '100%', padding: '6px 10px',
                          background: 'var(--hover-bg)',
                          border: '1px solid var(--border-filter)',
                          borderRadius: '8px',
                          color: 'var(--text-primary)',
                          fontSize: '0.78rem', fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                          textDecoration: 'none',
                          transition: 'all 0.2s ease',
                          boxSizing: 'border-box'
                        }}
                      >
                        Your Submissions
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          minWidth: 18, height: 18, borderRadius: '5px',
                          background: 'var(--green-500)', color: '#fff',
                          fontSize: '0.65rem', fontWeight: 700, padding: '0 4px'
                        }}>
                          {entry.submissions.length}
                        </span>
                      </Link>

                      {/* Campaign Details */}
                      <Link
                        to={`/campaign/${entry.campaignId}`}
                        style={{
                          width: '100%', padding: '6px 10px',
                          background: 'var(--hover-bg)',
                          border: '1px solid var(--border-filter)',
                          borderRadius: '8px',
                          color: 'var(--text-primary)',
                          fontSize: '0.78rem', fontWeight: 600,
                          cursor: 'pointer', textDecoration: 'none',
                          textAlign: 'center',
                          transition: 'all 0.2s ease',
                          display: 'block', boxSizing: 'border-box'
                        }}
                      >
                        Campaign Details
                      </Link>

                      {/* Submit button */}
                      {camp?.campaignStatus === 'ACTIVE' && (
                        <button
                          onClick={() => openSubmitForCampaign(entry.campaignId, camp?.title)}
                          style={{
                            width: '100%', padding: '7px 10px',
                            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                            border: 'none', borderRadius: '8px',
                            color: '#fff', fontSize: '0.8rem', fontWeight: 700,
                            cursor: 'pointer', transition: 'all 0.2s ease',
                            fontFamily: 'inherit'
                          }}
                        >
                          Submit
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Submit Video Modal ── */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem'
        }} onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(false); setSubmitSuccess(false); setSubmitError(''); setSubmitUrl('') } }}>
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
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1.3rem' }}>
                  Video Submitted!
                </h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                  Your submission has been received and will appear below.
                </p>
                <button
                  onClick={() => { setShowModal(false); setSubmitSuccess(false) }}
                  style={{
                    padding: '10px 24px', borderRadius: '10px', border: 'none',
                    background: 'linear-gradient(135deg, #37ba8c, #2fa97f)',
                    color: '#fff', fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Submit Your Video
                    </h3>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {modalCampaignTitle}
                    </p>
                  </div>
                  <button
                    onClick={() => { setShowModal(false); setSubmitError(''); setSubmitUrl('') }}
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
                    onKeyDown={e => e.key === 'Enter' && handleModalSubmit()}
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
                  onClick={handleModalSubmit}
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

export default MyCampaignsPage
