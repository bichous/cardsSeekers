import type { Product } from '../types'

const img = (seed: string) => `https://picsum.photos/seed/${seed}/480/640`

export const products: Product[] = [
  // ─── POKÉMON – SELLADOS ───────────────────────────────────────────────
  {
    id: 'poke-001',
    name: 'Elite Trainer Box – Escarlata y Púrpura Base',
    franchise: 'pokemon',
    type: 'sealed',
    category: 'ETB',
    currency: 'MXN',
    images: [img('cs-p1-a'), img('cs-p1-b'), img('cs-p1-c'), img('cs-p1-d'), img('cs-p1-e')],
    description:
      'Elite Trainer Box de la expansión base Escarlata y Púrpura. Incluye 9 sobres, accesorios premium y cartas promo exclusivas. La caja perfecta para jugadores y coleccionistas.',
    featured: true,
    isNew: false,
    variants: [
      { id: 'poke-001-es', productId: 'poke-001', language: 'español', condition: 'NM', price: 49.99, stock: 8 },
      { id: 'poke-001-en', productId: 'poke-001', language: 'inglés', condition: 'NM', price: 44.99, stock: 5 },
    ],
  },
  {
    id: 'poke-002',
    name: 'Caja de Sobres Llamas Obsidianas (36 sobres)',
    franchise: 'pokemon',
    type: 'sealed',
    category: 'Booster Box',
    currency: 'MXN',
    images: [img('cs-p2-a'), img('cs-p2-b'), img('cs-p2-c'), img('cs-p2-d'), img('cs-p2-e')],
    description:
      'Caja completa de 36 sobres de Llamas Obsidianas. Contiene los nuevos Teracristal y los muy cotizados Charizard ex Special Illustration Rare. Ideal para abrir o como inversión.',
    featured: true,
    isNew: false,
    variants: [
      { id: 'poke-002-es', productId: 'poke-002', language: 'español', condition: 'NM', price: 119.99, stock: 3 },
      { id: 'poke-002-en', productId: 'poke-002', language: 'inglés', condition: 'NM', price: 109.99, stock: 6 },
      { id: 'poke-002-jp', productId: 'poke-002', language: 'japonés', condition: 'NM', price: 99.99, stock: 2 },
    ],
  },
  {
    id: 'poke-003',
    name: 'Lata Colección 151 – Venusaur ex',
    franchise: 'pokemon',
    type: 'sealed',
    category: 'Tin',
    currency: 'MXN',
    images: [img('cs-p3-a'), img('cs-p3-b'), img('cs-p3-c'), img('cs-p3-d'), img('cs-p3-e')],
    description:
      'Lata de colección especial Pokémon 151 con Venusaur ex en portada. Incluye 4 sobres de la colección 151, carta promo foil de Venusaur ex y código digital.',
    featured: false,
    isNew: false,
    variants: [
      { id: 'poke-003-es', productId: 'poke-003', language: 'español', condition: 'NM', price: 24.99, originalPrice: 29.99, stock: 12 },
      { id: 'poke-003-en', productId: 'poke-003', language: 'inglés', condition: 'NM', price: 21.99, originalPrice: 26.99, stock: 8 },
    ],
  },
  // ─── POKÉMON – CARTAS SUELTAS ─────────────────────────────────────────
  {
    id: 'poke-004',
    name: 'Pikachu ex – 085/091 Special Illustration Rare',
    franchise: 'pokemon',
    type: 'singles',
    category: 'Carta Suelta',
    currency: 'MXN',
    images: [img('cs-p4-a'), img('cs-p4-b'), img('cs-p4-c'), img('cs-p4-d'), img('cs-p4-e')],
    description:
      'Pikachu ex en rareza Special Illustration Rare. Estado Near Mint (NM), incluye protector sleeve de calidad. Pieza imprescindible para cualquier coleccionista.',
    featured: true,
    isNew: true,
    variants: [
      { id: 'poke-004-es', productId: 'poke-004', language: 'español', condition: 'NM', price: 34.99, stock: 5 },
      { id: 'poke-004-en', productId: 'poke-004', language: 'inglés', condition: 'NM', price: 29.99, stock: 3 },
      { id: 'poke-004-jp', productId: 'poke-004', language: 'japonés', condition: 'NM', price: 24.99, stock: 7 },
    ],
  },
  {
    id: 'poke-005',
    name: 'Charizard ex – 228/193 Special Illustration Rare',
    franchise: 'pokemon',
    type: 'singles',
    category: 'Carta Suelta',
    currency: 'MXN',
    images: [img('cs-p5-a'), img('cs-p5-b'), img('cs-p5-c'), img('cs-p5-d'), img('cs-p5-e')],
    description:
      'La carta más cotizada del momento. Charizard ex SIR de Llamas Obsidianas en estado Near Mint. Artwork espectacular de pantalla completa. Solo 2 unidades disponibles.',
    featured: true,
    isNew: false,
    variants: [
      { id: 'poke-005-es', productId: 'poke-005', language: 'español', condition: 'NM', price: 89.99, stock: 2 },
      { id: 'poke-005-en', productId: 'poke-005', language: 'inglés', condition: 'NM', price: 79.99, stock: 4 },
    ],
  },

  // ─── YU-GI-OH! – SELLADOS ─────────────────────────────────────────────
  {
    id: 'yugi-001',
    name: 'Estructura de Mazo – El Mago Oscuro',
    franchise: 'yugioh',
    type: 'sealed',
    category: 'Structure Deck',
    currency: 'MXN',
    images: [img('cs-y1-a'), img('cs-y1-b'), img('cs-y1-c'), img('cs-y1-d'), img('cs-y1-e')],
    description:
      'Mazo de estructura centrado en el icónico Mago Oscuro. 46 cartas, guía de juego y mini tablero. Perfecto para iniciarse en Yu-Gi-Oh! o dominar los efectos de hechicero.',
    featured: false,
    isNew: false,
    variants: [
      { id: 'yugi-001-es', productId: 'yugi-001', language: 'español', condition: 'NM', price: 11.99, stock: 15 },
      { id: 'yugi-001-en', productId: 'yugi-001', language: 'inglés', condition: 'NM', price: 10.99, stock: 10 },
    ],
  },
  {
    id: 'yugi-002',
    name: 'Caja de Sobres Pesadilla Fantasma (24 sobres)',
    franchise: 'yugioh',
    type: 'sealed',
    category: 'Booster Box',
    currency: 'MXN',
    images: [img('cs-y2-a'), img('cs-y2-b'), img('cs-y2-c'), img('cs-y2-d'), img('cs-y2-e')],
    description:
      'Caja de 24 sobres de Phantom Nightmare. Nuevas cartas para los arquetipos más populares del meta. Posibilidad de obtener Secret Rares y Collector Rares.',
    featured: true,
    isNew: true,
    variants: [
      { id: 'yugi-002-es', productId: 'yugi-002', language: 'español', condition: 'NM', price: 89.99, stock: 4 },
      { id: 'yugi-002-en', productId: 'yugi-002', language: 'inglés', condition: 'NM', price: 84.99, stock: 7 },
    ],
  },
  {
    id: 'yugi-003',
    name: 'Colección Legendaria – 25 Aniversario',
    franchise: 'yugioh',
    type: 'sealed',
    category: 'Colección',
    currency: 'MXN',
    images: [img('cs-y3-a'), img('cs-y3-b'), img('cs-y3-c'), img('cs-y3-d'), img('cs-y3-e')],
    description:
      'Edición especial del 25 aniversario con reimpresiones de las cartas más icónicas de la historia del juego. Incluye 5 sobres de expansiones clásicas y carta ultra rara exclusiva.',
    featured: true,
    isNew: false,
    variants: [
      { id: 'yugi-003-es', productId: 'yugi-003', language: 'español', condition: 'NM', price: 44.99, stock: 6 },
      { id: 'yugi-003-en', productId: 'yugi-003', language: 'inglés', condition: 'NM', price: 39.99, stock: 3 },
    ],
  },
  // ─── YU-GI-OH! – CARTAS SUELTAS ──────────────────────────────────────
  {
    id: 'yugi-004',
    name: 'Dragón Blanco de Ojos Azules – LDK2 Secret Rare',
    franchise: 'yugioh',
    type: 'singles',
    category: 'Carta Suelta',
    currency: 'MXN',
    images: [img('cs-y4-a'), img('cs-y4-b'), img('cs-y4-c'), img('cs-y4-d'), img('cs-y4-e')],
    description:
      'Dragón Blanco de Ojos Azules Secret Rare de Legendary Decks II. Condición Near Mint con el artwork original clásico. El monstruo más emblemático de la franquicia.',
    featured: false,
    isNew: false,
    variants: [
      { id: 'yugi-004-es', productId: 'yugi-004', language: 'español', condition: 'NM', price: 29.99, stock: 3 },
      { id: 'yugi-004-en', productId: 'yugi-004', language: 'inglés', condition: 'NM', price: 24.99, stock: 5 },
    ],
  },
  {
    id: 'yugi-005',
    name: 'Maxx "C" – BLTR Secret Rare',
    franchise: 'yugioh',
    type: 'singles',
    category: 'Carta Suelta',
    currency: 'MXN',
    images: [img('cs-y5-a'), img('cs-y5-b'), img('cs-y5-c'), img('cs-y5-d'), img('cs-y5-e')],
    description:
      'Maxx "C" Secret Rare de Battles of Legend: Terminal Revenge. Una de las cartas más jugadas históricamente. Estado Near Mint, indispensable en mazos competitivos.',
    featured: false,
    isNew: true,
    variants: [
      { id: 'yugi-005-es', productId: 'yugi-005', language: 'español', condition: 'NM', price: 19.99, stock: 9 },
      { id: 'yugi-005-en', productId: 'yugi-005', language: 'inglés', condition: 'NM', price: 17.99, stock: 6 },
    ],
  },

  // ─── ONE PIECE – SELLADOS ─────────────────────────────────────────────
  {
    id: 'onep-001',
    name: 'Mazo Inicial ST-01 – Monkey D. Luffy',
    franchise: 'onepiece',
    type: 'sealed',
    category: 'Starter Deck',
    currency: 'MXN',
    images: [img('cs-o1-a'), img('cs-o1-b'), img('cs-o1-c'), img('cs-o1-d'), img('cs-o1-e')],
    description:
      'Mazo de inicio oficial del TCG de One Piece centrado en Luffy. 51 cartas, contador de daño, guía de inicio rápido y tarjeta líder Don!! exclusiva.',
    featured: false,
    isNew: false,
    variants: [
      { id: 'onep-001-es', productId: 'onep-001', language: 'español', condition: 'NM', price: 12.99, stock: 20 },
      { id: 'onep-001-en', productId: 'onep-001', language: 'inglés', condition: 'NM', price: 11.99, stock: 15 },
      { id: 'onep-001-jp', productId: 'onep-001', language: 'japonés', condition: 'NM', price: 9.99, stock: 10 },
    ],
  },
  {
    id: 'onep-002',
    name: 'Caja de Sobres OP-03 – Pilares de Fuerza (24 sobres)',
    franchise: 'onepiece',
    type: 'sealed',
    category: 'Booster Box',
    currency: 'MXN',
    images: [img('cs-o2-a'), img('cs-o2-b'), img('cs-o2-c'), img('cs-o2-d'), img('cs-o2-e')],
    description:
      'Caja completa de 24 sobres del set Pillars of Strength. Personajes de Dressrosa y Wano. Alta probabilidad de conseguir Secret Rares y Alternate Art.',
    featured: true,
    isNew: false,
    variants: [
      { id: 'onep-002-es', productId: 'onep-002', language: 'español', condition: 'NM', price: 79.99, stock: 5 },
      { id: 'onep-002-en', productId: 'onep-002', language: 'inglés', condition: 'NM', price: 74.99, stock: 8 },
      { id: 'onep-002-jp', productId: 'onep-002', language: 'japonés', condition: 'NM', price: 64.99, stock: 4 },
    ],
  },
  {
    id: 'onep-003',
    name: 'Caja de Sobres OP-08 – Dos Leyendas (24 sobres)',
    franchise: 'onepiece',
    type: 'sealed',
    category: 'Booster Box',
    currency: 'MXN',
    images: [img('cs-o3-a'), img('cs-o3-b'), img('cs-o3-c'), img('cs-o3-d'), img('cs-o3-e')],
    description:
      'El set más esperado del año. Two Legends presenta a Shanks y Barba Blanca con artes exclusivas. Carta líder Shanks Special Rare incluida. Solo 2 cajas disponibles.',
    featured: true,
    isNew: true,
    variants: [
      { id: 'onep-003-es', productId: 'onep-003', language: 'español', condition: 'NM', price: 94.99, stock: 2 },
      { id: 'onep-003-en', productId: 'onep-003', language: 'inglés', condition: 'NM', price: 89.99, stock: 3 },
      { id: 'onep-003-jp', productId: 'onep-003', language: 'japonés', condition: 'NM', price: 79.99, stock: 1 },
    ],
  },
  // ─── ONE PIECE – CARTAS SUELTAS ───────────────────────────────────────
  {
    id: 'onep-004',
    name: 'Monkey D. Luffy – OP-01 Líder Parallel',
    franchise: 'onepiece',
    type: 'singles',
    category: 'Carta Suelta',
    currency: 'MXN',
    images: [img('cs-o4-a'), img('cs-o4-b'), img('cs-o4-c'), img('cs-o4-d'), img('cs-o4-e')],
    description:
      'Carta líder de Monkey D. Luffy del set Romance Dawn en versión Parallel Art. Indispensable para cualquier mazo Luffy competitivo. Estado Near Mint, sleeve incluido.',
    featured: false,
    isNew: false,
    variants: [
      { id: 'onep-004-es', productId: 'onep-004', language: 'español', condition: 'NM', price: 14.99, stock: 7 },
      { id: 'onep-004-en', productId: 'onep-004', language: 'inglés', condition: 'NM', price: 12.99, stock: 5 },
      { id: 'onep-004-jp', productId: 'onep-004', language: 'japonés', condition: 'NM', price: 10.99, stock: 9 },
    ],
  },
  {
    id: 'onep-005',
    name: 'Nico Robin – OP-02 SEC Secret Rare',
    franchise: 'onepiece',
    type: 'singles',
    category: 'Carta Suelta',
    currency: 'MXN',
    images: [img('cs-o5-a'), img('cs-o5-b'), img('cs-o5-c'), img('cs-o5-d'), img('cs-o5-e')],
    description:
      'Nico Robin Secret Rare del set Paramount War. Una de las cartas más buscadas por coleccionistas. Artwork exclusivo de pantalla completa. Near Mint. ¡Solo 1 unidad!',
    featured: true,
    isNew: false,
    variants: [
      { id: 'onep-005-es', productId: 'onep-005', language: 'español', condition: 'NM', price: 49.99, stock: 1 },
      { id: 'onep-005-en', productId: 'onep-005', language: 'inglés', condition: 'NM', price: 44.99, stock: 2 },
      { id: 'onep-005-jp', productId: 'onep-005', language: 'japonés', condition: 'NM', price: 39.99, stock: 3 },
    ],
  },
]

export const getFeaturedProducts = () => products.filter((p) => p.featured)
export const getProductsByFranchise = (franchise: string) =>
  products.filter((p) => p.franchise === franchise)
export const getProductById = (id: string) => products.find((p) => p.id === id)
