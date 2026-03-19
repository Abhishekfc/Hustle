import { api } from './client'
export const login = (data) => api('/auth/login', { method: 'POST', body: JSON.stringify(data) })
export const register = (data) => api('/auth/register', { method: 'POST', body: JSON.stringify(data) })
export const googleLogin = (email, name) => api('/auth/google', { method: 'POST', body: JSON.stringify({ email, name }) })
