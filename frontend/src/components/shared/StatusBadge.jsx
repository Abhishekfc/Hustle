import './StatusBadge.css'

const STATUS_COLORS = {
  ACTIVE: 'green', ELIGIBLE: 'green', VERIFIED: 'green', PAID: 'green', PAID_OUT: 'green', APPROVED: 'green', NEW: 'green',
  PENDING: 'yellow', PROCESSING: 'yellow',
  REJECTED: 'red', VOIDED: 'red', FAILED: 'red',
  ENDED: 'gray', INELIGIBLE: 'gray',
}

function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || 'gray'
  return <span className={`status-badge status-badge-${color}`}>{status}</span>
}

export default StatusBadge
