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
  InputGroup,
  InputLeftElement,
  Spinner,
  Badge,
} from '@chakra-ui/react'
import { useState, useEffect, useRef } from 'react'
import { FiSearch } from 'react-icons/fi'

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

// ── API types ──────────────────────────────────────────────────────────────

interface YGOCard {
  name: string
  type: string
  race: string
  attribute?: string
  level?: number
  atk?: number
  def?: number
  card_images?: Array<{ image_url: string; image_url_small: string }>
  card_sets?: Array<{ set_name: string; set_code: string; set_rarity: string }>
}

interface PokemonCard {
  name: string
  supertype: string
  subtypes?: string[]
  hp?: string
  types?: string[]
  number: string
  artist?: string
  rarity?: string
  set: { id: string; name: string; series: string; total: number; printedTotal?: number; ptcgoCode?: string }
  images?: { small: string; large: string }
  abilities?: Array<{ name: string; text: string }>
  attacks?: Array<{ name: string; text: string; damage: string }>
}

interface SearchResult {
  name: string
  subtitle: string
  raw: YGOCard | PokemonCard
}

// ── API fetch helpers ──────────────────────────────────────────────────────

async function searchYGO(query: string): Promise<SearchResult[]> {
  // Detect optional set hint after a " - " separator: "dark magician - LOB"
  const [namePart, setPart] = query.split(/\s+-\s+/)
  const url = new URL('https://db.ygoprodeck.com/api/v7/cardinfo.php')
  url.searchParams.set('fname', namePart.trim())
  url.searchParams.set('num', '8')
  url.searchParams.set('offset', '0')
  if (setPart?.trim()) url.searchParams.set('cardset', setPart.trim())

  const res = await fetch(url.toString())
  if (!res.ok) return []
  const data = await res.json()
  return (data.data ?? []).map((c: YGOCard) => ({
    name: c.name,
    subtitle: `${c.type} · ${c.card_sets?.[0]?.set_name ?? '—'}`,
    raw: c,
  }))
}

/**
 * Parses a free-form query into Pokémon TCG API Lucene syntax.
 * Examples:
 *   "psyduck"              → name:"psyduck*"
 *   "psyduck 175"          → name:"psyduck*" number:175
 *   "psyduck 175 151"      → name:"psyduck*" number:175 set.name:"*151*"
 *   "psyduck 175 pokemon 151" → name:"psyduck*" number:175 set.name:"*151*"
 */
function buildPokemonQuery(query: string): string {
  // Match: <name words> <card number> [set hint...]
  const match = query.trim().match(/^(.*?)\s+(\d+)(?:\s+(.*))?$/)
  if (match && match[1].trim()) {
    const name = match[1].trim()
    const number = match[2]
    // Strip generic words like "pokemon" since the set is already implied
    const setHint = (match[3] ?? '').replace(/\bpokemon\b/gi, '').trim()
    const parts = [`name:"${name}*"`, `number:${number}`]
    if (setHint) parts.push(`set.name:"*${setHint}*"`)
    return parts.join(' ')
  }
  return `name:"${query.trim()}*"`
}

async function searchPokemon(query: string): Promise<SearchResult[]> {
  const q = buildPokemonQuery(query)
  const res = await fetch(
    `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(q)}&pageSize=8&select=name,supertype,subtypes,hp,types,number,artist,rarity,set,abilities,attacks,images`
  )
  if (!res.ok) return []
  const data = await res.json()
  return (data.data ?? []).map((c: PokemonCard) => ({
    name: c.name,
    subtitle: `${c.set.name} #${c.number} · ${c.rarity ?? ''}`,
    raw: c,
  }))
}

// ── Meta mappers ───────────────────────────────────────────────────────────

