const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export type User = { id: string; name: string; email: string }
export type SailingTrip = { id: string; title: string; boatName: string; departurePort: string; departureAt: string; destination: string | null; notes: string | null }

async function request<T>(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('skippers-token')
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) },
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new Error(body?.message || 'No se pudo completar la petición')
  return body as T
}

export const register = (data: { name: string; email: string; password: string }) => request<{ token: string; user: User }>('/auth/register', { method: 'POST', body: JSON.stringify(data) })
export const login = (data: { email: string; password: string }) => request<{ token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify(data) })
export const getTrips = () => request<SailingTrip[]>('/trips/upcoming')

