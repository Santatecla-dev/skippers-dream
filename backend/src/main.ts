import 'reflect-metadata'
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import cors from 'cors'
import express from 'express'
import { DataSource } from 'typeorm'
import { createToken, requireAuth, AuthRequest } from './auth'
import { Boat, BOAT_OWNERSHIP_TYPES, BoatOwnershipType } from './entities/Boat'
import { SailingTrip, TRIP_STATUSES, TripStatus } from './entities/SailingTrip'
import { User } from './entities/User'

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT || 5432),
  username: process.env.DATABASE_USER || 'skipper',
  password: process.env.DATABASE_PASSWORD || 'skipper_dev_password',
  database: process.env.DATABASE_NAME || 'skippers_dream',
  entities: [User, Boat, SailingTrip],
  synchronize: true,
})

const app = express()
app.use(cors({ origin: ['http://localhost:5173'], credentials: false }))
app.use(express.json())

const clean = (value: unknown) => typeof value === 'string' ? value.trim() : ''
const publicUser = (user: User) => ({ id: user.id, name: user.name, email: user.email })
const isOwnership = (value: unknown): value is BoatOwnershipType => BOAT_OWNERSHIP_TYPES.includes(value as BoatOwnershipType)
const isTripStatus = (value: unknown): value is TripStatus => TRIP_STATUSES.includes(value as TripStatus)

function publicBoat(boat: Boat) {
  return { id: boat.id, name: boat.name, brand: boat.brand, model: boat.model, lengthMeters: boat.lengthMeters, yearBuilt: boat.yearBuilt, ownershipType: boat.ownershipType, engineType: boat.engineType, sailPlan: boat.sailPlan, renewals: boat.renewals, notes: boat.notes }
}

function publicTrip(trip: SailingTrip) {
  return { id: trip.id, title: trip.title, boatName: trip.boat?.name ?? trip.boatName, boat: trip.boat ? publicBoat(trip.boat) : null, departurePort: trip.departurePort, departureAt: trip.departureAt, destination: trip.destination, notes: trip.notes, status: trip.status, isMine: Boolean(trip.createdBy), canEdit: Boolean(trip.createdBy) }
}

app.get('/api/health', (_req, res) => res.json({ ok: true, app: "Skipper's Dream" }))

app.post('/api/auth/register', async (req, res) => {
  const name = clean(req.body?.name), email = clean(req.body?.email).toLowerCase(), password = typeof req.body?.password === 'string' ? req.body.password : ''
  if (name.length < 2 || !email.includes('@') || password.length < 8) return res.status(400).json({ message: 'Introduce nombre, email válido y una contraseña de al menos 8 caracteres' })
  const users = dataSource.getRepository(User)
  if (await users.findOne({ where: { email } })) return res.status(409).json({ message: 'Ese email ya está registrado' })
  const user = users.create({ name, email, passwordHash: await bcrypt.hash(password, 10) })
  await users.save(user)
  return res.status(201).json({ token: createToken(user.id), user: publicUser(user) })
})

app.post('/api/auth/login', async (req, res) => {
  const email = clean(req.body?.email).toLowerCase(), password = typeof req.body?.password === 'string' ? req.body.password : ''
  const user = await dataSource.getRepository(User).findOne({ where: { email } })
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ message: 'Email o contraseña incorrectos' })
  return res.json({ token: createToken(user.id), user: publicUser(user) })
})

app.get('/api/me', requireAuth, async (req: AuthRequest, res) => {
  const user = await dataSource.getRepository(User).findOne({ where: { id: req.userId } })
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' })
  return res.json(publicUser(user))
})

app.get('/api/boats', requireAuth, async (req: AuthRequest, res) => {
  const boats = await dataSource.getRepository(Boat).find({ where: { createdBy: { id: req.userId } }, order: { name: 'ASC' } })
  return res.json(boats.map(publicBoat))
})

app.post('/api/boats', requireAuth, async (req: AuthRequest, res) => {
  const name = clean(req.body?.name), brand = clean(req.body?.brand), model = clean(req.body?.model)
  const lengthMeters = Number(req.body?.lengthMeters), yearBuilt = Number(req.body?.yearBuilt), ownershipType = req.body?.ownershipType
  if (!name || !brand || !model || !Number.isFinite(lengthMeters) || lengthMeters <= 0 || !Number.isInteger(yearBuilt) || yearBuilt < 1900 || yearBuilt > new Date().getFullYear() + 1 || !isOwnership(ownershipType)) return res.status(400).json({ message: 'Revisa nombre, marca, modelo, eslora, año y titularidad' })
  const user = await dataSource.getRepository(User).findOne({ where: { id: req.userId } })
  if (!user) return res.status(401).json({ message: 'Usuario no encontrado' })
  const boat = dataSource.getRepository(Boat).create({ name, brand, model, lengthMeters, yearBuilt, ownershipType, engineType: clean(req.body?.engineType) || null, sailPlan: clean(req.body?.sailPlan) || null, renewals: clean(req.body?.renewals) || null, notes: clean(req.body?.notes) || null, createdBy: user })
  await dataSource.getRepository(Boat).save(boat)
  return res.status(201).json(publicBoat(boat))
})

