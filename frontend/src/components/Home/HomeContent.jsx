import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCampaigns } from '../../api/campaignApi'

function HomeContent({ activeFilter }) {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      try {
        const res = await getCampaigns()
        if (!res.ok) throw new Error()
        const data = await res.json()
        if (!cancelled) setCampaigns(data)
      } catch {
        if (!cancelled) setCampaigns([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [])

  const filtered = activeFilter === 'All'
    ? campaigns
    : campaigns.filter(c => c.category === activeFilter.toUpperCase())

  return (
    <main className="cards-section">
      {loading ? (
        <div className="loading">Loading campaigns...</div>
      ) : (
        <div className="card-grid">
          {filtered.map((campaign) => (
            <Link key={campaign.id} to={`/campaign/${campaign.id}`} className="card card-clickable">
              <div className="card-image">
                <span className="card-letter">{campaign.title?.[0]?.toUpperCase()}</span>
              </div>
              <div className="card-content">
                <h3 className="card-title">{campaign.title}</h3>
                <span className="card-category">{campaign.category}</span>
              </div>
            </Link>
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

export default HomeContent