import {
  Box,
  Flex,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Button,
  Select,
  Text,
} from '@chakra-ui/react'
import { SearchIcon } from '@chakra-ui/icons'
import type { Franchise, ProductType, SortOption } from '../types'
import { FRANCHISE_CONFIG } from '../types'

interface Filters {
  search: string
  franchise: Franchise | 'all'
  type: ProductType | 'all'
  sort: SortOption
}

interface FilterBarProps {
  filters: Filters
  onChange: (filters: Partial<Filters>) => void
  totalCount: number
}

const FRANCHISE_TABS: { value: Franchise | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pokemon', label: FRANCHISE_CONFIG.pokemon.label },
  { value: 'yugioh', label: FRANCHISE_CONFIG.yugioh.label },
  { value: 'onepiece', label: FRANCHISE_CONFIG.onepiece.label },
]

const TYPE_TABS: { value: ProductType | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'sealed', label: 'Sellados' },
  { value: 'singles', label: 'Cartas Sueltas' },
]

export function FilterBar({ filters, onChange, totalCount }: FilterBarProps) {
  return (
    <Box
      bg="#111111"
      border="1px solid #1e1e1e"
      borderRadius="xl"
      p={{ base: 4, md: 5 }}
      mb={6}
    >
      {/* Search */}
      <InputGroup mb={4}>
        <InputLeftElement pointerEvents="none" h="full" pl={1}>
          <SearchIcon color="gray.600" boxSize={4} />
        </InputLeftElement>
        <Input
          placeholder="Buscar productos…"
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
          pl={9}
          aria-label="Buscar productos"
        />
      </InputGroup>

      <Flex
        direction={{ base: 'column', md: 'row' }}
        gap={4}
        align={{ md: 'center' }}
        justify="space-between"
      >
        {/* Franchise filter */}
        <Box>
          <Text fontSize="11px" color="gray.600" fontWeight={600} mb={2} textTransform="uppercase" letterSpacing="0.08em">
            Franquicia
          </Text>
          <HStack spacing={1} flexWrap="wrap">
            {FRANCHISE_TABS.map((tab) => {
              const isActive = filters.franchise === tab.value
              const cfg = tab.value !== 'all' ? FRANCHISE_CONFIG[tab.value as Franchise] : null
              return (
                <Button
                  key={tab.value}
                  size="xs"
                  h="28px"
                  px={3}
                  borderRadius="full"
                  fontSize="12px"
                  fontWeight={isActive ? 700 : 500}
                  bg={isActive ? (cfg?.color ?? 'brand.400') : 'transparent'}
                  color={isActive ? (cfg?.textColor ?? '#0d0d0d') : 'gray.400'}
                  border="1px solid"
                  borderColor={isActive ? (cfg?.color ?? 'brand.400') : '#2a2a2a'}
                  _hover={{
                    borderColor: cfg?.color ?? 'brand.400',
                    color: isActive ? cfg?.textColor ?? '#0d0d0d' : 'gray.200',
                  }}
                  transition="all 0.15s"
                  onClick={() => onChange({ franchise: tab.value as Franchise | 'all' })}
                  aria-pressed={isActive}
                >
                  {tab.label}
                </Button>
              )
            })}
          </HStack>
        </Box>

        {/* Type filter */}
        <Box>
          <Text fontSize="11px" color="gray.600" fontWeight={600} mb={2} textTransform="uppercase" letterSpacing="0.08em">
            Tipo
          </Text>
          <HStack spacing={1}>
            {TYPE_TABS.map((tab) => {
              const isActive = filters.type === tab.value
              return (
                <Button
                  key={tab.value}
                  size="xs"
                  h="28px"
                  px={3}
                  borderRadius="full"
                  fontSize="12px"
                  fontWeight={isActive ? 700 : 500}
                  bg={isActive ? 'brand.400' : 'transparent'}
                  color={isActive ? 'gray.900' : 'gray.400'}
                  border="1px solid"
                  borderColor={isActive ? 'brand.400' : '#2a2a2a'}
                  _hover={{ borderColor: 'brand.400', color: 'gray.200' }}
                  transition="all 0.15s"
                  onClick={() => onChange({ type: tab.value as ProductType | 'all' })}
                  aria-pressed={isActive}
                >
                  {tab.label}
                </Button>
              )
            })}
          </HStack>
        </Box>

        {/* Sort + count */}
        <Flex align="center" gap={3} flexShrink={0}>
          <Select
            value={filters.sort}
            onChange={(e) => onChange({ sort: e.target.value as SortOption })}
            size="sm"
            w="160px"
            aria-label="Ordenar por"
          >
            <option value="featured">Destacados</option>
            <option value="price-asc">Precio: menor a mayor</option>
            <option value="price-desc">Precio: mayor a menor</option>
            <option value="name-asc">Nombre A–Z</option>
          </Select>
          <Text fontSize="12px" color="gray.600" whiteSpace="nowrap">
            {totalCount} {totalCount === 1 ? 'producto' : 'productos'}
          </Text>
        </Flex>
      </Flex>
    </Box>
  )
}