app.delete('/api/boats/:id', requireAuth, async (req: AuthRequest, res) => {
  const boatId = String(req.params.id)
  const result = await dataSource.getRepository(Boat).delete({ id: boatId, createdBy: { id: req.userId } })
  if (!result.affected) return res.status(404).json({ message: 'Barco no encontrado' })
  return res.json({ deleted: true })
})

async function listTrips(userId: string, onlyPlanned = false) {
  const query = dataSource.getRepository(SailingTrip).createQueryBuilder('trip').leftJoinAndSelect('trip.boat', 'boat').leftJoinAndSelect('trip.createdBy', 'createdBy').where('(trip.createdById = :userId OR trip.createdById IS NULL)', { userId })
  if (onlyPlanned) query.andWhere('trip.status = :status', { status: 'planned' })
  return query.orderBy('trip.departureAt', 'ASC').getMany()
}

app.get('/api/trips', requireAuth, async (req: AuthRequest, res) => res.json((await listTrips(req.userId!)).map(publicTrip)))
app.get('/api/trips/upcoming', requireAuth, async (req: AuthRequest, res) => res.json((await listTrips(req.userId!, true)).map(publicTrip)))

app.post('/api/trips', requireAuth, async (req: AuthRequest, res) => {
  const title = clean(req.body?.title), departurePort = clean(req.body?.departurePort), departureAt = new Date(req.body?.departureAt), destination = clean(req.body?.destination) || null, notes = clean(req.body?.notes) || null
  if (!title || !departurePort || Number.isNaN(departureAt.getTime())) return res.status(400).json({ message: 'Introduce título, puerto y fecha de salida' })
  const user = await dataSource.getRepository(User).findOne({ where: { id: req.userId } })
  if (!user) return res.status(401).json({ message: 'Usuario no encontrado' })
  const boat = req.body?.boatId ? await dataSource.getRepository(Boat).findOne({ where: { id: req.body.boatId, createdBy: { id: req.userId } } }) : null
  if (req.body?.boatId && !boat) return res.status(404).json({ message: 'El barco no existe o no es tuyo' })
  const trip = dataSource.getRepository(SailingTrip).create({ title, departurePort, departureAt, destination, notes, status: 'planned', boatName: boat?.name ?? null, boat, createdBy: user })
  await dataSource.getRepository(SailingTrip).save(trip)
  return res.status(201).json(publicTrip(trip))
})

app.patch('/api/trips/:id', requireAuth, async (req: AuthRequest, res) => {
  const repo = dataSource.getRepository(SailingTrip)
  const tripId = String(req.params.id)
  const trip = await repo.findOne({ where: { id: tripId, createdBy: { id: req.userId } }, relations: { boat: true, createdBy: true } })
  if (!trip) return res.status(404).json({ message: 'Salida no encontrada o no es tuya' })
  if (req.body?.status !== undefined) { if (!isTripStatus(req.body.status)) return res.status(400).json({ message: 'Estado no válido' }); trip.status = req.body.status }
  if (req.body?.boatId !== undefined) {
    const boat = req.body.boatId ? await dataSource.getRepository(Boat).findOne({ where: { id: req.body.boatId, createdBy: { id: req.userId } } }) : null
    if (req.body.boatId && !boat) return res.status(404).json({ message: 'El barco no existe o no es tuyo' })
    trip.boat = boat; trip.boatName = boat?.name ?? null
  }
  await repo.save(trip)
  return res.json(publicTrip(trip))
})

async function seedTrips() {
  const repo = dataSource.getRepository(SailingTrip)
  if (await repo.count()) return
  const base = new Date()
  const at = (days: number, hour: number) => { const value = new Date(base); value.setDate(value.getDate() + days); value.setHours(hour, 0, 0, 0); return value }
  await repo.save([
    repo.create({ title: 'Salida de práctica', boatName: 'Mar Azul', departurePort: 'Club Náutico de Valencia', departureAt: at(3, 9), destination: 'El Saler', notes: 'Práctica de maniobras y navegación costera', status: 'planned' }),
    repo.create({ title: 'Travesía de fin de semana', boatName: 'Brisa II', departurePort: 'Puerto de Dénia', departureAt: at(10, 8), destination: 'Formentera', notes: 'Plazas disponibles para tripulación', status: 'planned' }),
    repo.create({ title: 'Navegación al atardecer', boatName: 'Amanecer', departurePort: 'Puerto de Barcelona', departureAt: at(17, 18), destination: 'Sitges', notes: 'Salida tranquila para ganar horas de mar', status: 'planned' }),
  ])
}

const port = Number(process.env.PORT || 3001)
dataSource.initialize().then(async () => { await seedTrips(); app.listen(port, () => console.log(`Skipper's Dream API listening on http://localhost:${port}`)) }).catch((error) => { console.error(error); process.exit(1) })
