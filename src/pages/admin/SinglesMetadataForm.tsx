import {
  SimpleGrid,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  NumberInput,
  NumberInputField,
  Divider,
  Text,
  Box,
  HStack,
  InputGroup,
  InputLeftElement,
  Spinner,
  Badge,
} from '@chakra-ui/react'
import { useState, useEffect, useRef } from 'react'
import { FiSearch, FiX } from 'react-icons/fi'

export interface SinglesMeta {
  // Yu-Gi-Oh
  expansion?: string
  rarity?: string
  attribute?: string
  monsterType?: string
  level?: string
  atk?: string
  def?: string
  numberES?: string
  numberEN?: string
  // Pokémon
  cardNumber?: string
  cardType?: string
  hp?: string
  stage?: string
  cardText?: string
  artist?: string
  // One Piece
  color?: string
  cost?: string
  power?: string
  subtypes?: string
  number?: string
}

// ── Open TCG API (tcgtracking.com) ─────────────────────────────────────────

const TCG_BASE = 'https://tcgtracking.com/tcgapi/v1'
const TCG_CAT: Record<string, number> = { yugioh: 2, pokemon: 3, onepiece: 68 }

interface TCGSet { id: number; name: string; abbr?: string }
interface TCGProduct {
  id: number; name: string; set_name: string; set_abbr?: string
  number?: string; rarity?: string; image_url?: string; finishes?: string[]
}

async function searchTCGSets(query: string, catId: number): Promise<TCGSet[]> {
  const res = await fetch(`${TCG_BASE}/${catId}/search?q=${encodeURIComponent(query.trim())}`)
  if (!res.ok) { console.warn(`Open TCG search error ${res.status}`); return [] }
  const data = await res.json()
  return Array.isArray(data) ? data : (data.sets ?? data.data ?? [])
}

async function fetchTCGProducts(catId: number, setId: number): Promise<TCGProduct[]> {
  const res = await fetch(`${TCG_BASE}/${catId}/sets/${setId}`)
  if (!res.ok) { console.warn(`Open TCG products error ${res.status}`); return [] }
  const data = await res.json()
  return Array.isArray(data) ? data : (data.products ?? data.data ?? [])
}

// ── YuGiOh API (ygoprodeck.com) ─────────────────────────────────────────────

interface YGOCard {
  name: string; type: string; race: string; attribute?: string
  level?: number; atk?: number; def?: number
  card_images?: Array<{ image_url: string; image_url_small: string }>
  card_sets?: Array<{ set_name: string; set_code: string; set_rarity: string }>
}

async function searchYGO(query: string): Promise<YGOCard[]> {
  const [namePart, setPart] = query.split(/\s+-\s+/)
  const url = new URL('https://db.ygoprodeck.com/api/v7/cardinfo.php')
  url.searchParams.set('fname', namePart.trim())
  url.searchParams.set('num', '8')
  url.searchParams.set('offset', '0')
  if (setPart?.trim()) url.searchParams.set('cardset', setPart.trim())
  const res = await fetch(url.toString())
  if (!res.ok) return []
  const data = await res.json()
  return data.data ?? []
}

// ── Pokémon TCG API (pokemontcg.io) ─────────────────────────────────────────

interface PokemonCard {
  name: string; supertype: string; subtypes?: string[]
  hp?: string; number: string; artist?: string; rarity?: string
  set: { id: string; name: string; series: string; total: number; printedTotal?: number; ptcgoCode?: string }
  images?: { small: string; large: string }
  abilities?: Array<{ name: string; text: string }>
  attacks?: Array<{ name: string; text: string; damage: string }>
}

function buildPokemonQuery(query: string): string {
  const match = query.trim().match(/^(.*?)\s+(\d+)(?:\s+(.*))?$/)
  if (match && match[1].trim()) {
    const name = match[1].trim()
    const number = match[2].replace(/^0+(?=\d)/, '')
    const setHint = (match[3] ?? '').replace(/\bpokemon\b/gi, '').trim()
    const parts = [`name:"${name}*"`, `number:${number}`]
    if (setHint) parts.push(`set.name:"*${setHint}*"`)
    return parts.join(' ')
  }
  return `name:"${query.trim()}*"`
}

