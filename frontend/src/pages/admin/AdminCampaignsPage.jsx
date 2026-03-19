import { useEffect, useState } from 'react'
import {
  Plus, Pencil, Trash2, BarChart2, Zap, X, TrendingUp,
  Check, Ban, Eye, ExternalLink, ChevronLeft,
} from 'lucide-react'
import AdminLayout from './AdminLayout'
import {
  getAllCampaigns, createCampaign, updateCampaign,
  deleteCampaign, getCampaignAnalytics, distributeCampaign, getAllEarnings,
  getCampaignSubmissions, markEligible, rejectSubmission, updateSubmissionViews,
  syncCampaignViews,
} from '../../api/adminApi'
import { PlatformStack, PLATFORM_ICONS } from '../../components/shared/PlatformIcons'
import '../../components/campaigns/CampaignCard.css'

/* ── helpers ── */
const fmtCurrency = (n) => {
  if (!n && n !== 0) return '₹0'
  return '₹' + (typeof n === 'string' ? parseFloat(n) : n)
    .toLocaleString('en-IN', { maximumFractionDigits: 0 })
}
const fmtViews = (n) => (!n ? '0' : Number(n).toLocaleString())

const CAT_STYLE = {
  CLIPPING: { bg: 'rgba(239,68,68,0.12)',  text: '#f87171' },
  UGC:      { bg: 'rgba(96,165,250,0.12)', text: '#60a5fa' },
  MUSIC:    { bg: 'rgba(167,139,250,0.12)',text: '#a78bfa' },
  LOGO:     { bg: 'rgba(52,211,153,0.12)', text: '#34d399' },
  OTHER:    { bg: 'rgba(156,163,175,0.12)',text: '#9ca3af' },
}

const STATUS_STYLE = {
  ELIGIBLE: { bg: 'rgba(52,211,153,0.15)', text: '#34d399', border: 'rgba(52,211,153,0.3)' },
  PENDING:  { bg: 'rgba(251,191,36,0.12)', text: '#fbbf24', border: 'rgba(251,191,36,0.3)'  },
  REJECTED: { bg: 'rgba(239,68,68,0.12)',  text: '#f87171', border: 'rgba(239,68,68,0.3)'  },
}

const CATEGORIES   = ['CLIPPING', 'UGC', 'MUSIC', 'LOGO', 'OTHER']
const STATUSES     = ['ACTIVE', 'ENDED']
const ALL_PLATFORMS = ['YOUTUBE', 'TIKTOK', 'INSTAGRAM', 'X']

const emptyForm = {
  title: '', description: '', category: 'CLIPPING',
  campaignStatus: 'ACTIVE', ratePerMillion: '', totalBudget: '', endsAt: '',
  thumbnailUrl: '', platforms: [],
}

/* ── Small icon button ── */
function IconBtn({ Icon, onClick, title, active, danger, disabled }) {
  const base = {
    width: 28, height: 28,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: '7px', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background 0.15s, color 0.15s', fontFamily: 'inherit', flexShrink: 0,
    backdropFilter: 'blur(8px)',
  }
  const style = active
    ? { ...base, background: 'rgba(52,211,153,0.25)', color: '#34d399' }
    : danger
    ? { ...base, background: 'rgba(239,68,68,0.18)', color: '#f87171' }
    : { ...base, background: 'rgba(0,0,0,0.35)', color: 'rgba(255,255,255,0.8)' }
  return (
    <button title={title} onClick={onClick} disabled={disabled} style={style}
      onMouseEnter={e => { if (!disabled && !active && !danger) e.currentTarget.style.background = 'rgba(0,0,0,0.55)' }}
      onMouseLeave={e => { if (!disabled && !active && !danger) e.currentTarget.style.background = 'rgba(0,0,0,0.35)' }}
    >
      <Icon size={13} strokeWidth={2} />
    </button>
  )
}

