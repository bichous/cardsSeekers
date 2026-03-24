import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireRole, AuthRequest } from '../middleware/auth'

const router = Router()
const staffOrAdmin = requireRole('admin', 'staff')

// ─── PRODUCTS ────────────────────────────────────────────────────────────────

// GET /api/admin/products
router.get('/products', staffOrAdmin, async (req: AuthRequest, res) => {
  const { franchise, type, language, search } = req.query as Record<string, string>
  try {
    const products = await prisma.product.findMany({
      where: {
        ...(franchise && { franchise }),
        ...(type && { type }),
        ...(search && { name: { contains: search } }),
        ...(language && { variants: { some: { language } } }),
      },
      include: { variants: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json(products)
  } catch {
    res.status(500).json({ error: 'Error al obtener productos' })
  }
})

// POST /api/admin/products
// Body: { name, franchise, type, category, currency?, images?, description?, featured?, isNew?, variants: [{language, price, originalPrice?, stock}] }
router.post('/products', staffOrAdmin, async (req: AuthRequest, res) => {
  const { name, franchise, type, category, currency, images, description, metadata, featured, isNew, variants } = req.body
  if (!name || !franchise || !type || !category || !variants?.length) {
    res.status(400).json({ error: 'Faltan campos requeridos (incluyendo al menos una variante)' })
    return
  }
  try {
    const product = await prisma.product.create({
      data: {
        name,
        franchise,
        type,
        category,
        currency: currency ?? 'MXN',
        images: Array.isArray(images) ? JSON.stringify(images) : (images ?? '[]'),
        description: description ?? '',
        metadata: metadata ? JSON.stringify(metadata) : '{}',
        featured: Boolean(featured),
        isNew: Boolean(isNew),
        variants: {
          create: variants.map((v: { language: string; condition?: string; price: number; originalPrice?: number; stock: number }) => ({
            language: v.language,
            condition: v.condition ?? 'NM',
            price: Number(v.price),
            originalPrice: v.originalPrice ? Number(v.originalPrice) : null,
            stock: Number(v.stock ?? 0),
          })),
        },
      },
      include: { variants: true },
    })
    res.status(201).json(product)
  } catch (err) {
    console.error('[POST /products]', err)
    res.status(500).json({ error: 'Error al crear producto' })
  }
})

// PUT /api/admin/products/:id
// Actualiza campos base del producto. Las variantes se gestionan por separado.
router.put('/products/:id', staffOrAdmin, async (req: AuthRequest, res) => {
  const { id } = req.params
  const { name, franchise, type, category, currency, images, description, metadata, featured, isNew } = req.body
  try {
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(franchise !== undefined && { franchise }),
        ...(type !== undefined && { type }),
        ...(category !== undefined && { category }),
        ...(currency !== undefined && { currency }),
        ...(images !== undefined && { images: Array.isArray(images) ? JSON.stringify(images) : images }),
        ...(description !== undefined && { description }),
        ...(metadata !== undefined && { metadata: JSON.stringify(metadata) }),
        ...(featured !== undefined && { featured: Boolean(featured) }),
        ...(isNew !== undefined && { isNew: Boolean(isNew) }),
      },
      include: { variants: true },
    })
    res.json(product)
  } catch {
    res.status(500).json({ error: 'Error al actualizar producto' })
  }
})

// DELETE /api/admin/products/:id (solo admin)
router.delete('/products/:id', requireRole('admin'), async (_req, res) => {
  const { id } = _req.params
  try {
    await prisma.product.delete({ where: { id } })
    res.status(204).send()
  } catch {
    res.status(500).json({ error: 'Error al eliminar producto' })
  }
})

// ─── VARIANTS ────────────────────────────────────────────────────────────────

// PUT /api/admin/products/:id/variants/:variantId
router.put('/products/:id/variants/:variantId', staffOrAdmin, async (_req, res) => {
  const { variantId } = _req.params
  const { price, originalPrice, stock, language, condition } = _req.body
  try {
    const variant = await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        ...(condition !== undefined && { condition }),
        ...(language !== undefined && { language }),
        ...(price !== undefined && { price: Number(price) }),
        ...(originalPrice !== undefined && { originalPrice: originalPrice ? Number(originalPrice) : null }),
        ...(stock !== undefined && { stock: Number(stock) }),
      },
    })
    res.json(variant)
  } catch {
    res.status(500).json({ error: 'Error al actualizar variante' })
  }
})

// POST /api/admin/products/:id/variants
router.post('/products/:id/variants', staffOrAdmin, async (req: AuthRequest, res) => {
  const { id } = req.params
  const { language, condition, price, originalPrice, stock } = req.body
  if (!language || price == null) {
    res.status(400).json({ error: 'language y price son requeridos' })
    return
  }
  try {
    const variant = await prisma.productVariant.create({
      data: {
        productId: id,
        language,
        condition: condition ?? 'NM',
        price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : null,
        stock: Number(stock ?? 0),
      },
    })
    res.status(201).json(variant)
  } catch {
    res.status(500).json({ error: 'Error al crear variante' })
  }
})

// DELETE /api/admin/products/:id/variants/:variantId
router.delete('/products/:id/variants/:variantId', requireRole('admin'), async (_req, res) => {
  const { variantId } = _req.params
  try {
    await prisma.productVariant.delete({ where: { id: variantId } })
    res.status(204).send()
  } catch {
    res.status(500).json({ error: 'Error al eliminar variante' })
  }
})

// ─── ORDERS ──────────────────────────────────────────────────────────────────

// GET /api/admin/orders
router.get('/orders', staffOrAdmin, async (_req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: true,
        user: { select: { id: true, email: true, nombre: true, apellidos: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(orders)
  } catch {
    res.status(500).json({ error: 'Error al obtener pedidos' })
  }
})

// PATCH /api/admin/orders/:id/status
router.patch('/orders/:id/status', staffOrAdmin, async (req: AuthRequest, res) => {
  const { id } = req.params
  const { status } = req.body as { status: string }
  const validStatuses = ['pending_shipping', 'shipped', 'delivered']
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: 'Estado inválido' })
    return
  }
  try {
    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: { items: true, user: { select: { id: true, email: true, nombre: true } } },
    })
    res.json(order)
  } catch {
    res.status(500).json({ error: 'Error al actualizar estado' })
  }
})

export default router
