import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import { api } from '../api/client'
import { formatViews } from '../utils/formatViews'

/* ── Platform Icons ──────────────────────────────────────────── */
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
)
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.27 8.27 0 004.84 1.55V6.79a4.85 4.85 0 01-1.07-.1z" />
  </svg>
)
const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="#FF0000">
    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
)
const XIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)
const TrashIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
  </svg>
)

const PlatformIcon = ({ platform }) => {
  const icons = { YOUTUBE: YouTubeIcon, TIKTOK: TikTokIcon, INSTAGRAM: InstagramIcon, X: XIcon }
  const Icon = icons[platform]
  return Icon ? <Icon /> : null
}

const platformLabel = (p) => {
  const map = { YOUTUBE: 'YouTube', TIKTOK: 'TikTok', INSTAGRAM: 'Instagram', X: 'X' }
  return map[p] || p
}

const getSubmissionStatusStyle = (status) => {
  const map = {
    ELIGIBLE: { background: 'rgba(52,211,153,0.15)', color: '#34d399' },
    PENDING: { background: 'rgba(251,191,36,0.15)', color: '#fbbf24' },
    REJECTED: { background: 'rgba(239,68,68,0.15)', color: '#f87171' },
    INELIGIBLE: { background: 'rgba(156,163,175,0.15)', color: '#9ca3af' },
  }
  return map[status] || map.PENDING
}

const getSubmissionStatusLabel = (status) => {
  const map = {
    ELIGIBLE: 'Eligible',
    PENDING: 'Pending',
    REJECTED: 'Rejected',
    INELIGIBLE: 'Ineligible',
  }
  return map[status] || status
}

