import { useEffect, useState } from 'react'
import { getAccounts } from '../api/connectedAccountApi'

export function useConnectedAccounts() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = () => {
    setLoading(true)
    getAccounts()
      .then(res => res.json())
      .then(data => setAccounts(data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { refresh() }, [])
  return { accounts, loading, refresh }
}
