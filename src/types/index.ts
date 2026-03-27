export type Franchise = 'pokemon' | 'yugioh' | 'onepiece'

export type ProductType = 'sealed' | 'singles'

export type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'name-asc'

export type Language = 'español' | 'inglés' | 'japonés' | 'portugués'

export type CardCondition = 'NM' | 'LP' | 'MP' | 'HP' | 'Damaged'

export const CONDITION_ORDER: CardCondition[] = ['NM', 'LP', 'MP', 'HP', 'Damaged']

export const CONDITION_LABELS: Record<CardCondition, string> = {
  NM: 'Near Mint',
  LP: 'Lightly Played',
  MP: 'Moderately Played',
  HP: 'Heavily Played',
  Damaged: 'Damaged',
}

export interface ProductVariant {
  id: string
  productId: string
  language: Language
  condition?: CardCondition  // 'NM' por defecto; obligatorio en singles
  rarity?: string  // rareza — solo relevante en pokemon singles
  price: number
  originalPrice?: number | null
  stock: number
}

export interface Product {
  id: string
  name: string
  franchise: Franchise
  type: ProductType
  category: string
  currency: string
  images: string[]
  description: string
  metadata?: Record<string, string>
  featured?: boolean
  isNew?: boolean
  variants: ProductVariant[]
}

export interface CartItem {
  product: Product
  variant: ProductVariant
  quantity: number
}

/** Devuelve la variante de menor precio (o la primera disponible) */
export function getMinVariant(product: Product): ProductVariant {
  return [...product.variants].sort((a, b) => a.price - b.price)[0]
}

/** Clave única de un item en el carrito */
export function cartKey(productId: string, language: string, condition?: string, rarity?: string): string {
  const base = condition ? `${productId}__${language}__${condition}` : `${productId}__${language}`
  return rarity ? `${base}__${rarity}` : base
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
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    currencyDisplay: 'narrowSymbol',
  }).format(price).replace('$', 'MX$')
}

export function getStockLabel(stock: number): { label: string; color: string } {
  if (stock === 0) return { label: 'Agotado', color: '#666' }
  if (stock <= 3) return { label: `¡Solo ${stock} en stock!`, color: '#FF6B00' }
  if (stock <= 8) return { label: `${stock} unidades`, color: '#FFD000' }
  return { label: 'En stock', color: '#68d391' }
}
