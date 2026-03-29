import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthRequest } from '../middleware/auth'
import jwt from 'jsonwebtoken'

const router = Router()

interface OrderItemInput {
  productId: string
  productName: string
  productImage?: string
  quantity: number
  price: number
}

interface GuestInfo {
  email: string
  name: string
  phone: string
}

// POST /api/orders  – crea un pedido (autenticado o guest)
router.post('/', async (req: AuthRequest, res) => {
  const { items, total, guest } = req.body as {
    items: OrderItemInput[]
    total: number
    guest?: GuestInfo
  }

  if (!items?.length || total == null) {
    res.status(400).json({ error: 'Datos del pedido incompletos' })
    return
  }

  let userId: string | null = null

  // Intentar obtener usuario del token (si está autenticado)
  const authHeader = req.headers.authorization
  if (authHeader) {
    try {
      const token = authHeader.split(' ')[1]
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
      userId = decoded.userId
    } catch (error) {
      // Token inválido, continuar como guest
    }
  }

  // Si no hay userId, validar datos de guest
  if (!userId) {
    if (!guest || !guest.email || !guest.name || !guest.phone) {
      res.status(400).json({
        error: 'Debes proporcionar email, nombre y teléfono para comprar sin cuenta',
      })
      return
    }
  }

  try {
    const order = await prisma.order.create({
      data: {
        userId: userId || undefined,
        total,
        ...(userId
          ? {}
          : {
              guestEmail: guest!.email,
              guestName: guest!.name,
              guestPhone: guest!.phone,
            }),
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            productImage: item.productImage ?? null,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: { items: true },
    })
    res.status(201).json(order)
  } catch (error) {
    console.error('Error creando orden:', error)
    res.status(500).json({ error: 'Error al crear pedido' })
  }
})

// GET /api/orders/mine  – lista pedidos del usuario autenticado
router.get('/mine', requireAuth, async (req: AuthRequest, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json(orders)
  } catch {
    res.status(500).json({ error: 'Error al obtener pedidos' })
  }
})

// GET /api/orders/:id/public?guestEmail=xxx@xxx.com  – consultar orden guest por ID + email
router.get('/:id/public', async (req, res) => {
  const { guestEmail } = req.query

  if (!guestEmail || typeof guestEmail !== 'string') {
    res.status(400).json({ error: 'Email requerido' })
    return
  }

  try {
    const order = await prisma.order.findFirst({
      where: {
        id: req.params.id,
        guestEmail: guestEmail,
      },
      include: { items: true },
    })

    if (!order) {
      res.status(404).json({ error: 'Orden no encontrada' })
      return
    }

    res.json({ order })
  } catch (error) {
    console.error('Error consultando orden:', error)
    res.status(500).json({ error: 'Error al consultar orden' })
  }
})

export default router
