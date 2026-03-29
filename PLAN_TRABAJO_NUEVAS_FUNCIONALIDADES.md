# PLAN DE TRABAJO - Nuevas Funcionalidades cardsSeekers

**Fecha de creación:** 2026-03-28
**Stack Técnico:** React 18 + TypeScript + Express + Prisma + SQLite → PostgreSQL

---

## 📋 RESUMEN EJECUTIVO

Este documento detalla la implementación de 10 grandes funcionalidades para el sistema cardsSeekers, una plataforma de e-commerce de cartas coleccionables con backend Express + Prisma y frontend React + Chakra UI.

**Funcionalidades a Implementar:**
1. Sistema de órdenes de compra mejorado
2. Opción de recogida en tienda vs envío
3. Sistema de apartados con strikes y cancelación automática
4. Importación/exportación de inventario en CSV
5. Integración completa de MercadoPago + MercadoEnvíos
6. Notificaciones por email de confirmación de compra
7. Protección con CAPTCHA anti-bots
8. Compras sin registro (guest checkout)
9. Soporte para nuevas franquicias (Digimon, Gundam, etc.)
10. Sistema completo de gestión de torneos

---

## 🏗️ CONTEXTO DE ARQUITECTURA ACTUAL

### Base de Datos (Prisma + SQLite → PostgreSQL)
```
User ─┬─ ShippingInfo (1:1)
      ├─ CartItem[] (1:N)
      └─ Order[] (1:N)
           └─ OrderItem[] (1:N)

Product ─ ProductVariant[] (1:N)
```

### Backend (Express + TypeScript)
```
server/src/routes/
├── auth.ts         # Google OAuth + JWT
├── products.ts     # Productos públicos
├── users.ts        # Perfil usuario
├── orders.ts       # Órdenes del usuario
├── admin.ts        # Gestión completa
└── upload.ts       # Cloudinary
```

### Frontend (React + Chakra UI)
```
src/
├── pages/
│   ├── Catalog.tsx, ProductDetail.tsx, CartPage.tsx, CheckoutPage.tsx
│   └── admin/ (ProductsPage, OrdersPage, etc.)
├── context/
│   ├── AuthContext.tsx (Google OAuth + User state)
│   └── CartContext.tsx (useReducer carrito)
└── components/
    ├── Header.tsx, FilterBar.tsx, ProductCard.tsx
    └── CheckoutStepper.tsx
```

### Tipos de Usuario
- **client** - Usuario comprador
- **staff** - Gestión de productos/órdenes
- **admin** - Acceso total

### Sistema de Variantes
- Cada producto tiene variantes por: `language`, `condition`, `rarity` (Pokemon), `price`, `stock`
- Índice único: `[productId, language, condition, rarity]`

---

## 🎯 FUNCIONALIDADES DETALLADAS

---

## 1️⃣ SISTEMA DE ÓRDENES DE COMPRA MEJORADO

### Objetivo
Mejorar el flujo de órdenes actual para soportar métodos de entrega, estados avanzados y tracking completo.

### Cambios en Base de Datos (Prisma Schema)

**Actualizar modelo `Order`:**
```prisma
model Order {
  id                  String      @id @default(cuid())
  userId              String?     // Opcional para guest checkout
  user                User?       @relation(fields: [userId], references: [id])

  // Totales
  subtotal            Float
  shippingCost        Float       @default(0)
  total               Float

  // Método de entrega
  deliveryMethod      String      // "shipping" | "pickup"

  // Estados
  status              String      // "pending_payment" | "paid" | "processing" | "ready_pickup" | "shipped" | "delivered" | "cancelled"
  paymentStatus       String      @default("pending") // "pending" | "paid" | "failed" | "refunded"

  // Info de envío (solo si deliveryMethod = "shipping")
  shippingName        String?
  shippingPhone       String?
  shippingAddress     String?
  shippingPostalCode  String?
  shippingCity        String?
  shippingState       String?
  trackingNumber      String?     // Mercado Envíos
  trackingUrl         String?

  // Info de recogida (solo si deliveryMethod = "pickup")
  pickupDate          DateTime?   // Fecha límite para recoger
  pickupConfirmedAt   DateTime?   // Cuando el admin confirma recogida

  // Metadata de pago
  mercadoPagoId       String?     // ID de preference o payment
  mercadoPagoStatus   String?

  // Guest checkout (si userId es null)
  guestEmail          String?
  guestName           String?
  guestPhone          String?

  // Timestamps
  createdAt           DateTime    @default(now())
  updatedAt           DateTime    @updatedAt
  paidAt              DateTime?
  cancelledAt         DateTime?

  items               OrderItem[]
}
```

### Cambios en Backend

**1. Actualizar `/server/src/routes/orders.ts`**

```typescript
// POST /api/orders - Crear orden (autenticado o guest)
interface CreateOrderDTO {
  items: Array<{
    productId: string
    variantId?: string
    quantity: number
    price: number
  }>
  deliveryMethod: 'shipping' | 'pickup'

  // Si deliveryMethod === 'shipping'
  shippingInfo?: {
    name: string
    phone: string
    address: string
    postalCode: string
    city: string
    state: string
  }

  // Guest checkout
  guest?: {
    email: string
    name: string
    phone: string
  }
}

// Lógica:
// 1. Validar stock de cada item
// 2. Calcular subtotal
// 3. Calcular shippingCost (según reglas: gratis > $1000 MXN, o tarifa fija)
// 4. Si deliveryMethod === 'pickup': shippingCost = 0, pickupDate = next Saturday
// 5. Crear Order en BD con status = "pending_payment"
// 6. Devolver Order + mercadoPagoPreferenceId (ver funcionalidad 5)
```

**2. Nuevos endpoints en `/server/src/routes/orders.ts`**

```typescript
// GET /api/orders/:id/public - Ver orden (autenticado o por email guest)
// Query: ?guestEmail=xxx@xxx.com

// GET /api/orders/:id/tracking - Obtener tracking info (si existe)
```

**3. Actualizar `/server/src/routes/admin.ts`**

```typescript
// GET /api/admin/orders?status=xxx&deliveryMethod=xxx

// PATCH /api/admin/orders/:id/status
// Body: { status: "processing" | "ready_pickup" | "shipped" | "delivered" | "cancelled" }

// PATCH /api/admin/orders/:id/confirm-pickup
// Marca pickupConfirmedAt = now(), status = "delivered"

// PATCH /api/admin/orders/:id/tracking
// Body: { trackingNumber: string, trackingUrl: string }
```

### Cambios en Frontend

**1. Actualizar `src/types/index.ts`**

```typescript
export type DeliveryMethod = 'shipping' | 'pickup'

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'processing'
  | 'ready_pickup'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export interface Order {
  id: string
  subtotal: number
  shippingCost: number
  total: number
  deliveryMethod: DeliveryMethod
  status: OrderStatus
  paymentStatus: string
  // ... resto de campos
  items: OrderItem[]
  createdAt: string
  pickupDate?: string
}
```

**2. Actualizar `src/pages/CheckoutPage.tsx`**

Agregar selector de método de entrega:
```tsx
<RadioGroup value={deliveryMethod} onChange={setDeliveryMethod}>
  <Stack>
    <Radio value="shipping">
      <Text>Envío a domicilio</Text>
      <Text fontSize="sm" color="gray.400">
        Gratis en compras mayores a $1000 MXN
      </Text>
    </Radio>
    <Radio value="pickup">
      <Text>Recoger en tienda</Text>
      <Text fontSize="sm" color="gray.400">
        Recoge tu pedido el sábado inmediato posterior a tu compra
      </Text>
    </Radio>
  </Stack>
</RadioGroup>

{deliveryMethod === 'shipping' && (
  <ShippingInfoForm /> // Formulario de dirección
)}

{deliveryMethod === 'pickup' && (
  <Alert status="info">
    Tu pedido estará listo para recoger el sábado {nextSaturday}.
    Debes recogerlo antes de las 5 PM, de lo contrario será cancelado.
  </Alert>
)}
```

**3. Nueva página `src/pages/OrderConfirmationPage.tsx`**

Mostrar detalles de orden, tracking (si aplica), fecha de recogida (si aplica).

**4. Actualizar `src/pages/admin/OrdersPage.tsx`**

- Filtros por `status` y `deliveryMethod`
- Botón "Confirmar recogida" para órdenes pickup
- Input para agregar tracking a órdenes shipping
- Cambiar status manualmente

### Dependencias Nuevas
```bash
# Backend
npm install date-fns  # Para calcular next Saturday
```

### Testing
- Crear orden con envío y validar cálculo de shipping
- Crear orden con recogida y validar pickupDate
- Verificar que stock se reduce al crear orden
- Probar cambios de estado desde admin

---

## 2️⃣ OPCIÓN DE RECOGIDA EN TIENDA VS ENVÍO

### Objetivo
Permitir al usuario elegir entre recibir el pedido en su domicilio o recogerlo en la tienda física.

### Estado
**✅ Implementado en funcionalidad #1**

La lógica de recogida incluye:
- Campo `deliveryMethod` en Order
- Si es "pickup": `shippingCost = 0`, se calcula `pickupDate` (próximo sábado)
- Frontend muestra selector con descripción clara
- Admin puede confirmar manualmente la recogida

---

## 3️⃣ SISTEMA DE APARTADOS CON STRIKES

### Objetivo
Implementar lógica de negocio para permitir apartados (órdenes sin pago inmediato) con sistema de penalización por no recoger a tiempo.

