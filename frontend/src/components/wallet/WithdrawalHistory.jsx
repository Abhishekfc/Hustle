import StatusBadge from '../shared/StatusBadge'
import { formatCurrency } from '../../utils/formatCurrency'

function WithdrawalHistory({ withdrawals }) {
  if (!withdrawals || withdrawals.length === 0) {
    return (
      <div className="withdrawal-section">
        <h3 className="section-title">Withdrawal History</h3>
        <div className="empty-state"><p>No withdrawals yet.</p></div>
      </div>
    )
  }

  return (
    <div className="withdrawal-section">
      <h3 className="section-title">Withdrawal History</h3>
      <div className="dash-table-wrapper">
        <table className="dash-table">
          <thead>
            <tr>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th>Requested</th>
              <th>Processed</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.map((w) => (
              <tr key={w.id}>
                <td className="td-green">{formatCurrency(w.amount)}</td>
                <td>{w.paymentMethod}</td>
                <td><StatusBadge status={w.status} /></td>
                <td>{w.requestedAt ? new Date(w.requestedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                <td>{w.processedAt ? new Date(w.processedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default WithdrawalHistory
