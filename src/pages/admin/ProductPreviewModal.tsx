import { useState, useEffect } from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Box,
  Grid,
  VStack,
  HStack,
  Text,
  Heading,
  Badge,
  Button,
  Divider,
  SimpleGrid,
  Flex,
} from '@chakra-ui/react'
import {
  FRANCHISE_CONFIG,
  CONDITION_ORDER,
  CONDITION_LABELS,
  formatPrice,
  getStockLabel,
  type Franchise,
  type Language,
  type CardCondition,
  type ProductVariant,
  type Product,
} from '../../types'
import { ProductGallery } from '../../components/ProductGallery'
import type { AdminProduct } from './ProductsPage'

function parseImages(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
  } catch { /* empty */ }
  if (typeof raw === 'string' && raw.startsWith('http')) return [raw]
  return []
}

function adminToProduct(p: AdminProduct): Product {
  return {
    id: p.id,
    name: p.name,
    franchise: p.franchise as Franchise,
    type: p.type as 'sealed' | 'singles',
    category: p.category,
    currency: p.currency,
    images: parseImages(p.images),
    description: p.description,
    featured: p.featured,
    isNew: p.isNew,
    variants: p.variants.map((v) => ({
      id: v.id,
      productId: v.productId,
      language: v.language as Language,
      condition: (v.condition ?? 'NM') as CardCondition,
      rarity: v.rarity,
      price: v.price,
      originalPrice: v.originalPrice,
      stock: v.stock,
    })),
  }
}

interface Props {
  isOpen: boolean
  onClose: () => void
  product: AdminProduct | null
}