function mapYGO(card: YGOCard, existing: SinglesMeta): SinglesMeta {
  const firstSet = card.card_sets?.[0]
  return {
    ...existing,
    expansion: firstSet?.set_name ?? existing.expansion,
    rarity: firstSet?.set_rarity ?? existing.rarity,
    numberEN: firstSet?.set_code ?? existing.numberEN,
    attribute: card.attribute ?? existing.attribute,
    monsterType:
      card.race && card.type
        ? `${card.race} / ${card.type}`
        : card.type ?? existing.monsterType,
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

  const supertype = card.supertype === 'Pokémon' ? 'Pokémon' : card.supertype === 'Trainer' ? 'Trainer' : 'Energy'

  return {
    ...existing,
    expansion: card.set.name,
    cardNumber: `${card.number}/${card.set.total}`,
    rarity: card.rarity ?? existing.rarity,
    cardType: supertype,
    hp: card.hp ?? existing.hp,
    stage,
    artist: card.artist ?? existing.artist,
    cardText: allText || existing.cardText,
  }
}

// ── Product name builders ──────────────────────────────────────────────────

/** "Psyduck - 175/165 - SV: Scarlet & Violet 151 (MEW)" */
function buildPokemonProductName(card: PokemonCard): string {
  const total = card.set.printedTotal ?? card.set.total
  const seriesCode = card.set.id.match(/^[a-z]+/)?.[0].toUpperCase() ?? ''
  const setCode = card.set.ptcgoCode ? ` (${card.set.ptcgoCode})` : ''
  const seriesPart = seriesCode ? `${seriesCode}: ${card.set.series} ` : `${card.set.series} `
  return `${card.name} - ${card.number}/${total} - ${seriesPart}${card.set.name}${setCode}`
}

/** "Dark Magician - SDY-006 - Starter Deck: Yugi" */
function buildYGOProductName(card: YGOCard): string {
  const firstSet = card.card_sets?.[0]
  if (!firstSet) return card.name
  return `${card.name} - ${firstSet.set_code} - ${firstSet.set_name}`
}

// ── Constants ──────────────────────────────────────────────────────────────


const INPUT_PROPS = {
  bg: '#161616' as const,
  borderColor: '#2a2a2a' as const,
  color: 'white' as const,
  size: 'sm' as const,
}

const LABEL_PROPS = {
  fontSize: '11px' as const,
  color: 'gray.500' as const,
  mb: 1,
}

// ── Component ──────────────────────────────────────────────────────────────

interface Props {
  franchise: string
  meta: SinglesMeta
  onChange: (meta: SinglesMeta) => void
  onCardSelect?: (name: string, category: string, imageUrls: string[]) => void
}

export function SinglesMetadataForm({ franchise, meta, onChange, onCardSelect }: Props) {
  const set = (field: keyof SinglesMeta, value: string) =>
    onChange({ ...meta, [field]: value })

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const justSelectedRef = useRef(false)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Reset search when franchise changes
  useEffect(() => {
    setQuery('')
    setResults([])
    setShowDropdown(false)
  }, [franchise])

  // Debounced search — se salta si el cambio fue por una selección
  useEffect(() => {
    if (justSelectedRef.current) {
      justSelectedRef.current = false
      return
    }
    if (query.length < 2) {
      setResults([])
      setShowDropdown(false)
      return
    }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const data =
          franchise === 'yugioh'
            ? await searchYGO(query)
            : await searchPokemon(query)
        setResults(data)
        setShowDropdown(true)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [query, franchise])

  const handleSelect = (result: SearchResult) => {
    let updated: SinglesMeta
    let productName: string
    let category: string
    let imageUrls: string[] = []

    if (franchise === 'yugioh') {
      const card = result.raw as YGOCard
      updated = mapYGO(card, meta)
      productName = buildYGOProductName(card)
      category = card.card_sets?.[0]?.set_name ?? ''
      imageUrls = card.card_images?.map((img) => img.image_url) ?? []
    } else {
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

  const showSearch = franchise === 'yugioh' || franchise === 'pokemon'

  return (
    <>
      <Divider borderColor="#1e1e1e" my={4} />
      <Text
        fontSize="12px"
        color="gray.500"
        fontWeight={600}
        textTransform="uppercase"
        letterSpacing="0.1em"
        mb={3}
      >
        Datos de la carta
      </Text>

      {/* ── Autocomplete search ──────────────────────────────────────────── */}
      {showSearch && (
        <Box position="relative" mb={4} ref={containerRef}>
          <Text fontSize="11px" color="brand.400" fontWeight={600} textTransform="uppercase" letterSpacing="0.1em" mb={2}>
            Buscar carta para autocompletar
          </Text>
          <InputGroup size="sm">
            <InputLeftElement pointerEvents="none" pl={1}>
              {loading
                ? <Spinner size="xs" color="brand.400" />
                : <FiSearch color="#666" size={13} />
              }
            </InputLeftElement>
            <Input
              {...INPUT_PROPS}
              pl="30px"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                franchise === 'yugioh'
                  ? 'Dark Magician  ó  Blue-Eyes - LOB'
                  : 'Psyduck  ó  Psyduck 175 pokemon 151'
              }
            />
          </InputGroup>

          {showDropdown && results.length > 0 && (
            <Box
              position="absolute"
              top="100%"
              left={0}
              right={0}
              mt={1}
              bg="#1a1a1a"
              border="1px solid #2a2a2a"
              borderRadius="lg"
              zIndex={200}
              maxH="220px"
              overflowY="auto"
              boxShadow="0 8px 32px rgba(0,0,0,0.6)"
            >
              {results.map((r, i) => (
                <Box
                  key={i}
                  px={3}
                  py={2}
                  cursor="pointer"
                  _hover={{ bg: '#252525' }}
                  borderBottom={i < results.length - 1 ? '1px solid #222' : 'none'}
                  onMouseDown={() => handleSelect(r)}
                >
                  <Text fontSize="13px" color="white" fontWeight={500}>{r.name}</Text>
                  <Text fontSize="11px" color="gray.600" noOfLines={1}>{r.subtitle}</Text>
                </Box>
              ))}
            </Box>
          )}

          {query.length >= 2 && !loading && results.length === 0 && showDropdown && (
            <Box
              position="absolute"
              top="100%"
              left={0}
              right={0}
              mt={1}
              bg="#1a1a1a"
              border="1px solid #2a2a2a"
              borderRadius="lg"
              zIndex={200}
              px={3}
              py={3}
            >
              <Text fontSize="12px" color="gray.600">Sin resultados para "{query}"</Text>
            </Box>
          )}
        </Box>
      )}

      {/* ── Yu-Gi-Oh ─────────────────────────────────────────────────────── */}
      {franchise === 'yugioh' && (
        <SimpleGrid columns={2} spacing={3}>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Expansion</FormLabel>
            <Input {...INPUT_PROPS} value={meta.expansion ?? ''} onChange={(e) => set('expansion', e.target.value)} placeholder="Phantom Nightmare" />
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Rarity</FormLabel>
            <Input {...INPUT_PROPS} value={meta.rarity ?? ''} onChange={(e) => set('rarity', e.target.value)} placeholder="Secret Rare" />
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Attribute</FormLabel>
            <Select {...INPUT_PROPS} value={meta.attribute ?? ''} onChange={(e) => set('attribute', e.target.value)}>
              <option value="">—</option>
              {['DARK', 'LIGHT', 'EARTH', 'WATER', 'FIRE', 'WIND', 'DIVINE'].map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Monster Type / Card Type</FormLabel>
            <Input {...INPUT_PROPS} value={meta.monsterType ?? ''} onChange={(e) => set('monsterType', e.target.value)} placeholder="Dragon / Effect" />
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Level</FormLabel>
            <NumberInput size="sm" min={0} max={12} value={meta.level ?? ''} onChange={(v) => set('level', v)}>
              <NumberInputField {...INPUT_PROPS} />
            </NumberInput>
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>ATK / DEF</FormLabel>
            <SimpleGrid columns={2} spacing={2}>
              <Input {...INPUT_PROPS} placeholder="ATK" value={meta.atk ?? ''} onChange={(e) => set('atk', e.target.value)} />
              <Input {...INPUT_PROPS} placeholder="DEF" value={meta.def ?? ''} onChange={(e) => set('def', e.target.value)} />
            </SimpleGrid>
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>
              Number (Español)
              <Badge ml={2} fontSize="9px" bg="#1e1e1e" color="gray.500" fontWeight={400}>manual</Badge>
            </FormLabel>
            <Input {...INPUT_PROPS} value={meta.numberES ?? ''} onChange={(e) => set('numberES', e.target.value)} placeholder="BLTR-SP034" />
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Number (Inglés)</FormLabel>
            <Input {...INPUT_PROPS} value={meta.numberEN ?? ''} onChange={(e) => set('numberEN', e.target.value)} placeholder="BLTR-EN034" />
          </FormControl>
        </SimpleGrid>
      )}

      {/* ── Pokémon ──────────────────────────────────────────────────────── */}
      {franchise === 'pokemon' && (
        <SimpleGrid columns={2} spacing={3}>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Expansion</FormLabel>
            <Input {...INPUT_PROPS} value={meta.expansion ?? ''} onChange={(e) => set('expansion', e.target.value)} placeholder="Obsidian Flames" />
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Card Number</FormLabel>
            <Input {...INPUT_PROPS} value={meta.cardNumber ?? ''} onChange={(e) => set('cardNumber', e.target.value)} placeholder="228/193" />
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Rarity</FormLabel>
            <Input {...INPUT_PROPS} value={meta.rarity ?? ''} onChange={(e) => set('rarity', e.target.value)} placeholder="Special Illustration Rare" />
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Card Type</FormLabel>
            <Select {...INPUT_PROPS} value={meta.cardType ?? ''} onChange={(e) => set('cardType', e.target.value)}>
              <option value="">—</option>
              {['Pokémon', 'Trainer', 'Energy'].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>HP</FormLabel>
            <Input {...INPUT_PROPS} value={meta.hp ?? ''} onChange={(e) => set('hp', e.target.value)} placeholder="330" />
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Stage</FormLabel>
            <Select {...INPUT_PROPS} value={meta.stage ?? ''} onChange={(e) => set('stage', e.target.value)}>
              <option value="">—</option>
              {['Basic', 'Stage 1', 'Stage 2', 'V', 'VMAX', 'VSTAR', 'ex', 'EX', 'GX'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </FormControl>
          <FormControl gridColumn="1 / -1">
            <FormLabel {...LABEL_PROPS}>Card Text</FormLabel>
            <Textarea
              {...INPUT_PROPS}
              rows={3}
              value={meta.cardText ?? ''}
              onChange={(e) => set('cardText', e.target.value)}
              placeholder="Texto de habilidades y ataques..."
            />
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Artist</FormLabel>
            <Input {...INPUT_PROPS} value={meta.artist ?? ''} onChange={(e) => set('artist', e.target.value)} placeholder="5ban Graphics" />
          </FormControl>
        </SimpleGrid>
      )}

      {/* ── One Piece ────────────────────────────────────────────────────── */}
      {franchise === 'onepiece' && (
        <SimpleGrid columns={2} spacing={3}>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Expansion</FormLabel>
            <Input {...INPUT_PROPS} value={meta.expansion ?? ''} onChange={(e) => set('expansion', e.target.value)} placeholder="Two Legends" />
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Rarity</FormLabel>
            <Select {...INPUT_PROPS} value={meta.rarity ?? ''} onChange={(e) => set('rarity', e.target.value)}>
              <option value="">—</option>
              {['C', 'UC', 'R', 'SR', 'L', 'SEC', 'P'].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Number</FormLabel>
            <Input {...INPUT_PROPS} value={meta.number ?? ''} onChange={(e) => set('number', e.target.value)} placeholder="OP08-001" />
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Color</FormLabel>
            <Select {...INPUT_PROPS} value={meta.color ?? ''} onChange={(e) => set('color', e.target.value)}>
              <option value="">—</option>
              {['Red', 'Green', 'Blue', 'Purple', 'Black', 'Yellow', 'Multicolor'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Card Type</FormLabel>
            <Select {...INPUT_PROPS} value={meta.cardType ?? ''} onChange={(e) => set('cardType', e.target.value)}>
              <option value="">—</option>
              {['Character', 'Event', 'Stage', 'Leader', 'Don!!'].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Cost</FormLabel>
            <Input {...INPUT_PROPS} value={meta.cost ?? ''} onChange={(e) => set('cost', e.target.value)} placeholder="5" />
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Power</FormLabel>
            <Input {...INPUT_PROPS} value={meta.power ?? ''} onChange={(e) => set('power', e.target.value)} placeholder="6000" />
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Subtype(s)</FormLabel>
            <Input {...INPUT_PROPS} value={meta.subtypes ?? ''} onChange={(e) => set('subtypes', e.target.value)} placeholder="Straw Hat Crew" />
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Attribute</FormLabel>
            <Select {...INPUT_PROPS} value={meta.attribute ?? ''} onChange={(e) => set('attribute', e.target.value)}>
              <option value="">—</option>
              {['Strike', 'Slash', 'Ranged', 'Special', 'Wisdom', 'Defend'].map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Artist</FormLabel>
            <Input {...INPUT_PROPS} value={meta.artist ?? ''} onChange={(e) => set('artist', e.target.value)} placeholder="Nombre del artista" />
          </FormControl>
        </SimpleGrid>
      )}
    </>
  )
}
