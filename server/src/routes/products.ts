import { Router } from 'express'
import { prisma } from '../lib/prisma'

const router = Router()

// GET /api/products  – lista pública de productos
router.get('/', async (req, res) => {
  const { franchise, type, search } = req.query as Record<string, string>
  try {
    const products = await prisma.product.findMany({
      where: {
        ...(franchise && { franchise }),
        ...(type && { type }),
        ...(search && { name: { contains: search } }),
      },
      include: { variants: true },
      orderBy: { createdAt: 'desc' },
    })
    const parsed = products.map((p) => ({
      ...p,
      images: (() => { try { return JSON.parse(p.images) } catch { return [] } })(),
      metadata: (() => { try { return JSON.parse(p.metadata) } catch { return {} } })(),
    }))
    res.json(parsed)
  } catch (err) {
    console.error('[GET /products]', err)
    res.status(500).json({ error: 'Error al obtener productos' })
  }
})

// GET /api/products/:id  – producto individual
router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { variants: true },
    })
    if (!product) {
      res.status(404).json({ error: 'Producto no encontrado' })
      return
    }
    res.json({
      ...product,
      images: (() => { try { return JSON.parse(product.images) } catch { return [] } })(),
    })
  } catch (err) {
    console.error('[GET /products/:id]', err)
    res.status(500).json({ error: 'Error al obtener producto' })
  }
})

export default router
