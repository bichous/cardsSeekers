import { useMemo, useEffect, useState } from 'react'
import {
  Box,
  Container,
  SimpleGrid,
  Heading,
  Text,
  VStack,
  Flex,
} from '@chakra-ui/react'
import { useSearchParams } from 'react-router-dom'
import { FiPackage } from 'react-icons/fi'
import type { Franchise, ProductType, SortOption } from '../types'
import { FRANCHISE_CONFIG, getMinVariant } from '../types'
import { useProducts } from '../hooks/useProducts'
import { ProductCard } from '../components/ProductCard'
import { FilterBar } from '../components/FilterBar'

interface Filters {
  search: string
  franchise: Franchise | 'all'
  type: ProductType | 'all'
  sort: SortOption
}

export function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [filters, setFilters] = useState<Filters>({
    search: searchParams.get('search') ?? '',
    franchise: (searchParams.get('franchise') as Franchise) ?? 'all',
    type: (searchParams.get('type') as ProductType) ?? 'all',
    sort: (searchParams.get('sort') as SortOption) ?? 'featured',
  })

  // Sync URL when filters change
  useEffect(() => {
    const params: Record<string, string> = {}
    if (filters.search) params.search = filters.search
    if (filters.franchise !== 'all') params.franchise = filters.franchise
    if (filters.type !== 'all') params.type = filters.type
    if (filters.sort !== 'featured') params.sort = filters.sort
    setSearchParams(params, { replace: true })
  }, [filters, setSearchParams])

  const handleFilterChange = (partial: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...partial }))
  }

  const allProducts = useProducts()

  const filteredProducts = useMemo(() => {
    let result = [...allProducts]

    if (filters.franchise !== 'all') {
      result = result.filter((p) => p.franchise === filters.franchise)
    }
    if (filters.type !== 'all') {
      result = result.filter((p) => p.type === filters.type)
    }
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase().trim()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          FRANCHISE_CONFIG[p.franchise].label.toLowerCase().includes(q)
      )
    }

    switch (filters.sort) {
      case 'price-asc':
        result.sort((a, b) => getMinVariant(a).price - getMinVariant(b).price)
        break
      case 'price-desc':
        result.sort((a, b) => getMinVariant(b).price - getMinVariant(a).price)
        break
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name, 'es'))
        break
      case 'featured':
      default:
        result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
    }

    return result
  }, [filters, allProducts])

  const activeFranchiseName =
    filters.franchise !== 'all' ? FRANCHISE_CONFIG[filters.franchise].label : null

  return (
    <Box pt="88px" pb={20} minH="100vh">
      <Container maxW="1280px">
        {/* Page header */}
        <Box mb={8}>
          <Text
            fontSize="11px"
            fontWeight={700}
            color="brand.400"
            letterSpacing="0.15em"
            textTransform="uppercase"
            mb={1}
          >
            {activeFranchiseName ?? 'Tienda'}
          </Text>
          <Heading
            fontFamily="heading"
            fontSize={{ base: '40px', md: '56px' }}
            color="white"
            letterSpacing="0.03em"
            lineHeight={0.95}
          >
            {activeFranchiseName
              ? activeFranchiseName.toUpperCase()
              : 'CATÁLOGO'}
          </Heading>
        </Box>

        {/* Filters */}
        <FilterBar
          filters={filters}
          onChange={handleFilterChange}
          totalCount={filteredProducts.length}
        />

        {/* Grid */}
        {filteredProducts.length > 0 ? (
          <SimpleGrid
            columns={{ base: 2, sm: 3, lg: 4 }}
            spacing={{ base: 3, md: 5 }}
          >
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </SimpleGrid>
        ) : (
          <Flex
            direction="column"
            align="center"
            justify="center"
            py={24}
            gap={3}
            color="gray.600"
          >
            <FiPackage size={48} />
            <VStack spacing={1}>
              <Text fontWeight={600} fontSize="16px" color="gray.500">
                Sin resultados
              </Text>
              <Text fontSize="13px" color="gray.700" textAlign="center">
                No hay productos que coincidan con los filtros actuales.
              </Text>
            </VStack>
          </Flex>
        )}
      </Container>
    </Box>
  )
}
