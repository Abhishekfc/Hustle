import { useState } from 'react'
import { connectAccount } from '../../api/connectedAccountApi'

const PLATFORMS = ['YOUTUBE', 'TIKTOK', 'INSTAGRAM', 'X']

function ConnectModal({ onClose, onSuccess }) {
  const [platform, setPlatform] = useState('YOUTUBE')
  const [handle, setHandle] = useState('')
  const [profileUrl, setProfileUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await connectAccount({ platform, handle: handle.trim(), profileUrl: profileUrl.trim() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to connect')
      setResult(data)
      if (onSuccess) onSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <div className="modal-header">
          <h3 className="modal-title">Connect Social Account</h3>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {result ? (
          <div className="modal-success">
            <p>Account connected! Your verification code:</p>
            <code className="modal-code">{result.verificationCode}</code>
            <p className="modal-hint">Paste this code in your bio, then click Verify on the account card.</p>
            <button className="modal-submit-btn" onClick={onClose}>Done</button>
          </div>
        ) : (
          <form className="modal-form" onSubmit={handleSubmit}>
            {error && <div className="modal-error">{error}</div>}
            <div className="modal-input-group">
              <label>Platform</label>
              <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
                {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="modal-input-group">
              <label>Handle</label>
              <input type="text" placeholder="@yourchannel" value={handle} onChange={(e) => setHandle(e.target.value)} required autoFocus />
            </div>
            <div className="modal-input-group">
              <label>Profile URL (optional)</label>
              <input type="url" placeholder="https://youtube.com/@yourchannel" value={profileUrl} onChange={(e) => setProfileUrl(e.target.value)} />
            </div>
            <button type="submit" className="modal-submit-btn" disabled={loading}>
              {loading ? 'Connecting…' : 'Connect Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default ConnectModal
