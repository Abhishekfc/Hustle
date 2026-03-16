import StatusBadge from '../shared/StatusBadge'

const PLATFORM_ICONS = { YOUTUBE: 'YT', TIKTOK: 'TK', INSTAGRAM: 'IG', X: 'X' }

function AccountCard({ account, onVerify, onDelete }) {
  return (
    <div className="account-card">
      <div className="account-card-header">
        <div className="account-platform-icon">
          {PLATFORM_ICONS[account.platform] || account.platform?.slice(0,2)}
        </div>
        <div className="account-card-info">
          <div className="account-card-handle">{account.handle}</div>
          <div className="account-card-platform">{account.platform}</div>
        </div>
        <StatusBadge status={account.verificationStatus} />
      </div>
      {account.profileUrl && (
        <a href={account.profileUrl} target="_blank" rel="noopener noreferrer" className="account-card-url">
          {account.profileUrl}
        </a>
      )}
      {account.verificationCode && account.verificationStatus === 'PENDING' && (
        <div className="account-card-code">
          <span className="account-card-code-label">Verification code:</span>
          <code>{account.verificationCode}</code>
          <p className="account-card-code-hint">Paste this code in your bio, then click Verify</p>
        </div>
      )}
      <div className="account-card-actions">
        {account.verificationStatus === 'PENDING' && (
          <button className="btn-verify" onClick={onVerify}>Verify</button>
        )}
        <button className="btn-delete" onClick={onDelete}>Remove</button>
      </div>
    </div>
  )
}

export default AccountCard
