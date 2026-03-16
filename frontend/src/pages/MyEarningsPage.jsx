import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import StatusBadge from '../components/shared/StatusBadge'
import { getMyEarnings } from '../api/earningsApi'
import { formatCurrency } from '../utils/formatCurrency'
import { formatViews } from '../utils/formatViews'
import './DashboardPage.css'

function MyEarningsPage({ isDark, setIsDark }) {
  const [earnings, setEarnings] = useState([])
  const [loading, setLoading] = useState(true)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)

  useEffect(() => {
    getMyEarnings()
      .then(res => res.json())
      .then(data => setEarnings(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const totalEarned = earnings.reduce((s, e) => s + (e.amount || 0), 0)

  return (
    <div className="dash-layout-nosidebar">
      <Navbar isDark={isDark} setIsDark={setIsDark} profileOpen={profileOpen} setProfileOpen={setProfileOpen} profileRef={profileRef} />
      <div className="dash-main">
        <div className="dash-page">
          <div className="dash-page-header">
            <div>
              <h1 className="dash-page-title">My Earnings</h1>
              <p className="dash-page-subtitle">Earnings breakdown by submission</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {earnings.length > 0 && (
                <div className="earnings-total-badge">Total: <strong>{formatCurrency(totalEarned)}</strong></div>
              )}
              <Link to="/wallet" className="btn-primary-action">Go to Wallet</Link>
            </div>
          </div>
          {loading ? (
            <div className="loading">Loading earnings…</div>
          ) : earnings.length === 0 ? (
            <div className="empty-state">
              <p>No earnings yet. Submit videos to active campaigns to start earning!</p>
            </div>
          ) : (
            <div className="dash-table-wrapper">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Views at Payout</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {earnings.map(e => (
                    <tr key={e.id}>
                      <td>{e.campaignTitle || '—'}</td>
                      <td>{formatViews(e.viewsAtPayout)}</td>
                      <td className="td-green">{formatCurrency(e.amount)}</td>
                      <td><StatusBadge status={e.payoutStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MyEarningsPage
