import { useState, useEffect, useMemo } from 'react'
import type { Product } from '../types'
import { products as mockProducts } from '../data/products'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export function useProducts() {
  const [dbProducts, setDbProducts] = useState<Product[]>([])

  useEffect(() => {
    fetch(`${API_URL}/api/products`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setDbProducts)
      .catch(() => setDbProducts([]))
  }, [])

  // DB products toman prioridad; el mock llena el resto sin duplicar IDs
  const products = useMemo(() => {
    const dbIds = new Set(dbProducts.map((p) => p.id))
    return [...dbProducts, ...mockProducts.filter((p) => !dbIds.has(p.id))]
  }, [dbProducts])

  return products
}

export async function fetchProductById(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_URL}/api/products/${id}`)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}
