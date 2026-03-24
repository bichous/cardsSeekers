import { Router } from 'express'
import { OAuth2Client } from 'google-auth-library'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

// POST /api/auth/google
// Body: { credential: string }  (ID token del GoogleLogin component)
router.post('/google', async (req, res) => {
  const { credential } = req.body
  if (!credential) {
    res.status(400).json({ error: 'Token de Google requerido' })
    return
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID!,
    })
    const payload = ticket.getPayload()
    if (!payload?.sub || !payload.email) {
      res.status(400).json({ error: 'Token de Google inválido' })
      return
    }

    const user = await prisma.user.upsert({
      where: { googleId: payload.sub },
      update: {
        email: payload.email,
        avatar: payload.picture ?? null,
      },
      create: {
        googleId: payload.sub,
        email: payload.email,
        nombre: payload.given_name ?? null,
        apellidos: payload.family_name ?? null,
        avatar: payload.picture ?? null,
        rol: 'client',
      },
      include: { shippingInfo: true },
    })

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '30d' })
    res.json({ token, user })
  } catch (err) {
    console.error('Google auth error:', err)
    res.status(401).json({ error: 'Autenticación fallida' })
  }
})

// GET /api/auth/me
router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { shippingInfo: true },
    })
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' })
      return
    }
    res.json(user)
  } catch {
    res.status(500).json({ error: 'Error del servidor' })
  }
})

export default router