/* ── Main Page ─────────────────────────────────────────────────── */
function CampaignSubmissionsPage({ isDark, setIsDark }) {
  const { campaignId } = useParams()
  const [submissions, setSubmissions] = useState([])
  const [campaign, setCampaign] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        // Fetch all user submissions and filter by campaignId
        const subsRes = await api('/submissions/me')
        const allSubs = await subsRes.json()
        const campSubs = Array.isArray(allSubs)
          ? allSubs.filter(s => String(s.campaign?.id || s.campaignId) === String(campaignId))
          : []
        setSubmissions(campSubs)

        // Get campaign details
        if (campSubs.length > 0 && campSubs[0].campaign) {
          setCampaign(campSubs[0].campaign)
        } else {
          try {
            const campRes = await api(`/campaigns/${campaignId}`)
            const campData = await campRes.json()
            setCampaign(campData)
          } catch { setCampaign(null) }
        }
      } catch {
        setError('Failed to load submissions')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [campaignId, refreshKey])

  const handleDelete = async (submissionId) => {
    if (!window.confirm('Are you sure you want to delete this submission?')) return
    try {
      await api(`/submissions/${submissionId}`, { method: 'DELETE' })
      setRefreshKey(k => k + 1)
    } catch {
      alert('Failed to delete submission')
    }
  }

  const title = campaign?.title || 'Campaign'

  return (
    <div className="app">
      <Navbar isDark={isDark} setIsDark={setIsDark} profileOpen={profileOpen} setProfileOpen={setProfileOpen} profileRef={profileRef} />
      <div className="campaign-detail-page page-container" style={{ paddingTop: '88px', maxWidth: 1100, margin: '0 auto' }}>

        {loading ? (
          <div className="loading">Loading submissions…</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#f87171' }}>
            <p>{error}</p>
            <button onClick={() => setRefreshKey(k => k + 1)} style={{
              padding: '8px 20px', borderRadius: '10px', border: 'none',
              background: 'linear-gradient(135deg, #37ba8c, #2fa97f)',
              color: '#fff', fontWeight: 600, cursor: 'pointer'
            }}>Retry</button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {title}
                </h1>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  minWidth: 24, height: 24, borderRadius: '6px',
                  background: 'var(--green-500)', color: '#fff',
                  fontSize: '0.75rem', fontWeight: 700, padding: '0 6px'
                }}>
                  {submissions.length}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                View all your submissions for this campaign
              </p>
            </div>

            {/* Disclaimer */}
            <div style={{
              marginBottom: '1.5rem', padding: '0.85rem 1rem',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.15)',
              borderRadius: '10px',
              display: 'flex', gap: '0.6rem', alignItems: 'flex-start'
            }}>
              <span style={{ color: '#ef4444', fontSize: '0.85rem', flexShrink: 0, marginTop: '1px' }}>🔴</span>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  General Disclaimer
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Passing initial checks does not guarantee payout. Submissions are continuously verified, and statuses may change at any time until verification is completed. Earnings depend on meeting the minimum view requirements specified in the campaign.
                </div>
              </div>
            </div>

            {/* Submissions Table */}
            {submissions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
                <p>No submissions yet for this campaign.</p>
              </div>
            ) : (
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-filter)',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 4px 20px var(--shadow-color)'
              }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-filter)' }}>
                        {['#', 'Platform', 'Video Link', 'View Count', 'Eligible Views', 'Status', 'Delete'].map(h => (
                          <th key={h} style={{
                            padding: '0.85rem 1.25rem', textAlign: 'left',
                            fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                            letterSpacing: '0.06em', color: 'var(--text-muted)',
                            background: 'var(--bg-surface)',
                            whiteSpace: 'nowrap'
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((sub, idx) => {
                        const platform = sub.account?.platform || sub.platform || ''
                        const statusStyle = getSubmissionStatusStyle(sub.status)
                        return (
                          <tr key={sub.id} style={{
                            borderBottom: idx < submissions.length - 1 ? '1px solid var(--border-filter)' : 'none',
                            transition: 'background 0.15s'
                          }}
                            onMouseEnter={e => { for (const td of e.currentTarget.children) td.style.background = 'var(--hover-bg)' }}
                            onMouseLeave={e => { for (const td of e.currentTarget.children) td.style.background = 'transparent' }}
                          >
                            <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                              {idx + 1}
                            </td>
                            <td style={{ padding: '0.85rem 1.25rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                                <PlatformIcon platform={platform} />
                                <span style={{ fontWeight: 500 }}>{platformLabel(platform)}</span>
                              </div>
                            </td>
                            <td style={{ padding: '0.85rem 1.25rem', maxWidth: 300 }}>
                              <a
                                href={sub.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  color: 'var(--green-500)', textDecoration: 'none', fontSize: '0.82rem',
                                  fontWeight: 500, display: 'block',
                                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                }}
                              >
                                {sub.videoUrl}
                              </a>
                            </td>
                            <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-primary)', fontWeight: 600, textAlign: 'center' }}>
                              {formatViews(sub.viewCount)}
                            </td>
                            <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-primary)', fontWeight: 600, textAlign: 'center' }}>
                              {formatViews(sub.viewCount)}
                            </td>
                            <td style={{ padding: '0.85rem 1.25rem' }}>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                padding: '4px 12px', borderRadius: '20px',
                                fontSize: '0.75rem', fontWeight: 700,
                                ...statusStyle
                              }}>
                                <span style={{
                                  width: 7, height: 7, borderRadius: '50%',
                                  background: statusStyle.color, flexShrink: 0
                                }} />
                                {getSubmissionStatusLabel(sub.status)}
                              </span>
                            </td>
                            <td style={{ padding: '0.85rem 1.25rem', textAlign: 'center' }}>
                              <button
                                onClick={() => handleDelete(sub.id)}
                                title="Delete submission"
                                style={{
                                  background: 'none', border: 'none',
                                  color: '#ef4444', cursor: 'pointer',
                                  padding: '4px', borderRadius: '6px',
                                  transition: 'all 0.2s', display: 'inline-flex',
                                  alignItems: 'center', justifyContent: 'center'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                              >
                                <TrashIcon />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination footer */}
                <div style={{
                  padding: '0.85rem 1.25rem',
                  borderTop: '1px solid var(--border-filter)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  fontSize: '0.8rem', color: 'var(--text-muted)'
                }}>
                  <span>Showing 1 to {submissions.length} of {submissions.length} results</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button disabled style={{
                      padding: '4px 12px', borderRadius: '6px',
                      border: '1px solid var(--border-filter)',
                      background: 'var(--hover-bg)', color: 'var(--text-muted)',
                      fontSize: '0.78rem', fontWeight: 600,
                      cursor: 'not-allowed', opacity: 0.5, fontFamily: 'inherit'
                    }}>Previous</button>
                    <button disabled style={{
                      padding: '4px 12px', borderRadius: '6px',
                      border: '1px solid var(--border-filter)',
                      background: 'var(--hover-bg)', color: 'var(--text-muted)',
                      fontSize: '0.78rem', fontWeight: 600,
                      cursor: 'not-allowed', opacity: 0.5, fontFamily: 'inherit'
                    }}>Next</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default CampaignSubmissionsPage