/* ── Campaign Card ── */
function CampaignAdminCard({
  c, onEdit, onDelete, onToggleAnalytics, analyticsOpen,
  analytics, analyticsLoading, onDistribute, distributing, isPaid, onClick,
}) {
  const isEnded   = c.campaignStatus === 'ENDED'
  const cs        = CAT_STYLE[c.category] || CAT_STYLE.OTHER
  const budgetUsed  = parseFloat(c.budgetUsed  || 0)
  const totalBudget = parseFloat(c.totalBudget || 1)
  const budgetPct   = Math.min(100, (budgetUsed / totalBudget) * 100)
  const initial     = c.title?.[0]?.toUpperCase() || '?'

  return (
    <div
      className="campaign-card"
      onClick={onClick}
      style={{ cursor: 'pointer', opacity: isEnded ? 0.9 : 1 }}
    >
      {/* ── Image area ── */}
      <div className="campaign-card-image">
        {c.thumbnailUrl
          ? <img src={c.thumbnailUrl} alt={c.title} className="campaign-card-img" />
          : <span className="campaign-card-letter">{initial}</span>
        }

        {/* Status badge — top right */}
        <span className={`campaign-card-status-badge ${isEnded ? 'ended' : 'active'}`}>
          <span className="campaign-card-status-dot" />
          {c.campaignStatus}
        </span>

        {/* Action buttons — top left */}
        <div
          style={{ position: 'absolute', top: 10, left: 10, zIndex: 3, display: 'flex', gap: '0.2rem' }}
          onClick={e => e.stopPropagation()}
        >
          <IconBtn Icon={Pencil}   title="Edit"      onClick={() => onEdit(c)} />
          <IconBtn Icon={BarChart2} title="Analytics" onClick={() => onToggleAnalytics(c.id)} active={analyticsOpen} />
          <IconBtn Icon={Trash2}   title="Delete"    onClick={() => onDelete(c.id)} danger />
        </div>

        {/* Platform icons — bottom left */}
        {c.platforms?.length > 0 && (
          <div className="campaign-card-platforms">
            <PlatformStack platforms={c.platforms} size={20} />
          </div>
        )}

        {/* Title + category overlay — bottom */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2,
          padding: '2.5rem 0.9rem 0.85rem',
          background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%)',
        }}>
          <span className="campaign-card-cat" style={{ background: cs.bg, color: cs.text, marginBottom: '0.3rem' }}>
            {c.category}
          </span>
          <h3 style={{
            margin: 0, fontSize: '0.88rem', fontWeight: 700, color: '#fff',
            lineHeight: 1.35, display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {c.title}
          </h3>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="campaign-card-body">
        {/* Rate + end date */}
        <div className="campaign-card-rate-block">
          <div className="campaign-card-rate-icon">
            <TrendingUp size={13} strokeWidth={2.5} />
          </div>
          <div>
            <div className="campaign-card-rate-value">{fmtCurrency(c.ratePerMillion)}</div>
            <div className="campaign-card-rate-label">per 1M views</div>
          </div>
          {c.endsAt && (
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {isEnded ? 'Ended' : 'Ends'}
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: isEnded ? '#9ca3af' : 'var(--text-secondary)' }}>
                {new Date(c.endsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
              </div>
            </div>
          )}
        </div>

        {/* Budget bar */}
        <div className="campaign-card-budget">
          <div className="campaign-card-budget-header">
            <span className="campaign-card-budget-label">Budget</span>
            <span className="campaign-card-budget-pct">{budgetPct.toFixed(0)}%</span>
          </div>
          <div className="campaign-card-budget-track">
            <div className="campaign-card-budget-fill" style={{ width: `${budgetPct}%` }} />
          </div>
          <div className="campaign-card-budget-amounts">
            <span>{fmtCurrency(budgetUsed)}</span>
            <span>{fmtCurrency(totalBudget)}</span>
          </div>
        </div>

        {/* Distribute / Paid Out */}
        {isEnded && (
          isPaid ? (
            <div style={{
              padding: '7px 0', background: 'rgba(52,211,153,0.08)',
              border: '1px solid rgba(52,211,153,0.25)', borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              color: '#34d399', fontWeight: 700, fontSize: '0.8rem',
            }}>
              ✓ Paid Out
            </div>
          ) : (
            <button
              onClick={e => { e.stopPropagation(); onDistribute(c.id) }}
              disabled={distributing === c.id}
              style={{
                padding: '7px 0',
                background: distributing === c.id ? 'rgba(52,211,153,0.15)' : 'linear-gradient(135deg, #37ba8c, #2fa97f)',
                color: distributing === c.id ? 'var(--green-400)' : '#fff',
                border: distributing === c.id ? '1px solid rgba(52,211,153,0.3)' : 'none',
                borderRadius: '10px', fontWeight: 700, fontSize: '0.8rem',
                cursor: distributing === c.id ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              }}
            >
              <Zap size={13} strokeWidth={2.5} />
              {distributing === c.id ? 'Distributing…' : 'Distribute Earnings'}
            </button>
          )
        )}

        {/* Analytics panel */}
        {analyticsOpen && (
          <div
            style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}
            onClick={e => e.stopPropagation()}
          >
            {analyticsLoading && !analytics
              ? <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>Loading…</div>
              : analytics ? <AnalyticsPanel data={analytics} /> : null
            }
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Analytics panel ── */
function AnalyticsPanel({ data }) {
  const total = data.totalSubmissions || 1
  const bars = [
    { label: 'Eligible', count: data.eligibleSubmissions, color: '#34d399' },
    { label: 'Pending',  count: data.pendingSubmissions,  color: '#fbbf24' },
    { label: 'Rejected', count: data.rejectedSubmissions, color: '#f87171' },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
      <div>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.6rem' }}>Submissions</div>
        {bars.map(b => (
          <div key={b.label} style={{ marginBottom: '0.45rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.15rem' }}>
              <span>{b.label}</span><span style={{ fontWeight: 700, color: b.color }}>{b.count}</span>
            </div>
            <div style={{ height: 4, background: 'var(--border-filter)', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.round((b.count / total) * 100)}%`, height: '100%', background: b.color, borderRadius: '99px' }} />
            </div>
          </div>
        ))}
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          Views: <strong style={{ color: 'var(--text-primary)' }}>{fmtViews(data.totalViews)}</strong>
        </div>
      </div>
      <div>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.6rem' }}>Top Creators</div>
        {!data.topCreators?.length
          ? <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>No eligible submissions</div>
          : data.topCreators.slice(0, 5).map((tc, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', marginBottom: '0.3rem' }}>
              <span style={{ color: 'var(--text-muted)', minWidth: '1rem' }}>#{i + 1}</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tc.username}</span>
              <span style={{ color: '#34d399', fontWeight: 700 }}>₹{parseFloat(tc.earnings || 0).toFixed(0)}</span>
            </div>
          ))
        }
      </div>
    </div>
  )
}

/* ── Campaign Submissions Modal ── */
function CampaignSubmissionsModal({ campaign, onClose }) {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingViews, setEditingViews] = useState(null)
  const [viewInput, setViewInput] = useState('')
  const [msg, setMsg] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [syncing, setSyncing] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await getCampaignSubmissions(campaign.id)
      if (res.ok) setSubmissions(await res.json())
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [campaign.id])

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 2500) }

  const handleEligible = async (id) => {
    await markEligible(id); flash('Marked eligible'); load()
  }
  const handleReject = async (id) => {
    await rejectSubmission(id); flash('Rejected'); load()
  }
  const handleUpdateViews = async (id) => {
    const v = parseInt(viewInput)
    if (isNaN(v) || v < 0) return
    await updateSubmissionViews(id, v)
    setEditingViews(null); setViewInput(''); load()
  }

  const handleSyncViews = async () => {
    setSyncing(true)
    try {
      const res = await syncCampaignViews(campaign.id)
      const data = await res.json()
      if (!res.ok) { flash(data.error || 'Sync failed'); return }
      flash(`Synced ${data.synced} submissions · ${Number(data.totalViewsAfterSync).toLocaleString()} total views`)
      load()
    } catch { flash('Sync failed') }
    finally { setSyncing(false) }
  }

  const displayed = filterStatus === 'ALL'
    ? submissions
    : submissions.filter(s => s.status === filterStatus)

  const counts = { ALL: submissions.length }
  for (const s of submissions) counts[s.status] = (counts[s.status] || 0) + 1

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'stretch', justifyContent: 'flex-end',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        width: '100%', maxWidth: '820px',
        background: 'var(--bg-card)',
        borderLeft: '1px solid var(--border-filter)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', animation: 'slideIn 0.22s ease',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0,
        }}>
          <button onClick={onClose} style={{ background: 'var(--hover-bg)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '6px 10px', gap: '0.3rem', fontFamily: 'inherit', fontSize: '0.8rem' }}>
            <ChevronLeft size={15} strokeWidth={2} /> Back
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {campaign.title}
            </h2>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {submissions.length} submissions
            </p>
          </div>
          {campaign.campaignStatus === 'ACTIVE' && (
            <button
              onClick={handleSyncViews}
              disabled={syncing}
              title="Sync view counts for all eligible submissions (YouTube auto, others manual)"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                padding: '6px 12px', borderRadius: '8px', fontFamily: 'inherit',
                fontSize: '0.75rem', fontWeight: 600, cursor: syncing ? 'not-allowed' : 'pointer',
                background: syncing ? 'rgba(96,165,250,0.1)' : 'rgba(96,165,250,0.12)',
                border: '1px solid rgba(96,165,250,0.3)', color: '#60a5fa', flexShrink: 0,
              }}
            >
              <TrendingUp size={13} strokeWidth={2} />
              {syncing ? 'Syncing…' : 'Sync Views'}
            </button>
          )}
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 4 }}>
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Filter tabs */}
        <div style={{ padding: '0.85rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
          {['ALL', 'PENDING', 'ELIGIBLE', 'REJECTED'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{
              padding: '5px 12px', borderRadius: '7px', fontFamily: 'inherit',
              fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
              background: filterStatus === s ? 'var(--green-500)' : 'var(--hover-bg)',
              color: filterStatus === s ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${filterStatus === s ? 'var(--green-500)' : 'var(--border-subtle)'}`,
            }}>
              {s} {counts[s] != null ? <span style={{ opacity: 0.7 }}>({counts[s] ?? 0})</span> : null}
            </button>
          ))}
        </div>

        {/* Flash message */}
        {msg && (
          <div style={{ margin: '0.75rem 1.5rem 0', padding: '8px 14px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399', borderRadius: '8px', fontSize: '0.82rem', flexShrink: 0 }}>
            ✓ {msg}
          </div>
        )}

        {/* Submissions list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading submissions…</div>
          ) : displayed.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              No {filterStatus !== 'ALL' ? filterStatus.toLowerCase() : ''} submissions
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {displayed.map(sub => {
                const ss = STATUS_STYLE[sub.status] || STATUS_STYLE.PENDING
                return (
                  <div key={sub.id} style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '12px', padding: '0.9rem 1rem',
                    display: 'flex', flexDirection: 'column', gap: '0.6rem',
                  }}>
                    {/* Row 1: user + status */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                          background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.85rem', fontWeight: 700, color: '#34d399',
                        }}>
                          {sub.user?.username?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {sub.user?.username || 'Unknown'}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {sub.user?.email}
                          </div>
                        </div>
                      </div>
                      <span style={{
                        padding: '3px 10px', borderRadius: '100px', fontSize: '0.65rem', fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0,
                        background: ss.bg, color: ss.text, border: `1px solid ${ss.border}`,
                      }}>
                        {sub.status}
                      </span>
                    </div>

                    {/* Row 2: video URL */}
                    <a href={sub.videoUrl} target="_blank" rel="noopener noreferrer" style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      fontSize: '0.75rem', color: '#60a5fa', textDecoration: 'none',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      <ExternalLink size={12} strokeWidth={2} style={{ flexShrink: 0 }} />
                      {sub.videoUrl}
                    </a>

                    {/* Row 3: views + submitted date */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Eye size={13} style={{ color: 'var(--text-muted)' }} />
                        {editingViews === sub.id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <input
                              autoFocus
                              type="number"
                              value={viewInput}
                              onChange={e => setViewInput(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') handleUpdateViews(sub.id); if (e.key === 'Escape') setEditingViews(null) }}
                              style={{
                                width: 90, padding: '3px 7px', background: 'var(--hover-bg)',
                                border: '1px solid var(--green-500)', borderRadius: '6px',
                                color: 'var(--text-primary)', fontSize: '0.78rem', fontFamily: 'inherit', outline: 'none',
                              }}
                            />
                            <button onClick={() => handleUpdateViews(sub.id)} style={{ background: 'var(--green-500)', border: 'none', borderRadius: '5px', color: '#fff', cursor: 'pointer', padding: '3px 8px', fontSize: '0.72rem', fontFamily: 'inherit' }}>Set</button>
                            <button onClick={() => setEditingViews(null)} style={{ background: 'var(--hover-bg)', border: '1px solid var(--border-subtle)', borderRadius: '5px', color: 'var(--text-muted)', cursor: 'pointer', padding: '3px 8px', fontSize: '0.72rem', fontFamily: 'inherit' }}>✕</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditingViews(sub.id); setViewInput(String(sub.viewCount || 0)) }}
                            title="Click to update view count"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 600, fontFamily: 'inherit' }}
                          >
                            {fmtViews(sub.viewCount)} views
                          </button>
                        )}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {new Date(sub.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </div>
                      {sub.account?.platform && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          {(() => { const Icon = PLATFORM_ICONS[sub.account.platform]; return Icon ? <Icon size={13} /> : null })()}
                          {sub.account.username || sub.account.platform}
                        </div>
                      )}
                    </div>

                    {/* Row 4: action buttons */}
                    {sub.status !== 'REJECTED' && (
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {sub.status !== 'ELIGIBLE' && (
                          <button onClick={() => handleEligible(sub.id)} style={{
                            display: 'flex', alignItems: 'center', gap: '0.3rem',
                            padding: '5px 12px', borderRadius: '7px', border: '1px solid rgba(52,211,153,0.35)',
                            background: 'rgba(52,211,153,0.1)', color: '#34d399',
                            fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit',
                          }}>
                            <Check size={12} strokeWidth={2.5} /> Mark Eligible
                          </button>
                        )}
                        <button onClick={() => handleReject(sub.id)} style={{
                          display: 'flex', alignItems: 'center', gap: '0.3rem',
                          padding: '5px 12px', borderRadius: '7px', border: '1px solid rgba(239,68,68,0.3)',
                          background: 'rgba(239,68,68,0.08)', color: '#f87171',
                          fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit',
                        }}>
                          <Ban size={12} strokeWidth={2} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  )
}

/* ── Modal + Field helpers ── */
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-filter)', borderRadius: '20px', padding: '1.75rem', width: '100%', maxWidth: '520px', boxShadow: '0 24px 64px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '4px' }}>
            <X size={20} strokeWidth={2} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '10px 12px',
  background: 'var(--hover-bg)', border: '1px solid var(--border-subtle)',
  borderRadius: '10px', color: 'var(--text-primary)',
  fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit',
  boxSizing: 'border-box', transition: 'border-color 0.2s',
}

