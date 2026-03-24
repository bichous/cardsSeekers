import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Grid,
  VStack,
  HStack,
  Text,
  Heading,
  Badge,
  Button,
  Divider,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  SimpleGrid,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Flex,
} from '@chakra-ui/react'
import { ChevronRightIcon } from '@chakra-ui/icons'
import { FiShoppingCart, FiArrowLeft } from 'react-icons/fi'
import { getProductById } from '../data/products'


function MetaRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <HStack justify="space-between" py={2} borderBottom="1px solid #1a1a1a">
      <Text fontSize="12px" color="gray.600">{label}</Text>
      <Text fontSize="12px" color="gray.300" fontWeight={500} textAlign="right" maxW="60%">{value}</Text>
    </HStack>
  )
}

function CardMetadataBlock({ franchise, meta }: { franchise: string; meta: Record<string, string> }) {
  const rows: { label: string; value?: string }[] = []

  if (franchise === 'yugioh') {
    rows.push(
      { label: 'Expansion', value: meta.expansion },
      { label: 'Rarity', value: meta.rarity },
      { label: 'Attribute', value: meta.attribute },
      { label: 'Monster / Card Type', value: meta.monsterType },
      { label: 'Level', value: meta.level },
      { label: 'ATK', value: meta.atk },
      { label: 'DEF', value: meta.def },
      { label: 'Number (ES)', value: meta.numberES },
      { label: 'Number (EN)', value: meta.numberEN },
    )
  } else if (franchise === 'pokemon') {
    rows.push(
      { label: 'Expansion', value: meta.expansion },
      { label: 'Card Number', value: meta.cardNumber },
      { label: 'Rarity', value: meta.rarity },
      { label: 'Card Type', value: meta.cardType },
      { label: 'HP', value: meta.hp },
      { label: 'Stage', value: meta.stage },
      { label: 'Artist', value: meta.artist },
      { label: 'Card Text', value: meta.cardText },
    )
  } else if (franchise === 'onepiece') {
    rows.push(
      { label: 'Expansion', value: meta.expansion },
      { label: 'Rarity', value: meta.rarity },
      { label: 'Number', value: meta.number },
      { label: 'Color', value: meta.color },
      { label: 'Card Type', value: meta.cardType },
      { label: 'Cost', value: meta.cost },
      { label: 'Power', value: meta.power },
      { label: 'Subtype(s)', value: meta.subtypes },
      { label: 'Attribute', value: meta.attribute },
      { label: 'Artist', value: meta.artist },
    )
  }

  const visible = rows.filter(r => r.value)
  if (!visible.length) return null

  return (
    <Box bg="#111111" borderRadius="xl" p={4} border="1px solid #1e1e1e">
      <Text fontSize="10px" color="gray.700" textTransform="uppercase" letterSpacing="0.1em" mb={2}>
        Datos de la carta
      </Text>
      {visible.map(r => <MetaRow key={r.label} label={r.label} value={r.value} />)}
    </Box>
  )
}
import { FRANCHISE_CONFIG, formatPrice, getStockLabel, CONDITION_ORDER, CONDITION_LABELS, type ProductVariant, type Product } from '../types'
import { fetchProductById } from '../hooks/useProducts'
import { useProducts } from '../hooks/useProducts'
import { useCart } from '../context/CartContext'
import { ProductGallery } from '../components/ProductGallery'
import { ProductCard } from '../components/ProductCard'