### Reglas de Negocio
1. Un apartado es una orden con `status = "reserved"` que **no requiere pago inmediato**
2. Usuario tiene hasta el **sábado inmediato** a las 5 PM para recoger
3. Si no recoge a tiempo, orden se cancela automáticamente → productos regresan a stock → usuario recibe un strike
4. Cada usuario puede tener **máximo 2 strikes**
5. Al tercer strike, usuario **no puede hacer más apartados** (solo compras con pago)
6. Admin puede confirmar recogida manualmente antes de las 5 PM del sábado
7. Admin puede cancelar apartado manualmente en cualquier momento

### Cambios en Base de Datos

**Actualizar modelo `User`:**
```prisma
model User {
  // ... campos existentes
  strikes             Int         @default(0)  // 0, 1, 2, o 3
  bannedFromReserve   Boolean     @default(false) // true si strikes >= 3
}
```

**Actualizar modelo `Order`:**
```prisma
model Order {
  // ... campos existentes
  isReservation       Boolean     @default(false) // true = apartado
  reservationDeadline DateTime?   // Fecha límite (sábado 5 PM)

  // Estados válidos para apartados:
  // "reserved" -> apartado activo
  // "cancelled" -> cancelado (automático o manual)
  // "delivered" -> confirmado por admin
}
```

**Nueva tabla `Strike`** (historial de strikes):
```prisma
model Strike {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])

  orderId     String   // Orden que causó el strike
  reason      String   // "auto_cancel" | "manual_cancel"

  createdAt   DateTime @default(now())

  @@index([userId])
}
```

### Cambios en Backend

**1. Nuevo archivo `/server/src/services/reservationService.ts`**

```typescript
import { prisma } from '../lib/prisma'
import { addDays, nextSaturday, setHours } from 'date-fns'

export async function canUserMakeReservation(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  return !user?.bannedFromReserve
}

export function calculateReservationDeadline(): Date {
  const nextSat = nextSaturday(new Date())
  return setHours(nextSat, 17) // 5 PM
}

export async function addStrikeToUser(userId: string, orderId: string, reason: string) {
  await prisma.$transaction([
    prisma.strike.create({
      data: { userId, orderId, reason }
    }),
    prisma.user.update({
      where: { id: userId },
      data: {
        strikes: { increment: 1 }
      }
    })
  ])

  // Verificar si llegó a 3 strikes
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (user && user.strikes >= 3) {
    await prisma.user.update({
      where: { id: userId },
      data: { bannedFromReserve: true }
    })
  }
}

export async function restoreStockFromOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true }
  })

  if (!order) return

  // Incrementar stock de cada variante
  for (const item of order.items) {
    const variant = await prisma.productVariant.findFirst({
      where: { productId: item.productId }
    })

    if (variant) {
      await prisma.productVariant.update({
        where: { id: variant.id },
        data: { stock: { increment: item.quantity } }
      })
    }
  }
}

// Auto-cancelar apartados vencidos (ejecutar con cron job)
export async function cancelExpiredReservations() {
  const now = new Date()

  const expiredOrders = await prisma.order.findMany({
    where: {
      isReservation: true,
      status: 'reserved',
      reservationDeadline: { lte: now }
    }
  })

  for (const order of expiredOrders) {
    await prisma.$transaction([
      // Cancelar orden
      prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'cancelled',
          cancelledAt: now
        }
      }),

      // Restaurar stock
      restoreStockFromOrder(order.id),

      // Agregar strike al usuario
      addStrikeToUser(order.userId!, order.id, 'auto_cancel')
    ])
  }

  console.log(`[CRON] Cancelados ${expiredOrders.length} apartados vencidos`)
}
```

**2. Actualizar `/server/src/routes/orders.ts`**

```typescript
import { canUserMakeReservation, calculateReservationDeadline } from '../services/reservationService'

// POST /api/orders - Agregar soporte para apartados
interface CreateOrderDTO {
  // ... campos existentes
  isReservation?: boolean  // Si es true, crear apartado
}

router.post('/', requireAuth(), async (req, res) => {
  const { items, deliveryMethod, isReservation } = req.body

  // Validar si usuario puede hacer apartados
  if (isReservation) {
    const canReserve = await canUserMakeReservation(req.user.id)
    if (!canReserve) {
      return res.status(403).json({
        error: 'No puedes hacer apartados porque has acumulado 3 strikes. Solo puedes comprar con pago inmediato.'
      })
    }

    // Validar que deliveryMethod sea "pickup"
    if (deliveryMethod !== 'pickup') {
      return res.status(400).json({ error: 'Los apartados solo están disponibles para recogida en tienda' })
    }
  }

  // ... lógica de creación

  const order = await prisma.order.create({
    data: {
      userId: req.user.id,
      // ...
      isReservation: isReservation || false,
      reservationDeadline: isReservation ? calculateReservationDeadline() : null,
      status: isReservation ? 'reserved' : 'pending_payment',
      deliveryMethod
    }
  })

  // Si es apartado, no generar MercadoPago preference
  if (isReservation) {
    return res.json({ order })
  }

  // Si es compra normal, generar MercadoPago preference
  // ...
})
```

**3. Actualizar `/server/src/routes/admin.ts`**

```typescript
// PATCH /api/admin/orders/:id/confirm-reservation
// Confirmar recogida de apartado manualmente
router.patch('/:id/confirm-reservation', requireRole('admin', 'staff'), async (req, res) => {
  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: {
      status: 'delivered',
      pickupConfirmedAt: new Date()
    }
  })

  res.json({ order })
})

// PATCH /api/admin/orders/:id/cancel-reservation
// Cancelar apartado manualmente (SIN strike)
router.patch('/:id/cancel-reservation', requireRole('admin', 'staff'), async (req, res) => {
  await prisma.$transaction([
    prisma.order.update({
      where: { id: req.params.id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date()
      }
    }),
    restoreStockFromOrder(req.params.id)
  ])

  res.json({ message: 'Apartado cancelado (sin penalización)' })
})

// GET /api/admin/users/:id/strikes
// Ver historial de strikes de un usuario
router.get('/users/:id/strikes', requireRole('admin'), async (req, res) => {
  const strikes = await prisma.strike.findMany({
    where: { userId: req.params.id },
    include: { user: true },
    orderBy: { createdAt: 'desc' }
  })

  res.json({ strikes })
})

// DELETE /api/admin/users/:id/strikes/:strikeId
// Eliminar strike (perdón administrativo)
router.delete('/users/:id/strikes/:strikeId', requireRole('admin'), async (req, res) => {
  await prisma.$transaction([
    prisma.strike.delete({ where: { id: req.params.strikeId } }),
    prisma.user.update({
      where: { id: req.params.id },
      data: { strikes: { decrement: 1 } }
    })
  ])

  // Verificar si puede volver a hacer apartados
  const user = await prisma.user.findUnique({ where: { id: req.params.id } })
  if (user && user.strikes < 3) {
    await prisma.user.update({
      where: { id: req.params.id },
      data: { bannedFromReserve: false }
    })
  }

  res.json({ message: 'Strike eliminado' })
})
```

**4. Cron Job para cancelación automática**

Crear `/server/src/cron/reservations.ts`:
```typescript
import cron from 'node-cron'
import { cancelExpiredReservations } from '../services/reservationService'

// Ejecutar cada hora
export function startReservationCronJob() {
  cron.schedule('0 * * * *', async () => {
    console.log('[CRON] Verificando apartados vencidos...')
    await cancelExpiredReservations()
  })
}
```

Llamar en `/server/src/index.ts`:
```typescript
import { startReservationCronJob } from './cron/reservations'

// ...
startReservationCronJob()
```

### Cambios en Frontend

**1. Actualizar `src/types/index.ts`**

```typescript
export interface User {
  // ... campos existentes
  strikes: number
  bannedFromReserve: boolean
}

export interface Strike {
  id: string
  userId: string
  orderId: string
  reason: string
  createdAt: string
}
```

**2. Actualizar `src/pages/CheckoutPage.tsx`**

Agregar opción de apartado si usuario está autenticado y puede hacerlo:
```tsx
const { user } = useAuth()

{user && !user.bannedFromReserve && deliveryMethod === 'pickup' && (
  <Checkbox
    isChecked={isReservation}
    onChange={(e) => setIsReservation(e.target.checked)}
  >
    <Text>Apartar sin pagar ahora</Text>
    <Text fontSize="sm" color="gray.400">
      Tendrás hasta el sábado a las 5 PM para recoger tu apartado.
      Si no lo recoges a tiempo, se cancelará y recibirás un strike.
    </Text>
  </Checkbox>
)}

{user?.bannedFromReserve && (
  <Alert status="warning">
    Has acumulado 3 strikes por no recoger apartados. Solo puedes hacer compras con pago inmediato.
  </Alert>
)}
```

**3. Mostrar strikes en perfil**

Crear `src/pages/ProfilePage.tsx`:
```tsx
<Box>
  <Heading size="md">Strikes: {user.strikes}/3</Heading>
  {user.strikes > 0 && (
    <Alert status="warning" mt={2}>
      <AlertIcon />
      Tienes {user.strikes} strike(s). Al llegar a 3, no podrás hacer apartados.
    </Alert>
  )}
</Box>
```

**4. Admin: Ver strikes de usuario**

En `src/pages/admin/OrdersPage.tsx`, agregar modal para ver strikes al hacer click en usuario.

