import { useEffect, useState } from 'react'
import { getMyWallet, getWithdrawalHistory } from '../api/walletApi'

export function useWallet() {
  const [wallet, setWallet] = useState(null)
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = () => {
    setLoading(true)
    Promise.all([getMyWallet(), getWithdrawalHistory()])
      .then(async ([wRes, whRes]) => {
        setWallet(await wRes.json())
        setWithdrawals(await whRes.json())
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { refresh() }, [])
  return { wallet, withdrawals, loading, refresh }
}
