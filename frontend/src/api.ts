const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export type User = { id: string; name: string; email: string }
export type BoatOwnershipType = 'owner' | 'co-owner'
export type TripStatus = 'planned' | 'completed'
export type Boat = { id: string; name: string; brand: string; model: string; lengthMeters: number; yearBuilt: number; ownershipType: BoatOwnershipType; engineType: string | null; sailPlan: string | null; renewals: string | null; notes: string | null }
export type SailingTrip = { id: string; title: string; boatName: string | null; boat: Boat | null; departurePort: string; departureAt: string; destination: string | null; notes: string | null; status: TripStatus; isMine: boolean; canEdit: boolean }

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
export const getTrips = () => request<SailingTrip[]>('/trips')
export const getBoats = () => request<Boat[]>('/boats')
export const createBoat = (data: Omit<Boat, 'id'>) => request<Boat>('/boats', { method: 'POST', body: JSON.stringify(data) })
export const deleteBoat = (id: string) => request<{ deleted: boolean }>(`/boats/${id}`, { method: 'DELETE' })
export const createTrip = (data: { title: string; departurePort: string; departureAt: string; destination?: string; notes?: string; boatId?: string }) => request<SailingTrip>('/trips', { method: 'POST', body: JSON.stringify(data) })
export const updateTrip = (id: string, data: { status?: TripStatus; boatId?: string | null }) => request<SailingTrip>(`/trips/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