### Dependencias Nuevas
```bash
# Backend
npm install node-cron @types/node-cron
npm install date-fns  # Ya incluido en funcionalidad #1
```

### Testing
- Usuario sin strikes puede hacer apartado
- Usuario con 3 strikes no puede hacer apartado
- Apartado se cancela automáticamente después de deadline
- Stock se restaura al cancelar apartado
- Admin puede confirmar recogida antes de deadline
- Admin puede cancelar sin penalizar
- Admin puede eliminar strikes

---

## 4️⃣ IMPORTACIÓN Y EXPORTACIÓN DE INVENTARIO (CSV)

### Objetivo
Permitir al administrador descargar todo el inventario actual en formato CSV y cargar inventario masivo desde un archivo CSV.

### Formato CSV

**Estructura del archivo CSV:**
```csv
product_id,product_name,franchise,type,category,variant_id,language,condition,rarity,price,original_price,stock,description,image_urls
cuid1,Charizard VMAX,pokemon,singles,Pokemon Card,variant_cuid1,español,NM,Secret Rare,1200.00,1500.00,3,"Carta holográfica especial","https://image1.jpg,https://image2.jpg"
cuid2,Booster Box - Sword & Shield,pokemon,sealed,Booster Box,variant_cuid2,español,NM,,3500.00,,10,"Caja sellada de 36 sobres","https://image3.jpg"
```

**Campos:**
- `product_id` - ID del producto (vacío para productos nuevos)
- `product_name` - Nombre del producto
- `franchise` - Franquicia (pokemon, yugioh, onepiece, digimon, gundam, etc.)
- `type` - Tipo (sealed, singles)
- `category` - Categoría específica
- `variant_id` - ID de variante (vacío para variantes nuevas)
- `language` - Idioma (español, inglés, japonés, portugués)
- `condition` - Condición (NM, LP, MP, HP, Damaged)
- `rarity` - Rareza (solo para Pokemon singles, puede estar vacío)
- `price` - Precio actual
- `original_price` - Precio original (opcional)
- `stock` - Stock disponible
- `description` - Descripción del producto
- `image_urls` - URLs separadas por comas

### Cambios en Backend

**1. Nuevo archivo `/server/src/routes/csv.ts`**

```typescript
import express from 'express'
import multer from 'multer'
import csv from 'csv-parser'
import { createObjectCsvWriter } from 'csv-writer'
import { prisma } from '../lib/prisma'
import { requireRole } from '../middleware/auth'
import fs from 'fs'
import path from 'path'

const router = express.Router()
const upload = multer({ dest: 'uploads/' })

// GET /api/csv/export - Exportar inventario completo
router.get('/export', requireRole('admin', 'staff'), async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: { variants: true }
    })

    const rows: any[] = []

    for (const product of products) {
      for (const variant of product.variants) {
        rows.push({
          product_id: product.id,
          product_name: product.name,
          franchise: product.franchise,
          type: product.type,
          category: product.category,
          variant_id: variant.id,
          language: variant.language,
          condition: variant.condition,
          rarity: variant.rarity || '',
          price: variant.price,
          original_price: variant.originalPrice || '',
          stock: variant.stock,
          description: product.description,
          image_urls: product.images // Ya es string JSON
        })
      }
    }

    // Generar CSV
    const csvWriter = createObjectCsvWriter({
      path: 'temp_export.csv',
      header: [
        { id: 'product_id', title: 'product_id' },
        { id: 'product_name', title: 'product_name' },
        { id: 'franchise', title: 'franchise' },
        { id: 'type', title: 'type' },
        { id: 'category', title: 'category' },
        { id: 'variant_id', title: 'variant_id' },
        { id: 'language', title: 'language' },
        { id: 'condition', title: 'condition' },
        { id: 'rarity', title: 'rarity' },
        { id: 'price', title: 'price' },
        { id: 'original_price', title: 'original_price' },
        { id: 'stock', title: 'stock' },
        { id: 'description', title: 'description' },
        { id: 'image_urls', title: 'image_urls' }
      ]
    })

    await csvWriter.writeRecords(rows)

    // Enviar archivo
    res.download('temp_export.csv', `inventario_${Date.now()}.csv`, (err) => {
      if (!err) {
        fs.unlinkSync('temp_export.csv') // Limpiar
      }
    })
  } catch (error) {
    console.error('Error exportando CSV:', error)
    res.status(500).json({ error: 'Error exportando inventario' })
  }
})

// POST /api/csv/import - Importar inventario desde CSV
router.post('/import', requireRole('admin'), upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ningún archivo' })
  }

  const results: any[] = []
  let created = 0
  let updated = 0
  let errors: string[] = []

  try {
    // Leer CSV
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file!.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', resolve)
        .on('error', reject)
    })

    // Procesar filas
    for (let i = 0; i < results.length; i++) {
      const row = results[i]

      try {
        // Validaciones básicas
        if (!row.product_name || !row.franchise || !row.type || !row.language || !row.condition) {
          errors.push(`Fila ${i + 2}: Faltan campos requeridos`)
          continue
        }

        const price = parseFloat(row.price)
        const stock = parseInt(row.stock)

        if (isNaN(price) || isNaN(stock)) {
          errors.push(`Fila ${i + 2}: Precio o stock inválido`)
          continue
        }

        // Parsear images
        let images = '[]'
        if (row.image_urls) {
          const urls = row.image_urls.split(',').map((url: string) => url.trim())
          images = JSON.stringify(urls)
        }

        // Producto nuevo o existente
        let product
        if (row.product_id) {
          product = await prisma.product.findUnique({ where: { id: row.product_id } })

          if (product) {
            // Actualizar producto
            product = await prisma.product.update({
              where: { id: row.product_id },
              data: {
                name: row.product_name,
                franchise: row.franchise,
                type: row.type,
                category: row.category,
                description: row.description,
                images
              }
            })
          }
        }

        if (!product) {
          // Crear producto nuevo
          product = await prisma.product.create({
            data: {
              name: row.product_name,
              franchise: row.franchise,
              type: row.type,
              category: row.category,
              description: row.description || '',
              images,
              metadata: '{}',
              featured: false,
              isNew: false
            }
          })
          created++
        }

        // Variante nueva o existente
        let variant
        if (row.variant_id) {
          variant = await prisma.productVariant.findUnique({ where: { id: row.variant_id } })
        }

        if (variant) {
          // Actualizar variante
          await prisma.productVariant.update({
            where: { id: row.variant_id },
            data: {
              language: row.language,
              condition: row.condition,
              rarity: row.rarity || null,
              price,
              originalPrice: row.original_price ? parseFloat(row.original_price) : null,
              stock
            }
          })
          updated++
        } else {
          // Crear variante nueva
          await prisma.productVariant.create({
            data: {
              productId: product.id,
              language: row.language,
              condition: row.condition,
              rarity: row.rarity || null,
              price,
              originalPrice: row.original_price ? parseFloat(row.original_price) : null,
              stock
            }
          })
          created++
        }
      } catch (error: any) {
        errors.push(`Fila ${i + 2}: ${error.message}`)
      }
    }

    // Limpiar archivo temporal
    fs.unlinkSync(req.file.path)

    res.json({
      success: true,
      created,
      updated,
      errors,
      total: results.length
    })
  } catch (error) {
    console.error('Error importando CSV:', error)
    res.status(500).json({ error: 'Error procesando archivo CSV' })
  }
})

export default router
```

**2. Registrar ruta en `/server/src/index.ts`**

```typescript
import csvRoutes from './routes/csv'

// ...
app.use('/api/csv', csvRoutes)
```

### Cambios en Frontend

**1. Nueva sección en `/src/pages/admin/InventoryPage.tsx`**

```tsx
import { Button, Input, VStack, HStack, useToast, Text, Progress } from '@chakra-ui/react'
import { useState } from 'react'

export default function InventoryPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const handleExport = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:3001/api/csv/export', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `inventario_${Date.now()}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()

      toast({
        title: 'Inventario exportado',
        status: 'success',
        duration: 3000
      })
    } catch (error) {
      toast({
        title: 'Error exportando inventario',
        status: 'error',
        duration: 3000
      })
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!file) return

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('http://localhost:3001/api/csv/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })

      const result = await response.json()

      toast({
        title: `Importación completada`,
        description: `Creados: ${result.created}, Actualizados: ${result.updated}, Errores: ${result.errors.length}`,
        status: result.errors.length === 0 ? 'success' : 'warning',
        duration: 5000
      })

      if (result.errors.length > 0) {
        console.error('Errores de importación:', result.errors)
      }
    } catch (error) {
      toast({
        title: 'Error importando inventario',
        status: 'error',
        duration: 3000
      })
    } finally {
      setLoading(false)
      setFile(null)
    }
  }

  return (
    <VStack spacing={4} align="stretch">
      <Heading>Gestión de Inventario CSV</Heading>

      <HStack>
        <Button
          colorScheme="brand"
          onClick={handleExport}
          isLoading={loading}
        >
          Exportar Inventario (CSV)
        </Button>
      </HStack>

      <Divider />

      <VStack align="start" spacing={2}>
        <Text fontWeight="bold">Importar Inventario</Text>
        <Input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <Button
          colorScheme="accent"
          onClick={handleImport}
          isDisabled={!file}
          isLoading={loading}
        >
          Subir e Importar CSV
        </Button>
        <Text fontSize="sm" color="gray.400">
          El archivo debe tener el formato: product_id, product_name, franchise, type, variant_id, language, condition, rarity, price, stock, etc.
        </Text>
      </VStack>
    </VStack>
  )
}
```

**2. Agregar ruta en admin**

En `/src/App.tsx`:
```tsx
<Route path="/admin/inventory" element={<AdminGuard><InventoryPage /></AdminGuard>} />
```

### Dependencias Nuevas
```bash
# Backend
npm install csv-parser csv-writer
npm install @types/csv-parser --save-dev
```

### Testing
- Exportar CSV con productos existentes
- Importar CSV vacío
- Importar CSV con productos nuevos
- Importar CSV actualizando productos existentes
- Validar errores en filas con datos inválidos
- Verificar que stock se actualiza correctamente

---

## 5️⃣ INTEGRACIÓN COMPLETA MERCADOPAGO + MERCADOENVÍOS

### Objetivo
Implementar flujo completo de pago con MercadoPago y spike de investigación para MercadoEnvíos con tracking.

### Parte A: MercadoPago Checkout Pro

**Cambios en Backend**

**1. Nuevo archivo `/server/src/services/mercadoPagoService.ts`**

```typescript
import mercadopago from 'mercadopago'

