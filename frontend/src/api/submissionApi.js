import { api } from './client'
export const submitVideo = (data) => api('/submissions', { method: 'POST', body: JSON.stringify(data) })
export const getMySubmissions = () => api('/submissions/me')
export const getMySubmissionsForCampaign = (campaignId) => api(`/submissions/me/${campaignId}`)
export const deleteSubmission = (id) => api(`/submissions/${id}`, { method: 'DELETE' })
