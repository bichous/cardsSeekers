import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()

interface OrderItemInput {
  productId: string
  productName: string
  productImage?: string
  quantity: number
  price: number
}

// POST /api/orders  – crea un pedido
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  const { items, total } = req.body as { items: OrderItemInput[]; total: number }

  if (!items?.length || total == null) {
    res.status(400).json({ error: 'Datos del pedido incompletos' })
    return
  }

  try {
    const order = await prisma.order.create({
      data: {
        userId: req.userId!,
        total,
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
  } catch {
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

export default router