async function searchPokemon(query: string): Promise<PokemonCard[]> {
  const q = buildPokemonQuery(query)
  const res = await fetch(
    `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(q)}&pageSize=8&select=name,supertype,subtypes,hp,number,artist,rarity,set,abilities,attacks,images`
  )
  if (!res.ok) return []
  const data = await res.json()
  return data.data ?? []
}

// ── Mappers ──────────────────────────────────────────────────────────────────

function mapTCGTracking(product: TCGProduct, franchise: string, existing: SinglesMeta, setName?: string): SinglesMeta {
  // set_name puede venir undefined de la API — usar setName del set seleccionado como fallback
  const expansion = setName || product.set_name || existing.expansion
  const base = { ...existing, expansion, rarity: product.rarity ?? existing.rarity }
  if (franchise === 'yugioh') return { ...base, numberEN: product.number ?? existing.numberEN }
  if (franchise === 'pokemon') return { ...base, cardNumber: product.number ?? existing.cardNumber }
  return { ...base, number: product.number ?? existing.number }
}

function mapYGO(card: YGOCard, existing: SinglesMeta): SinglesMeta {
  const firstSet = card.card_sets?.[0]
  return {
    ...existing,
    expansion: firstSet?.set_name ?? existing.expansion,
    rarity: firstSet?.set_rarity ?? existing.rarity,
    numberEN: firstSet?.set_code ?? existing.numberEN,
    attribute: card.attribute ?? existing.attribute,
    monsterType: card.race && card.type ? `${card.race} / ${card.type}` : card.type ?? existing.monsterType,
    level: card.level != null ? String(card.level) : existing.level,
    atk: card.atk != null ? String(card.atk) : existing.atk,
    def: card.def != null ? String(card.def) : existing.def,
  }
}

function mapPokemon(card: PokemonCard, existing: SinglesMeta): SinglesMeta {
  const STAGES = ['Basic', 'Stage 1', 'Stage 2', 'V', 'VMAX', 'VSTAR', 'ex', 'EX', 'GX']
  const stage = card.subtypes?.find((s) => STAGES.includes(s)) ?? ''
  const allText = [
    ...(card.abilities ?? []).map((a) => `[Ability] ${a.name}: ${a.text}`),
    ...(card.attacks ?? []).map((a) => `${a.name}${a.damage ? ` (${a.damage})` : ''}: ${a.text}`),
  ].join('\n\n')
  const normalizedSupertype = card.supertype?.normalize('NFC') ?? ''
  const cardType = normalizedSupertype.includes('Pok') ? 'Pokémon'
    : normalizedSupertype === 'Trainer' ? 'Trainer'
    : normalizedSupertype === 'Energy' ? 'Energy'
    : existing.cardType ?? ''
  return {
    ...existing,
    expansion: card.set.name,
    cardNumber: `${card.number}/${card.set.total}`,
    rarity: card.rarity ?? existing.rarity,
    cardType, hp: card.hp ?? existing.hp, stage,
    artist: card.artist ?? existing.artist,
    cardText: allText || existing.cardText,
  }
}

// Enriquecimiento para modo "por set": Open TCG no trae hp/stage/cardType/cardText
function enrichWithPokemon(card: PokemonCard, existing: SinglesMeta): SinglesMeta {
  const STAGES = ['Basic', 'Stage 1', 'Stage 2', 'V', 'VMAX', 'VSTAR', 'ex', 'EX', 'GX']
  const stage = card.subtypes?.find((s) => STAGES.includes(s)) ?? ''
  const allText = [
    ...(card.abilities ?? []).map((a) => `[Ability] ${a.name}: ${a.text}`),
    ...(card.attacks ?? []).map((a) => `${a.name}${a.damage ? ` (${a.damage})` : ''}: ${a.text}`),
  ].join('\n\n')
  const normalizedSupertype = card.supertype?.normalize('NFC') ?? ''
  const cardType = normalizedSupertype.includes('Pok') ? 'Pokémon'
    : normalizedSupertype === 'Trainer' ? 'Trainer'
    : normalizedSupertype === 'Energy' ? 'Energy'
    : existing.cardType ?? ''
  return { ...existing, cardType, hp: card.hp ?? existing.hp, stage, artist: card.artist ?? existing.artist, cardText: allText || existing.cardText }
}