mercadopago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN!
})

export interface PreferenceItem {
  title: string
  quantity: number
  unit_price: number
  currency_id: string
  picture_url?: string
}

export async function createPreference(
  items: PreferenceItem[],
  orderId: string,
  buyerEmail: string
) {
  const preference = await mercadopago.preferences.create({
    items,
    payer: {
      email: buyerEmail
    },
    back_urls: {
      success: `${process.env.FRONTEND_URL}/checkout/success`,
      failure: `${process.env.FRONTEND_URL}/checkout/failure`,
      pending: `${process.env.FRONTEND_URL}/checkout/pending`
    },
    auto_return: 'approved' as any,
    external_reference: orderId, // Vincular con Order en BD
    notification_url: `${process.env.BACKEND_URL}/api/mercadopago/webhook`,
    statement_descriptor: 'cardsSeekers',
    metadata: {
      order_id: orderId
    }
  })

  return preference.body
}

export async function getPaymentInfo(paymentId: string) {
  const payment = await mercadopago.payment.findById(Number(paymentId))
  return payment.body
}
```

**2. Actualizar `/server/src/routes/orders.ts`**

```typescript
import { createPreference } from '../services/mercadoPagoService'

// POST /api/orders - Agregar generación de preference
router.post('/', requireAuth(), async (req, res) => {
  // ... lógica de creación de orden

  const order = await prisma.order.create({ /* ... */ })

  // Si es compra normal (no apartado), generar MercadoPago preference
  if (!order.isReservation) {
    const items = order.items.map(item => ({
      title: item.productName,
      quantity: item.quantity,
      unit_price: item.price,
      currency_id: 'MXN',
      picture_url: item.productImage || undefined
    }))

    const preference = await createPreference(
      items,
      order.id,
      req.user.email
    )

    // Guardar preference ID en orden
    await prisma.order.update({
      where: { id: order.id },
      data: { mercadoPagoId: preference.id }
    })

    return res.json({
      order,
      preferenceId: preference.id,
      initPoint: preference.init_point // URL de checkout
    })
  }

  res.json({ order })
})
```

**3. Nuevo archivo `/server/src/routes/mercadopago.ts`**

```typescript
import express from 'express'
import { prisma } from '../lib/prisma'
import mercadopago from 'mercadopago'

const router = express.Router()

// POST /api/mercadopago/webhook - Webhook de notificaciones
router.post('/webhook', async (req, res) => {
  const { type, data } = req.body

  console.log('[MercadoPago] Webhook recibido:', type, data)

  if (type === 'payment') {
    try {
      const payment = await mercadopago.payment.findById(data.id)
      const orderId = payment.body.external_reference

      if (!orderId) {
        return res.sendStatus(200)
      }

      const status = payment.body.status
      let orderStatus = 'pending_payment'
      let paymentStatus = 'pending'

      if (status === 'approved') {
        orderStatus = 'paid'
        paymentStatus = 'paid'
      } else if (status === 'rejected' || status === 'cancelled') {
        orderStatus = 'cancelled'
        paymentStatus = 'failed'
      }

      // Actualizar orden
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: orderStatus,
          paymentStatus,
          mercadoPagoStatus: status,
          paidAt: status === 'approved' ? new Date() : null
        }
      })

      console.log(`[MercadoPago] Orden ${orderId} actualizada: ${orderStatus}`)
    } catch (error) {
      console.error('[MercadoPago] Error procesando webhook:', error)
    }
  }

  res.sendStatus(200)
})

export default router
```

**4. Registrar ruta en `/server/src/index.ts`**

```typescript
import mercadoPagoRoutes from './routes/mercadopago'

// ...
app.use('/api/mercadopago', mercadoPagoRoutes)
```

**5. Variables de entorno en `/server/.env`**

```env
MERCADOPAGO_ACCESS_TOKEN=tu_access_token_aqui
BACKEND_URL=http://localhost:3001
```

**Cambios en Frontend**

**1. Instalar SDK**

```bash
npm install @mercadopago/sdk-react
```

**2. Configurar en `/src/main.tsx`**

```tsx
import { initMercadoPago } from '@mercadopago/sdk-react'

initMercadoPago(import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY)
```

**3. Actualizar `/src/pages/CheckoutPage.tsx`**

```tsx
import { Wallet } from '@mercadopago/sdk-react'
import { useState } from 'react'

export default function CheckoutPage() {
  const [preferenceId, setPreferenceId] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)

  const handleCreateOrder = async () => {
    // Llamar a POST /api/orders
    const response = await fetch('http://localhost:3001/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        items: cartItems,
        deliveryMethod,
        isReservation: false
      })
    })

    const { order, preferenceId, initPoint } = await response.json()

    setOrderId(order.id)
    setPreferenceId(preferenceId)
  }

  return (
    <Box>
      {/* Formulario de datos */}

      {!preferenceId && (
        <Button colorScheme="brand" onClick={handleCreateOrder}>
          Continuar al Pago
        </Button>
      )}

      {preferenceId && (
        <Box mt={4}>
          <Wallet
            initialization={{ preferenceId }}
            customization={{
              texts: {
                action: 'pay',
                valueProp: 'security_safety'
              }
            }}
          />
        </Box>
      )}
    </Box>
  )
}
```

**4. Páginas de resultado**

Crear `/src/pages/CheckoutSuccessPage.tsx`:
```tsx
export default function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams()
  const paymentId = searchParams.get('payment_id')
  const orderId = searchParams.get('external_reference')

  return (
    <Container maxW="container.lg" py={8}>
      <Alert status="success">
        <AlertIcon />
        <VStack align="start" spacing={1}>
          <Text fontWeight="bold">¡Pago exitoso!</Text>
          <Text fontSize="sm">Tu orden #{orderId} ha sido confirmada.</Text>
        </VStack>
      </Alert>
      <Button as={Link} to={`/orders/${orderId}`} colorScheme="brand" mt={4}>
        Ver Detalles de la Orden
      </Button>
    </Container>
  )
}
```

Crear páginas similares para `/checkout/failure` y `/checkout/pending`.

### Parte B: Spike MercadoEnvíos

**Objetivo:** Investigar y documentar cómo integrar MercadoEnvíos para generar envíos con tracking automático.

**Documentación a crear:** `/memory/SPIKE_MERCADOENVIOS.md`

**Puntos a investigar:**
1. ¿Se puede generar envío automáticamente después del pago?
2. ¿Cómo obtener cotización de envío antes del checkout?
3. ¿Cómo generar etiqueta de envío?
4. ¿Qué información de tracking se obtiene? (número, URL, estado)
5. ¿Se puede notificar al usuario automáticamente de cambios de estado?
6. ¿Qué webhooks existen para tracking?

**API a explorar:**
- `mercadopago.shipments.create()`
- `mercadopago.shipments.search()`
- Documentación: https://www.mercadopago.com.mx/developers/es/docs/shipping

**Resultado esperado:**
- Documento técnico con ejemplos de código
- Diagrama de flujo de integración
- Estimación de esfuerzo para implementación completa

### Dependencias Nuevas
```bash
# Backend
npm install mercadopago

# Frontend
npm install @mercadopago/sdk-react
```

### Variables de Entorno
```env
# Backend .env
MERCADOPAGO_ACCESS_TOKEN=tu_access_token
BACKEND_URL=http://localhost:3001

# Frontend .env
VITE_MERCADOPAGO_PUBLIC_KEY=tu_public_key
```

### Testing
- Crear orden y generar preference
- Completar pago con tarjeta de prueba
- Verificar que webhook actualiza estado de orden
- Probar flujos de pago exitoso, rechazado y pendiente
- Validar redirecciones de vuelta al sitio

---

## 6️⃣ CONFIRMACIÓN DE COMPRA POR EMAIL

### Objetivo
Enviar email automático al usuario con detalles de su orden después de confirmar pago.

### Servicio de Email

**Opción recomendada:** Resend (moderno, fácil, económico)

**Alternativas:** SendGrid, Mailgun, AWS SES

### Cambios en Backend

**1. Instalar Resend**

```bash
npm install resend
```

**2. Nuevo archivo `/server/src/services/emailService.ts`**

```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface OrderEmailData {
  orderId: string
  buyerEmail: string
  buyerName: string
  items: Array<{
    name: string
    quantity: number
    price: number
    image?: string
  }>
  subtotal: number
  shippingCost: number
  total: number
  deliveryMethod: 'shipping' | 'pickup'
  shippingAddress?: string
  pickupDate?: string
}

