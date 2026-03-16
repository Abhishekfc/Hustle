import { api } from './client'
export const getMyEarnings = () => api('/earnings/me')