export function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [product, setProduct] = useState<Product | null>(() => getProductById(id ?? '') ?? null)
  const allProducts = useProducts()
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product ? product.variants[0] : null
  )

  useEffect(() => { window.scrollTo(0, 0) }, [id])

  // Si no está en mock, buscar en la BD
  useEffect(() => {
    if (product) return
    fetchProductById(id ?? '').then((p) => {
      if (p) {
        setProduct(p)
        setSelectedVariant(p.variants[0] ?? null)
      }
    })
  }, [id, product])

  if (!product) {
    return (
      <Box pt="88px" pb={20} minH="100vh">
        <Container maxW="1280px">
          <VStack py={24} spacing={4} align="center">
            <Text fontFamily="heading" fontSize="80px" color="gray.800">404</Text>
            <Text color="gray.500" fontSize="16px">Producto no encontrado</Text>
            <Button variant="outline_brand" leftIcon={<FiArrowLeft />} onClick={() => navigate('/catalogo')}>
              Volver al catálogo
            </Button>
          </VStack>
        </Container>
      </Box>
    )
  }

  const franchise = FRANCHISE_CONFIG[product.franchise]
  const isSingles = product.type === 'singles'

  // Unique languages available
  const languages = [...new Set(product.variants.map((v) => v.language))]
  const selectedLanguage = (selectedVariant ?? product.variants[0]).language

  // Variants for selected language, sorted by condition order
  const variantsForLanguage = product.variants
    .filter((v) => v.language === selectedLanguage)
    .sort((a, b) => {
      const ai = CONDITION_ORDER.indexOf(a.condition ?? 'NM')
      const bi = CONDITION_ORDER.indexOf(b.condition ?? 'NM')
      return ai - bi
    })

  // Show condition selector only when singles has multiple distinct conditions for this language
  const availableConditions = isSingles
    ? CONDITION_ORDER.filter((c) => variantsForLanguage.some((v) => (v.condition ?? 'NM') === c))
    : []
  const showConditionSelector = availableConditions.length > 1

  const variant = selectedVariant ?? product.variants[0]
  const stock = getStockLabel(variant.stock)
  const isOutOfStock = variant.stock === 0

  const handleLanguageChange = (lang: string) => {
    // Buscar mejor condición disponible (NM primero), fallback al primer variant del idioma
    const best =
      CONDITION_ORDER.map((c) =>
        product.variants.find((v) => v.language === lang && (v.condition ?? 'NM') === c)
      ).find(Boolean) ?? product.variants.find((v) => v.language === lang)
    if (best) { setSelectedVariant(best); setQuantity(1) }
  }

  const handleConditionChange = (condition: string) => {
    const v = variantsForLanguage.find((v) => (v.condition ?? 'NM') === condition)
    if (v) { setSelectedVariant(v); setQuantity(1) }
  }

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) addToCart(product, variant)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const related = allProducts
    .filter((p) => p.franchise === product.franchise && p.id !== product.id)
    .slice(0, 4)

  return (
    <Box pt="88px" pb={20} minH="100vh">
      <Container maxW="1280px">
        {/* Go back */}
        <Box
          as="button"
          display="inline-flex"
          alignItems="center"
          gap={2}
          mb={6}
          fontSize="13px"
          color="gray.500"
          _hover={{ color: 'brand.400' }}
          transition="color 0.15s"
          onClick={() => navigate(-1)}
        >
          <FiArrowLeft size={14} />
          Volver
        </Box>

        {/* Breadcrumb */}
        <Breadcrumb
          separator={<ChevronRightIcon color="gray.700" />}
          mb={8}
          fontSize="12px"
          color="gray.600"
        >
          <BreadcrumbItem>
            <BreadcrumbLink as={Link} to="/" _hover={{ color: 'brand.400' }}>
              Inicio
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink
              as={Link}
              to="/catalogo"
              _hover={{ color: 'brand.400' }}
            >
              Catálogo
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink
              as={Link}
              to={`/catalogo?franchise=${product.franchise}`}
              _hover={{ color: 'brand.400' }}
            >
              {franchise.label}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <Text color="gray.500" noOfLines={1} maxW="200px">{product.name}</Text>
          </BreadcrumbItem>
        </Breadcrumb>

        {/* Main content */}
        <Grid
          templateColumns={{ base: '1fr', lg: '3fr 5fr' }}
          gap={{ base: 8, lg: 14 }}
          alignItems="flex-start"
        >
          {/* Gallery */}
          <Box position={{ lg: 'sticky' }} top="88px">
            <ProductGallery images={product.images} name={product.name} />
          </Box>

          {/* Product info */}
          <VStack align="stretch" spacing={6}>
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
                letterSpacing="0.08em"
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
                <Badge
                  bg="accent.400"
                  color="white"
                  fontSize="11px"
                  px={3}
                  py={1}
                  borderRadius="full"
                >
                  NUEVO
                </Badge>
              )}
            </HStack>

            {/* Name */}
            <Box>
              <Heading
                fontFamily="body"
                fontSize={{ base: '22px', md: '28px' }}
                fontWeight={700}
                color="white"
                lineHeight={1.25}
              >
                {product.name}
              </Heading>
            </Box>

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
                        {lang}
                        {allOut && ' (agotado)'}
                      </Button>
                    )
                  })}
                </HStack>
              </VStack>
            )}

            {/* Condition selector — solo singles con múltiples condiciones */}
            {showConditionSelector && (
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
                        variant={(variant.condition ?? 'NM') === cond ? 'primary' : 'outline_brand'}
                        onClick={() => handleConditionChange(cond)}
                        fontSize="12px"
                        h="32px"
                        px={4}
                        opacity={outOfStock ? 0.4 : 1}
                        isDisabled={outOfStock}
                        title={CONDITION_LABELS[cond]}
                      >
                        {cond}
                      </Button>
                    )
                  })}
                </HStack>
                <Text fontSize="11px" color="gray.600">
                  {CONDITION_LABELS[variant.condition ?? 'NM']}
                </Text>
              </VStack>
            )}

            {/* Price */}
            <VStack align="flex-start" spacing={1}>
              <HStack spacing={3} align="baseline">
                <Text
                  fontFamily="heading"
                  fontSize="42px"
                  color="brand.400"
                  lineHeight={1}
                  letterSpacing="0.02em"
                >
                  {formatPrice(variant.price)}
                </Text>
                {variant.originalPrice && (
                  <Text fontSize="18px" color="gray.600" textDecoration="line-through">
                    {formatPrice(variant.originalPrice)}
                  </Text>
                )}
              </HStack>
              {variant.originalPrice && (
                <Badge bg="accent.400" color="white" fontSize="11px" px={2} borderRadius="full">
                  -{Math.round((1 - variant.price / variant.originalPrice) * 100)}% DESCUENTO
                </Badge>
              )}
            </VStack>

            {/* Stock */}
            <HStack spacing={2}>
              <Box
                w="8px"
                h="8px"
                borderRadius="full"
                bg={isOutOfStock ? 'gray.700' : stock.color}
                flexShrink={0}
              />
              <Text fontSize="13px" color={stock.color} fontWeight={500}>
                {stock.label}
              </Text>
            </HStack>

            <Divider borderColor="#1e1e1e" />

            {/* Add to cart */}
            {!isOutOfStock && (
              <VStack align="stretch" spacing={3}>
                <Text fontSize="12px" color="gray.600" fontWeight={600} textTransform="uppercase" letterSpacing="0.08em">
                  Cantidad
                </Text>
                <HStack spacing={3}>
                  <NumberInput
                    value={quantity}
                    min={1}
                    max={variant.stock}
                    onChange={(_, val) => setQuantity(val)}
                    w="110px"
                    size="md"
                  >
                    <NumberInputField
                      bg="#1a1a1a"
                      border="1px solid #2a2a2a"
                      color="white"
                      textAlign="center"
                      _focus={{ borderColor: 'brand.400' }}
                    />
                    <NumberInputStepper>
                      <NumberIncrementStepper
                        borderColor="#2a2a2a"
                        color="gray.500"
                        _hover={{ bg: '#2a2a2a' }}
                      />
                      <NumberDecrementStepper
                        borderColor="#2a2a2a"
                        color="gray.500"
                        _hover={{ bg: '#2a2a2a' }}
                      />
                    </NumberInputStepper>
                  </NumberInput>

                  <Button
                    flex={1}
                    size="md"
                    variant={added ? 'outline_brand' : 'primary'}
                    leftIcon={<FiShoppingCart />}
                    onClick={handleAddToCart}
                    transition="all 0.2s"
                  >
                    {added ? '¡Añadido! ✓' : 'Añadir al carrito'}
                  </Button>
                </HStack>

                <Text fontSize="11px" color="gray.700" textAlign="center">
                  Subtotal: {formatPrice(variant.price * quantity)}
                </Text>
              </VStack>
            )}

            {isOutOfStock && (
              <Button variant="outline_brand" isDisabled size="lg" w="full">
                Producto agotado
              </Button>
            )}

            <Divider borderColor="#1e1e1e" />

            {/* Description */}
            <VStack align="stretch" spacing={2}>
              <Text fontSize="12px" fontWeight={700} color="gray.500" textTransform="uppercase" letterSpacing="0.1em">
                Descripción
              </Text>
              <Text fontSize="14px" color="gray.400" lineHeight={1.8}>
                {product.description}
              </Text>
            </VStack>

            {/* Tags info */}
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
                    <Text fontSize="13px" color="gray.300" fontWeight={500}>
                      {info.value}
                    </Text>
                  </VStack>
                ))}
              </SimpleGrid>
            </Box>

            {/* Singles metadata */}
            {product.type === 'singles' && product.metadata && Object.keys(product.metadata).length > 0 && (
              <CardMetadataBlock franchise={product.franchise} meta={product.metadata} />
            )}
          </VStack>
        </Grid>

        {/* Related products */}
        {related.length > 0 && (
          <Box mt={20}>
            <Flex justify="space-between" align="baseline" mb={6}>
              <Heading
                fontFamily="heading"
                fontSize={{ base: '32px', md: '40px' }}
                color="white"
                letterSpacing="0.03em"
              >
                MÁS DE {franchise.label.toUpperCase()}
              </Heading>
              <Button
                variant="outline_brand"
                size="sm"
                as={Link}
                to={`/catalogo?franchise=${product.franchise}`}
              >
                Ver todos
              </Button>
            </Flex>
            <SimpleGrid columns={{ base: 2, sm: 3, lg: 4 }} spacing={{ base: 3, md: 5 }}>
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </SimpleGrid>
          </Box>
        )}
      </Container>
    </Box>
  )
}