export async function sendOrderConfirmationEmail(data: OrderEmailData) {
  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        ${item.image ? `<img src="${item.image}" width="50" height="50" style="object-fit: cover; border-radius: 4px;" />` : ''}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)} MXN</td>
    </tr>
  `).join('')

  const deliveryInfo = data.deliveryMethod === 'pickup'
    ? `<p><strong>Método de entrega:</strong> Recoger en tienda</p>
       <p><strong>Fecha límite de recogida:</strong> ${data.pickupDate}</p>`
    : `<p><strong>Método de entrega:</strong> Envío a domicilio</p>
       <p><strong>Dirección de envío:</strong> ${data.shippingAddress}</p>`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #FFD000; padding: 20px; text-align: center; color: #0d0d0d; }
        .content { background: #fff; padding: 20px; border: 1px solid #eee; }
        table { width: 100%; border-collapse: collapse; }
        .total { font-size: 18px; font-weight: bold; text-align: right; padding: 10px; background: #f9f9f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>¡Gracias por tu compra!</h1>
        </div>
        <div class="content">
          <p>Hola <strong>${data.buyerName}</strong>,</p>
          <p>Tu orden <strong>#${data.orderId}</strong> ha sido confirmada exitosamente.</p>

          ${deliveryInfo}

          <h3>Resumen de tu compra:</h3>
          <table>
            <thead>
              <tr style="background: #f5f5f5;">
                <th style="padding: 10px; text-align: left;">Imagen</th>
                <th style="padding: 10px; text-align: left;">Producto</th>
                <th style="padding: 10px; text-align: center;">Cantidad</th>
                <th style="padding: 10px; text-align: right;">Precio</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="margin-top: 20px;">
            <p style="text-align: right;">Subtotal: $${data.subtotal.toFixed(2)} MXN</p>
            <p style="text-align: right;">Envío: $${data.shippingCost.toFixed(2)} MXN</p>
            <p class="total">Total: $${data.total.toFixed(2)} MXN</p>
          </div>

          <p style="margin-top: 30px;">Puedes ver el estado de tu orden en cualquier momento ingresando a tu cuenta en <a href="${process.env.FRONTEND_URL}/orders/${data.orderId}">cardsSeekers</a>.</p>

          <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>

          <p>¡Gracias por confiar en nosotros!</p>
          <p><strong>El equipo de cardsSeekers</strong></p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    const { data: response, error } = await resend.emails.send({
      from: 'cardsSeekers <orders@cardsseekers.com>',
      to: [data.buyerEmail],
      subject: `Confirmación de compra - Orden #${data.orderId}`,
      html
    })

    if (error) {
      console.error('[Email] Error enviando confirmación:', error)
      return { success: false, error }
    }

    console.log('[Email] Confirmación enviada:', response)
    return { success: true, data: response }
  } catch (error) {
    console.error('[Email] Error enviando confirmación:', error)
    return { success: false, error }
  }
}
```

**3. Llamar después de confirmar pago**

En `/server/src/routes/mercadopago.ts`, al actualizar orden:

```typescript
// POST /api/mercadopago/webhook
if (status === 'approved') {
  orderStatus = 'paid'
  paymentStatus = 'paid'

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: orderStatus,
      paymentStatus,
      paidAt: new Date()
    }
  })

  // Enviar email de confirmación
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, user: true }
  })

  if (order && order.user) {
    await sendOrderConfirmationEmail({
      orderId: order.id,
      buyerEmail: order.guestEmail || order.user.email,
      buyerName: order.guestName || order.user.nombre || 'Cliente',
      items: order.items.map(item => ({
        name: item.productName,
        quantity: item.quantity,
        price: item.price,
        image: item.productImage
      })),
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      total: order.total,
      deliveryMethod: order.deliveryMethod as 'shipping' | 'pickup',
      shippingAddress: order.shippingAddress,
      pickupDate: order.pickupDate?.toLocaleDateString('es-MX')
    })
  }
}
```

### Variables de Entorno
```env
# Backend .env
RESEND_API_KEY=re_tu_api_key
```

### Testing
- Completar compra y verificar que llega email
- Validar que email contiene todos los detalles correctos
- Probar con usuario registrado y guest
- Validar formato HTML en diferentes clientes de email

---

## 7️⃣ CAPTCHA ANTI-BOTS

### Objetivo
Proteger formularios críticos (registro, checkout, contacto) contra bots con Google reCAPTCHA v3.

### Cambios en Backend

**1. Instalar librería**

```bash
npm install express-recaptcha
```

**2. Crear middleware `/server/src/middleware/recaptcha.ts`**

```typescript
import axios from 'axios'

