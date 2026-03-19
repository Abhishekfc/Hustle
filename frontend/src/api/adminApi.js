import { api } from './client'

// Stats
export const getAdminStats = () => api('/admin/stats')

// Campaigns
export const getAllCampaigns = () => api('/campaigns/admin/all')
export const createCampaign = (data) => api('/campaigns', { method: 'POST', body: JSON.stringify(data) })
export const updateCampaign = (id, data) => api(`/campaigns/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteCampaign = (id) => api(`/campaigns/${id}`, { method: 'DELETE' })
export const getCampaignAnalytics = (id) => api(`/admin/campaigns/${id}/analytics`)

// Submissions
export const getAllSubmissions = () => api('/submissions/admin/all')
export const getCampaignSubmissions = (campaignId) => api(`/submissions/admin/campaign/${campaignId}`)
export const markEligible = (id) => api(`/submissions/admin/${id}/eligible`, { method: 'PUT' })
export const rejectSubmission = (id) => api(`/submissions/admin/${id}/reject`, { method: 'PUT' })
export const updateSubmissionViews = (id, viewCount) =>
  api(`/submissions/admin/${id}/views`, { method: 'PUT', body: JSON.stringify({ viewCount }) })

// Earnings & Payouts
export const getAllEarnings = () => api('/earnings/admin/all')
export const triggerPayout = (id) => api(`/earnings/admin/${id}/payout`, { method: 'POST' })

// Users
export const getAllUsers = () => api('/admin/users')

// Wallets & Withdrawals
export const getAllWallets = () => api('/wallet/admin/all')
export const getAllWithdrawals = () => api('/wallet/admin/withdrawals')
export const updateWithdrawalStatus = (id, status) =>
  api(`/wallet/admin/withdrawals/${id}`, { method: 'PUT', body: JSON.stringify({ status }) })
export const distributeAll = () => api('/wallet/admin/distribute-all', { method: 'POST' })
export const distributeCampaign = (id) => api(`/wallet/admin/distribute/${id}`, { method: 'POST' })

// View sync
export const syncCampaignViews = (campaignId) => api(`/admin/sync-views/campaign/${campaignId}`, { method: 'POST' })