async function fetchPokemonDetails(name: string, number?: string): Promise<PokemonCard | null> {
  const cardNumber = number ? number.split('/')[0].replace(/^0+(?=\d)/, '') : null
  const parts = [`name:"${name.trim()}"`]
  if (cardNumber) parts.push(`number:${cardNumber}`)
  // set.name not used — colons in set names (e.g. "SV10: Destined Rivals") break Lucene query syntax
  const res = await fetch(
    `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(parts.join(' '))}&pageSize=4&select=name,supertype,subtypes,hp,number,artist,rarity,set,abilities,attacks,images`
  )
  if (!res.ok) return null
  const data = await res.json()
  return (data.data?.[0] as PokemonCard) ?? null
}

// ── Product name builders ────────────────────────────────────────────────────

function buildYGOProductName(card: YGOCard): string {
  const firstSet = card.card_sets?.[0]
  if (!firstSet) return card.name
  return [card.name, firstSet.set_rarity, firstSet.set_name].filter(Boolean).join(' - ')
}

async function enrichWithYGO(cardName: string, existing: SinglesMeta): Promise<SinglesMeta> {
  const url = new URL('https://db.ygoprodeck.com/api/v7/cardinfo.php')
  url.searchParams.set('name', cardName)
  const res = await fetch(url.toString())
  if (!res.ok) return existing
  const data = await res.json()
  const card: YGOCard | undefined = data.data?.[0]
  if (!card) return existing
  return {
    ...existing,
    attribute: card.attribute ?? existing.attribute,
    monsterType: card.race && card.type ? `${card.race} / ${card.type}` : card.type ?? existing.monsterType,
    level: card.level != null ? String(card.level) : existing.level,
    atk: card.atk != null ? String(card.atk) : existing.atk,
    def: card.def != null ? String(card.def) : existing.def,
  }
}

function buildPokemonProductName(card: PokemonCard): string {
  const total = card.set.printedTotal ?? card.set.total
  const seriesCode = card.set.id.match(/^[a-z]+/)?.[0].toUpperCase() ?? ''
  const setCode = card.set.ptcgoCode ? ` (${card.set.ptcgoCode})` : ''
  const seriesPart = seriesCode ? `${seriesCode}: ${card.set.series} ` : `${card.set.series} `
  return `${card.name} - ${card.number}/${total} - ${seriesPart}${card.set.name}${setCode}`
}

// ── SearchResult ─────────────────────────────────────────────────────────────

type SearchResult =
  | { name: string; subtitle: string; raw: TCGSet; source: 'set' }
  | { name: string; subtitle: string; raw: TCGProduct; source: 'card' }
  | { name: string; subtitle: string; raw: YGOCard; source: 'yugioh' }
  | { name: string; subtitle: string; raw: PokemonCard; source: 'pokemon' }

// ── Constants ────────────────────────────────────────────────────────────────

const INPUT_PROPS = { bg: '#161616' as const, borderColor: '#2a2a2a' as const, color: 'white' as const, size: 'sm' as const }
const LABEL_PROPS = { fontSize: '11px' as const, color: 'gray.500' as const, mb: 1 }

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  franchise: string
  meta: SinglesMeta
  onChange: (meta: SinglesMeta) => void
  onCardSelect?: (name: string, category: string, imageUrls: string[]) => void
}

