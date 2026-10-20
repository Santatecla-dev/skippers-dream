import { FormEvent, useEffect, useMemo, useState } from 'react'
import { getTrips, login, register, SailingTrip, User } from './api'

type AuthMode = 'login' | 'register'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

function AuthScreen({ onAuthenticated }: { onAuthenticated: (token: string, user: User) => void }) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setLoading(true)
    try {
      const result = mode === 'login' ? await login({ email, password }) : await register({ name, email, password })
      onAuthenticated(result.token, result.user)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo iniciar sesión') }
    finally { setLoading(false) }
  }

  return <main className="auth-layout">
    <section className="auth-hero"><div className="brand-mark">⚓</div><p className="eyebrow">SKIPPER'S DREAM</p><h1>Tu próxima aventura empieza en el agua.</h1><p>Organiza tus salidas, conoce tus horas de mar y mantén el rumbo.</p></section>
    <section className="auth-card"><p className="eyebrow">Bienvenido a bordo</p><h2>{mode === 'login' ? 'Inicia sesión' : 'Crea tu cuenta'}</h2><p className="muted">{mode === 'login' ? 'Continúa con tu planificación náutica.' : 'Solo necesitamos unos datos para empezar.'}</p>
      <form onSubmit={submit}>{mode === 'register' && <label>Nombre<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" required /></label>}<label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" required /></label><label>Contraseña<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" minLength={8} required /></label>{error && <p className="form-error">{error}</p>}<button className="primary-button" disabled={loading}>{loading ? 'Cargando…' : mode === 'login' ? 'Entrar' : 'Registrarme'}</button></form>
      <button className="link-button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}>{mode === 'login' ? '¿Aún no tienes cuenta? Regístrate' : 'Ya tengo cuenta, quiero entrar'}</button>
    </section>
  </main>
}

function TripCard({ trip }: { trip: SailingTrip }) {
  return <article className="trip-card"><div className="trip-date"><strong>{new Date(trip.departureAt).getDate()}</strong><span>{new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(new Date(trip.departureAt)).toUpperCase()}</span></div><div className="trip-content"><div className="trip-heading"><div><p className="eyebrow">PRÓXIMA SALIDA</p><h3>{trip.title}</h3></div><span className="boat-icon">◒</span></div><p className="trip-meta">⛵ {trip.boatName}</p><p className="trip-meta">⌖ {trip.departurePort}{trip.destination ? ` · rumbo a ${trip.destination}` : ''}</p><p className="trip-time">{formatDate(trip.departureAt)}</p>{trip.notes && <p className="trip-notes">{trip.notes}</p>}</div></article>
}

function Home({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [trips, setTrips] = useState<SailingTrip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => { getTrips().then(setTrips).catch((reason) => setError(reason instanceof Error ? reason.message : 'No se pudieron cargar las salidas')).finally(() => setLoading(false)) }, [])
  const greeting = useMemo(() => user.name.split(' ')[0], [user.name])
  return <div className="app-shell"><header className="topbar"><div className="brand"><span className="brand-mini">⚓</span><span>Skipper's Dream</span></div><nav><a className="active">Inicio</a><a className="disabled">Mis barcos <small>Pronto</small></a></nav><div className="profile"><span className="avatar">{greeting[0]?.toUpperCase()}</span><span className="profile-name">{greeting}</span><button className="logout" onClick={onLogout}>Salir</button></div></header><main className="dashboard"><section className="welcome"><div><p className="eyebrow">CUADERNO DE BITÁCORA</p><h1>Buenos días, {greeting}.</h1><p className="muted">Todo listo para tu próxima salida.</p></div><div className="sun">☼</div></section><section className="section-heading"><div><p className="eyebrow">PLANIFICACIÓN</p><h2>Próximas salidas</h2></div><span className="count-pill">{trips.length} {trips.length === 1 ? 'salida' : 'salidas'}</span></section>{loading ? <div className="state-card">Cargando tus próximas salidas…</div> : error ? <div className="state-card error-state">{error}</div> : trips.length ? <div className="trip-grid">{trips.map((trip) => <TripCard key={trip.id} trip={trip} />)}</div> : <div className="state-card"><h3>No tienes salidas próximas</h3><p>Cuando planifiques una navegación aparecerá aquí.</p></div>}<section className="coming-soon"><span className="coming-icon">⚓</span><div><p className="eyebrow">PRÓXIMAMENTE</p><h3>Mis barcos</h3><p>Guarda tus barcos en propiedad y copropiedad para tenerlos siempre a mano.</p></div><span className="arrow">→</span></section></main></div>
}

export default function App() {
  const [user, setUser] = useState<User | null>(() => { const raw = localStorage.getItem('skippers-user'); return raw ? JSON.parse(raw) : null })
  if (!user) return <AuthScreen onAuthenticated={(token, nextUser) => { localStorage.setItem('skippers-token', token); localStorage.setItem('skippers-user', JSON.stringify(nextUser)); setUser(nextUser) }} />
  return <Home user={user} onLogout={() => { localStorage.removeItem('skippers-token'); localStorage.removeItem('skippers-user'); setUser(null) }} />
}

