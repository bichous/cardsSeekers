import { useState } from 'react'
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
import { getProductById, products } from '../data/products'
import { FRANCHISE_CONFIG, formatPrice, getStockLabel } from '../types'
import { useCart } from '../context/CartContext'
import { ProductGallery } from '../components/ProductGallery'
import { ProductCard } from '../components/ProductCard'

export function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  const product = getProductById(id ?? '')

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
  const stock = getStockLabel(product.stock)
  const isOutOfStock = product.stock === 0

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) addToCart(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  // Related products: same franchise, different product
  const related = products
    .filter((p) => p.franchise === product.franchise && p.id !== product.id)
    .slice(0, 4)

  return (
    <Box pt="88px" pb={20} minH="100vh">
      <Container maxW="1280px">
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
          templateColumns={{ base: '1fr', lg: '1fr 1fr' }}
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
                  {formatPrice(product.price)}
                </Text>
                {product.originalPrice && (
                  <Text fontSize="18px" color="gray.600" textDecoration="line-through">
                    {formatPrice(product.originalPrice)}
                  </Text>
                )}
              </HStack>
              {product.originalPrice && (
                <Badge bg="accent.400" color="white" fontSize="11px" px={2} borderRadius="full">
                  -{Math.round((1 - product.price / product.originalPrice) * 100)}% DESCUENTO
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
                    max={product.stock}
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
                  Subtotal: {formatPrice(product.price * quantity)}
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
