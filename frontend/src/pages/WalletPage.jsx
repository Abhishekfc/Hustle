import { useRef, useState } from 'react'
import Navbar from '../components/layout/Navbar'
import WithdrawModal from '../components/wallet/WithdrawModal'
import WithdrawalHistory from '../components/wallet/WithdrawalHistory'
import { useWallet } from '../hooks/useWallet'
import { formatCurrency } from '../utils/formatCurrency'
import { formatViews } from '../utils/formatViews'
import './DashboardPage.css'

function WalletPage({ isDark, setIsDark }) {
  const { wallet, withdrawals, loading, refresh } = useWallet()
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)

  return (
    <div className="dash-layout-nosidebar">
      <Navbar isDark={isDark} setIsDark={setIsDark} profileOpen={profileOpen} setProfileOpen={setProfileOpen} profileRef={profileRef} />
      <div className="dash-main">
        <div className="dash-page">
          <div className="dash-page-header">
            <div>
              <h1 className="dash-page-title">Wallet</h1>
              <p className="dash-page-subtitle">Your balance and withdrawal history</p>
            </div>
            {wallet && <button className="btn-primary-action" onClick={() => setShowWithdraw(true)}>Request Withdrawal</button>}
          </div>
          {loading ? (
            <div className="loading">Loading wallet…</div>
          ) : (
            <>
              <div className="wallet-stats-grid">
                <div className="wallet-stat-card wallet-stat-balance">
                  <span className="wallet-stat-label">Available Balance</span>
                  <span className="wallet-stat-value green">{formatCurrency(wallet?.balance)}</span>
                </div>
                <div className="wallet-stat-card">
                  <span className="wallet-stat-label">Total Earned</span>
                  <span className="wallet-stat-value">{formatCurrency(wallet?.totalEarned)}</span>
                </div>
                <div className="wallet-stat-card">
                  <span className="wallet-stat-label">Total Withdrawn</span>
                  <span className="wallet-stat-value">{formatCurrency(wallet?.totalWithdrawn)}</span>
                </div>
                <div className="wallet-stat-card">
                  <span className="wallet-stat-label">Eligible Views</span>
                  <span className="wallet-stat-value">{formatViews(wallet?.totalViewsEligible)}</span>
                </div>
              </div>
              <WithdrawalHistory withdrawals={withdrawals} />
            </>
          )}
          {showWithdraw && (
            <WithdrawModal balance={wallet?.balance || 0} onClose={() => setShowWithdraw(false)} onSuccess={() => { refresh(); setShowWithdraw(false) }} />
          )}
        </div>
      </div>
    </div>
  )
}

export default WalletPage
