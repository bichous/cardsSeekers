import {
  Box,
  Container,
  Grid,
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  Image,
  IconButton,
  Divider,
  Badge,
  Flex,
} from '@chakra-ui/react'
import { DeleteIcon, AddIcon, MinusIcon } from '@chakra-ui/icons'
import { Link, useNavigate } from 'react-router-dom'
import { FiShoppingBag, FiArrowLeft, FiArrowRight } from 'react-icons/fi'
import { useCart } from '../context/CartContext'
import { FRANCHISE_CONFIG, formatPrice } from '../types'

const SHIPPING_THRESHOLD = 50

export function CartPage() {
  const { state, removeFromCart, updateQty, total, itemCount, clearCart } = useCart()
  const navigate = useNavigate()

  const isFreeShipping = total >= SHIPPING_THRESHOLD
  const shippingCost = isFreeShipping ? 0 : 4.99
  const orderTotal = total + shippingCost

  if (state.items.length === 0) {
    return (
      <Box pt="88px" pb={20} minH="100vh">
        <Container maxW="800px">
          <Flex direction="column" align="center" py={24} gap={4}>
            <FiShoppingBag size={64} color="#2a2a2a" />
            <Heading
              fontFamily="heading"
              fontSize="40px"
              color="gray.700"
              letterSpacing="0.03em"
            >
              CARRITO VACÍO
            </Heading>
            <Text color="gray.600" fontSize="14px">
              Todavía no has añadido ningún producto.
            </Text>
            <Button
              variant="primary"
              size="md"
              leftIcon={<FiArrowLeft />}
              onClick={() => navigate('/catalogo')}
              mt={2}
            >
              Explorar catálogo
            </Button>
          </Flex>
        </Container>
      </Box>
    )
  }

  return (
    <Box pt="88px" pb={20} minH="100vh">
      <Container maxW="1100px">
        {/* Header */}
        <Flex justify="space-between" align="baseline" mb={8} flexWrap="wrap" gap={3}>
          <VStack align="flex-start" spacing={0}>
            <Text fontSize="11px" color="brand.400" fontWeight={700} letterSpacing="0.15em" textTransform="uppercase">
              Resumen
            </Text>
            <Heading fontFamily="heading" fontSize={{ base: '40px', md: '52px' }} color="white" letterSpacing="0.03em">
              TU CARRITO
            </Heading>
          </VStack>
          <HStack spacing={3}>
            <Text fontSize="13px" color="gray.500">
              {itemCount} {itemCount === 1 ? 'artículo' : 'artículos'}
            </Text>
            <Button
              variant="ghost"
              size="xs"
              color="gray.700"
              _hover={{ color: '#FF6B00' }}
              onClick={clearCart}
            >
              Vaciar carrito
            </Button>
          </HStack>
        </Flex>

        <Grid templateColumns={{ base: '1fr', lg: '1fr 360px' }} gap={8} alignItems="flex-start">
          {/* Cart items */}
          <VStack align="stretch" spacing={0} divider={<Divider borderColor="#1e1e1e" />}>
            {state.items.map((item) => {
              const franchise = FRANCHISE_CONFIG[item.product.franchise]
              return (
                <HStack
                  key={item.product.id}
                  p={4}
                  spacing={4}
                  align="flex-start"
                  bg="#111111"
                  _first={{ borderTopRadius: 'xl' }}
                  _last={{ borderBottomRadius: 'xl' }}
                >
                  {/* Image */}
                  <Box
                    as={Link}
                    to={`/producto/${item.product.id}`}
                    w={{ base: '72px', md: '88px' }}
                    h={{ base: '96px', md: '118px' }}
                    borderRadius="lg"
                    overflow="hidden"
                    flexShrink={0}
                    bg="#0d0d0d"
                  >
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.name}
                      w="full"
                      h="full"
                      objectFit="cover"
                    />
                  </Box>

                  {/* Info */}
                  <VStack align="stretch" spacing={1} flex={1} minW={0}>
                    <Badge
                      bg={franchise.color}
                      color={franchise.textColor}
                      fontSize="9px"
                      w="fit-content"
                      px={2}
                      py="2px"
                      borderRadius="full"
                    >
                      {franchise.label}
                    </Badge>
                    <Text
                      as={Link}
                      to={`/producto/${item.product.id}`}
                      fontSize={{ base: '13px', md: '14px' }}
                      fontWeight={600}
                      color="gray.200"
                      lineHeight={1.35}
                      _hover={{ color: 'brand.400' }}
                      noOfLines={2}
                    >
                      {item.product.name}
                    </Text>
                    <Text fontSize="12px" color="gray.600">
                      {item.product.category}
                    </Text>

                    <Flex align="center" justify="space-between" mt={2} flexWrap="wrap" gap={2}>
                      {/* Qty controls */}
                      <HStack spacing={1}>
                        <IconButton
                          aria-label="Reducir"
                          icon={<MinusIcon boxSize={2} />}
                          size="xs"
                          w="28px"
                          h="28px"
                          minW="28px"
                          bg="#1e1e1e"
                          border="1px solid #2a2a2a"
                          color="gray.400"
                          _hover={{ borderColor: 'brand.400', color: 'brand.400' }}
                          onClick={() => updateQty(item.product.id, item.quantity - 1)}
                        />
                        <Text
                          fontSize="14px"
                          fontWeight={700}
                          color="white"
                          w="32px"
                          textAlign="center"
                        >
                          {item.quantity}
                        </Text>
                        <IconButton
                          aria-label="Aumentar"
                          icon={<AddIcon boxSize={2} />}
                          size="xs"
                          w="28px"
                          h="28px"
                          minW="28px"
                          bg="#1e1e1e"
                          border="1px solid #2a2a2a"
                          color="gray.400"
                          isDisabled={item.quantity >= item.product.stock}
                          _hover={{ borderColor: 'brand.400', color: 'brand.400' }}
                          onClick={() => updateQty(item.product.id, item.quantity + 1)}
                        />
                      </HStack>

                      <HStack spacing={3}>
                        <Text fontSize="16px" fontWeight={700} color="brand.400">
                          {formatPrice(item.product.price * item.quantity)}
                        </Text>
                        <IconButton
                          aria-label="Eliminar"
                          icon={<DeleteIcon boxSize={3} />}
                          size="xs"
                          variant="ghost"
                          color="gray.600"
                          _hover={{ color: 'accent.400', bg: 'transparent' }}
                          onClick={() => removeFromCart(item.product.id)}
                        />
                      </HStack>
                    </Flex>
                  </VStack>
                </HStack>
              )
            })}
          </VStack>

          {/* Order summary */}
          <Box
            bg="#111111"
            border="1px solid #1e1e1e"
            borderRadius="xl"
            p={6}
            position={{ lg: 'sticky' }}
            top="88px"
          >
            <Text fontWeight={700} fontSize="15px" color="white" mb={5}>
              Resumen del pedido
            </Text>

            <VStack align="stretch" spacing={3} mb={5}>
              <HStack justify="space-between">
                <Text fontSize="13px" color="gray.500">Subtotal ({itemCount} artículos)</Text>
                <Text fontSize="13px" color="gray.300">{formatPrice(total)}</Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="13px" color="gray.500">Envío</Text>
                {isFreeShipping ? (
                  <Badge bg="brand.400" color="gray.900" fontSize="10px" px={2} borderRadius="full">
                    GRATIS
                  </Badge>
                ) : (
                  <Text fontSize="13px" color="gray.300">{formatPrice(shippingCost)}</Text>
                )}
              </HStack>

              {!isFreeShipping && (
                <Box bg="#1a1a1a" borderRadius="md" p={3} border="1px solid #2a2a2a">
                  <Text fontSize="11px" color="brand.400">
                    ¡Te faltan {formatPrice(SHIPPING_THRESHOLD - total)} para envío gratis!
                  </Text>
                </Box>
              )}
            </VStack>

            <Divider borderColor="#1e1e1e" mb={5} />

            <HStack justify="space-between" mb={5}>
              <Text fontWeight={700} fontSize="15px" color="white">Total</Text>
              <Text fontFamily="heading" fontSize="28px" color="brand.400" letterSpacing="0.02em">
                {formatPrice(orderTotal)}
              </Text>
            </HStack>

            <Button
              variant="primary"
              w="full"
              size="lg"
              rightIcon={<FiArrowRight />}
              onClick={() => navigate('/checkout')}
            >
              Proceder al pago
            </Button>

            <Button
              variant="ghost"
              w="full"
              size="sm"
              color="gray.600"
              leftIcon={<FiArrowLeft size={13} />}
              mt={3}
              _hover={{ color: 'white' }}
              onClick={() => navigate('/catalogo')}
            >
              Seguir comprando
            </Button>

            <Text fontSize="11px" color="gray.700" textAlign="center" mt={4}>
              Pago 100% seguro · Devoluaciones en 30 días
            </Text>
          </Box>
        </Grid>
      </Container>
    </Box>
  )
}
