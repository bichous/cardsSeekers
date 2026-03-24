import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()

// PATCH /api/users/me
// Actualiza perfil y/o info de envío del usuario autenticado
router.patch('/me', requireAuth, async (req: AuthRequest, res) => {
  const { nombre, apellidos, telefono, shippingInfo } = req.body

  try {
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(apellidos !== undefined && { apellidos }),
        ...(telefono !== undefined && { telefono }),
        ...(shippingInfo && {
          shippingInfo: {
            upsert: {
              create: shippingInfo,
              update: shippingInfo,
            },
          },
        }),
      },
      include: { shippingInfo: true },
    })
    res.json(user)
  } catch {
    res.status(500).json({ error: 'Error al actualizar usuario' })
  }
})

export default router
