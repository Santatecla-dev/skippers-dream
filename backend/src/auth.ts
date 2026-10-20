import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

export type AuthRequest = Request & { userId?: string }

const secret = () => process.env.JWT_SECRET || 'skippers-dream-local-secret'

export function createToken(userId: string) {
  return jwt.sign({ sub: userId }, secret(), { expiresIn: '7d' })
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.header('authorization')
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ message: 'Necesitas iniciar sesión' })
  try {
    const payload = jwt.verify(token, secret()) as jwt.JwtPayload
    if (typeof payload.sub !== 'string') throw new Error('Invalid token')
    req.userId = payload.sub
    return next()
  } catch {
    return res.status(401).json({ message: 'La sesión ha caducado' })
  }
}

