import { useEffect, useState } from 'react'
import AdminLayout from './AdminLayout'
import { getAllSubmissions, markEligible, rejectSubmission, getAllCampaigns } from '../../api/adminApi'

const PAGE_SIZE = 20

const statusMeta = {
  ELIGIBLE:   { bg: 'rgba(52,211,153,0.15)',  text: '#34d399',  label: '● ELIGIBLE' },
  PENDING:    { bg: 'rgba(251,191,36,0.15)',   text: '#fbbf24',  label: '● PENDING' },
  REJECTED:   { bg: 'rgba(239,68,68,0.15)',    text: '#ef4444',  label: '● REJECTED' },
  INELIGIBLE: { bg: 'rgba(156,163,175,0.15)', text: '#9ca3af',  label: '● INELIGIBLE' },
}

const platformIcon = (url = '') => {
  const u = url.toLowerCase()
  if (u.includes('youtube') || u.includes('youtu.be')) return '▶️'
  if (u.includes('tiktok')) return '🎵'
  if (u.includes('instagram')) return '📸'
  if (u.includes('x.com') || u.includes('twitter')) return '𝕏'
  return '🔗'
}

const fmtViews = (n) => {
  if (!n) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

function AdminSubmissionsPage({ isDark, setIsDark }) {
  const [submissions, setSubmissions] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterCampaign, setFilterCampaign] = useState('ALL')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [page, setPage] = useState(1)
  const [actionLoading, setActionLoading] = useState(null)
  const [confirmReject, setConfirmReject] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [subsRes, campsRes] = await Promise.all([getAllSubmissions(), getAllCampaigns()])
      if (!subsRes.ok) throw new Error('Failed to load submissions')
      setSubmissions(await subsRes.json())
      if (campsRes.ok) setCampaigns(await campsRes.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleMarkEligible = async (id) => {
    setActionLoading(id + '-eligible')
    try {
      await markEligible(id)
      load()
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id) => {
    setActionLoading(id + '-reject')
    setConfirmReject(null)
    try {
      await rejectSubmission(id)
      load()
    } finally {
      setActionLoading(null)
    }
  }

  // Filter
  const filtered = submissions.filter(s => {
    const campMatch = filterCampaign === 'ALL' || String(s.campaign?.id) === filterCampaign
    const statusMatch = filterStatus === 'ALL' || s.status === filterStatus
    return campMatch && statusMatch
  })

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <AdminLayout isDark={isDark} setIsDark={setIsDark}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.03em' }}>
          Submissions
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
          {filtered.length} submissions
        </p>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <select
          value={filterCampaign}
          onChange={e => { setFilterCampaign(e.target.value); setPage(1) }}
          style={selectStyle}
        >
          <option value="ALL">All Campaigns</option>
          {campaigns.map(c => <option key={c.id} value={String(c.id)}>{c.title}</option>)}
        </select>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {['ALL', 'PENDING', 'ELIGIBLE', 'REJECTED', 'INELIGIBLE'].map(s => (
            <button key={s} onClick={() => { setFilterStatus(s); setPage(1) }} style={{
              padding: '6px 14px',
              background: filterStatus === s ? 'var(--green-500)' : 'var(--bg-card)',
              color: filterStatus === s ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${filterStatus === s ? 'var(--green-500)' : 'var(--border-filter)'}`,
              borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '10px 14px', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.875rem' }}>
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Loading submissions…</div>
      ) : paginated.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎬</div>
          <p>No submissions found for the selected filters.</p>
        </div>
      ) : (
        <>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-filter)', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 4px 20px var(--shadow-color)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  {['#', 'Creator', 'Campaign', 'Platform', 'Video URL', 'Views', 'Status', 'Date', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '0.85rem 0.75rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((s, i) => {
                  const sm = statusMeta[s.status] || statusMeta.INELIGIBLE
                  const rowNum = (page - 1) * PAGE_SIZE + i + 1
                  const isConfirmReject = confirmReject === s.id
                  return (
                    <tr key={s.id} style={{ borderBottom: i < paginated.length - 1 ? '1px solid var(--border-subtle)' : 'none', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--hover-bg)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{rowNum}</td>
                      <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        @{s.user?.username || s.userId}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.campaign?.title || s.campaignId}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '1rem', textAlign: 'center' }}>
                        {platformIcon(s.videoUrl)}
                      </td>
                      <td style={{ padding: '0.75rem', maxWidth: 150 }}>
                        <a href={s.videoUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--green-400)', fontSize: '0.78rem', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.videoUrl?.replace(/^https?:\/\/(www\.)?/, '')}
                        </a>
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {fmtViews(s.viewCount)}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, background: sm.bg, color: sm.text, whiteSpace: 'nowrap' }}>
                          {sm.label}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        {isConfirmReject ? (
                          <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.7rem', color: '#f87171', whiteSpace: 'nowrap' }}>Confirm?</span>
                            <button onClick={() => handleReject(s.id)} disabled={!!actionLoading} style={{ padding: '3px 8px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                              Yes
                            </button>
                            <button onClick={() => setConfirmReject(null)} style={{ padding: '3px 8px', background: 'var(--hover-bg)', border: '1px solid var(--border-subtle)', borderRadius: '5px', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', color: 'var(--text-secondary)', fontFamily: 'inherit' }}>
                              No
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            {s.status === 'PENDING' && (
                              <button
                                onClick={() => handleMarkEligible(s.id)}
                                disabled={actionLoading === s.id + '-eligible'}
                                style={{ padding: '4px 10px', background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '6px', color: '#34d399', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                              >
                                {actionLoading === s.id + '-eligible' ? '…' : '✓ Eligible'}
                              </button>
                            )}
                            {(s.status === 'PENDING' || s.status === 'ELIGIBLE') && (
                              <button
                                onClick={() => setConfirmReject(s.id)}
                                style={{ padding: '4px 10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', color: '#ef4444', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                              >
                                ✗ Reject
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
              <PagBtn onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</PagBtn>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <PagBtn key={p} onClick={() => setPage(p)} active={p === page}>{p}</PagBtn>
              ))}
              <PagBtn onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</PagBtn>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  )
}

function PagBtn({ children, onClick, disabled, active }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '6px 12px',
      background: active ? 'var(--green-500)' : 'var(--bg-card)',
      color: active ? '#fff' : disabled ? 'var(--text-muted)' : 'var(--text-secondary)',
      border: `1px solid ${active ? 'var(--green-500)' : 'var(--border-filter)'}`,
      borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
    }}>
      {children}
    </button>
  )
}

const selectStyle = {
  padding: '7px 12px',
  background: 'var(--bg-card)',
  border: '1px solid var(--border-filter)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '0.85rem',
  outline: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
  minWidth: '180px',
}

export default AdminSubmissionsPage
