import { useState } from 'react'
import { requestWithdrawal } from '../../api/walletApi'
import { formatCurrency } from '../../utils/formatCurrency'

function WithdrawModal({ balance, onClose, onSuccess }) {
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('UPI')
  const [paymentDetails, setPaymentDetails] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const num = parseFloat(amount)
    if (!num || num <= 0) return setError('Enter a valid amount.')
    if (num > balance) return setError(`Amount exceeds balance (${formatCurrency(balance)}).`)
    if (!paymentDetails.trim()) return setError('Enter your payment details.')
    setLoading(true)
    setError('')
    try {
      const res = await requestWithdrawal({ amount: num, paymentMethod, paymentDetails: paymentDetails.trim() })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Withdrawal failed')
      }
      if (onSuccess) onSuccess()
      onClose()
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
          <h3 className="modal-title">Request Withdrawal</h3>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        <p className="modal-subtitle">Available: <strong>{formatCurrency(balance)}</strong></p>

        <form className="modal-form" onSubmit={handleSubmit}>
          {error && <div className="modal-error">{error}</div>}
          <div className="modal-input-group">
            <label>Amount</label>
            <input type="number" placeholder="0.00" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required autoFocus />
          </div>
          <div className="modal-input-group">
            <label>Payment Method</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="UPI">UPI</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="modal-input-group">
            <label>Payment Details</label>
            <textarea placeholder="e.g. user@upi or bank account details" value={paymentDetails} onChange={(e) => setPaymentDetails(e.target.value)} rows={3} required />
          </div>
          <button type="submit" className="modal-submit-btn" disabled={loading}>
            {loading ? 'Processing…' : 'Confirm Withdrawal'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default WithdrawModal
