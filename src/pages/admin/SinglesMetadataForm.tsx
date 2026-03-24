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
} from '@chakra-ui/react'

export type CardCondition = 'NM' | 'LP' | 'MP' | 'HP' | 'Damaged'

export interface SinglesMeta {
  condition: CardCondition
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

const CONDITIONS: { value: CardCondition; label: string }[] = [
  { value: 'NM', label: 'Near Mint (NM)' },
  { value: 'LP', label: 'Lightly Played (LP)' },
  { value: 'MP', label: 'Moderately Played (MP)' },
  { value: 'HP', label: 'Heavily Played (HP)' },
  { value: 'Damaged', label: 'Damaged' },
]

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

interface Props {
  franchise: string
  meta: SinglesMeta
  onChange: (meta: SinglesMeta) => void
}

export function SinglesMetadataForm({ franchise, meta, onChange }: Props) {
  const set = (field: keyof SinglesMeta, value: string) =>
    onChange({ ...meta, [field]: value })

  return (
    <>
      <Divider borderColor="#1e1e1e" my={4} />
      <Text fontSize="12px" color="gray.500" fontWeight={600} textTransform="uppercase" letterSpacing="0.1em" mb={3}>
        Datos de la carta
      </Text>

      {/* ── Condition – siempre presente ─────────────────────────────── */}
      <FormControl mb={4}>
        <FormLabel {...LABEL_PROPS}>Card Condition *</FormLabel>
        <Select {...INPUT_PROPS} value={meta.condition} onChange={e => set('condition', e.target.value)}>
          {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </Select>
      </FormControl>

      {/* ── Yu-Gi-Oh ────────────────────────────────────────────────── */}
      {franchise === 'yugioh' && (
        <SimpleGrid columns={2} spacing={3}>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Expansion</FormLabel>
            <Input {...INPUT_PROPS} value={meta.expansion ?? ''} onChange={e => set('expansion', e.target.value)} placeholder="Phantom Nightmare" />
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Rarity</FormLabel>
            <Input {...INPUT_PROPS} value={meta.rarity ?? ''} onChange={e => set('rarity', e.target.value)} placeholder="Secret Rare" />
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Attribute</FormLabel>
            <Select {...INPUT_PROPS} value={meta.attribute ?? ''} onChange={e => set('attribute', e.target.value)}>
              <option value="">—</option>
              {['DARK', 'LIGHT', 'EARTH', 'WATER', 'FIRE', 'WIND', 'DIVINE'].map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Monster Type / Card Type</FormLabel>
            <Input {...INPUT_PROPS} value={meta.monsterType ?? ''} onChange={e => set('monsterType', e.target.value)} placeholder="Dragon / Effect" />
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Level</FormLabel>
            <NumberInput size="sm" min={0} max={12} value={meta.level ?? ''} onChange={v => set('level', v)}>
              <NumberInputField {...INPUT_PROPS} />
            </NumberInput>
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>ATK / DEF</FormLabel>
            <SimpleGrid columns={2} spacing={2}>
              <Input {...INPUT_PROPS} placeholder="ATK" value={meta.atk ?? ''} onChange={e => set('atk', e.target.value)} />
              <Input {...INPUT_PROPS} placeholder="DEF" value={meta.def ?? ''} onChange={e => set('def', e.target.value)} />
            </SimpleGrid>
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Number (Español)</FormLabel>
            <Input {...INPUT_PROPS} value={meta.numberES ?? ''} onChange={e => set('numberES', e.target.value)} placeholder="BLTR-SP034" />
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Number (Inglés)</FormLabel>
            <Input {...INPUT_PROPS} value={meta.numberEN ?? ''} onChange={e => set('numberEN', e.target.value)} placeholder="BLTR-EN034" />
          </FormControl>
        </SimpleGrid>
      )}

      {/* ── Pokémon ─────────────────────────────────────────────────── */}
      {franchise === 'pokemon' && (
        <SimpleGrid columns={2} spacing={3}>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Expansion</FormLabel>
            <Input {...INPUT_PROPS} value={meta.expansion ?? ''} onChange={e => set('expansion', e.target.value)} placeholder="Obsidian Flames" />
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Card Number</FormLabel>
            <Input {...INPUT_PROPS} value={meta.cardNumber ?? ''} onChange={e => set('cardNumber', e.target.value)} placeholder="228/193" />
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Rarity</FormLabel>
            <Input {...INPUT_PROPS} value={meta.rarity ?? ''} onChange={e => set('rarity', e.target.value)} placeholder="Special Illustration Rare" />
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Card Type</FormLabel>
            <Select {...INPUT_PROPS} value={meta.cardType ?? ''} onChange={e => set('cardType', e.target.value)}>
              <option value="">—</option>
              {['Pokémon', 'Trainer', 'Energy'].map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>HP</FormLabel>
            <Input {...INPUT_PROPS} value={meta.hp ?? ''} onChange={e => set('hp', e.target.value)} placeholder="330" />
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Stage</FormLabel>
            <Select {...INPUT_PROPS} value={meta.stage ?? ''} onChange={e => set('stage', e.target.value)}>
              <option value="">—</option>
              {['Basic', 'Stage 1', 'Stage 2', 'V', 'VMAX', 'VSTAR', 'ex', 'EX', 'GX'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </FormControl>
          <FormControl gridColumn="1 / -1">
            <FormLabel {...LABEL_PROPS}>Card Text</FormLabel>
            <Textarea {...INPUT_PROPS} rows={3} value={meta.cardText ?? ''} onChange={e => set('cardText', e.target.value)} placeholder="Texto de habilidades y ataques..." />
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Artist</FormLabel>
            <Input {...INPUT_PROPS} value={meta.artist ?? ''} onChange={e => set('artist', e.target.value)} placeholder="5ban Graphics" />
          </FormControl>
        </SimpleGrid>
      )}

      {/* ── One Piece ───────────────────────────────────────────────── */}
      {franchise === 'onepiece' && (
        <SimpleGrid columns={2} spacing={3}>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Expansion</FormLabel>
            <Input {...INPUT_PROPS} value={meta.expansion ?? ''} onChange={e => set('expansion', e.target.value)} placeholder="Two Legends" />
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Rarity</FormLabel>
            <Select {...INPUT_PROPS} value={meta.rarity ?? ''} onChange={e => set('rarity', e.target.value)}>
              <option value="">—</option>
              {['C', 'UC', 'R', 'SR', 'L', 'SEC', 'P'].map(r => <option key={r} value={r}>{r}</option>)}
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Number</FormLabel>
            <Input {...INPUT_PROPS} value={meta.number ?? ''} onChange={e => set('number', e.target.value)} placeholder="OP08-001" />
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Color</FormLabel>
            <Select {...INPUT_PROPS} value={meta.color ?? ''} onChange={e => set('color', e.target.value)}>
              <option value="">—</option>
              {['Red', 'Green', 'Blue', 'Purple', 'Black', 'Yellow', 'Multicolor'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Card Type</FormLabel>
            <Select {...INPUT_PROPS} value={meta.cardType ?? ''} onChange={e => set('cardType', e.target.value)}>
              <option value="">—</option>
              {['Character', 'Event', 'Stage', 'Leader', 'Don!!'].map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Cost</FormLabel>
            <Input {...INPUT_PROPS} value={meta.cost ?? ''} onChange={e => set('cost', e.target.value)} placeholder="5" />
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Power</FormLabel>
            <Input {...INPUT_PROPS} value={meta.power ?? ''} onChange={e => set('power', e.target.value)} placeholder="6000" />
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Subtype(s)</FormLabel>
            <Input {...INPUT_PROPS} value={meta.subtypes ?? ''} onChange={e => set('subtypes', e.target.value)} placeholder="Straw Hat Crew" />
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Attribute</FormLabel>
            <Select {...INPUT_PROPS} value={meta.attribute ?? ''} onChange={e => set('attribute', e.target.value)}>
              <option value="">—</option>
              {['Strike', 'Slash', 'Ranged', 'Special', 'Wisdom', 'Defend'].map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel {...LABEL_PROPS}>Artist</FormLabel>
            <Input {...INPUT_PROPS} value={meta.artist ?? ''} onChange={e => set('artist', e.target.value)} placeholder="Nombre del artista" />
          </FormControl>
        </SimpleGrid>
      )}
    </>
  )
}
