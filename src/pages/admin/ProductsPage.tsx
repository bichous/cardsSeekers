import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Flex,
  Heading,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Text,
  HStack,
  VStack,
  Select,
  Input,
  IconButton,
  useToast,
  Spinner,
  Center,
  useDisclosure,
} from '@chakra-ui/react'
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import { FRANCHISE_CONFIG, formatPrice } from '../../types'
import type { Franchise } from '../../types'
import { ProductFormModal } from './ProductFormModal'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export interface AdminVariant {
  id: string
  productId: string
  language: string
  price: number
  originalPrice?: number | null
  stock: number
}

export interface AdminProduct {
  id: string
  name: string
  franchise: string
  type: string
  category: string
  currency: string
  images: string
  description: string
  featured: boolean
  isNew: boolean
  createdAt: string
  variants: AdminVariant[]
}

export function ProductsPage() {
  const { token } = useAuth()
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()

  const [products, setProducts] = useState<AdminProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [franchise, setFranchise] = useState('')
  const [type, setType] = useState('')
  const [language, setLanguage] = useState('')
  const [search, setSearch] = useState('')
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (franchise) params.set('franchise', franchise)
    if (type) params.set('type', type)
    if (language) params.set('language', language)
    if (search) params.set('search', search)
    try {
      const res = await fetch(`${API_URL}/api/admin/products?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      setProducts(await res.json())
    } catch {
      toast({ title: 'Error al cargar productos', status: 'error', duration: 3000 })
    } finally {
      setLoading(false)
    }
  }, [token, franchise, type, language, search, toast])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return
    try {
      const res = await fetch(`${API_URL}/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      toast({ title: 'Producto eliminado', status: 'success', duration: 2000 })
      fetchProducts()
    } catch {
      toast({ title: 'Error al eliminar', status: 'error', duration: 3000 })
    }
  }

  const openEdit = (product: AdminProduct) => {
    setEditingProduct(product)
    onOpen()
  }

  const openNew = () => {
    setEditingProduct(null)
    onOpen()
  }

  return (
    <Box p={8}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading fontFamily="heading" fontSize="28px" color="white" letterSpacing="0.04em">
            PRODUCTOS
          </Heading>
          <Text fontSize="13px" color="gray.500" mt={1}>
            {products.length} productos en inventario
          </Text>
        </Box>
        <Button
          leftIcon={<FiPlus />}
          variant="primary"
          size="sm"
          onClick={openNew}
        >
          Nuevo producto
        </Button>
      </Flex>

      {/* Filters */}
      <HStack mb={5} spacing={3} flexWrap="wrap">
        <Select
          size="sm"
          maxW="180px"
          bg="#111111"
          borderColor="#1e1e1e"
          value={franchise}
          onChange={e => setFranchise(e.target.value)}
          color="gray.300"
        >
          <option value="">Todas las franquicias</option>
          <option value="pokemon">Pokémon</option>
          <option value="yugioh">Yu-Gi-Oh!</option>
          <option value="onepiece">One Piece</option>
        </Select>
        <Select
          size="sm"
          maxW="150px"
          bg="#111111"
          borderColor="#1e1e1e"
          value={type}
          onChange={e => setType(e.target.value)}
          color="gray.300"
        >
          <option value="">Todos los tipos</option>
          <option value="sealed">Sellados</option>
          <option value="singles">Singles</option>
        </Select>
        <Select
          size="sm"
          maxW="160px"
          bg="#111111"
          borderColor="#1e1e1e"
          value={language}
          onChange={e => setLanguage(e.target.value)}
          color="gray.300"
        >
          <option value="">Todos los idiomas</option>
          <option value="español">Español</option>
          <option value="inglés">Inglés</option>
          <option value="japonés">Japonés</option>
          <option value="portugués">Portugués</option>
        </Select>
        <HStack flex={1} maxW="300px">
          <Input
            size="sm"
            placeholder="Buscar por nombre..."
            bg="#111111"
            borderColor="#1e1e1e"
            color="gray.200"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchProducts()}
          />
          <IconButton
            aria-label="Buscar"
            icon={<FiSearch />}
            size="sm"
            variant="ghost"
            onClick={fetchProducts}
          />
        </HStack>
      </HStack>

      {/* Table */}
      {loading ? (
        <Center py={20}><Spinner color="brand.400" size="lg" /></Center>
      ) : products.length === 0 ? (
        <Center py={20}>
          <Text color="gray.600">No hay productos. ¡Agrega el primero!</Text>
        </Center>
      ) : (
        <Box
          bg="#111111"
          border="1px solid #1e1e1e"
          borderRadius="xl"
          overflow="hidden"
        >
          <Table size="sm" variant="unstyled">
            <Thead bg="#161616">
              <Tr>
                <Th color="gray.600" fontSize="10px" letterSpacing="0.1em" py={3} pl={5}>NOMBRE</Th>
                <Th color="gray.600" fontSize="10px" letterSpacing="0.1em">FRANQUICIA</Th>
                <Th color="gray.600" fontSize="10px" letterSpacing="0.1em">TIPO</Th>
                <Th color="gray.600" fontSize="10px" letterSpacing="0.1em">CATEGORÍA</Th>
                <Th color="gray.600" fontSize="10px" letterSpacing="0.1em">VARIANTES</Th>
                <Th color="gray.600" fontSize="10px" letterSpacing="0.1em"></Th>
              </Tr>
            </Thead>
            <Tbody>
              {products.map((p, i) => {
                const fConfig = FRANCHISE_CONFIG[p.franchise as Franchise]
                return (
                  <Tr
                    key={p.id}
                    borderTop={i > 0 ? '1px solid #1a1a1a' : undefined}
                    _hover={{ bg: '#161616' }}
                    transition="background 0.15s"
                  >
                    <Td py={3} pl={5}>
                      <Text fontSize="13px" color="gray.200" fontWeight={500} noOfLines={1} maxW="220px">
                        {p.name}
                      </Text>
                      {p.isNew && (
                        <Badge colorScheme="orange" fontSize="9px" mt={0.5}>NUEVO</Badge>
                      )}
                    </Td>
                    <Td>
                      <Badge
                        bg={fConfig?.color}
                        color={fConfig?.textColor}
                        fontSize="9px"
                        fontWeight={700}
                        px={2}
                        py="2px"
                        borderRadius="full"
                        textTransform="uppercase"
                      >
                        {fConfig?.label ?? p.franchise}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge
                        colorScheme={p.type === 'sealed' ? 'blue' : 'purple'}
                        fontSize="9px"
                        textTransform="uppercase"
                      >
                        {p.type === 'sealed' ? 'Sellado' : 'Single'}
                      </Badge>
                    </Td>
                    <Td>
                      <Text fontSize="12px" color="gray.500">{p.category}</Text>
                    </Td>
                    <Td>
                      <VStack align="flex-start" spacing={1}>
                        {(p.variants ?? []).map((v) => (
                          <HStack key={v.id} spacing={2}>
                            <Text fontSize="11px" color="gray.500" textTransform="capitalize" minW="56px">{v.language}</Text>
                            <Text fontSize="12px" color="brand.400" fontWeight={600}>{formatPrice(v.price)}</Text>
                            <Text
                              fontSize="11px"
                              fontWeight={600}
                              color={v.stock === 0 ? 'red.400' : v.stock <= 3 ? 'orange.400' : 'green.400'}
                            >
                              ({v.stock})
                            </Text>
                          </HStack>
                        ))}
                      </VStack>
                    </Td>
                    <Td>
                      <HStack spacing={1} justify="flex-end">
                        <IconButton
                          aria-label="Editar"
                          icon={<FiEdit2 size={13} />}
                          size="xs"
                          variant="ghost"
                          colorScheme="gray"
                          onClick={() => openEdit(p)}
                        />
                        <IconButton
                          aria-label="Eliminar"
                          icon={<FiTrash2 size={13} />}
                          size="xs"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => handleDelete(p.id)}
                        />
                      </HStack>
                    </Td>
                  </Tr>
                )
              })}
            </Tbody>
          </Table>
        </Box>
      )}

      <ProductFormModal
        isOpen={isOpen}
        onClose={onClose}
        product={editingProduct}
        onSaved={fetchProducts}
      />
    </Box>
  )
}
