import { useEffect, useMemo, useState } from 'react'
import AdminLayout from './AdminLayout'
import { getAllUsers } from '../../api/adminApi'

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

const roleMeta = {
  ADMIN:   { bg: 'rgba(167,139,250,0.15)', text: '#a78bfa' },
  CREATOR: { bg: 'rgba(52,211,153,0.15)',  text: '#34d399' },
}

function AdminUsersPage({ isDark, setIsDark }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortDir, setSortDir] = useState('desc')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await getAllUsers()
        if (!res.ok) throw new Error('Failed to load users')
        setUsers(await res.json())
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSort = (col) => {
    if (sortBy === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(col)
      setSortDir('desc')
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return users.filter(u =>
      !q || u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    )
  }, [users, search])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av = a[sortBy], bv = b[sortBy]
      if (sortBy === 'totalEarned') { av = parseFloat(av || 0); bv = parseFloat(bv || 0) }
      if (sortBy === 'totalViewsGenerated') { av = av || 0; bv = bv || 0 }
      if (sortBy === 'submissionCount') { av = av || 0; bv = bv || 0 }
      if (sortBy === 'createdAt') { av = new Date(av || 0).getTime(); bv = new Date(bv || 0).getTime() }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [filtered, sortBy, sortDir])

  const SortHeader = ({ col, children }) => {
    const active = sortBy === col
    return (
      <th
        onClick={() => handleSort(col)}
        style={{
          padding: '0.85rem 1rem',
          textAlign: 'left',
          fontSize: '0.7rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: active ? 'var(--green-400)' : 'var(--text-muted)',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          userSelect: 'none',
        }}
      >
        {children} {active ? (sortDir === 'asc' ? '↑' : '↓') : ''}
      </th>
    )
  }

  return (
    <AdminLayout isDark={isDark} setIsDark={setIsDark}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.03em' }}>
          Users
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
          {users.length} total users
        </p>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '1.25rem' }}>
        <input
          type="text"
          placeholder="Search by username or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '360px',
            padding: '9px 14px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-filter)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            outline: 'none',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '10px 14px', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.875rem' }}>
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Loading users…</div>
      ) : sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
          <p>{search ? 'No users match your search.' : 'No users yet.'}</p>
        </div>
      ) : (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-filter)', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 4px 20px var(--shadow-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>User</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Role</th>
                <SortHeader col="totalViewsGenerated">Total Views</SortHeader>
                <SortHeader col="submissionCount">Submissions</SortHeader>
                <SortHeader col="totalEarned">Total Earned</SortHeader>
                <SortHeader col="createdAt">Joined</SortHeader>
              </tr>
            </thead>
            <tbody>
              {sorted.map((u, i) => {
                const rm = roleMeta[u.role] || roleMeta.CREATOR
                const initial = u.username?.[0]?.toUpperCase() || '?'
                return (
                  <tr key={u.id} style={{ borderBottom: i < sorted.length - 1 ? '1px solid var(--border-subtle)' : 'none', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--hover-bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--green-400), var(--green-700))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.85rem', fontWeight: 800, color: '#fff', flexShrink: 0,
                        }}>
                          {initial}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                            {u.username}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, background: rm.bg, color: rm.text }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                      {fmtViews(u.totalViewsGenerated)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                      {u.submissionCount}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.9rem', color: 'var(--green-400)', fontWeight: 800 }}>
                      {fmtCurrency(u.totalEarned)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : '—'}
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

export default AdminUsersPage