export async function verifyRecaptcha(token: string): Promise<boolean> {
  try {
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify`,
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: token
        }
      }
    )

    const { success, score } = response.data

    // reCAPTCHA v3 devuelve score de 0.0 a 1.0
    // 0.0 = muy probable bot, 1.0 = muy probable humano
    // Threshold recomendado: 0.5
    console.log('[reCAPTCHA] Score:', score)

    return success && score >= 0.5
  } catch (error) {
    console.error('[reCAPTCHA] Error verificando:', error)
    return false
  }
}
```

**3. Aplicar en rutas críticas**

En `/server/src/routes/orders.ts`:
```typescript
import { verifyRecaptcha } from '../middleware/recaptcha'

// POST /api/orders
router.post('/', requireAuth(), async (req, res) => {
  const { recaptchaToken } = req.body

  // Verificar reCAPTCHA
  const isHuman = await verifyRecaptcha(recaptchaToken)
  if (!isHuman) {
    return res.status(400).json({ error: 'Verificación de reCAPTCHA fallida. Intenta de nuevo.' })
  }

  // ... resto de lógica
})
```

Aplicar también en:
- `POST /api/auth/google` (login)
- `POST /api/orders` (checkout)
- Formulario de contacto (si existe)

### Cambios en Frontend

**1. Instalar SDK**

```bash
npm install react-google-recaptcha-v3
```

**2. Configurar en `/src/main.tsx`**

```tsx
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'

root.render(
  <GoogleReCaptchaProvider reCaptchaKey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}>
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <App />
    </ChakraProvider>
  </GoogleReCaptchaProvider>
)
```

**3. Usar en formularios**

En `/src/pages/CheckoutPage.tsx`:
```tsx
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'

export default function CheckoutPage() {
  const { executeRecaptcha } = useGoogleReCaptcha()

  const handleCreateOrder = async () => {
    if (!executeRecaptcha) {
      console.log('reCAPTCHA no disponible')
      return
    }

    // Obtener token
    const recaptchaToken = await executeRecaptcha('create_order')

    // Enviar con petición
    const response = await fetch('http://localhost:3001/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        items: cartItems,
        deliveryMethod,
        recaptchaToken  // <-- Incluir token
      })
    })

    // ...
  }

  return (
    // ...
  )
}
```

### Variables de Entorno
```env
# Backend .env
RECAPTCHA_SECRET_KEY=tu_secret_key

# Frontend .env
VITE_RECAPTCHA_SITE_KEY=tu_site_key
```

### Obtener Keys
1. Ir a https://www.google.com/recaptcha/admin
2. Crear nuevo sitio con reCAPTCHA v3
3. Copiar Site Key y Secret Key

### Testing
- Crear orden y verificar que score es >= 0.5
- Simular tráfico automatizado y verificar rechazo
- Verificar que no afecta UX (v3 es invisible)

---

## 8️⃣ COMPRAS SIN REGISTRO (GUEST CHECKOUT)

### Objetivo
Permitir que usuarios no registrados puedan completar compras proporcionando solo email, nombre y teléfono.

### Estado
**✅ Parcialmente implementado en funcionalidad #1**

El modelo `Order` ya incluye campos `guestEmail`, `guestName`, `guestPhone` y `userId` es opcional.

### Cambios Adicionales en Backend

**1. Actualizar `/server/src/routes/orders.ts`**

```typescript
// POST /api/orders - Permitir sin autenticación si incluye datos guest
router.post('/', async (req, res) => {  // <-- Remover requireAuth()
  const { items, deliveryMethod, shippingInfo, guest, recaptchaToken } = req.body

  // Verificar reCAPTCHA
  const isHuman = await verifyRecaptcha(recaptchaToken)
  if (!isHuman) {
    return res.status(400).json({ error: 'Verificación fallida' })
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
      return res.status(400).json({ error: 'Debes proporcionar email, nombre y teléfono para comprar sin cuenta' })
    }
  }

  // Validar items y stock
  // ...

  // Crear orden
  const order = await prisma.order.create({
    data: {
      userId,  // null si es guest
      guestEmail: !userId ? guest.email : null,
      guestName: !userId ? guest.name : null,
      guestPhone: !userId ? guest.phone : null,
      // ... resto de campos
    }
  })

  // Generar MercadoPago preference
  const preference = await createPreference(
    items,
    order.id,
    guest?.email || req.user.email
  )

  res.json({
    order,
    preferenceId: preference.id,
    initPoint: preference.init_point
  })
})
```

**2. Permitir consultar orden guest por email**

```typescript
// GET /api/orders/:id/public?guestEmail=xxx@xxx.com
router.get('/:id/public', async (req, res) => {
  const { guestEmail } = req.query

  if (!guestEmail) {
    return res.status(400).json({ error: 'Email requerido' })
  }

  const order = await prisma.order.findFirst({
    where: {
      id: req.params.id,
      guestEmail: guestEmail as string
    },
    include: { items: true }
  })

  if (!order) {
    return res.status(404).json({ error: 'Orden no encontrada' })
  }

  res.json({ order })
})
```

### Cambios en Frontend

**1. Actualizar `src/pages/CheckoutPage.tsx`**

Mostrar formulario de guest si usuario no está autenticado:

```tsx
const { user } = useAuth()

{!user && (
  <VStack spacing={4} align="stretch">
    <Heading size="md">Información de Compra</Heading>
    <Text fontSize="sm" color="gray.400">
      No tienes que crear una cuenta para comprar. Solo proporciona tus datos de contacto.
    </Text>

    <Input
      placeholder="Nombre completo"
      value={guestName}
      onChange={(e) => setGuestName(e.target.value)}
    />
    <Input
      type="email"
      placeholder="Email"
      value={guestEmail}
      onChange={(e) => setGuestEmail(e.target.value)}
    />
    <Input
      type="tel"
      placeholder="Teléfono"
      value={guestPhone}
      onChange={(e) => setGuestPhone(e.target.value)}
    />

    <Text fontSize="sm" color="gray.400">
      Guarda este email para consultar tu orden después.
    </Text>
  </VStack>
)}
```

**2. Nueva página `/src/pages/OrderLookupPage.tsx`**

Permitir consultar orden por ID + email:

```tsx
export default function OrderLookupPage() {
  const [orderId, setOrderId] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleLookup = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `http://localhost:3001/api/orders/${orderId}/public?guestEmail=${encodeURIComponent(guestEmail)}`
      )

      if (response.ok) {
        const data = await response.json()
        setOrder(data.order)
      } else {
        toast({ title: 'Orden no encontrada', status: 'error' })
      }
    } catch (error) {
      toast({ title: 'Error buscando orden', status: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={4}>
        <Heading>Consultar Orden</Heading>
        <Input
          placeholder="ID de Orden (ej: ckxyz123...)"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
        />
        <Input
          type="email"
          placeholder="Email usado en la compra"
          value={guestEmail}
          onChange={(e) => setGuestEmail(e.target.value)}
        />
        <Button colorScheme="brand" onClick={handleLookup} isLoading={loading}>
          Buscar Orden
        </Button>

        {order && (
          <OrderDetailsCard order={order} />
        )}
      </VStack>
    </Container>
  )
}
```

**3. Agregar link en footer**

En `src/components/Footer.tsx`:
```tsx
<Link as={RouterLink} to="/order-lookup">
  Consultar Orden
</Link>
```

### Testing
- Crear orden sin estar autenticado
- Verificar que email de confirmación llega a guest
- Buscar orden por ID + email
- Verificar que guest no puede hacer apartados (solo compras con pago)

### ✅ ESTADO: COMPLETADO

**Fecha de implementación:** 2026-03-28

**Cambios realizados:**

**Backend:**
- ✅ `server/prisma/schema.prisma` - Agregados campos `guestEmail`, `guestName`, `guestPhone` + `userId` opcional
- ✅ Migración creada: `20260329002332_add_guest_checkout`
- ✅ `server/src/routes/orders.ts` - POST /api/orders actualizado para aceptar guest checkout
- ✅ `server/src/routes/orders.ts` - GET /api/orders/:id/public agregado para consultar órdenes guest

**Frontend:**
- ✅ `src/pages/CheckoutPage.tsx` - Función handlePayment actualizada para enviar datos guest
- ✅ `src/pages/CheckoutPage.tsx` - Alert informativo agregado para usuarios no autenticados
- ✅ `src/pages/OrderLookupPage.tsx` - Nueva página creada para consultar órdenes por ID + email
- ✅ `src/components/Footer.tsx` - Link "Consultar Orden" agregado
- ✅ `src/App.tsx` - Ruta `/order-lookup` agregada

**Funcionalidad implementada:**
- Los usuarios NO autenticados pueden completar compras proporcionando email, nombre y teléfono
- Las órdenes guest se guardan con campos `guestEmail`, `guestName`, `guestPhone`
- Los usuarios guest pueden consultar sus órdenes en `/order-lookup` usando ID + email
- El backend valida que se proporcionen datos guest si no hay autenticación
- Alert informativo muestra mensaje amigable en checkout para usuarios no autenticados

**Flujo completo:**
1. Usuario agrega productos al carrito sin autenticarse
2. En checkout, ve mensaje: "No necesitas crear una cuenta..."
3. Completa formulario con sus datos
4. Sistema detecta que no hay token y envía datos como `guest`
5. Backend crea orden con campos guest
6. Usuario recibe confirmación (mock por ahora)
7. Usuario puede buscar su orden en `/order-lookup` con ID + email

---

## 9️⃣ NUEVAS FRANQUICIAS (DIGIMON, GUNDAM, ETC.)

### Objetivo
Agregar soporte para nuevas franquicias manteniendo la estructura de variantes y metadata existente.

### Cambios en Base de Datos

**Actualizar tipo `franchise` en Prisma** (si está como enum):

```prisma
// Si franchise es enum, actualizar:
enum Franchise {
  pokemon
  yugioh
  onepiece
  digimon
  gundam
  magicthegathering
  dragonballsuper
  finalfantasy
  // Agregar más según necesidad
}

// Si franchise es String, no requiere cambio en schema
```

### Cambios en Frontend

**1. Actualizar `src/types/index.ts`**

```typescript
export type Franchise =
  | 'pokemon'
  | 'yugioh'
  | 'onepiece'
  | 'digimon'
  | 'gundam'
  | 'magicthegathering'
  | 'dragonballsuper'
  | 'finalfantasy'

export const FRANCHISE_CONFIG: Record<Franchise, { name: string; color: string; logo?: string }> = {
  pokemon: { name: 'Pokémon', color: '#FFD000' },
  yugioh: { name: 'Yu-Gi-Oh!', color: '#7B0F9E' },
  onepiece: { name: 'One Piece', color: '#FF6B00' },
  digimon: { name: 'Digimon', color: '#0099FF' },
  gundam: { name: 'Gundam', color: '#D32F2F' },
  magicthegathering: { name: 'Magic: The Gathering', color: '#FFA726' },
  dragonballsuper: { name: 'Dragon Ball Super', color: '#FF5722' },
  finalfantasy: { name: 'Final Fantasy', color: '#673AB7' }
}
```

**2. Actualizar `src/components/FilterBar.tsx`**

Agregar pills para nuevas franquicias:
```tsx
{Object.entries(FRANCHISE_CONFIG).map(([key, config]) => (
  <Tag
    key={key}
    size="lg"
    colorScheme={selectedFranchise === key ? 'brand' : 'gray'}
    cursor="pointer"
    onClick={() => handleFranchiseChange(key)}
  >
    {config.name}
  </Tag>
))}
```

**3. Actualizar formulario admin**

En `src/pages/admin/ProductFormModal.tsx`:
```tsx
<Select name="franchise" value={formData.franchise} onChange={handleChange}>
  {Object.entries(FRANCHISE_CONFIG).map(([key, config]) => (
    <option key={key} value={key}>{config.name}</option>
  ))}
</Select>
```

### Metadata por Franquicia

Cada franquicia puede tener metadata específica en el campo `metadata` de `Product` (JSON):

**Pokémon:**
```json
{
  "set": "Sword & Shield",
  "cardNumber": "123/456",
  "artist": "John Doe",
  "hp": "220"
}
```

**Digimon:**
```json
{
  "set": "Booster Set 01",
  "cardNumber": "BT01-001",
  "digivolutionCost": 2,
  "level": 5
}
```

**Gundam:**
```json
{
  "series": "Mobile Suit Gundam",
  "scale": "1/144",
  "grade": "Master Grade"
}
```

### Testing
- Crear producto de franquicia Digimon
- Filtrar catálogo por Digimon
- Validar que colores y badges se aplican correctamente
- Agregar metadata específica de franquicia

### ✅ ESTADO: COMPLETADO

**Fecha de implementación:** 2026-03-28

**Archivos modificados:**
- ✅ `src/types/index.ts` - Agregado tipo Franchise con 8 franquicias + FRANCHISE_CONFIG con colores y emojis
- ✅ `src/pages/admin/ProductFormModal.tsx` - Agregadas opciones de franquicias en Select
- ✅ `src/pages/Home.tsx` - Actualizado FRANCHISE_CARDS con 8 franquicias + descripción hero + stats
- ✅ `server/prisma/schema.prisma` - Actualizado comentario de campo franchise
- ✅ `src/components/FilterBar.tsx` - Se actualiza automáticamente desde FRANCHISE_CONFIG (no requirió cambios)

**Nuevas franquicias agregadas:**
1. **Digimon** - Color: #0099FF, Emoji: 🦖
2. **Gundam** - Color: #D32F2F, Emoji: 🤖
3. **Magic: The Gathering** - Color: #FFA726, Emoji: 🔮
4. **Dragon Ball Super** - Color: #FF5722, Emoji: 🐉
5. **Final Fantasy** - Color: #673AB7, Emoji: ⚔️

**Verificación realizada:**
- ✅ Tipos TypeScript actualizados correctamente
- ✅ Configuración de colores y gradientes aplicados
- ✅ Filtros de catálogo soportan nuevas franquicias
- ✅ Formulario de admin incluye todas las opciones
- ✅ Home page muestra las 8 franquicias en sección de franquicias
- ✅ Schema de Prisma documentado con nuevas franquicias
- ✅ No se requieren migraciones de BD (franchise es String)

---

## 🔟 SISTEMA DE TORNEOS

### Objetivo
Implementar sistema completo de gestión de torneos con inscripción, pareos, resultados, puntajes, premios y rankings.

### Cambios en Base de Datos

**Nuevos modelos en Prisma:**

```prisma
model Tournament {
  id              String            @id @default(cuid())
  name            String
  franchise       String            // pokemon, yugioh, etc.
  format          String            // Standard, Expanded, Limited, etc.
  description     String?

  // Fechas
  registrationStart DateTime
  registrationEnd   DateTime
  startDate         DateTime
  endDate           DateTime?

  // Configuración
  maxParticipants   Int?
  entryFee          Float           @default(0)
  prizePool         String          // JSON con premios

  // Estado
  status            String          // "registration_open" | "registration_closed" | "in_progress" | "completed"

  // Metadata
  rules             String?         // Reglas específicas
  location          String?         // Presencial o "Online"

  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  participants      TournamentParticipant[]
  matches           TournamentMatch[]
  standings         TournamentStanding[]
}

model TournamentParticipant {
  id              String      @id @default(cuid())
  tournamentId    String
  tournament      Tournament  @relation(fields: [tournamentId], references: [id])
  userId          String
  user            User        @relation(fields: [userId], references: [id])

  // Deck info (opcional)
  deckName        String?
  deckList        String?     // JSON con lista de cartas

  // Estado
  status          String      @default("registered") // "registered" | "checked_in" | "dropped"
  checkedInAt     DateTime?
  droppedAt       DateTime?

  registeredAt    DateTime    @default(now())

  matches         TournamentMatchParticipant[]

  @@unique([tournamentId, userId])
  @@index([tournamentId])
  @@index([userId])
}

model TournamentMatch {
  id              String      @id @default(cuid())
  tournamentId    String
  tournament      Tournament  @relation(fields: [tournamentId], references: [id])

  roundNumber     Int         // 1, 2, 3, etc.
  matchNumber     Int         // Número de mesa/match dentro de la ronda

  // Resultado
  status          String      @default("pending") // "pending" | "in_progress" | "completed"
  winnerId        String?     // userId del ganador

  createdAt       DateTime    @default(now())
  completedAt     DateTime?

  participants    TournamentMatchParticipant[]

  @@index([tournamentId, roundNumber])
}

model TournamentMatchParticipant {
  id              String                @id @default(cuid())
  matchId         String
  match           TournamentMatch       @relation(fields: [matchId], references: [id])
  participantId   String
  participant     TournamentParticipant @relation(fields: [participantId], references: [id])

  // Resultado
  wins            Int                   @default(0)
  losses          Int                   @default(0)
  draws           Int                   @default(0)

  isWinner        Boolean               @default(false)

  @@unique([matchId, participantId])
  @@index([matchId])
}

model TournamentStanding {
  id              String      @id @default(cuid())
  tournamentId    String
  tournament      Tournament  @relation(fields: [tournamentId], references: [id])
  userId          String
  user            User        @relation(fields: [userId], references: [id])

  // Puntaje
  points          Int         @default(0)  // 3 puntos por victoria, 1 por empate
  matchWins       Int         @default(0)
  matchLosses     Int         @default(0)
  matchDraws      Int         @default(0)
  gameWins        Int         @default(0)  // Total de partidas ganadas
  gameLosses      Int         @default(0)

  // Tiebreakers
  opponentWinRate Float       @default(0)  // OMW% (Opponent Match Win Percentage)
  gameWinRate     Float       @default(0)  // GW%

  // Posición final
  finalRank       Int?

  updatedAt       DateTime    @updatedAt

  @@unique([tournamentId, userId])
  @@index([tournamentId])
}

// Agregar a modelo User existente:
model User {
  // ... campos existentes

  tournamentParticipations TournamentParticipant[]
  tournamentStandings      TournamentStanding[]
}
```

### Cambios en Backend

**1. Nuevo archivo `/server/src/routes/tournaments.ts`**

```typescript
import express from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, requireRole } from '../middleware/auth'

