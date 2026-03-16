import { api } from './client'
export const getAccounts = () => api('/accounts')
export const connectAccount = (data) => api('/accounts/connect', { method: 'POST', body: JSON.stringify(data) })
export const verifyAccount = (id, data) => api(`/accounts/${id}/verify`, { method: 'POST', body: JSON.stringify(data) })
export const deleteAccount = (id) => api(`/accounts/${id}`, { method: 'DELETE' })