export function ProductPreviewModal({ isOpen, onClose, product: adminProduct }: Props) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)

  // Reset selected variant when product changes
  useEffect(() => {
    setSelectedVariant(null)
  }, [adminProduct?.id])

  if (!adminProduct) return null

  const product = adminToProduct(adminProduct)
  const franchise = FRANCHISE_CONFIG[product.franchise]
  const isSingles = product.type === 'singles'
  const isPokemonSingles = isSingles && product.franchise === 'pokemon'

  // Unique rarities available — only for Pokémon singles
  const availableRarities = isPokemonSingles
    ? [...new Set(product.variants.map((v) => v.rarity).filter(Boolean))] as string[]
    : []
  const hasRarityVariants = availableRarities.length > 1

  const currentVariant = selectedVariant ?? product.variants[0]
  if (!currentVariant) return null

  const languages = [...new Set(product.variants.map((v) => v.language))]
  const selectedLanguage = currentVariant.language

  const selectedRarity = hasRarityVariants ? (currentVariant.rarity ?? availableRarities[0] ?? '') : ''

  const variantsForLanguage = product.variants
    .filter((v) => v.language === selectedLanguage && (!hasRarityVariants || (v.rarity ?? '') === selectedRarity))
    .sort((a, b) => CONDITION_ORDER.indexOf(a.condition ?? 'NM') - CONDITION_ORDER.indexOf(b.condition ?? 'NM'))

  const availableConditions = isSingles
    ? CONDITION_ORDER.filter((c) => variantsForLanguage.some((v) => (v.condition ?? 'NM') === c))
    : []

  const stock = getStockLabel(currentVariant.stock)

  const handleLanguageChange = (lang: string) => {
    const best =
      CONDITION_ORDER.map((c) =>
        product.variants.find((v) => v.language === lang && (v.condition ?? 'NM') === c)
      ).find(Boolean) ?? product.variants.find((v) => v.language === lang)
    if (best) setSelectedVariant(best)
  }

  const handleRarityChange = (rarity: string) => {
    const best =
      CONDITION_ORDER.map((c) =>
        product.variants.find((v) => v.rarity === rarity && v.language === selectedLanguage && (v.condition ?? 'NM') === c)
      ).find(Boolean) ?? product.variants.find((v) => v.rarity === rarity)
    if (best) setSelectedVariant(best)
  }

  const handleConditionChange = (condition: string) => {
    const v = variantsForLanguage.find((v) => (v.condition ?? 'NM') === condition)
    if (v) setSelectedVariant(v)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="5xl"
      scrollBehavior="inside"
    >
      <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(4px)" />
      <ModalContent bg="#0d0d0d" border="1px solid #1e1e1e" borderRadius="2xl" mx={4} my={6}>
        <ModalHeader
          borderBottom="1px solid #1a1a1a"
          pb={3}
          display="flex"
          alignItems="center"
          gap={3}
        >
          <Badge
            bg={franchise.color}
            color={franchise.textColor}
            fontSize="10px"
            fontWeight={700}
            px={2}
            py="2px"
            borderRadius="full"
          >
            {franchise.emoji} VISTA PREVIA
          </Badge>
          <Text fontSize="13px" color="gray.500" fontWeight={400} noOfLines={1}>
            {product.name}
          </Text>
        </ModalHeader>
        <ModalCloseButton color="gray.500" top={3} right={4} />

        <ModalBody py={8}>
          <Grid templateColumns={{ base: '1fr', md: '5fr 7fr' }} gap={10} alignItems="flex-start">
            {/* Gallery */}
            <Box>
              <ProductGallery images={product.images} name={product.name} />
            </Box>

            {/* Info */}
            <VStack align="stretch" spacing={5}>
              {/* Badges */}
              <HStack spacing={2} flexWrap="wrap">
                <Badge
                  bg={franchise.color}
                  color={franchise.textColor}
                  fontSize="11px"
                  fontWeight={700}
                  px={3}
                  py={1}
                  borderRadius="full"
                >
                  {franchise.emoji} {franchise.label}
                </Badge>
                <Badge
                  bg="#1e1e1e"
                  color="gray.400"
                  fontSize="11px"
                  px={3}
                  py={1}
                  borderRadius="full"
                  border="1px solid #2a2a2a"
                >
                  {product.category}
                </Badge>
                {product.isNew && (
                  <Badge bg="accent.400" color="white" fontSize="11px" px={3} py={1} borderRadius="full">
                    NUEVO
                  </Badge>
                )}
              </HStack>

              {/* Name */}
              <Heading fontFamily="body" fontSize={{ base: '18px', md: '24px' }} fontWeight={700} color="white" lineHeight={1.25}>
                {product.name}
              </Heading>

              {/* Rarity selector — Pokémon singles only */}
              {hasRarityVariants && (
                <VStack align="flex-start" spacing={2}>
                  <Text fontSize="11px" color="gray.600" fontWeight={600} textTransform="uppercase" letterSpacing="0.08em">
                    Rareza
                  </Text>
                  <HStack spacing={2} flexWrap="wrap">
                    {availableRarities.map((rar) => {
                      const allOut = product.variants.filter((v) => v.rarity === rar).every((v) => v.stock === 0)
                      return (
                        <Button
                          key={rar}
                          size="sm"
                          variant={selectedRarity === rar ? 'primary' : 'outline_brand'}
                          onClick={() => handleRarityChange(rar)}
                          fontSize="12px"
                          h="32px"
                          px={4}
                          opacity={allOut ? 0.4 : 1}
                        >
                          {rar}{allOut && ' (agotado)'}
                        </Button>
                      )
                    })}
                  </HStack>
                </VStack>
              )}

              {/* Language selector */}
              {languages.length > 1 && (
                <VStack align="flex-start" spacing={2}>
                  <Text fontSize="11px" color="gray.600" fontWeight={600} textTransform="uppercase" letterSpacing="0.08em">
                    Idioma
                  </Text>
                  <HStack spacing={2} flexWrap="wrap">
                    {languages.map((lang) => {
                      const allOut = product.variants.filter((v) => v.language === lang).every((v) => v.stock === 0)
                      return (
                        <Button
                          key={lang}
                          size="sm"
                          variant={selectedLanguage === lang ? 'primary' : 'outline_brand'}
                          onClick={() => handleLanguageChange(lang)}
                          textTransform="capitalize"
                          fontSize="12px"
                          h="32px"
                          px={4}
                          opacity={allOut ? 0.4 : 1}
                        >
                          {lang}{allOut && ' (agotado)'}
                        </Button>
                      )
                    })}
                  </HStack>
                </VStack>
              )}

              {/* Condition selector — always for singles */}
              {isSingles && availableConditions.length > 0 && (
                <VStack align="flex-start" spacing={2}>
                  <Text fontSize="11px" color="gray.600" fontWeight={600} textTransform="uppercase" letterSpacing="0.08em">
                    Condición
                  </Text>
                  <HStack spacing={2} flexWrap="wrap">
                    {availableConditions.map((cond) => {
                      const v = variantsForLanguage.find((v) => (v.condition ?? 'NM') === cond)
                      const outOfStock = !v || v.stock === 0
                      return (
                        <Button
                          key={cond}
                          size="sm"
                          variant={(currentVariant.condition ?? 'NM') === cond ? 'primary' : 'outline_brand'}
                          onClick={() => handleConditionChange(cond)}
                          fontSize="12px"
                          h="32px"
                          px={4}
                          opacity={outOfStock ? 0.4 : 1}
                          title={CONDITION_LABELS[cond]}
                        >
                          {cond}
                        </Button>
                      )
                    })}
                  </HStack>
                  <Text fontSize="11px" color="gray.600">
                    {CONDITION_LABELS[currentVariant.condition ?? 'NM']}
                  </Text>
                </VStack>
              )}

              {/* Price */}
              <VStack align="flex-start" spacing={1}>
                <Flex align="baseline" gap={3}>
                  <Text fontFamily="heading" fontSize="38px" color="brand.400" lineHeight={1} letterSpacing="0.02em">
                    {formatPrice(currentVariant.price)}
                  </Text>
                  {currentVariant.originalPrice && (
                    <Text fontSize="16px" color="gray.600" textDecoration="line-through">
                      {formatPrice(currentVariant.originalPrice)}
                    </Text>
                  )}
                </Flex>
                {currentVariant.originalPrice && (
                  <Badge bg="accent.400" color="white" fontSize="11px" px={2} borderRadius="full">
                    -{Math.round((1 - currentVariant.price / currentVariant.originalPrice) * 100)}% DESCUENTO
                  </Badge>
                )}
              </VStack>

              {/* Stock */}
              <HStack spacing={2}>
                <Box
                  w="8px"
                  h="8px"
                  borderRadius="full"
                  bg={currentVariant.stock === 0 ? 'gray.700' : stock.color}
                  flexShrink={0}
                />
                <Text fontSize="13px" color={stock.color} fontWeight={500}>{stock.label}</Text>
              </HStack>

              <Divider borderColor="#1e1e1e" />

              {/* Description */}
              {product.description && (
                <VStack align="stretch" spacing={2}>
                  <Text fontSize="12px" fontWeight={700} color="gray.500" textTransform="uppercase" letterSpacing="0.1em">
                    Descripción
                  </Text>
                  <Text fontSize="13px" color="gray.400" lineHeight={1.8}>
                    {product.description}
                  </Text>
                </VStack>
              )}

              {/* Info grid */}
              <Box bg="#111111" borderRadius="xl" p={4} border="1px solid #1e1e1e">
                <SimpleGrid columns={2} spacing={3}>
                  {[
                    { label: 'Franquicia', value: franchise.label },
                    { label: 'Tipo', value: product.type === 'sealed' ? 'Sellado' : 'Carta Suelta' },
                    { label: 'Categoría', value: product.category },
                    { label: 'Ref.', value: product.id.toUpperCase() },
                  ].map((info) => (
                    <VStack key={info.label} align="flex-start" spacing={0}>
                      <Text fontSize="10px" color="gray.700" textTransform="uppercase" letterSpacing="0.1em">
                        {info.label}
                      </Text>
                      <Text fontSize="12px" color="gray.300" fontWeight={500}>
                        {info.value}
                      </Text>
                    </VStack>
                  ))}
                </SimpleGrid>
              </Box>

              {/* All variants summary */}
              <Box bg="#111111" borderRadius="xl" p={4} border="1px solid #1e1e1e">
                <Text fontSize="10px" color="gray.700" textTransform="uppercase" letterSpacing="0.1em" mb={3}>
                  Todas las variantes
                </Text>
                <VStack align="stretch" spacing={2}>
                  {product.variants.map((v) => (
                    <HStack key={v.id} justify="space-between">
                      <HStack spacing={2}>
                        <Text fontSize="12px" color="gray.400" textTransform="capitalize">{v.language}</Text>
                        {isSingles && (
                          <Badge bg="#1e1e1e" color="gray.500" fontSize="9px" px={1} borderRadius="sm">
                            {v.condition ?? 'NM'}
                          </Badge>
                        )}
                        {isPokemonSingles && v.rarity && (
                          <Badge bg="#1e1e1e" color="gray.500" fontSize="9px" px={1} borderRadius="sm">
                            {v.rarity}
                          </Badge>
                        )}
                      </HStack>
                      <HStack spacing={3}>
                        <Text fontSize="12px" color="brand.400" fontWeight={600}>{formatPrice(v.price)}</Text>
                        <Text
                          fontSize="11px"
                          fontWeight={600}
                          color={v.stock === 0 ? 'red.400' : v.stock <= 3 ? 'orange.400' : 'green.400'}
                        >
                          {v.stock} en stock
                        </Text>
                      </HStack>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            </VStack>
          </Grid>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