/* ── Main page ── */
function AdminCampaignsPage({ isDark, setIsDark }) {
  const [campaigns, setCampaigns]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')

  const [showModal, setShowModal]     = useState(false)
  const [editCampaign, setEditCampaign] = useState(null)
  const [form, setForm]               = useState(emptyForm)
  const [saving, setSaving]           = useState(false)
  const [saveError, setSaveError]     = useState('')

  const [deleteId, setDeleteId]       = useState(null)

  const [analyticsOpen, setAnalyticsOpen]     = useState(null)
  const [analytics, setAnalytics]             = useState({})
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  const [distributing, setDistributing] = useState(null)
  const [distributeMsg, setDistributeMsg] = useState('')
  const [paidCampaigns, setPaidCampaigns] = useState(new Set())

  const [detailCampaign, setDetailCampaign] = useState(null)

  const load = async () => {
    setLoading(true); setError('')
    try {
      const [campRes, earnRes] = await Promise.all([getAllCampaigns(), getAllEarnings()])
      if (!campRes.ok) throw new Error('Failed to load campaigns')
      setCampaigns(await campRes.json())
      if (earnRes.ok) {
        const earnings = await earnRes.json()
        const byCampaign = {}
        for (const e of earnings) {
          const cid = e.campaign?.id
          if (!cid) continue
          if (!byCampaign[cid]) byCampaign[cid] = []
          byCampaign[cid].push(e.payoutStatus)
        }
        const paid = new Set()
        for (const [cid, statuses] of Object.entries(byCampaign)) {
          if (statuses.length > 0 && statuses.every(s => s === 'PAID'))
            paid.add(Number(cid))
        }
        setPaidCampaigns(paid)
      }
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditCampaign(null); setForm(emptyForm); setSaveError(''); setShowModal(true) }
  const openEdit   = (c) => {
    setEditCampaign(c)
    setForm({
      title: c.title || '', description: c.description || '',
      category: c.category || 'CLIPPING', campaignStatus: c.campaignStatus || 'ACTIVE',
      ratePerMillion: c.ratePerMillion != null ? String(c.ratePerMillion) : '',
      totalBudget: c.totalBudget != null ? String(c.totalBudget) : '',
      endsAt: c.endsAt ? c.endsAt.substring(0, 16) : '',
      thumbnailUrl: c.thumbnailUrl || '',
      platforms: Array.isArray(c.platforms) ? c.platforms : [],
    })
    setSaveError(''); setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.title.trim())      { setSaveError('Title is required'); return }
    if (!form.ratePerMillion)    { setSaveError('Rate per million is required'); return }
    if (!form.totalBudget)       { setSaveError('Total budget is required'); return }
    setSaving(true); setSaveError('')
    try {
      const payload = {
        title: form.title.trim(), description: form.description.trim(),
        category: form.category, campaignStatus: form.campaignStatus,
        ratePerMillion: parseInt(form.ratePerMillion),
        totalBudget: parseFloat(form.totalBudget),
        endsAt: form.endsAt ? form.endsAt + ':00' : null,
        thumbnailUrl: form.thumbnailUrl.trim() || null,
        platforms: form.platforms,
      }
      const res = editCampaign
        ? await updateCampaign(editCampaign.id, payload)
        : await createCampaign(payload)
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Save failed') }
      setShowModal(false); load()
    } catch (e) { setSaveError(e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    try { await deleteCampaign(id); setDeleteId(null); load() }
    catch (e) { setError('Delete failed: ' + e.message) }
  }

  const toggleAnalytics = async (id) => {
    if (analyticsOpen === id) { setAnalyticsOpen(null); return }
    setAnalyticsOpen(id)
    if (analytics[id]) return
    setAnalyticsLoading(true)
    try {
      const res = await getCampaignAnalytics(id)
      if (res.ok) { const data = await res.json(); setAnalytics(prev => ({ ...prev, [id]: data })) }
    } finally { setAnalyticsLoading(false) }
  }

  const handleDistribute = async (campaignId) => {
    setDistributing(campaignId); setDistributeMsg('')
    try {
      const res = await distributeCampaign(campaignId)
      const text = await res.text()
      if (!res.ok) throw new Error(text)
      setDistributeMsg(text); load()
    } catch (e) {
      setDistributeMsg('Error: ' + e.message)
    } finally {
      setDistributing(null)
      setTimeout(() => setDistributeMsg(''), 4000)
    }
  }

  const displayed   = filterStatus === 'ALL' ? campaigns : campaigns.filter(c => c.campaignStatus === filterStatus)
  const activeCount = campaigns.filter(c => c.campaignStatus === 'ACTIVE').length
  const endedCount  = campaigns.filter(c => c.campaignStatus === 'ENDED').length

  return (
    <AdminLayout isDark={isDark} setIsDark={setIsDark}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.03em' }}>Campaigns</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '0.2rem 0 0' }}>
            {activeCount} active · {endedCount} ended · {campaigns.length} total
          </p>
        </div>
        <button onClick={openCreate} style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '9px 18px',
          background: 'linear-gradient(135deg, #37ba8c, #2fa97f)', color: '#fff',
          border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.875rem',
          cursor: 'pointer', fontFamily: 'inherit',
        }}>
          <Plus size={16} strokeWidth={2.5} /> Create Campaign
        </button>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['ALL', 'ACTIVE', 'ENDED'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} style={{
            padding: '6px 14px', borderRadius: '8px', fontFamily: 'inherit',
            fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
            background: filterStatus === s ? 'var(--green-500)' : 'var(--bg-card)',
            color: filterStatus === s ? '#fff' : 'var(--text-secondary)',
            border: `1px solid ${filterStatus === s ? 'var(--green-500)' : 'var(--border-filter)'}`,
          }}>{s}</button>
        ))}
      </div>

      {/* Messages */}
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '10px 14px', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.875rem' }}>
          ⚠️ {error}
        </div>
      )}
      {distributeMsg && (
        <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399', padding: '10px 14px', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.875rem' }}>
          ✓ {distributeMsg}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Loading campaigns…</div>
      ) : displayed.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📢</div>
          <p>{filterStatus === 'ALL' ? 'No campaigns yet. Create one to get started.' : `No ${filterStatus.toLowerCase()} campaigns.`}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
          {displayed.map(c => (
            <CampaignAdminCard
              key={c.id}
              c={c}
              onEdit={openEdit}
              onDelete={id => setDeleteId(id)}
              onToggleAnalytics={toggleAnalytics}
              analyticsOpen={analyticsOpen === c.id}
              analytics={analytics[c.id]}
              analyticsLoading={analyticsLoading}
              onDistribute={handleDistribute}
              distributing={distributing}
              isPaid={paidCampaigns.has(c.id)}
              onClick={() => setDetailCampaign(c)}
            />
          ))}
        </div>
      )}

      {/* Campaign detail side panel */}
      {detailCampaign && (
        <CampaignSubmissionsModal
          campaign={detailCampaign}
          onClose={() => setDetailCampaign(null)}
        />
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <Modal title={editCampaign ? 'Edit Campaign' : 'Create Campaign'} onClose={() => setShowModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Field label="Title">
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Campaign title" style={inputStyle} />
            </Field>
            <Field label="Description">
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Campaign description" style={{ ...inputStyle, resize: 'vertical' }} />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Field label="Category">
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inputStyle}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select value={form.campaignStatus} onChange={e => setForm(f => ({ ...f, campaignStatus: e.target.value }))} style={inputStyle}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Rate Per Million (₹)">
                <input type="number" value={form.ratePerMillion} onChange={e => setForm(f => ({ ...f, ratePerMillion: e.target.value }))} placeholder="1000" style={inputStyle} />
              </Field>
              <Field label="Total Budget (₹)">
                <input type="number" value={form.totalBudget} onChange={e => setForm(f => ({ ...f, totalBudget: e.target.value }))} placeholder="10000" style={inputStyle} />
              </Field>
            </div>
            <Field label="Ends At">
              <input type="datetime-local" value={form.endsAt} onChange={e => setForm(f => ({ ...f, endsAt: e.target.value }))} style={inputStyle} />
            </Field>
            <Field label="Thumbnail URL">
              <input value={form.thumbnailUrl} onChange={e => setForm(f => ({ ...f, thumbnailUrl: e.target.value }))} placeholder="https://example.com/image.jpg" style={inputStyle} />
            </Field>
            <Field label="Allowed Platforms">
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {ALL_PLATFORMS.map(p => {
                  const Icon = PLATFORM_ICONS[p]
                  const selected = form.platforms.includes(p)
                  return (
                    <button key={p} type="button"
                      onClick={() => setForm(f => ({
                        ...f,
                        platforms: selected ? f.platforms.filter(x => x !== p) : [...f.platforms, p],
                      }))}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        padding: '6px 12px', borderRadius: '8px',
                        background: selected ? 'rgba(52,211,153,0.15)' : 'var(--hover-bg)',
                        border: `1px solid ${selected ? 'var(--green-500)' : 'var(--border-subtle)'}`,
                        color: selected ? 'var(--green-400)' : 'var(--text-muted)',
                        fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit',
                      }}>
                      {Icon && <Icon size={14} />} {p}
                    </button>
                  )
                })}
              </div>
            </Field>
            {saveError && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem' }}>
                ⚠️ {saveError}
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '9px 18px', background: 'var(--hover-bg)', border: '1px solid var(--border-subtle)', borderRadius: '10px', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '9px 20px', background: saving ? 'rgba(55,186,140,0.4)' : 'linear-gradient(135deg, #37ba8c, #2fa97f)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.875rem', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {saving ? 'Saving…' : editCampaign ? 'Save Changes' : 'Create'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <Modal title="Delete Campaign" onClose={() => setDeleteId(null)}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Are you sure you want to delete this campaign? This action cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button onClick={() => setDeleteId(null)} style={{ padding: '9px 18px', background: 'var(--hover-bg)', border: '1px solid var(--border-subtle)', borderRadius: '10px', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
            <button onClick={() => handleDelete(deleteId)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '9px 18px', background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit' }}>
              <Trash2 size={14} strokeWidth={2} /> Delete
            </button>
          </div>
        </Modal>
      )}
    </AdminLayout>
  )
}

export default AdminCampaignsPage
