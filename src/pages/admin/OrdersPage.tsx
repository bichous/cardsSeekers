import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Flex,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Text,
  HStack,
  Select,
  Spinner,
  Center,
  VStack,
  Tooltip,
  useToast,
} from '@chakra-ui/react'
import { useAuth } from '../../context/AuthContext'
import { formatPrice } from '../../types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

interface OrderUser {
  id: string
  email: string
  nombre?: string | null
}

interface OrderItem {
  id: string
  productName: string
  quantity: number
  price: number
}

interface Order {
  id: string
  total: number
  status: string
  createdAt: string
  user: OrderUser
  items: OrderItem[]
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending_shipping: { label: 'Pendiente de envío', color: 'yellow' },
  shipped: { label: 'Enviado', color: 'blue' },
  delivered: { label: 'Entregado', color: 'green' },
}

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? { label: status, color: 'gray' }
  return (
    <Badge colorScheme={config.color} fontSize="10px" px={2} py="2px" borderRadius="full">
      {config.label}
    </Badge>
  )
}

export function OrdersPage() {
  const { token } = useAuth()
  const toast = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      setOrders(await res.json())
    } catch {
      toast({ title: 'Error al cargar pedidos', status: 'error', duration: 3000 })
    } finally {
      setLoading(false)
    }
  }, [token, toast])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const updateStatus = async (orderId: string, status: string) => {
    setUpdatingId(orderId)
    try {
      const res = await fetch(`${API_URL}/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
      toast({ title: 'Estado actualizado', status: 'success', duration: 2000 })
    } catch {
      toast({ title: 'Error al actualizar estado', status: 'error', duration: 3000 })
    } finally {
      setUpdatingId(null)
    }
  }

  const displayed = filterStatus
    ? orders.filter(o => o.status === filterStatus)
    : orders

  const counts = {
    pending_shipping: orders.filter(o => o.status === 'pending_shipping').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  }

  return (
    <Box p={8}>
      {/* Header */}
      <Flex justify="space-between" align="flex-start" mb={6}>
        <Box>
          <Heading fontFamily="heading" fontSize="28px" color="white" letterSpacing="0.04em">
            PEDIDOS
          </Heading>
          <Text fontSize="13px" color="gray.500" mt={1}>
            {orders.length} pedidos en total
          </Text>
        </Box>

        {/* Summary pills */}
        <HStack spacing={3}>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <HStack
              key={key}
              bg="#111111"
              border="1px solid #1e1e1e"
              borderRadius="lg"
              px={4}
              py={2}
              spacing={2}
            >
              <Badge colorScheme={cfg.color} fontSize="9px">{cfg.label}</Badge>
              <Text fontSize="16px" fontWeight={700} color="white">
                {counts[key as keyof typeof counts] ?? 0}
              </Text>
            </HStack>
          ))}
        </HStack>
      </Flex>

      {/* Filter */}
      <HStack mb={5}>
        <Select
          size="sm"
          maxW="220px"
          bg="#111111"
          borderColor="#1e1e1e"
          color="gray.300"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </Select>
      </HStack>

      {/* Table */}
      {loading ? (
        <Center py={20}><Spinner color="brand.400" size="lg" /></Center>
      ) : displayed.length === 0 ? (
        <Center py={20}>
          <Text color="gray.600">No hay pedidos con este estado.</Text>
        </Center>
      ) : (
        <Box bg="#111111" border="1px solid #1e1e1e" borderRadius="xl" overflow="hidden">
          <Table size="sm" variant="unstyled">
            <Thead bg="#161616">
              <Tr>
                <Th color="gray.600" fontSize="10px" letterSpacing="0.1em" py={3} pl={5}>PEDIDO</Th>
                <Th color="gray.600" fontSize="10px" letterSpacing="0.1em">CLIENTE</Th>
                <Th color="gray.600" fontSize="10px" letterSpacing="0.1em">PRODUCTOS</Th>
                <Th color="gray.600" fontSize="10px" letterSpacing="0.1em">FECHA</Th>
                <Th color="gray.600" fontSize="10px" letterSpacing="0.1em" isNumeric>TOTAL</Th>
                <Th color="gray.600" fontSize="10px" letterSpacing="0.1em">ESTADO</Th>
              </Tr>
            </Thead>
            <Tbody>
              {displayed.map((order, i) => (
                <Tr
                  key={order.id}
                  borderTop={i > 0 ? '1px solid #1a1a1a' : undefined}
                  _hover={{ bg: '#161616' }}
                  transition="background 0.15s"
                >
                  <Td py={3} pl={5}>
                    <Text fontSize="11px" color="gray.600" fontFamily="mono">
                      #{order.id.slice(-8).toUpperCase()}
                    </Text>
                  </Td>
                  <Td>
                    <VStack spacing={0} align="flex-start">
                      <Text fontSize="13px" color="gray.200" fontWeight={500}>
                        {order.user.nombre ?? '—'}
                      </Text>
                      <Text fontSize="11px" color="gray.600">{order.user.email}</Text>
                    </VStack>
                  </Td>
                  <Td>
                    <Tooltip
                      label={order.items.map(it => `${it.productName} ×${it.quantity}`).join(', ')}
                      placement="top"
                      hasArrow
                    >
                      <Text fontSize="12px" color="gray.400" noOfLines={1} maxW="200px" cursor="default">
                        {order.items.map(it => `${it.productName} ×${it.quantity}`).join(', ')}
                      </Text>
                    </Tooltip>
                  </Td>
                  <Td>
                    <Text fontSize="12px" color="gray.500">
                      {new Date(order.createdAt).toLocaleDateString('es-MX', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                  </Td>
                  <Td isNumeric>
                    <Text fontSize="13px" color="brand.400" fontWeight={600}>
                      {formatPrice(order.total)}
                    </Text>
                  </Td>
                  <Td>
                    <Select
                      size="xs"
                      bg="#0d0d0d"
                      borderColor="#2a2a2a"
                      color="gray.300"
                      value={order.status}
                      onChange={e => updateStatus(order.id, e.target.value)}
                      isDisabled={updatingId === order.id}
                      maxW="180px"
                      borderRadius="md"
                    >
                      {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                        <option key={key} value={key}>{cfg.label}</option>
                      ))}
                    </Select>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}
    </Box>
  )
}
