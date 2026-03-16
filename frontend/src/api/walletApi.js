import { api } from './client'
export const getMyWallet = () => api('/wallet/me')
export const requestWithdrawal = (data) => api('/wallet/withdraw', { method: 'POST', body: JSON.stringify(data) })
export const getWithdrawalHistory = () => api('/wallet/withdrawals')
