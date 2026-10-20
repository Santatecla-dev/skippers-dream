import 'reflect-metadata'
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import cors from 'cors'
import express from 'express'
import { DataSource } from 'typeorm'
import { createToken, requireAuth, AuthRequest } from './auth'
import { SailingTrip } from './entities/SailingTrip'
import { User } from './entities/User'

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT || 5432),
  username: process.env.DATABASE_USER || 'skipper',
  password: process.env.DATABASE_PASSWORD || 'skipper_dev_password',
  database: process.env.DATABASE_NAME || 'skippers_dream',
  entities: [User, SailingTrip],
  synchronize: true,
})

const app = express()
app.use(cors({ origin: ['http://localhost:5173'], credentials: false }))
app.use(express.json())

const clean = (value: unknown) => typeof value === 'string' ? value.trim() : ''

app.get('/api/health', (_req, res) => res.json({ ok: true, app: "Skipper's Dream" }))

app.post('/api/auth/register', async (req, res) => {
  const name = clean(req.body?.name)
  const email = clean(req.body?.email).toLowerCase()
  const password = typeof req.body?.password === 'string' ? req.body.password : ''
  if (name.length < 2 || !email.includes('@') || password.length < 8) {
    return res.status(400).json({ message: 'Introduce nombre, email válido y una contraseña de al menos 8 caracteres' })
  }
  const users = dataSource.getRepository(User)
  if (await users.findOne({ where: { email } })) return res.status(409).json({ message: 'Ese email ya está registrado' })
  const user = users.create({ name, email, passwordHash: await bcrypt.hash(password, 10) })
  await users.save(user)
  return res.status(201).json({ token: createToken(user.id), user: { id: user.id, name: user.name, email: user.email } })
})

app.post('/api/auth/login', async (req, res) => {
  const email = clean(req.body?.email).toLowerCase()
  const password = typeof req.body?.password === 'string' ? req.body.password : ''
  const user = await dataSource.getRepository(User).findOne({ where: { email } })
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ message: 'Email o contraseña incorrectos' })
  return res.json({ token: createToken(user.id), user: { id: user.id, name: user.name, email: user.email } })
})

app.get('/api/me', requireAuth, async (req: AuthRequest, res) => {
  const user = await dataSource.getRepository(User).findOne({ where: { id: req.userId } })
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' })
  return res.json({ id: user.id, name: user.name, email: user.email })
})

app.get('/api/trips/upcoming', requireAuth, async (_req, res) => {
  const trips = await dataSource.getRepository(SailingTrip).find({
    where: {}, order: { departureAt: 'ASC' }, take: 20,
  })
  return res.json(trips.map((trip) => ({
    id: trip.id, title: trip.title, boatName: trip.boatName, departurePort: trip.departurePort,
    departureAt: trip.departureAt, destination: trip.destination, notes: trip.notes,
  })))
})

async function seedTrips() {
  const repo = dataSource.getRepository(SailingTrip)
  if (await repo.count()) return
  const base = new Date()
  const at = (days: number, hour: number) => {
    const value = new Date(base)
    value.setDate(value.getDate() + days)
    value.setHours(hour, 0, 0, 0)
    return value
  }
  await repo.save([
    repo.create({ title: 'Salida de práctica', boatName: 'Mar Azul', departurePort: 'Club Náutico de Valencia', departureAt: at(3, 9), destination: 'El Saler', notes: 'Práctica de maniobras y navegación costera' }),
    repo.create({ title: 'Travesía de fin de semana', boatName: 'Brisa II', departurePort: 'Puerto de Dénia', departureAt: at(10, 8), destination: 'Formentera', notes: 'Plazas disponibles para tripulación' }),
    repo.create({ title: 'Navegación al atardecer', boatName: 'Amanecer', departurePort: 'Puerto de Barcelona', departureAt: at(17, 18), destination: 'Sitges', notes: 'Salida tranquila para ganar horas de mar' }),
  ])
}

const port = Number(process.env.PORT || 3001)
dataSource.initialize().then(async () => {
  await seedTrips()
  app.listen(port, () => console.log(`Skipper's Dream API listening on http://localhost:${port}`))
}).catch((error) => { console.error(error); process.exit(1) })
