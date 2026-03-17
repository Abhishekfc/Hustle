import { useEffect, useState } from 'react'
import AdminLayout from './AdminLayout'
import {
  getAllCampaigns, createCampaign, updateCampaign,
  deleteCampaign, getCampaignAnalytics
} from '../../api/adminApi'

const CATEGORIES = ['CLIPPING', 'UGC', 'MUSIC', 'LOGO', 'OTHER']
const STATUSES = ['ACTIVE', 'ENDED']

const fmtCurrency = (n) => {
  if (!n && n !== 0) return '₹0'
  const num = typeof n === 'string' ? parseFloat(n) : n
  return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

const fmtViews = (n) => {
  if (!n) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

const statusStyle = (status) => ({
  ACTIVE: { bg: 'rgba(52,211,153,0.15)', text: '#34d399', label: '● ACTIVE' },
  ENDED: { bg: 'rgba(156,163,175,0.15)', text: '#9ca3af', label: '● ENDED' },
}[status] || { bg: 'rgba(156,163,175,0.1)', text: '#9ca3af', label: status })

const catStyle = (cat) => {
  const map = {
    CLIPPING: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444' },
    UGC: { bg: 'rgba(96,165,250,0.15)', text: '#60a5fa' },
    MUSIC: { bg: 'rgba(167,139,250,0.15)', text: '#a78bfa' },
    LOGO: { bg: 'rgba(52,211,153,0.15)', text: '#34d399' },
    OTHER: { bg: 'rgba(156,163,175,0.15)', text: '#9ca3af' },
  }
  return map[cat] || map.OTHER
}

const emptyForm = { title: '', description: '', category: 'CLIPPING', campaignStatus: 'ACTIVE', ratePerMillion: '', totalBudget: '', endsAt: '' }

function AdminCampaignsPage({ isDark, setIsDark }) {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editCampaign, setEditCampaign] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const [analyticsOpen, setAnalyticsOpen] = useState(null)
  const [analytics, setAnalytics] = useState({})
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getAllCampaigns()
      if (!res.ok) throw new Error('Failed to load campaigns')
      setCampaigns(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditCampaign(null)
    setForm(emptyForm)
    setSaveError('')
    setShowModal(true)
  }

  const openEdit = (c) => {
    setEditCampaign(c)
    setForm({
      title: c.title || '',
      description: c.description || '',
      category: c.category || 'CLIPPING',
      campaignStatus: c.campaignStatus || 'ACTIVE',
      ratePerMillion: c.ratePerMillion != null ? String(c.ratePerMillion) : '',
      totalBudget: c.totalBudget != null ? String(c.totalBudget) : '',
      endsAt: c.endsAt ? c.endsAt.substring(0, 16) : '',
    })
    setSaveError('')
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) { setSaveError('Title is required'); return }
    if (!form.ratePerMillion) { setSaveError('Rate per million is required'); return }
    if (!form.totalBudget) { setSaveError('Total budget is required'); return }
    setSaving(true)
    setSaveError('')
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        campaignStatus: form.campaignStatus,
        ratePerMillion: parseInt(form.ratePerMillion),
        totalBudget: parseFloat(form.totalBudget),
        endsAt: form.endsAt ? form.endsAt + ':00' : null,
      }
      const res = editCampaign
        ? await updateCampaign(editCampaign.id, payload)
        : await createCampaign(payload)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Save failed')
      }
      setShowModal(false)
      load()
    } catch (e) {
      setSaveError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteCampaign(id)
      setDeleteId(null)
      load()
    } catch (e) {
      setError('Delete failed: ' + e.message)
    }
  }

  const toggleAnalytics = async (id) => {
    if (analyticsOpen === id) { setAnalyticsOpen(null); return }
    setAnalyticsOpen(id)
    if (analytics[id]) return
    setAnalyticsLoading(true)
    try {
      const res = await getCampaignAnalytics(id)
      if (res.ok) {
        const data = await res.json()
        setAnalytics(prev => ({ ...prev, [id]: data }))
      }
    } finally {
      setAnalyticsLoading(false)
    }
  }

  return (
    <AdminLayout isDark={isDark} setIsDark={setIsDark}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.03em' }}>
            Campaigns
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
            {campaigns.length} total campaigns
          </p>
        </div>
        <button
          onClick={openCreate}
          style={{
            padding: '9px 20px',
            background: 'linear-gradient(135deg, #37ba8c, #2fa97f)',
            color: '#fff', border: 'none', borderRadius: '8px',
            fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          + Create Campaign
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '10px 14px', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.875rem' }}>
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Loading campaigns…</div>
      ) : campaigns.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📢</div>
          <p>No campaigns yet. Create one to get started.</p>
        </div>
      ) : (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-filter)', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 4px 20px var(--shadow-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {['Title', 'Category', 'Status', 'Budget', 'Rate/M', 'Ends At', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c, i) => {
                const ss = statusStyle(c.campaignStatus)
                const cs = catStyle(c.category)
                const budgetPct = Math.min(100, ((parseFloat(c.budgetUsed) || 0) / Math.max(1, parseFloat(c.totalBudget) || 1)) * 100)
                const isAnalyticsOpen = analyticsOpen === c.id
                return (
                  <>
                    <tr key={c.id} style={{ borderBottom: isAnalyticsOpen ? 'none' : (i < campaigns.length - 1 ? '1px solid var(--border-subtle)' : 'none'), transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--hover-bg)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.title}
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, background: cs.bg, color: cs.text }}>
                          {c.category}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, background: ss.bg, color: ss.text }}>
                          {ss.label}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                          {fmtCurrency(c.budgetUsed)} / {fmtCurrency(c.totalBudget)}
                        </div>
                        <div style={{ width: 80, height: 4, background: 'var(--border-filter)', borderRadius: '99px', marginTop: 4 }}>
                          <div style={{ width: `${budgetPct}%`, height: '100%', borderRadius: '99px', background: 'linear-gradient(90deg, var(--green-400), var(--green-600))' }} />
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        ₹{c.ratePerMillion?.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {c.endsAt ? new Date(c.endsAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <ActionBtn title="Edit" onClick={() => openEdit(c)}>✏️</ActionBtn>
                          <ActionBtn title="Analytics" onClick={() => toggleAnalytics(c.id)} active={isAnalyticsOpen}>📊</ActionBtn>
                          <ActionBtn title="Delete" onClick={() => setDeleteId(c.id)} danger>🗑️</ActionBtn>
                        </div>
                      </td>
                    </tr>

                    {/* Analytics Panel */}
                    {isAnalyticsOpen && (
                      <tr key={`analytics-${c.id}`}>
                        <td colSpan={7} style={{ padding: '0 1rem 1rem', background: 'var(--hover-bg)', borderBottom: i < campaigns.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                          {analyticsLoading && !analytics[c.id] ? (
                            <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading analytics…</div>
                          ) : analytics[c.id] ? (
                            <AnalyticsPanel data={analytics[c.id]} />
                          ) : null}
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
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

            {saveError && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem' }}>
                ⚠️ {saveError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '9px 18px', background: 'var(--hover-bg)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '9px 20px', background: saving ? 'rgba(55,186,140,0.4)' : 'linear-gradient(135deg, #37ba8c, #2fa97f)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.875rem', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {saving ? 'Saving…' : editCampaign ? 'Save Changes' : 'Create'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <Modal title="Delete Campaign" onClose={() => setDeleteId(null)}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Are you sure you want to delete this campaign? This action cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button onClick={() => setDeleteId(null)} style={{ padding: '9px 18px', background: 'var(--hover-bg)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
            <button onClick={() => handleDelete(deleteId)} style={{ padding: '9px 20px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit' }}>
              Delete
            </button>
          </div>
        </Modal>
      )}
    </AdminLayout>
  )
}

function AnalyticsPanel({ data }) {
  const total = data.totalSubmissions || 1
  const bars = [
    { label: 'Eligible', count: data.eligibleSubmissions, color: '#34d399' },
    { label: 'Pending', count: data.pendingSubmissions, color: '#fbbf24' },
    { label: 'Rejected', count: data.rejectedSubmissions, color: '#ef4444' },
  ]

  return (
    <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
      <div>
        <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Submission Breakdown</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {bars.map(b => (
            <div key={b.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <span>{b.label}</span>
                <span style={{ fontWeight: 700, color: b.color }}>{b.count}</span>
              </div>
              <div style={{ width: '100%', height: 6, background: 'var(--border-filter)', borderRadius: '99px' }}>
                <div style={{ width: `${Math.round((b.count / total) * 100)}%`, height: '100%', borderRadius: '99px', background: b.color, transition: 'width 0.4s ease' }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Total views: <strong style={{ color: 'var(--text-primary)' }}>{data.totalViews >= 1_000_000 ? (data.totalViews / 1_000_000).toFixed(1) + 'M' : data.totalViews?.toLocaleString('en-IN')}</strong>
        </div>
      </div>
      <div>
        <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Top Creators</h4>
        {data.topCreators?.length === 0 ? (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No eligible submissions yet</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {data.topCreators?.slice(0, 5).map((tc, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-muted)', minWidth: '1rem' }}>#{i + 1}</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600, flex: 1 }}>{tc.username}</span>
                <span style={{ color: 'var(--text-muted)' }}>{tc.viewCount >= 1_000_000 ? (tc.viewCount / 1_000_000).toFixed(1) + 'M' : tc.viewCount?.toLocaleString('en-IN')} views</span>
                <span style={{ color: '#34d399', fontWeight: 700 }}>₹{parseFloat(tc.earnings || 0).toFixed(0)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ActionBtn({ children, onClick, title, danger, active }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        padding: '5px 8px',
        background: active ? 'rgba(16,185,129,0.2)' : danger ? 'rgba(239,68,68,0.1)' : 'var(--hover-bg)',
        border: `1px solid ${active ? 'var(--green-500)' : danger ? 'rgba(239,68,68,0.3)' : 'var(--border-subtle)'}`,
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '0.85rem',
        lineHeight: 1,
      }}
    >
      {children}
    </button>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-filter)', borderRadius: '16px', padding: '1.75rem', width: '100%', maxWidth: '520px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.4rem', lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  background: 'var(--bg-page)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '0.875rem',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

export default AdminCampaignsPage
