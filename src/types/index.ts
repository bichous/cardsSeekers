export type Franchise = 'pokemon' | 'yugioh' | 'onepiece'

export type ProductType = 'sealed' | 'singles'

export type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'name-asc'

export interface Product {
  id: string
  name: string
  franchise: Franchise
  type: ProductType
  category: string
  price: number
  originalPrice?: number
  currency: string
  stock: number
  images: string[]
  description: string
  featured?: boolean
  isNew?: boolean
}

export interface CartItem {
  product: Product
  quantity: number
}

export const FRANCHISE_CONFIG: Record<
  Franchise,
  { label: string; color: string; textColor: string; gradient: string; emoji: string }
> = {
  pokemon: {
    label: 'Pokémon',
    color: '#FFD000',
    textColor: '#0d0d0d',
    gradient: 'linear(to-br, #FFD000, #FF9500)',
    emoji: '⚡',
  },
  yugioh: {
    label: 'Yu-Gi-Oh!',
    color: '#FF6B00',
    textColor: '#ffffff',
    gradient: 'linear(to-br, #FF8C36, #FF4500)',
    emoji: '🌀',
  },
  onepiece: {
    label: 'One Piece',
    color: '#FF4500',
    textColor: '#ffffff',
    gradient: 'linear(to-br, #FF6B00, #CC2200)',
    emoji: '⚓',
  },
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(price)
}

export function getStockLabel(stock: number): { label: string; color: string } {
  if (stock === 0) return { label: 'Agotado', color: '#666' }
  if (stock <= 3) return { label: `¡Solo ${stock} en stock!`, color: '#FF6B00' }
  if (stock <= 8) return { label: `${stock} unidades`, color: '#FFD000' }
  return { label: 'En stock', color: '#68d391' }
}
