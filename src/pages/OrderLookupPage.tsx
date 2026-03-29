import { useState } from 'react'
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Input,
  Button,
  Alert,
  AlertIcon,
  FormControl,
  FormLabel,
  Divider,
  HStack,
  Image,
  Badge,
  SimpleGrid,
} from '@chakra-ui/react'
import { FiSearch, FiPackage } from 'react-icons/fi'
import { FRANCHISE_CONFIG, formatPrice } from '../types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

const inputStyles = {
  bg: '#1a1a1a',
  border: '1px solid #2a2a2a',
  color: 'white',
  _placeholder: { color: 'gray.600' },
  _focus: { borderColor: 'brand.400', boxShadow: 'none' },
  _hover: { borderColor: '#3a3a3a' },
  size: 'md' as const,
}

const labelStyles = {
  fontSize: '11px' as const,
  fontWeight: 600 as const,
  color: 'gray.500',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  mb: 1,
}

interface OrderItem {
  id: string
  productName: string
  productImage: string | null
  quantity: number
  price: number
}

interface Order {
  id: string
  total: number
  status: string
  createdAt: string
  guestEmail: string
  guestName: string
  guestPhone: string
  items: OrderItem[]
}

export function OrderLookupPage() {
  const [orderId, setOrderId] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLookup = async () => {
    if (!orderId.trim() || !guestEmail.trim()) {
      setError('Por favor completa ambos campos')
      return
    }

    setLoading(true)
    setError('')
    setOrder(null)

    try {
      const response = await fetch(
        `${API_URL}/api/orders/${orderId}/public?guestEmail=${encodeURIComponent(guestEmail)}`
      )

      if (response.ok) {
        const data = await response.json()
        setOrder(data.order)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Orden no encontrada. Verifica el ID y el email.')
      }
    } catch (err) {
      setError('Error al buscar la orden. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      pending_shipping: { label: 'Pendiente de envío', color: 'yellow' },
      shipped: { label: 'Enviado', color: 'blue' },
      delivered: { label: 'Entregado', color: 'green' },
    }
    const config = statusConfig[status] || { label: status, color: 'gray' }
    return (
      <Badge colorScheme={config.color} fontSize="11px" px={3} py={1} borderRadius="full">
        {config.label}
      </Badge>
    )
  }

  return (
    <Box pt="88px" pb={20} minH="100vh">
      <Container maxW="800px">
        <VStack align="flex-start" spacing={6} mb={8}>
          <VStack align="flex-start" spacing={2}>
            <Text
              fontSize="11px"
              color="brand.400"
              fontWeight={700}
              letterSpacing="0.15em"
              textTransform="uppercase"
            >
              Consultar orden
            </Text>
            <Heading
              fontFamily="heading"
              fontSize={{ base: '40px', md: '52px' }}
              color="white"
              letterSpacing="0.03em"
            >
              BUSCAR PEDIDO
            </Heading>
            <Text color="gray.400" fontSize="14px">
              Si compraste como invitado, ingresa el ID de tu orden y el email que usaste en la compra.
            </Text>
          </VStack>

          <Box
            w="full"
            bg="#111111"
            border="1px solid #1e1e1e"
            borderRadius="xl"
            p={6}
          >
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel {...labelStyles}>ID de Orden</FormLabel>
                <Input
                  {...inputStyles}
                  placeholder="Ej: clxyz123abc..."
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                />
                <Text fontSize="11px" color="gray.600" mt={1}>
                  Puedes encontrar el ID en el email de confirmación
                </Text>
              </FormControl>

              <FormControl>
                <FormLabel {...labelStyles}>Email usado en la compra</FormLabel>
                <Input
                  {...inputStyles}
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                />
              </FormControl>

              {error && (
                <Alert status="error" borderRadius="md" fontSize="13px">
                  <AlertIcon />
                  {error}
                </Alert>
              )}

              <Button
                colorScheme="brand"
                size="lg"
                leftIcon={<FiSearch />}
                onClick={handleLookup}
                isLoading={loading}
                w="full"
              >
                Buscar Orden
              </Button>
            </VStack>
          </Box>
        </VStack>

        {order && (
          <VStack spacing={6} align="stretch">
            <Box
              bg="#111111"
              border="1px solid #1e1e1e"
              borderRadius="xl"
              p={6}
            >
              <HStack justify="space-between" mb={4}>
                <VStack align="flex-start" spacing={1}>
                  <Text fontSize="11px" color="gray.600" textTransform="uppercase" letterSpacing="0.08em">
                    Orden
                  </Text>
                  <Text fontSize="18px" fontWeight={700} color="white">
                    #{order.id.slice(-8)}
                  </Text>
                </VStack>
                {getStatusBadge(order.status)}
              </HStack>

              <Divider borderColor="#1e1e1e" mb={4} />

              <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4} mb={4}>
                <VStack align="flex-start" spacing={1}>
                  <Text fontSize="11px" color="gray.600" textTransform="uppercase">
                    Fecha
                  </Text>
                  <Text fontSize="13px" color="gray.300">
                    {new Date(order.createdAt).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                </VStack>

                <VStack align="flex-start" spacing={1}>
                  <Text fontSize="11px" color="gray.600" textTransform="uppercase">
                    Email
                  </Text>
                  <Text fontSize="13px" color="gray.300">
                    {order.guestEmail}
                  </Text>
                </VStack>

                <VStack align="flex-start" spacing={1}>
                  <Text fontSize="11px" color="gray.600" textTransform="uppercase">
                    Total
                  </Text>
                  <Text fontSize="18px" fontWeight={700} color="brand.400">
                    {formatPrice(order.total)}
                  </Text>
                </VStack>
              </SimpleGrid>

              <Divider borderColor="#1e1e1e" mb={4} />

              <VStack align="stretch" spacing={3}>
                <Text fontSize="12px" fontWeight={600} color="gray.500" textTransform="uppercase" letterSpacing="0.08em">
                  Productos ({order.items.length})
                </Text>
                {order.items.map((item) => (
                  <HStack
                    key={item.id}
                    py={3}
                    spacing={3}
                    borderBottom="1px solid #1a1a1a"
                    _last={{ borderBottom: 'none' }}
                  >
                    <Box
                      w="50px"
                      h="66px"
                      borderRadius="md"
                      overflow="hidden"
                      flexShrink={0}
                      bg="#0d0d0d"
                    >
                      {item.productImage && (
                        <Image
                          src={item.productImage}
                          alt={item.productName}
                          w="full"
                          h="full"
                          objectFit="cover"
                        />
                      )}
                      {!item.productImage && (
                        <Box
                          w="full"
                          h="full"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <FiPackage size={20} color="#333" />
                        </Box>
                      )}
                    </Box>
                    <VStack align="flex-start" spacing={0} flex={1} minW={0}>
                      <Text fontSize="13px" fontWeight={600} color="gray.200" noOfLines={2}>
                        {item.productName}
                      </Text>
                      <Text fontSize="11px" color="gray.600">
                        Cantidad: {item.quantity}
                      </Text>
                    </VStack>
                    <Text fontSize="14px" fontWeight={700} color="brand.400" flexShrink={0}>
                      {formatPrice(item.price * item.quantity)}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </Box>
          </VStack>
        )}
      </Container>
    </Box>
  )
}
