import StatusBadge from '../shared/StatusBadge'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatViews } from '../../utils/formatViews'

function SubmissionEarningsRow({ submission }) {
  const renderEarnings = () => {
    if (submission.earningsVisible) return <span className="td-green">{formatCurrency(submission.earnings)}</span>
    if (submission.status === 'ELIGIBLE') return <span className="td-muted">Campaign active — earnings pending</span>
    if (submission.status === 'PENDING') return <span className="td-muted">Under review</span>
    if (submission.status === 'REJECTED') return <span className="td-red">Rejected</span>
    return <span className="td-muted">—</span>
  }

  return (
    <tr>
      <td>{submission.campaignTitle || '—'}</td>
      <td className="td-url">
        {submission.videoUrl ? (
          <a href={submission.videoUrl} target="_blank" rel="noopener noreferrer">
            {submission.videoUrl.length > 40 ? submission.videoUrl.slice(0, 40) + '…' : submission.videoUrl}
          </a>
        ) : '—'}
      </td>
      <td><StatusBadge status={submission.status} /></td>
      <td>{formatViews(submission.viewCount)}</td>
      <td>{renderEarnings()}</td>
    </tr>
  )
}

export default SubmissionEarningsRow
