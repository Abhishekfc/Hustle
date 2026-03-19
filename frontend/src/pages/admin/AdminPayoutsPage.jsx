import { useEffect, useState } from 'react'
import AdminLayout from './AdminLayout'
import { getAllEarnings, triggerPayout, distributeAll } from '../../api/adminApi'

const statusMeta = {
  PENDING:    { bg: 'rgba(251,191,36,0.15)',  text: '#fbbf24', label: '🟡 PENDING' },
  PROCESSING: { bg: 'rgba(96,165,250,0.15)', text: '#60a5fa', label: '⚙️ PROCESSING' },
  PAID:       { bg: 'rgba(52,211,153,0.15)', text: '#34d399', label: '✅ PAID' },
  VOIDED:     { bg: 'rgba(156,163,175,0.15)', text: '#9ca3af', label: '⊘ VOIDED' },
}

const fmtViews = (n) => {
  if (!n) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

const fmtCurrency = (n) => {
  if (!n && n !== 0) return '₹0'
  const num = typeof n === 'string' ? parseFloat(n) : n
  return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

function AdminPayoutsPage({ isDark, setIsDark }) {
  const [earnings, setEarnings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [actionLoading, setActionLoading] = useState(null)
  const [bulkProgress, setBulkProgress] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getAllEarnings()
      if (!res.ok) throw new Error('Failed to load earnings')
      setEarnings(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handlePayout = async (id) => {
    setActionLoading(id)
    try {
      await triggerPayout(id)
      load()
    } finally {
      setActionLoading(null)
    }
  }

  const handleDistributeAll = async () => {
    setBulkProgress({ done: 0, total: '…' })
    setError('')
    try {
      const res = await distributeAll()
      if (!res.ok) {
        const text = await res.text()
        setError(`Distribute failed (${res.status}): ${text}`)
      }
    } catch (e) {
      setError(`Distribute error: ${e.message}`)
    } finally {
      setBulkProgress(null)
      load()
    }
  }

  const handlePayAllPending = async () => {
    const pending = earnings.filter(e => e.payoutStatus === 'PENDING')
    if (pending.length === 0) return
    setBulkProgress({ done: 0, total: pending.length })
    for (let i = 0; i < pending.length; i++) {
      try { await triggerPayout(pending[i].id) } catch {}
      setBulkProgress({ done: i + 1, total: pending.length })
    }
    setBulkProgress(null)
    load()
  }

  const filtered = filterStatus === 'ALL' ? earnings : earnings.filter(e => e.payoutStatus === filterStatus)

  const pendingAmt = earnings.filter(e => e.payoutStatus === 'PENDING').reduce((s, e) => s + parseFloat(e.amount || 0), 0)
  const processingAmt = earnings.filter(e => e.payoutStatus === 'PROCESSING').reduce((s, e) => s + parseFloat(e.amount || 0), 0)
  const paidAmt = earnings.filter(e => e.payoutStatus === 'PAID').reduce((s, e) => s + parseFloat(e.amount || 0), 0)

  return (
    <AdminLayout isDark={isDark} setIsDark={setIsDark}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.03em' }}>
            Payouts
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
            Manage earnings payouts for creators
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={handleDistributeAll}
            disabled={!!bulkProgress}
            style={{
              padding: '9px 20px',
              background: bulkProgress ? 'rgba(55,186,140,0.4)' : 'linear-gradient(135deg, #37ba8c, #2fa97f)',
              color: '#fff', border: 'none', borderRadius: '8px',
              fontWeight: 700, fontSize: '0.875rem', cursor: bulkProgress ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}
          >
            {bulkProgress ? `Distributing…` : '🚀 Distribute All'}
          </button>
          <button
            onClick={handlePayAllPending}
            disabled={!!bulkProgress || earnings.filter(e => e.payoutStatus === 'PENDING').length === 0}
            style={{
              padding: '9px 20px',
              background: 'var(--bg-card)', border: '1px solid var(--border-filter)',
              color: 'var(--text-primary)', borderRadius: '8px',
              fontWeight: 600, fontSize: '0.875rem', cursor: bulkProgress ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}
          >
            {bulkProgress ? `Paying ${bulkProgress.done}/${bulkProgress.total}…` : '⚡ Pay All Pending'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: '💰 Pending', amount: pendingAmt, color: '#fbbf24' },
          { label: '⚙️ Processing', amount: processingAmt, color: '#60a5fa' },
          { label: '✅ Paid Out', amount: paidAmt, color: '#34d399' },
        ].map(item => (
          <div key={item.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-filter)', borderRadius: '12px', padding: '1rem 1.25rem', boxShadow: '0 4px 16px var(--shadow-color)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>{item.label}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: item.color, letterSpacing: '-0.02em' }}>{fmtCurrency(item.amount)}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {['ALL', 'PENDING', 'PROCESSING', 'PAID', 'VOIDED'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} style={{
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

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '10px 14px', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.875rem' }}>
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Loading earnings…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💰</div>
          <p>No earnings found.</p>
        </div>
      ) : (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-filter)', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 4px 20px var(--shadow-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {['Creator', 'Campaign', 'Views at Payout', 'Amount', 'Status', 'Created', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => {
                const sm = statusMeta[e.payoutStatus] || statusMeta.VOIDED
                return (
                  <tr key={e.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border-subtle)' : 'none', transition: 'background 0.15s' }}
                    onMouseEnter={ev => ev.currentTarget.style.background = 'var(--hover-bg)'}
                    onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                      @{e.user?.username || e.userId}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {e.campaign?.title || e.campaignId}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                      {fmtViews(e.viewsAtPayout)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.95rem', color: 'var(--green-400)', fontWeight: 800 }}>
                      {fmtCurrency(e.amount)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, background: sm.bg, color: sm.text, whiteSpace: 'nowrap' }}>
                        {sm.label}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {e.createdAt ? new Date(e.createdAt).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {e.payoutStatus === 'PENDING' && (
                        <button
                          onClick={() => handlePayout(e.id)}
                          disabled={actionLoading === e.id || !!bulkProgress}
                          style={{
                            padding: '5px 14px',
                            background: actionLoading === e.id ? 'rgba(55,186,140,0.3)' : 'linear-gradient(135deg, #37ba8c, #2fa97f)',
                            color: '#fff', border: 'none', borderRadius: '6px',
                            fontSize: '0.78rem', fontWeight: 700, cursor: actionLoading === e.id ? 'not-allowed' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                          }}
                        >
                          {actionLoading === e.id ? '…' : '💸 Pay Now'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminPayoutsPage
