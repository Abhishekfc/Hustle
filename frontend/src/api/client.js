const BASE_URL = '/api'
const getToken = () => localStorage.getItem('hustle_token')

export const api = async (endpoint, options = {}) => {
  const token = getToken()
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (res.status === 401) {
    localStorage.removeItem('hustle_token')
    localStorage.removeItem('hustle_user')
    window.location.href = '/login'
    return
  }
  return res
}
