# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Dev server con HMR en http://localhost:5173
npm run build      # Type-check TypeScript + build de producción (dist/)
npm run lint       # ESLint en todos los archivos
npm run preview    # Previsualizar el build de producción
```

## Stack

- **React 18 + TypeScript 5.6** con **Vite 5**
- **Chakra UI v2** (`@chakra-ui/react@^2`) — sistema de diseño principal
- **React Router v6** — enrutamiento SPA
- **Framer Motion** — animaciones (dependencia de Chakra)

## Arquitectura

```
src/
  theme/index.ts          # Tema Chakra: dark mode forzado, colores brand/accent, variantes
  types/index.ts          # Tipos: Product, CartItem, Franchise, formatPrice(), FRANCHISE_CONFIG
  data/products.ts        # 15 productos mock (5 por franquicia) con imágenes picsum.photos
  context/CartContext.tsx # Estado del carrito (useReducer) + openCart/closeCart
  components/
    Header.tsx            # Sticky, nav desktop + Drawer móvil, badge carrito
    Footer.tsx
    ProductCard.tsx       # Tarjeta con imagen 3:4, badge franquicia, stock, add to cart
    ProductGallery.tsx    # Imagen principal + strip 5 miniaturas + flechas + teclado
    FilterBar.tsx         # Búsqueda, filtros franquicia/tipo (pills), sort Select
    CartDrawer.tsx        # Drawer derecho con items, qty controls, totales
  pages/
    Home.tsx              # Hero + sección franquicias + grid destacados + banner
    Catalog.tsx           # URL-based filters (useSearchParams) + SimpleGrid responsive
    ProductDetail.tsx     # Gallery sticky + info + NumberInput qty + relacionados
    CartPage.tsx          # Lista items + resumen pedido + shipping threshold 50€
    CheckoutPage.tsx      # Mock MercadoPago (ver comentario bloque al inicio del archivo)
  App.tsx                 # BrowserRouter + CartProvider + rutas
  main.tsx                # ChakraProvider + ColorModeScript + theme
```

## Paleta de colores

| Variable Chakra | Hex | Uso |
|---|---|---|
| `brand.400` | `#FFD000` | Acento principal (precios, CTAs, logo) |
| `accent.400` | `#FF6B00` | Acento secundario (badges nuevo, hover) |
| `#0d0d0d` | — | Background global |
| `#111111` | — | Tarjetas y superficies |
| `#1e1e1e` | — | Bordes y elementos elevados |

## Rutas

| Path | Página |
|---|---|
| `/` | Home |
| `/catalogo` | Catálogo (acepta params: `?franchise=pokemon\|yugioh\|onepiece`, `?type=sealed\|singles`, `?search=`) |
| `/producto/:id` | Detalle producto |
| `/carrito` | Carrito |
| `/checkout` | Checkout (mock MercadoPago) |

## Datos de ejemplo

Los 15 productos están en `src/data/products.ts`. Las imágenes usan `picsum.photos/seed/{seed}/480/640` — sustituir por URLs reales o un CDN cuando exista backend.

## Integración MercadoPago (pendiente)

El bloque de comentarios al inicio de `src/pages/CheckoutPage.tsx` documenta paso a paso cómo conectar:
1. Backend Node.js con el SDK oficial de MP para crear una preference
2. Frontend con `@mercadopago/sdk-react` y el componente `<Wallet />`
3. Variables de entorno necesarias
