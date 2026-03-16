import { api } from './client'
export const getCampaigns = () => api('/campaigns')
export const getCampaignById = (id) => api(`/campaigns/${id}`)
export const getLeaderboard = (id) => api(`/campaigns/${id}/leaderboard`)