export function SinglesMetadataForm({ franchise, meta, onChange, onCardSelect }: Props) {
  const setField = (field: keyof SinglesMeta, value: string) => onChange({ ...meta, [field]: value })

  const catId = TCG_CAT[franchise]

  // "por-set": Open TCG (set → carta) | "por-carta": API directa por nombre
  // One Piece solo tiene "por-set"
  const [searchMode, setSearchMode] = useState<'por-set' | 'por-carta'>('por-set')

  // Estado del flujo "por-set"
  const [phase, setPhase] = useState<'set' | 'card'>('set')
  const [selectedSet, setSelectedSet] = useState<TCGSet | null>(null)
  const [cardPool, setCardPool] = useState<TCGProduct[]>([])
  const [poolLoading, setPoolLoading] = useState(false)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [variantPrintings, setVariantPrintings] = useState<string[]>([])

  const containerRef = useRef<HTMLDivElement>(null)
  const justSelectedRef = useRef(false)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Reset completo al cambiar franquicia
  useEffect(() => {
    setSearchMode('por-set')
    setPhase('set')
    setSelectedSet(null)
    setCardPool([])
    setQuery('')
    setResults([])
    setShowDropdown(false)
    setVariantPrintings([])
  }, [franchise])

  // Reset de búsqueda al cambiar modo
  const switchMode = (mode: 'por-set' | 'por-carta') => {
    setSearchMode(mode)
    setPhase('set')
    setSelectedSet(null)
    setCardPool([])
    setQuery('')
    setResults([])
    setShowDropdown(false)
  }

  // Búsqueda con debounce
  useEffect(() => {
    if (justSelectedRef.current) { justSelectedRef.current = false; return }
    if (query.length < 2) { setResults([]); setShowDropdown(false); return }

    // Modo por-set, fase carta: filtrar pool en el cliente
    if (searchMode === 'por-set' && phase === 'card') {
      const q = query.toLowerCase()
      const filtered = cardPool
        .filter((p) => p.name.toLowerCase().includes(q) || p.number?.toLowerCase().includes(q))
        .slice(0, 10)
        .map((p): SearchResult => ({
          name: p.name,
          subtitle: [p.number, p.rarity].filter(Boolean).join(' · '),
          raw: p, source: 'card',
        }))
      setResults(filtered)
      setShowDropdown(filtered.length > 0)
      return
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        let data: SearchResult[] = []

        if (searchMode === 'por-set') {
          // Fase set: buscar sets en Open TCG API
          if (!catId) return
          const sets = await searchTCGSets(query, catId)
          data = sets.map((s): SearchResult => ({
            name: s.name, subtitle: s.abbr ? `(${s.abbr})` : '', raw: s, source: 'set',
          }))
        } else if (franchise === 'yugioh') {
          const cards = await searchYGO(query)
          data = cards.map((c): SearchResult => ({
            name: c.name,
            subtitle: `${c.type} · ${c.card_sets?.[0]?.set_name ?? '—'}`,
            raw: c, source: 'yugioh',
          }))
        } else {
          // pokemon, modo por-carta
          const cards = await searchPokemon(query)
          data = cards.map((c): SearchResult => ({
            name: c.name,
            subtitle: `${c.set.name} · ${c.number} · ${c.rarity ?? ''}`,
            raw: c, source: 'pokemon',
          }))
        }

        setResults(data)
        setShowDropdown(true)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [query, searchMode, phase, cardPool, catId, franchise])

  const resetSet = () => {
    setPhase('set')
    setSelectedSet(null)
    setCardPool([])
    setQuery('')
    setResults([])
    setShowDropdown(false)
    setVariantPrintings([])
  }

  const handleSelect = (result: SearchResult) => {
    // Set seleccionado → cargar cartas del set
    if (result.source === 'set') {
      const tcgSet = result.raw as TCGSet
      setSelectedSet(tcgSet)
      setPhase('card')
      setQuery('')
      setShowDropdown(false)
      setResults([])
      setPoolLoading(true)
      fetchTCGProducts(catId!, tcgSet.id)
        .then((products) => setCardPool(products))
        .catch(() => setCardPool([]))
        .finally(() => setPoolLoading(false))
      return
    }

    let updated: SinglesMeta
    let productName: string
    let category: string
    let imageUrls: string[] = []

    if (result.source === 'card') {
      // Carta de Open TCG (modo por-set)
      const product = result.raw as TCGProduct
      // selectedSet siempre existe cuando source === 'card'
      const setName = selectedSet!.name
      setVariantPrintings([...new Set((product.finishes ?? []).filter(Boolean))])
      updated = mapTCGTracking(product, franchise, meta, setName)
      // product.name ya incluye el número (ej: "Team Rocket's Mewtwo ex - 240/182")
      // así que el nombre del producto es: "{product.name} - {setName}"
      productName = `${product.name} - ${setName}`
      category = setName
      if (product.image_url) imageUrls = [product.image_url]

      // Enriquecer Pokémon con hp/stage/cardType/cardText
      if (franchise === 'pokemon') {
        const base = updated
        // Extraer nombre limpio sin el número para que matchee en la Pokémon TCG API
        const cleanName = product.name.replace(/\s*-\s*\d+(?:\/\d+)?\s*$/, '').trim()
        fetchPokemonDetails(cleanName, product.number)
          .then((details) => {
            if (!details) return
            const enriched = enrichWithPokemon(details, base)
            const extra: string[] = []
            if (details.images?.large) extra.push(details.images.large)
            if (details.images?.small) extra.push(details.images.small)
            onChange(enriched)
            if (extra.length > 0) onCardSelect?.(productName, category, extra)
          })
          .catch(() => {})
      }

      // Enriquecer YuGiOh con attribute/monsterType/level/atk/def desde YGOPro
      if (franchise === 'yugioh') {
        const base = updated
        // Extraer nombre limpio quitando el número (ej: "Dark Magician - LOB-EN005" → "Dark Magician")
        const cleanName = product.number
          ? product.name.replace(` - ${product.number}`, '').trim()
          : product.name.replace(/\s*-\s*[A-Z]{2,}[0-9A-Z-]*\d+\s*$/, '').trim()
        // Nombre del producto: Nombre - rareza - expansión
        productName = [cleanName, product.rarity, setName].filter(Boolean).join(' - ')
        enrichWithYGO(cleanName, base)
          .then((enriched) => { onChange(enriched) })
          .catch(() => {})
      }
    } else if (result.source === 'yugioh') {
      const card = result.raw as YGOCard
      updated = mapYGO(card, meta)
      productName = buildYGOProductName(card)
      category = card.card_sets?.[0]?.set_name ?? ''
      imageUrls = card.card_images?.map((img) => img.image_url) ?? []
    } else {
      // pokemon directo
      const card = result.raw as PokemonCard
      updated = mapPokemon(card, meta)
      productName = buildPokemonProductName(card)
      category = card.set.name
      if (card.images?.large) imageUrls = [card.images.large]
      if (card.images?.small) imageUrls.push(card.images.small)
    }

    onChange(updated)
    onCardSelect?.(productName, category, imageUrls)
    justSelectedRef.current = true
    setQuery(result.name)
    setShowDropdown(false)
    setResults([])
  }

  if (!catId) return null

  const canSearchByCard = franchise === 'yugioh' || franchise === 'pokemon'

  const searchLabel = searchMode === 'por-carta'
    ? 'Buscar carta para autocompletar'
    : phase === 'set'
      ? 'Buscar set para autocompletar'
      : `Buscar carta en: ${selectedSet?.name}`

  const searchPlaceholder = searchMode === 'por-carta'
    ? franchise === 'yugioh'
      ? 'Dark Magician  ó  Blue-Eyes - LOB'
      : 'Pikachu  ó  Pikachu 060  ó  Pikachu 060 151'
    : phase === 'set'
      ? franchise === 'yugioh' ? 'Rage of the Abyss, Phantom Nightmare...'
        : franchise === 'pokemon' ? 'Scarlet & Violet 151, Obsidian Flames...'
        : 'Romance Dawn, Two Legends...'
      : 'Nombre de la carta...'

  return (
    <>
      <Divider borderColor="#1e1e1e" my={4} />
      <Text fontSize="12px" color="gray.500" fontWeight={600} textTransform="uppercase" letterSpacing="0.1em" mb={3}>
        Datos de la carta
      </Text>

      {/* ── Autocomplete ─────────────────────────────────────────────────── */}
      <Box position="relative" mb={4} ref={containerRef}>
        <HStack justify="space-between" mb={2}>
          <Text fontSize="11px" color="brand.400" fontWeight={600} textTransform="uppercase" letterSpacing="0.1em">
            {searchLabel}
          </Text>
          {/* Toggle por-set / por-carta — solo Pokémon y YuGiOh */}
          {canSearchByCard && (
            <HStack spacing={0} border="1px solid #2a2a2a" borderRadius="md" overflow="hidden">
              {(['por-set', 'por-carta'] as const).map((mode) => (
                <Box
                  key={mode}
                  px={2}
                  py="2px"
                  fontSize="10px"
                  fontWeight={600}
                  cursor="pointer"
                  bg={searchMode === mode ? 'brand.400' : 'transparent'}
                  color={searchMode === mode ? '#000' : 'gray.500'}
                  onClick={() => switchMode(mode)}
                  _hover={{ color: searchMode === mode ? '#000' : 'gray.300' }}
                  textTransform="uppercase"
                  letterSpacing="0.05em"
                >
                  {mode === 'por-set' ? 'Por set' : 'Por carta'}
                </Box>
              ))}
            </HStack>
          )}
        </HStack>

        {/* Badge set seleccionado (modo por-set, fase carta) */}
        {searchMode === 'por-set' && phase === 'card' && selectedSet && (
          <Box
            display="inline-flex" alignItems="center" gap={1}
            bg="#1e1e1e" border="1px solid #2a2a2a" borderRadius="md"
            px={2} py={1} mb={2} cursor="pointer" onClick={resetSet} _hover={{ borderColor: '#555' }}
          >
            <Text fontSize="11px" color="gray.400">{selectedSet.name}</Text>
            <Box as={FiX} size={11} color="gray.500" />
          </Box>
        )}

        <InputGroup size="sm">
          <InputLeftElement pointerEvents="none" pl={1}>
            {searching || poolLoading
              ? <Spinner size="xs" color="brand.400" />
              : <FiSearch color="#666" size={13} />
            }
          </InputLeftElement>
          <Input {...INPUT_PROPS} pl="30px" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={searchPlaceholder} />
        </InputGroup>

        {showDropdown && results.length > 0 && (
          <Box
            position="absolute" top="100%" left={0} right={0} mt={1}
            bg="#1a1a1a" border="1px solid #2a2a2a" borderRadius="lg"
            zIndex={200} maxH="220px" overflowY="auto" boxShadow="0 8px 32px rgba(0,0,0,0.6)"
          >
            {results.map((r, i) => (
              <Box
                key={i} px={3} py={2} cursor="pointer" _hover={{ bg: '#252525' }}
                borderBottom={i < results.length - 1 ? '1px solid #222' : 'none'}
                onMouseDown={() => handleSelect(r)}
              >
                <Text fontSize="13px" color="white" fontWeight={500}>{r.name}</Text>
                {r.subtitle && <Text fontSize="11px" color="gray.600" noOfLines={1}>{r.subtitle}</Text>}
              </Box>
            ))}
          </Box>
        )}

        {query.length >= 2 && !searching && !poolLoading && results.length === 0 && showDropdown && (
          <Box
            position="absolute" top="100%" left={0} right={0} mt={1}
            bg="#1a1a1a" border="1px solid #2a2a2a" borderRadius="lg" zIndex={200} px={3} py={3}
          >
            <Text fontSize="12px" color="gray.600">Sin resultados para "{query}"</Text>
          </Box>
        )}
      </Box>

      {/* ── Yu-Gi-Oh ─────────────────────────────────────────────────────── */}
      {franchise === 'yugioh' && (
        <SimpleGrid columns={2} spacing={3}>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Expansion</FormLabel>
            <Input {...INPUT_PROPS} value={meta.expansion ?? ''} onChange={(e) => setField('expansion', e.target.value)} placeholder="Phantom Nightmare" />
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Rarity</FormLabel>
            {variantPrintings.length > 0 ? (
              <Select {...INPUT_PROPS} value={meta.rarity ?? ''} onChange={(e) => setField('rarity', e.target.value)}>
                <option value="">—</option>
                {variantPrintings.map((p) => <option key={p} value={p}>{p}</option>)}
              </Select>
            ) : (
              <Input {...INPUT_PROPS} value={meta.rarity ?? ''} onChange={(e) => setField('rarity', e.target.value)} placeholder="Secret Rare" />
            )}
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Attribute</FormLabel>
            <Select {...INPUT_PROPS} value={meta.attribute ?? ''} onChange={(e) => setField('attribute', e.target.value)}>
              <option value="">—</option>
              {['DARK', 'LIGHT', 'EARTH', 'WATER', 'FIRE', 'WIND', 'DIVINE'].map((a) => <option key={a} value={a}>{a}</option>)}
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Monster Type / Card Type</FormLabel>
            <Input {...INPUT_PROPS} value={meta.monsterType ?? ''} onChange={(e) => setField('monsterType', e.target.value)} placeholder="Dragon / Effect" />
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Level</FormLabel>
            <NumberInput size="sm" min={0} max={12} value={meta.level ?? ''} onChange={(v) => setField('level', v)}>
              <NumberInputField {...INPUT_PROPS} />
            </NumberInput>
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>ATK / DEF</FormLabel>
            <SimpleGrid columns={2} spacing={2}>
              <Input {...INPUT_PROPS} placeholder="ATK" value={meta.atk ?? ''} onChange={(e) => setField('atk', e.target.value)} />
              <Input {...INPUT_PROPS} placeholder="DEF" value={meta.def ?? ''} onChange={(e) => setField('def', e.target.value)} />
            </SimpleGrid>
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>
              Number (Español)
              <Badge ml={2} fontSize="9px" bg="#1e1e1e" color="gray.500" fontWeight={400}>manual</Badge>
            </FormLabel>
            <Input {...INPUT_PROPS} value={meta.numberES ?? ''} onChange={(e) => setField('numberES', e.target.value)} placeholder="BLTR-SP034" />
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Number (Inglés)</FormLabel>
            <Input {...INPUT_PROPS} value={meta.numberEN ?? ''} onChange={(e) => setField('numberEN', e.target.value)} placeholder="BLTR-EN034" />
          </FormControl>
        </SimpleGrid>
      )}

      {/* ── Pokémon ──────────────────────────────────────────────────────── */}
      {franchise === 'pokemon' && (
        <SimpleGrid columns={2} spacing={3}>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Expansion</FormLabel>
            <Input {...INPUT_PROPS} value={meta.expansion ?? ''} onChange={(e) => setField('expansion', e.target.value)} placeholder="Obsidian Flames" />
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Card Number</FormLabel>
            <Input {...INPUT_PROPS} value={meta.cardNumber ?? ''} onChange={(e) => setField('cardNumber', e.target.value)} placeholder="228/193" />
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Rarity</FormLabel>
            {variantPrintings.length > 0 ? (
              <Select {...INPUT_PROPS} value={meta.rarity ?? ''} onChange={(e) => setField('rarity', e.target.value)}>
                <option value="">—</option>
                {variantPrintings.map((p) => <option key={p} value={p}>{p}</option>)}
              </Select>
            ) : (
              <Input {...INPUT_PROPS} value={meta.rarity ?? ''} onChange={(e) => setField('rarity', e.target.value)} placeholder="Special Illustration Rare" />
            )}
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Card Type</FormLabel>
            <Select {...INPUT_PROPS} value={meta.cardType ?? ''} onChange={(e) => setField('cardType', e.target.value)}>
              <option value="">—</option>
              {['Pokémon', 'Trainer', 'Energy'].map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>HP</FormLabel>
            <Input {...INPUT_PROPS} value={meta.hp ?? ''} onChange={(e) => setField('hp', e.target.value)} placeholder="60" />
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Stage</FormLabel>
            <Select {...INPUT_PROPS} value={meta.stage ?? ''} onChange={(e) => setField('stage', e.target.value)}>
              <option value="">—</option>
              {['Basic', 'Stage 1', 'Stage 2', 'V', 'VMAX', 'VSTAR', 'ex', 'EX', 'GX'].map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </FormControl>
          <FormControl gridColumn="1 / -1">
            <FormLabel {...LABEL_PROPS}>Card Text</FormLabel>
            <Textarea {...INPUT_PROPS} rows={3} value={meta.cardText ?? ''} onChange={(e) => setField('cardText', e.target.value)} placeholder="Texto de habilidades y ataques..." />
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Artist</FormLabel>
            <Input {...INPUT_PROPS} value={meta.artist ?? ''} onChange={(e) => setField('artist', e.target.value)} placeholder="5ban Graphics" />
          </FormControl>
        </SimpleGrid>
      )}

      {/* ── One Piece ────────────────────────────────────────────────────── */}
      {franchise === 'onepiece' && (
        <SimpleGrid columns={2} spacing={3}>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Expansion</FormLabel>
            <Input {...INPUT_PROPS} value={meta.expansion ?? ''} onChange={(e) => setField('expansion', e.target.value)} placeholder="Two Legends" />
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Rarity</FormLabel>
            {variantPrintings.length > 0 ? (
              <Select {...INPUT_PROPS} value={meta.rarity ?? ''} onChange={(e) => setField('rarity', e.target.value)}>
                <option value="">—</option>
                {variantPrintings.map((p) => <option key={p} value={p}>{p}</option>)}
              </Select>
            ) : (
              <Input {...INPUT_PROPS} value={meta.rarity ?? ''} onChange={(e) => setField('rarity', e.target.value)} placeholder="C / UC / R / SR / L / SEC" />
            )}
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Number</FormLabel>
            <Input {...INPUT_PROPS} value={meta.number ?? ''} onChange={(e) => setField('number', e.target.value)} placeholder="OP08-001" />
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Color</FormLabel>
            <Select {...INPUT_PROPS} value={meta.color ?? ''} onChange={(e) => setField('color', e.target.value)}>
              <option value="">—</option>
              {['Red', 'Green', 'Blue', 'Purple', 'Black', 'Yellow', 'Multicolor'].map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Card Type</FormLabel>
            <Select {...INPUT_PROPS} value={meta.cardType ?? ''} onChange={(e) => setField('cardType', e.target.value)}>
              <option value="">—</option>
              {['Character', 'Event', 'Stage', 'Leader', 'Don!!'].map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Cost</FormLabel>
            <Input {...INPUT_PROPS} value={meta.cost ?? ''} onChange={(e) => setField('cost', e.target.value)} placeholder="5" />
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Power</FormLabel>
            <Input {...INPUT_PROPS} value={meta.power ?? ''} onChange={(e) => setField('power', e.target.value)} placeholder="6000" />
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Subtype(s)</FormLabel>
            <Input {...INPUT_PROPS} value={meta.subtypes ?? ''} onChange={(e) => setField('subtypes', e.target.value)} placeholder="Straw Hat Crew" />
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Attribute</FormLabel>
            <Select {...INPUT_PROPS} value={meta.attribute ?? ''} onChange={(e) => setField('attribute', e.target.value)}>
              <option value="">—</option>
              {['Strike', 'Slash', 'Ranged', 'Special', 'Wisdom', 'Defend'].map((a) => <option key={a} value={a}>{a}</option>)}
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Artist</FormLabel>
            <Input {...INPUT_PROPS} value={meta.artist ?? ''} onChange={(e) => setField('artist', e.target.value)} placeholder="Nombre del artista" />
          </FormControl>
        </SimpleGrid>
      )}
    </>
  )
}
