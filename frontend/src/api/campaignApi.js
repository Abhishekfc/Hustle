import { api } from './client'
export const getCampaigns = () => api('/campaigns')
export const getCampaignById = (id) => api(`/campaigns/${id}`)
export const getLeaderboard = (id) => api(`/campaigns/${id}/leaderboard`)
export const registerForCampaign = (id) => api(`/campaigns/${id}/register`, { method: 'POST' })
export const getMyRegistrations = () => api('/campaigns/my-registrations')
export const checkIsRegistered = (id) => api(`/campaigns/${id}/is-registered`)
