import { Link } from 'react-router-dom'
import Badge from '../shared/Badge'
import StatusBadge from '../shared/StatusBadge'
import { formatCurrency } from '../../utils/formatCurrency'
import './CampaignCard.css'

function CampaignCard({ campaign }) {
  return (
    <Link to={`/campaign/${campaign.id}`} className="campaign-card">
      <div className="campaign-card-image">
        <span className="card-letter">{campaign.title?.[0]?.toUpperCase()}</span>
      </div>
      <div className="campaign-card-body">
        <div className="campaign-card-top">
          <h3 className="campaign-card-title">{campaign.title}</h3>
          <StatusBadge status={campaign.campaignStatus} />
        </div>
        <div className="campaign-card-badges">
          <Badge label={campaign.category} />
        </div>
        <p className="campaign-card-rate">
          {formatCurrency(campaign.ratePerMillion)} <span>per 1M views</span>
        </p>
      </div>
    </Link>
  )
}

export default CampaignCard
