import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  HStack,
  Box,
  Image,
  Text,
  IconButton,
  Button,
  Divider,
  Flex,
  Badge,
} from '@chakra-ui/react'
import { AddIcon, MinusIcon, DeleteIcon } from '@chakra-ui/icons'
import { FiShoppingBag } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { FRANCHISE_CONFIG, formatPrice, cartKey } from '../types'

export function CartDrawer() {
  const { state, closeCart, removeFromCart, updateQty, total, itemCount } = useCart()
  const navigate = useNavigate()

  const handleGoToCart = () => {
    closeCart()
    navigate('/carrito')
  }

  const handleCheckout = () => {
    closeCart()
    navigate('/checkout')
  }

  return (
    <Drawer isOpen={state.isOpen} onClose={closeCart} placement="right" size="sm">
      <DrawerOverlay bg="rgba(0,0,0,0.7)" />
      <DrawerContent bg="#111111" borderLeft="1px solid #2a2a2a">
        <DrawerCloseButton color="gray.400" />

        <DrawerHeader borderBottom="1px solid #1e1e1e" pb={4}>
          <HStack spacing={2}>
            <FiShoppingBag size={18} color="#FFD000" />
            <Text fontFamily="heading" fontSize="20px" letterSpacing="0.05em">
              Carrito
            </Text>
            {itemCount > 0 && (
              <Badge bg="brand.400" color="gray.900" borderRadius="full" fontSize="11px" px={2}>
                {itemCount}
              </Badge>
            )}
          </HStack>
        </DrawerHeader>

        <DrawerBody p={0}>
          {state.items.length === 0 ? (
            <Flex
              direction="column"
              align="center"
              justify="center"
              h="full"
              gap={3}
              py={16}
              color="gray.600"
            >
              <FiShoppingBag size={48} />
              <Text fontWeight={600} fontSize="15px" color="gray.500">
                Tu carrito está vacío
              </Text>
              <Text fontSize="13px" color="gray.700" textAlign="center" px={8}>
                Añade productos del catálogo para empezar
              </Text>
              <Button
                size="sm"
                variant="outline_brand"
                mt={2}
                onClick={() => { closeCart(); navigate('/catalogo') }}
              >
                Ver catálogo
              </Button>
            </Flex>
          ) : (
            <VStack align="stretch" spacing={0} divider={<Divider borderColor="#1e1e1e" />}>
              {state.items.map((item) => {
                const franchise = FRANCHISE_CONFIG[item.product.franchise]
                const key = cartKey(item.product.id, item.variant.language, item.variant.condition)
                return (
                  <HStack key={key} p={4} spacing={3} align="flex-start">
                    {/* Image */}
                    <Box
                      w="64px"
                      h="86px"
                      borderRadius="md"
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
                        borderRadius="full"
                      >
                        {franchise.label}
                      </Badge>
                      <Text fontSize="12px" fontWeight={600} color="gray.200" lineHeight={1.3} noOfLines={2}>
                        {item.product.name}
                      </Text>
                      <Text fontSize="10px" color="gray.600" textTransform="capitalize">
                        {item.variant.language}
                        {item.product.type === 'singles' && item.variant.condition && (
                          <> · <Text as="span" color="accent.400">{item.variant.condition}</Text></>
                        )}
                      </Text>
                      <Text fontSize="14px" fontWeight={700} color="brand.400">
                        {formatPrice(item.variant.price * item.quantity)}
                      </Text>

                      {/* Qty controls */}
                      <HStack spacing={1} mt={1}>
                        <IconButton
                          aria-label="Reducir cantidad"
                          icon={<MinusIcon boxSize={2} />}
                          size="xs"
                          w="24px"
                          h="24px"
                          minW="24px"
                          bg="#1e1e1e"
                          border="1px solid #2a2a2a"
                          color="gray.400"
                          _hover={{ borderColor: 'brand.400', color: 'brand.400' }}
                          onClick={() => updateQty(key, item.quantity - 1)}
                        />
                        <Text
                          fontSize="13px"
                          fontWeight={600}
                          color="white"
                          w="28px"
                          textAlign="center"
                        >
                          {item.quantity}
                        </Text>
                        <IconButton
                          aria-label="Aumentar cantidad"
                          icon={<AddIcon boxSize={2} />}
                          size="xs"
                          w="24px"
                          h="24px"
                          minW="24px"
                          bg="#1e1e1e"
                          border="1px solid #2a2a2a"
                          color="gray.400"
                          isDisabled={item.quantity >= item.variant.stock}
                          _hover={{ borderColor: 'brand.400', color: 'brand.400' }}
                          onClick={() => updateQty(key, item.quantity + 1)}
                        />
                        <IconButton
                          aria-label="Eliminar del carrito"
                          icon={<DeleteIcon boxSize={3} />}
                          size="xs"
                          w="24px"
                          h="24px"
                          minW="24px"
                          ml={2}
                          bg="transparent"
                          color="gray.600"
                          _hover={{ color: '#FF6B00', bg: 'transparent' }}
                          onClick={() => removeFromCart(key)}
                        />
                      </HStack>
                    </VStack>
                  </HStack>
                )
              })}
            </VStack>
          )}
        </DrawerBody>

        {state.items.length > 0 && (
          <DrawerFooter
            flexDirection="column"
            borderTop="1px solid #1e1e1e"
            bg="#0d0d0d"
            gap={3}
            p={4}
          >
            <HStack justify="space-between" w="full">
              <Text color="gray.400" fontSize="14px">Subtotal</Text>
              <Text fontWeight={700} fontSize="20px" color="brand.400">
                {formatPrice(total)}
              </Text>
            </HStack>
            <Text fontSize="11px" color="gray.700" textAlign="center">
              Gastos de envío calculados en el proceso de pago
            </Text>
            <Button variant="primary" w="full" size="md" onClick={handleCheckout}>
              Pagar con Mercado Pago
            </Button>
            <Button
              variant="ghost"
              w="full"
              size="sm"
              color="gray.500"
              _hover={{ color: 'white' }}
              onClick={handleGoToCart}
            >
              Ver carrito completo
            </Button>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  )
}
