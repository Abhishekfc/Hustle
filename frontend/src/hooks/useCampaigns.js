import { useEffect, useState } from 'react'
import { getCampaigns } from '../api/campaignApi'

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getCampaigns()
      .then(res => res.json())
      .then(data => setCampaigns(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return { campaigns, loading, error }
}
