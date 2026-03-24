import {
  Box,
  Image,
  Text,
  Badge,
  Button,
  VStack,
  HStack,
  Flex,
} from '@chakra-ui/react'
import { FiShoppingCart } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import type { Product } from '../types'
import { FRANCHISE_CONFIG, formatPrice, getStockLabel, getMinVariant } from '../types'
import { useCart } from '../context/CartContext'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart()
  const franchise = FRANCHISE_CONFIG[product.franchise]
  const minVariant = getMinVariant(product)
  const stock = getStockLabel(minVariant.stock)
  const isOutOfStock = minVariant.stock === 0
  const hasMultipleVariants = product.variants.length > 1

  return (
    <Box
      as="article"
      bg="#161616"
      borderRadius="xl"
      overflow="hidden"
      border="1px solid #1e1e1e"
      transition="all 0.25s ease"
      _hover={{
        transform: isOutOfStock ? 'none' : 'translateY(-4px)',
        borderColor: '#2a2a2a',
        boxShadow: isOutOfStock ? 'none' : '0 12px 40px rgba(0,0,0,0.5)',
      }}
      opacity={isOutOfStock ? 0.6 : 1}
      display="flex"
      flexDirection="column"
    >
      {/* Image */}
      <Box
        as={Link}
        to={`/producto/${product.id}`}
        position="relative"
        sx={{ aspectRatio: '15/17' }}
        overflow="hidden"
        bg="#111111"
        display="block"
        aria-label={product.name}
      >
        <Image
          src={product.images[0]}
          alt={product.name}
          w="full"
          h="full"
          objectFit="cover"
          transition="transform 0.4s ease"
          _groupHover={{ transform: 'scale(1.05)' }}
          loading="lazy"
          fallback={
            <Flex
              w="full"
              h="full"
              align="center"
              justify="center"
              bg="#111111"
              color="gray.700"
              fontSize="32px"
              fontFamily="heading"
              letterSpacing="widest"
            >
              CS
            </Flex>
          }
        />

        {/* Badges overlay */}
        <VStack position="absolute" top={2} left={2} align="flex-start" spacing={1}>
          <Badge
            bg={franchise.color}
            color={franchise.textColor}
            fontSize="9px"
            fontWeight={700}
            letterSpacing="0.08em"
            px={2}
            py="2px"
            borderRadius="full"
            textTransform="uppercase"
          >
            {franchise.label}
          </Badge>
          {product.isNew && (
            <Badge
              bg="accent.400"
              color="white"
              fontSize="9px"
              fontWeight={700}
              px={2}
              py="2px"
              borderRadius="full"
            >
              NUEVO
            </Badge>
          )}
        </VStack>
      </Box>

      {/* Content */}
      <VStack p={3} align="stretch" spacing={2} flex={1} justify="space-between">
        <VStack align="stretch" spacing={1}>
          <Text
            as={Link}
            to={`/producto/${product.id}`}
            fontSize="13px"
            fontWeight={600}
            color="gray.100"
            lineHeight={1.4}
            noOfLines={2}
            _hover={{ color: 'brand.400' }}
            transition="color 0.2s"
          >
            {product.name}
          </Text>
          <Text fontSize="11px" color="gray.600" textTransform="uppercase" letterSpacing="0.05em">
            {product.category}
          </Text>
        </VStack>

        <VStack align="stretch" spacing={2}>
          <HStack justify="space-between" align="baseline">
            <HStack spacing={1} align="baseline">
              {hasMultipleVariants && (
                <Text fontSize="11px" color="gray.600" fontWeight={400}>Desde</Text>
              )}
              <Text fontSize="18px" fontWeight={700} color="brand.400" lineHeight={1}>
                {formatPrice(minVariant.price)}
              </Text>
              {minVariant.originalPrice && (
                <Text fontSize="12px" color="gray.600" textDecoration="line-through">
                  {formatPrice(minVariant.originalPrice)}
                </Text>
              )}
            </HStack>
            <Text fontSize="11px" color={stock.color} fontWeight={500}>
              {stock.label}
            </Text>
          </HStack>

          <Button
            size="sm"
            variant={isOutOfStock ? 'outline_brand' : 'primary'}
            isDisabled={isOutOfStock}
            leftIcon={<FiShoppingCart size={13} />}
            fontSize="12px"
            h="34px"
            onClick={() => !isOutOfStock && addToCart(product, minVariant)}
            w="full"
            aria-label={isOutOfStock ? 'Producto agotado' : `Añadir ${product.name} al carrito`}
          >
            {isOutOfStock ? 'Agotado' : 'Añadir al carrito'}
          </Button>
        </VStack>
      </VStack>
    </Box>
  )
}
