import { useRef, useState } from 'react'
import Navbar from '../components/layout/Navbar'
import AccountCard from '../components/accounts/AccountCard'
import ConnectModal from '../components/accounts/ConnectModal'
import { useConnectedAccounts } from '../hooks/useConnectedAccounts'
import { verifyAccount, deleteAccount } from '../api/connectedAccountApi'
import './DashboardPage.css'

function ConnectedAccountsPage({ isDark, setIsDark }) {
  const { accounts, loading, refresh } = useConnectedAccounts()
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)

  const handleVerify = async (account) => {
    try {
      const res = await verifyAccount(account.id, { verificationCode: account.verificationCode })
      if (!res.ok) throw new Error('Verification failed')
      refresh()
    } catch (e) { setError(e.message) }
  }

  const handleDelete = async (id) => {
    try {
      await deleteAccount(id)
      refresh()
    } catch (e) { setError('Delete failed') }
  }

  return (
    <div className="dash-layout-nosidebar">
      <Navbar isDark={isDark} setIsDark={setIsDark} profileOpen={profileOpen} setProfileOpen={setProfileOpen} profileRef={profileRef} />
      <div className="dash-main">
        <div className="dash-page">
          <div className="dash-page-header">
            <div>
              <h1 className="dash-page-title">Connected Accounts</h1>
              <p className="dash-page-subtitle">Manage your social media accounts</p>
            </div>
            <button className="btn-primary-action" onClick={() => setShowModal(true)}>+ Connect Account</button>
          </div>
          {error && <div className="page-error">{error}</div>}
          {loading ? (
            <div className="loading">Loading accounts…</div>
          ) : accounts.length === 0 ? (
            <div className="empty-state"><p>No accounts connected yet. Connect your first account to start submitting videos.</p></div>
          ) : (
            <div className="accounts-grid">
              {accounts.map(a => (
                <AccountCard key={a.id} account={a} onVerify={() => handleVerify(a)} onDelete={() => handleDelete(a.id)} />
              ))}
            </div>
          )}
          {showModal && <ConnectModal onClose={() => setShowModal(false)} onSuccess={() => { refresh(); setShowModal(false) }} />}
        </div>
      </div>
    </div>
  )
}

export default ConnectedAccountsPage