const router = express.Router()

// GET /api/tournaments - Listar torneos (públicos)
router.get('/', async (req, res) => {
  const { franchise, status } = req.query

  const tournaments = await prisma.tournament.findMany({
    where: {
      franchise: franchise as string | undefined,
      status: status as string | undefined
    },
    include: {
      _count: {
        select: { participants: true }
      }
    },
    orderBy: { startDate: 'desc' }
  })

  res.json({ tournaments })
})

// GET /api/tournaments/:id - Detalle torneo
router.get('/:id', async (req, res) => {
  const tournament = await prisma.tournament.findUnique({
    where: { id: req.params.id },
    include: {
      participants: {
        include: { user: true }
      },
      standings: {
        include: { user: true },
        orderBy: [
          { points: 'desc' },
          { opponentWinRate: 'desc' },
          { gameWinRate: 'desc' }
        ]
      }
    }
  })

  if (!tournament) {
    return res.status(404).json({ error: 'Torneo no encontrado' })
  }

  res.json({ tournament })
})

// POST /api/tournaments/:id/register - Inscribirse a torneo (autenticado)
router.post('/:id/register', requireAuth(), async (req, res) => {
  const { deckName, deckList } = req.body
  const tournamentId = req.params.id

  // Verificar que torneo existe y está abierto
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { _count: { select: { participants: true } } }
  })

  if (!tournament) {
    return res.status(404).json({ error: 'Torneo no encontrado' })
  }

  if (tournament.status !== 'registration_open') {
    return res.status(400).json({ error: 'El registro para este torneo está cerrado' })
  }

  if (tournament.maxParticipants && tournament._count.participants >= tournament.maxParticipants) {
    return res.status(400).json({ error: 'El torneo está lleno' })
  }

  // Verificar que usuario no está ya registrado
  const existing = await prisma.tournamentParticipant.findUnique({
    where: {
      tournamentId_userId: {
        tournamentId,
        userId: req.user.id
      }
    }
  })

  if (existing) {
    return res.status(400).json({ error: 'Ya estás registrado en este torneo' })
  }

  // Crear participación
  const participant = await prisma.tournamentParticipant.create({
    data: {
      tournamentId,
      userId: req.user.id,
      deckName,
      deckList
    }
  })

  // Crear standing inicial
  await prisma.tournamentStanding.create({
    data: {
      tournamentId,
      userId: req.user.id
    }
  })

  res.json({ participant })
})

// POST /api/tournaments/:id/drop - Abandonar torneo (autenticado)
router.post('/:id/drop', requireAuth(), async (req, res) => {
  await prisma.tournamentParticipant.update({
    where: {
      tournamentId_userId: {
        tournamentId: req.params.id,
        userId: req.user.id
      }
    },
    data: {
      status: 'dropped',
      droppedAt: new Date()
    }
  })

  res.json({ message: 'Has abandonado el torneo' })
})

// GET /api/tournaments/:id/pairings?round=1 - Ver pareos de una ronda
router.get('/:id/pairings', async (req, res) => {
  const { round } = req.query

  const matches = await prisma.tournamentMatch.findMany({
    where: {
      tournamentId: req.params.id,
      roundNumber: round ? parseInt(round as string) : undefined
    },
    include: {
      participants: {
        include: {
          participant: {
            include: { user: true }
          }
        }
      }
    },
    orderBy: { matchNumber: 'asc' }
  })

  res.json({ matches })
})

export default router
```

**2. Rutas de administración** `/server/src/routes/admin.ts`

Agregar endpoints para gestión de torneos:

```typescript
// POST /api/admin/tournaments - Crear torneo
router.post('/tournaments', requireRole('admin', 'staff'), async (req, res) => {
  const tournament = await prisma.tournament.create({
    data: {
      ...req.body,
      status: 'registration_open'
    }
  })

  res.json({ tournament })
})

// PATCH /api/admin/tournaments/:id/status - Cambiar estado
router.patch('/tournaments/:id/status', requireRole('admin', 'staff'), async (req, res) => {
  const { status } = req.body

  const tournament = await prisma.tournament.update({
    where: { id: req.params.id },
    data: { status }
  })

  res.json({ tournament })
})

// POST /api/admin/tournaments/:id/generate-pairings - Generar pareos para ronda
router.post('/tournaments/:id/generate-pairings', requireRole('admin', 'staff'), async (req, res) => {
  const { round } = req.body

  // Obtener participantes activos
  const participants = await prisma.tournamentParticipant.findMany({
    where: {
      tournamentId: req.params.id,
      status: 'checked_in'
    },
    include: {
      user: true
    }
  })

  // Algoritmo de pareos suizo (simplificado)
  // En producción: implementar Swiss pairing algorithm completo
  const shuffled = participants.sort(() => Math.random() - 0.5)
  const pairs: any[] = []

  for (let i = 0; i < shuffled.length; i += 2) {
    if (i + 1 < shuffled.length) {
      pairs.push([shuffled[i], shuffled[i + 1]])
    } else {
      // Bye (jugador sin oponente)
      pairs.push([shuffled[i], null])
    }
  }

  // Crear matches en BD
  for (let i = 0; i < pairs.length; i++) {
    const [p1, p2] = pairs[i]

    const match = await prisma.tournamentMatch.create({
      data: {
        tournamentId: req.params.id,
        roundNumber: round,
        matchNumber: i + 1
      }
    })

    await prisma.tournamentMatchParticipant.create({
      data: {
        matchId: match.id,
        participantId: p1.id
      }
    })

    if (p2) {
      await prisma.tournamentMatchParticipant.create({
        data: {
          matchId: match.id,
          participantId: p2.id
        }
      })
    } else {
      // Bye automático: +3 puntos
      await prisma.tournamentStanding.update({
        where: {
          tournamentId_userId: {
            tournamentId: req.params.id,
            userId: p1.userId
          }
        },
        data: {
          points: { increment: 3 },
          matchWins: { increment: 1 }
        }
      })
    }
  }

  res.json({ message: `Pareos generados para ronda ${round}` })
})

