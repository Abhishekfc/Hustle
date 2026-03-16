import { useCampaigns } from '../../hooks/useCampaigns'
import CampaignCard from './CampaignCard'

function CampaignList({ activeFilter }) {
  const { campaigns, loading, error } = useCampaigns()

  const filtered = activeFilter === 'All'
    ? campaigns
    : campaigns.filter(c => c.category === activeFilter)

  return (
    <main className="cards-section">
      {loading ? (
        <div className="loading">Loading campaigns...</div>
      ) : (
        <div className="card-grid">
          {filtered.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          <p>No campaigns found.</p>
        </div>
      )}
    </main>
  )
}

export default CampaignList
