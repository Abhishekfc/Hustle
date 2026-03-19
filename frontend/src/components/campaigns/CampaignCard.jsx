import { Link } from 'react-router-dom'
import { TrendingUp } from 'lucide-react'
import { formatCurrency } from '../../utils/formatCurrency'
import { PlatformStack } from '../shared/PlatformIcons'
import './CampaignCard.css'

const CAT_STYLE = {
  CLIPPING: { bg: 'rgba(239,68,68,0.12)',   text: '#f87171' },
  UGC:      { bg: 'rgba(96,165,250,0.12)',   text: '#60a5fa' },
  MUSIC:    { bg: 'rgba(167,139,250,0.12)',  text: '#a78bfa' },
  LOGO:     { bg: 'rgba(52,211,153,0.12)',   text: '#34d399' },
  OTHER:    { bg: 'rgba(156,163,175,0.12)', text: '#9ca3af' },
}

function CampaignCard({ campaign }) {
  const budgetUsed    = parseFloat(campaign.budgetUsed  || 0)
  const totalBudget   = parseFloat(campaign.totalBudget || 1)
  const budgetPercent = Math.min(100, (budgetUsed / totalBudget) * 100)
  const isEnded       = campaign.campaignStatus === 'ENDED'
  const cs            = CAT_STYLE[campaign.category] || CAT_STYLE.OTHER
  const initial       = campaign.title?.[0]?.toUpperCase() || '?'

  return (
    <Link to={`/campaign/${campaign.id}`} className="campaign-card">
      {/* ── Gradient image area ── */}
      <div className="campaign-card-image">
        {campaign.thumbnailUrl
          ? <img src={campaign.thumbnailUrl} alt={campaign.title} className="campaign-card-img" />
          : <span className="campaign-card-letter">{initial}</span>
        }

        {/* Status badge — top right of image */}
        <span className={`campaign-card-status-badge ${isEnded ? 'ended' : 'active'}`}>
          <span className="campaign-card-status-dot" />
          {campaign.campaignStatus}
        </span>

        {/* Platform icons — bottom left of image */}
        {campaign.platforms?.length > 0 && (
          <div className="campaign-card-platforms">
            <PlatformStack platforms={campaign.platforms} size={22} />
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="campaign-card-body">
        {/* Category + title */}
        <div>
          <span className="campaign-card-cat" style={{ background: cs.bg, color: cs.text }}>
            {campaign.category}
          </span>
          <h3 className="campaign-card-title">{campaign.title}</h3>
        </div>

        {/* Rate */}
        <div className="campaign-card-rate-block">
          <div className="campaign-card-rate-icon">
            <TrendingUp size={13} strokeWidth={2.5} />
          </div>
          <div>
            <div className="campaign-card-rate-value">{formatCurrency(campaign.ratePerMillion)}</div>
            <div className="campaign-card-rate-label">per 1M views</div>
          </div>
        </div>

        {/* Budget bar */}
        <div className="campaign-card-budget">
          <div className="campaign-card-budget-header">
            <span className="campaign-card-budget-label">Budget</span>
            <span className="campaign-card-budget-pct">{budgetPercent.toFixed(0)}%</span>
          </div>
          <div className="campaign-card-budget-track">
            <div className="campaign-card-budget-fill" style={{ width: `${budgetPercent}%` }} />
          </div>
          <div className="campaign-card-budget-amounts">
            <span>{formatCurrency(budgetUsed)}</span>
            <span>{formatCurrency(totalBudget)}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default CampaignCard
