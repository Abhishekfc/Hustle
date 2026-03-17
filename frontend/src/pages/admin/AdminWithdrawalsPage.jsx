import { useEffect, useState } from 'react'
import AdminLayout from './AdminLayout'
import { getAllWithdrawals, updateWithdrawalStatus } from '../../api/adminApi'

const statusMeta = {
  PENDING:  { bg: 'rgba(251,191,36,0.15)', text: '#fbbf24', label: '🟡 PENDING' },
  APPROVED: { bg: 'rgba(96,165,250,0.15)', text: '#60a5fa', label: '🔵 APPROVED' },
  PAID:     { bg: 'rgba(52,211,153,0.15)', text: '#34d399', label: '✅ PAID' },
  REJECTED: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444', label: '❌ REJECTED' },
}

const fmtCurrency = (n) => {
  if (!n && n !== 0) return '₹0'
  const num = typeof n === 'string' ? parseFloat(n) : n
  return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

function AdminWithdrawalsPage({ isDark, setIsDark }) {
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [actionLoading, setActionLoading] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getAllWithdrawals()
      if (!res.ok) throw new Error('Failed to load withdrawals')
      setWithdrawals(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleStatus = async (id, status) => {
    setActionLoading(id + '-' + status)
    try {
      const res = await updateWithdrawalStatus(id, status)
      if (!res.ok) throw new Error('Update failed')
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = filterStatus === 'ALL' ? withdrawals : withdrawals.filter(w => w.status === filterStatus)
  const pendingTotal = withdrawals.filter(w => w.status === 'PENDING').reduce((s, w) => s + parseFloat(w.amount || 0), 0)

  return (
    <AdminLayout isDark={isDark} setIsDark={setIsDark}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.03em' }}>
          Withdrawals
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
          Manage creator withdrawal requests
        </p>
      </div>

      {/* Pending Summary */}
      {pendingTotal > 0 && (
        <div style={{
          background: 'rgba(251,191,36,0.08)',
          border: '1px solid rgba(251,191,36,0.25)',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <span style={{ fontSize: '1.25rem' }}>⚠️</span>
          <div>
            <span style={{ fontWeight: 700, color: '#fbbf24', fontSize: '0.95rem' }}>
              {fmtCurrency(pendingTotal)}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '0.5rem' }}>
              in pending withdrawals ({withdrawals.filter(w => w.status === 'PENDING').length} requests)
            </span>
          </div>
        </div>
      )}

      {/* Filter */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {['ALL', 'PENDING', 'APPROVED', 'PAID', 'REJECTED'].map(s => (
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
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Loading withdrawals…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💳</div>
          <p>No withdrawal requests found.</p>
        </div>
      ) : (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-filter)', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 4px 20px var(--shadow-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {['Creator', 'Amount', 'Method', 'Payment Details', 'Status', 'Requested At', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((w, i) => {
                const sm = statusMeta[w.status] || statusMeta.PENDING
                return (
                  <tr key={w.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border-subtle)' : 'none', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--hover-bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                      @{w.user?.username || w.userId}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.95rem', color: 'var(--green-400)', fontWeight: 800 }}>
                      {fmtCurrency(w.amount)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {w.paymentMethod || '—'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {w.paymentDetails || '—'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, background: sm.bg, color: sm.text, whiteSpace: 'nowrap' }}>
                        {sm.label}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {w.requestedAt ? new Date(w.requestedAt).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {w.status === 'PENDING' && (
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            onClick={() => handleStatus(w.id, 'PAID')}
                            disabled={!!actionLoading}
                            style={{ padding: '5px 12px', background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '6px', color: '#34d399', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                          >
                            {actionLoading === w.id + '-PAID' ? '…' : '✓ Mark Paid'}
                          </button>
                          <button
                            onClick={() => handleStatus(w.id, 'REJECTED')}
                            disabled={!!actionLoading}
                            style={{ padding: '5px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', color: '#ef4444', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                          >
                            {actionLoading === w.id + '-REJECTED' ? '…' : '✗ Reject'}
                          </button>
                        </div>
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

export default AdminWithdrawalsPage
