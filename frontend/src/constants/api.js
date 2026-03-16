export const API_BASE = '/api'

export const getToken = () => localStorage.getItem('hustle_token')
export const getUser = () => {
  const u = localStorage.getItem('hustle_user')
  return u ? JSON.parse(u) : null
}
export const setAuth = (token, user) => {
  localStorage.setItem('hustle_token', token)
  localStorage.setItem('hustle_user', JSON.stringify(user))
}
export const clearAuth = () => {
  localStorage.removeItem('hustle_token')
  localStorage.removeItem('hustle_user')
}
export const isLoggedIn = () => !!getToken()

export const authFetch = async (url, options = {}) => {
  const token = getToken()
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
}