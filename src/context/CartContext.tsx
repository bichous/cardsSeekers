import { createContext, useContext, useReducer, type ReactNode } from 'react'
import type { CartItem, Product, ProductVariant } from '../types'
import { cartKey } from '../types'

interface CartState {
  items: CartItem[]
  isOpen: boolean
}

type CartAction =
  | { type: 'ADD_TO_CART'; payload: { product: Product; variant: ProductVariant } }
  | { type: 'REMOVE_FROM_CART'; payload: string } // cartKey
  | { type: 'UPDATE_QTY'; payload: { key: string; qty: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'OPEN_CART' }
  | { type: 'CLOSE_CART' }
  | { type: 'TOGGLE_CART' }

const initialState: CartState = { items: [], isOpen: false }

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const { product, variant } = action.payload
      const key = cartKey(product.id, variant.language)
      const existing = state.items.find((i) => cartKey(i.product.id, i.variant.language) === key)
      if (existing) {
        const newQty = Math.min(existing.quantity + 1, variant.stock)
        return {
          ...state,
          isOpen: true,
          items: state.items.map((i) =>
            cartKey(i.product.id, i.variant.language) === key ? { ...i, quantity: newQty } : i
          ),
        }
      }
      return {
        ...state,
        isOpen: true,
        items: [...state.items, { product, variant, quantity: 1 }],
      }
    }
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        items: state.items.filter(
          (i) => cartKey(i.product.id, i.variant.language) !== action.payload
        ),
      }
    case 'UPDATE_QTY':
      return {
        ...state,
        items: state.items
          .map((i) =>
            cartKey(i.product.id, i.variant.language) === action.payload.key
              ? { ...i, quantity: action.payload.qty }
              : i
          )
          .filter((i) => i.quantity > 0),
      }
    case 'CLEAR_CART':
      return { ...state, items: [] }
    case 'OPEN_CART':
      return { ...state, isOpen: true }
    case 'CLOSE_CART':
      return { ...state, isOpen: false }
    case 'TOGGLE_CART':
      return { ...state, isOpen: !state.isOpen }
    default:
      return state
  }
}

interface CartContextValue {
  state: CartState
  addToCart: (product: Product, variant: ProductVariant) => void
  removeFromCart: (key: string) => void
  updateQty: (key: string, qty: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  total: number
  itemCount: number
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)

  const total = state.items.reduce((sum, i) => sum + i.variant.price * i.quantity, 0)
  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        state,
        addToCart: (product, variant) =>
          dispatch({ type: 'ADD_TO_CART', payload: { product, variant } }),
        removeFromCart: (key) => dispatch({ type: 'REMOVE_FROM_CART', payload: key }),
        updateQty: (key, qty) => dispatch({ type: 'UPDATE_QTY', payload: { key, qty } }),
        clearCart: () => dispatch({ type: 'CLEAR_CART' }),
        openCart: () => dispatch({ type: 'OPEN_CART' }),
        closeCart: () => dispatch({ type: 'CLOSE_CART' }),
        toggleCart: () => dispatch({ type: 'TOGGLE_CART' }),
        total,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