// POST /api/admin/tournaments/:id/matches/:matchId/report - Reportar resultado
router.post('/tournaments/:id/matches/:matchId/report', requireRole('admin', 'staff'), async (req, res) => {
  const { winnerId, player1Wins, player1Losses, player2Wins, player2Losses, draws } = req.body

  const match = await prisma.tournamentMatch.findUnique({
    where: { id: req.params.matchId },
    include: { participants: true }
  })

  if (!match) {
    return res.status(404).json({ error: 'Match no encontrado' })
  }

  // Actualizar resultado del match
  await prisma.tournamentMatch.update({
    where: { id: req.params.matchId },
    data: {
      status: 'completed',
      winnerId,
      completedAt: new Date()
    }
  })

  // Actualizar participantes del match
  const [p1, p2] = match.participants

  await prisma.tournamentMatchParticipant.update({
    where: { id: p1.id },
    data: {
      wins: player1Wins,
      losses: player1Losses,
      draws: draws || 0,
      isWinner: winnerId === p1.participantId
    }
  })

  if (p2) {
    await prisma.tournamentMatchParticipant.update({
      where: { id: p2.id },
      data: {
        wins: player2Wins,
        losses: player2Losses,
        draws: draws || 0,
        isWinner: winnerId === p2.participantId
      }
    })
  }

  // Actualizar standings
  const winner = match.participants.find(p => p.participantId === winnerId)
  const loser = match.participants.find(p => p.participantId !== winnerId)

  if (winner) {
    const participantWinner = await prisma.tournamentParticipant.findUnique({
      where: { id: winner.participantId }
    })

    await prisma.tournamentStanding.update({
      where: {
        tournamentId_userId: {
          tournamentId: req.params.id,
          userId: participantWinner!.userId
        }
      },
      data: {
        points: { increment: 3 },
        matchWins: { increment: 1 },
        gameWins: { increment: player1Wins },
        gameLosses: { increment: player1Losses }
      }
    })
  }

  if (loser) {
    const participantLoser = await prisma.tournamentParticipant.findUnique({
      where: { id: loser.participantId }
    })

    await prisma.tournamentStanding.update({
      where: {
        tournamentId_userId: {
          tournamentId: req.params.id,
          userId: participantLoser!.userId
        }
      },
      data: {
        matchLosses: { increment: 1 },
        gameWins: { increment: player2Wins },
        gameLosses: { increment: player2Losses }
      }
    })
  }

  res.json({ message: 'Resultado reportado' })
})
```

### Cambios en Frontend

**1. Nueva página `/src/pages/TournamentsPage.tsx`**

```tsx
export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState([])
  const [filter, setFilter] = useState('all') // all, upcoming, in_progress, completed

  useEffect(() => {
    fetchTournaments()
  }, [filter])

  const fetchTournaments = async () => {
    const response = await fetch(`http://localhost:3001/api/tournaments?status=${filter}`)
    const data = await response.json()
    setTournaments(data.tournaments)
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <Heading>Torneos</Heading>

        <HStack>
          <Button onClick={() => setFilter('all')} variant={filter === 'all' ? 'solid' : 'ghost'}>
            Todos
          </Button>
          <Button onClick={() => setFilter('registration_open')} variant={filter === 'registration_open' ? 'solid' : 'ghost'}>
            Abiertos
          </Button>
          <Button onClick={() => setFilter('in_progress')} variant={filter === 'in_progress' ? 'solid' : 'ghost'}>
            En curso
          </Button>
          <Button onClick={() => setFilter('completed')} variant={filter === 'completed' ? 'solid' : 'ghost'}>
            Completados
          </Button>
        </HStack>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {tournaments.map(tournament => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </SimpleGrid>
      </VStack>
    </Container>
  )
}
```

**2. Nueva página `/src/pages/TournamentDetailPage.tsx`**

Mostrar:
- Info del torneo
- Botón de inscripción (si está abierto)
- Lista de participantes
- Tabla de posiciones (standings)
- Pareos por ronda

**3. Panel de administración `/src/pages/admin/TournamentManagementPage.tsx`**

- Crear/editar torneos
- Cambiar estado (abrir registro, iniciar, finalizar)
- Generar pareos por ronda
- Reportar resultados de matches
- Ver standings en tiempo real

### Testing
- Crear torneo
- Inscribirse a torneo
- Generar pareos para ronda 1
- Reportar resultados y validar que standings se actualizan
- Verificar tiebreakers (OMW%, GW%)
- Abandonar torneo

---

## 📊 RESUMEN DE PRIORIDADES Y ORDEN DE IMPLEMENTACIÓN

### Fase 1: Fundamentos (Semanas 1-2)
1. ✅ **Órdenes mejoradas** (funcionalidad #1)
2. ✅ **Opción recogida/envío** (incluida en #1)
3. 🔒 **CAPTCHA** (funcionalidad #7) - proteger sistema antes de abrir
4. 💳 **MercadoPago + MercadoEnvíos** (funcionalidad #5)

### Fase 2: Operaciones (Semanas 3-4)
5. 📧 **Email confirmación** (funcionalidad #6)
6. 🛒 **Guest checkout** (funcionalidad #8)
7. 📝 **Sistema de apartados + strikes** (funcionalidad #3)
8. 📊 **CSV import/export** (funcionalidad #4)

### Fase 3: Expansión (Semanas 5-6)
9. 🎴 **Nuevas franquicias** (funcionalidad #9)
10. 🏆 **Sistema de torneos** (funcionalidad #10)

---

## 🚀 GUÍA DE DESPLIEGUE

### Pre-requisitos de Producción

**1. Migrar a PostgreSQL**

Actualizar `/server/prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"  // Cambiar de sqlite
  url      = env("DATABASE_URL")
}
```

Actualizar `.env` en producción:
```env
DATABASE_URL="postgresql://user:password@host:5432/cardsseekers?schema=public"
```

Ejecutar migración:
```bash
cd server
npx prisma migrate deploy
```

**2. Variables de Entorno de Producción**

Backend:
```env
DATABASE_URL=postgresql://...
JWT_SECRET=generate_secure_random_string_here
GOOGLE_CLIENT_ID=...
PORT=3001
FRONTEND_URL=https://cardsseekers.com
BACKEND_URL=https://api.cardsseekers.com
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
MERCADOPAGO_ACCESS_TOKEN=...
RESEND_API_KEY=...
RECAPTCHA_SECRET_KEY=...
```

Frontend:
```env
VITE_API_URL=https://api.cardsseekers.com
VITE_GOOGLE_CLIENT_ID=...
VITE_MERCADOPAGO_PUBLIC_KEY=...
VITE_RECAPTCHA_SITE_KEY=...
```

**3. Configurar Cron Jobs**

Si usas Vercel/Railway/Render, configurar cron job externo (ej: cron-job.org) para llamar:
```
GET https://api.cardsseekers.com/api/cron/cancel-reservations
```
Frecuencia: cada hora

Alternativamente, usar servicio de cron nativo del hosting.

**4. Configurar Webhooks**

MercadoPago:
- URL: `https://api.cardsseekers.com/api/mercadopago/webhook`
- Eventos: payment

**5. DNS y Dominios**

- Frontend: cardsseekers.com → Vercel/Netlify
- Backend: api.cardsseekers.com → Railway/Render/Fly.io
- Certificados SSL automáticos (Let's Encrypt)

---

## 📝 NOTAS FINALES

### Buenas Prácticas
- Siempre hacer backup de BD antes de importar CSV
- Monitorear tasa de éxito de CAPTCHA (ajustar threshold si es necesario)
- Revisar logs de emails enviados (rate limits de Resend)
- Implementar soft deletes para órdenes (no eliminar físicamente)
- Agregar índices en BD para queries frecuentes

### Seguridad
- Nunca exponer SECRET_KEY de MercadoPago en frontend
- Validar siempre input del usuario (SQL injection, XSS)
- Rate limiting en endpoints críticos (login, checkout)
- Sanitizar datos de CSV antes de insertar en BD

### Escalabilidad
- Considerar Redis para cachear productos frecuentes
- Usar CDN para imágenes (ya implementado con Cloudinary)
- Implementar paginación en listados grandes
- Monitorear performance de queries (usar Prisma Studio)

### Testing
- Crear suite de tests E2E con Playwright/Cypress
- Tests unitarios para lógica de negocio crítica (strikes, pareos)
- Simular carga con herramientas como k6 o Artillery

---

## 📞 SOPORTE Y DOCUMENTACIÓN

- **Prisma Docs:** https://www.prisma.io/docs
- **MercadoPago API:** https://www.mercadopago.com.mx/developers
- **Resend Docs:** https://resend.com/docs
- **reCAPTCHA v3:** https://developers.google.com/recaptcha/docs/v3
- **Chakra UI:** https://chakra-ui.com/docs

---

**Fin del Plan de Trabajo**

Este documento debe actualizarse conforme avanza la implementación.
Versión: 1.0
Última actualización: 2026-03-28
