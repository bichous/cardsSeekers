/**
 * CHECKOUT – MAQUETADO CON MERCADO PAGO (MOCK)
 *
 * ── INTEGRACIÓN REAL CON MERCADO PAGO ─────────────────────────────────
 *
 * PASO 1 – Backend (Node.js/Express + SDK oficial):
 *   npm install mercadopago
 *
 *   import { MercadoPagoConfig, Preference } from 'mercadopago'
 *   const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN })
 *
 *   app.post('/api/checkout/preference', async (req, res) => {
 *     const preference = await new Preference(client).create({
 *       body: {
 *         items: req.body.items.map(i => ({
 *           title: i.name,
 *           quantity: i.quantity,
 *           unit_price: i.price,
 *           currency_id: 'EUR', // o 'ARS', 'MXN', etc.
 *         })),
 *         back_urls: {
 *           success: `${process.env.FRONTEND_URL}/checkout/success`,
 *           failure:  `${process.env.FRONTEND_URL}/checkout/failure`,
 *           pending:  `${process.env.FRONTEND_URL}/checkout/pending`,
 *         },
 *         auto_return: 'approved',
 *         notification_url: `${process.env.API_URL}/webhooks/mp`,
 *       },
 *     })
 *     res.json({ preferenceId: preference.id, initPoint: preference.init_point })
 *   })
 *
 * PASO 2 – Frontend (Brick oficial):
 *   npm install @mercadopago/sdk-react
 *
 *   import { initMercadoPago, Wallet } from '@mercadopago/sdk-react'
 *   initMercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY, { locale: 'es-ES' })
 *
 *   const { data } = await fetch('/api/checkout/preference', { method: 'POST', body: JSON.stringify(cartItems) })
 *   <Wallet initialization={{ preferenceId: data.preferenceId }}
 *           customization={{ texts: { valueProp: 'smart_option' } }} />
 *
 * PASO 3 – Variables de entorno:
 *   .env (backend)  → MP_ACCESS_TOKEN=TEST-xxxx...
 *   .env (frontend) → VITE_MP_PUBLIC_KEY=TEST-xxxx...
 * ──────────────────────────────────────────────────────────────────────
 */

import { useState } from 'react'
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
  Divider,
  Badge,
  Flex,
  Spinner,
  Alert,
  AlertIcon,
  AlertDescription,
} from '@chakra-ui/react'
import { Link, useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiShield, FiTruck, FiRefreshCw } from 'react-icons/fi'
import { useCart } from '../context/CartContext'
import { FRANCHISE_CONFIG, formatPrice } from '../types'

type PaymentStep = 'review' | 'processing' | 'success'

const ORDER_NUMBER = `CS-${Date.now().toString().slice(-6)}`

export function CheckoutPage() {
  const { state, total, itemCount, clearCart } = useCart()
  const navigate = useNavigate()
  const [step, setStep] = useState<PaymentStep>('review')

  const shippingCost = total >= 50 ? 0 : 4.99
  const orderTotal = total + shippingCost

  if (state.items.length === 0 && step !== 'success') {
    navigate('/carrito')
    return null
  }

  const handlePayment = async () => {
    setStep('processing')
    // TODO: llamar a POST /api/checkout/preference y redirigir a initPoint
    // Simulación de 2.5 segundos
    await new Promise((r) => setTimeout(r, 2500))
    setStep('success')
    clearCart()
  }

  // ── SUCCESS ──────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <Box pt="88px" pb={20} minH="100vh">
        <Container maxW="600px">
          <Flex direction="column" align="center" py={16} gap={6} textAlign="center">
            <Box
              w="80px"
              h="80px"
              borderRadius="full"
              bg="rgba(255,208,0,0.1)"
              border="2px solid"
              borderColor="brand.400"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="32px"
            >
              ✓
            </Box>
            <VStack spacing={2}>
              <Heading fontFamily="heading" fontSize="48px" color="brand.400" letterSpacing="0.04em">
                ¡PEDIDO REALIZADO!
              </Heading>
              <Text color="gray.400" fontSize="14px">
                Tu pedido <Text as="span" color="white" fontWeight={700}>{ORDER_NUMBER}</Text> ha sido confirmado.
              </Text>
              <Text color="gray.600" fontSize="13px">
                Recibirás un correo de confirmación con los detalles de envío.
              </Text>
            </VStack>

            <Box
              bg="#111111"
              border="1px solid #1e1e1e"
              borderRadius="xl"
              p={5}
              w="full"
              textAlign="left"
            >
              <VStack align="stretch" spacing={3}>
                {[
                  { icon: FiTruck, text: 'Envío estimado: 24–48 horas laborables' },
                  { icon: FiShield, text: 'Pago procesado de forma segura' },
                  { icon: FiRefreshCw, text: 'Devoluciones gratuitas en 30 días' },
                ].map(({ icon: Icon, text }) => (
                  <HStack key={text} spacing={3}>
                    <Icon size={16} color="#FFD000" />
                    <Text fontSize="13px" color="gray.400">{text}</Text>
                  </HStack>
                ))}
              </VStack>
            </Box>

            <HStack spacing={3}>
              <Button variant="primary" onClick={() => navigate('/')}>
                Volver a la tienda
              </Button>
              <Button variant="outline_brand" onClick={() => navigate('/catalogo')}>
                Seguir comprando
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>
    )
  }

  // ── PROCESSING ───────────────────────────────────────────────────────
  if (step === 'processing') {
    return (
      <Box pt="88px" pb={20} minH="100vh">
        <Container maxW="600px">
          <Flex direction="column" align="center" py={24} gap={6}>
            <Spinner size="xl" color="brand.400" thickness="3px" speed="0.8s" />
            <VStack spacing={2} textAlign="center">
              <Text fontWeight={700} fontSize="18px" color="white">
                Procesando tu pago…
              </Text>
              <Text fontSize="13px" color="gray.500">
                No cierres esta ventana. Te redirigiremos en breve.
              </Text>
            </VStack>
          </Flex>
        </Container>
      </Box>
    )
  }

  // ── REVIEW ───────────────────────────────────────────────────────────
  return (
    <Box pt="88px" pb={20} minH="100vh">
      <Container maxW="1000px">
        {/* Header */}
        <VStack align="flex-start" spacing={0} mb={8}>
          <Text fontSize="11px" color="brand.400" fontWeight={700} letterSpacing="0.15em" textTransform="uppercase">
            Finalizar compra
          </Text>
          <Heading fontFamily="heading" fontSize={{ base: '40px', md: '52px' }} color="white" letterSpacing="0.03em">
            CHECKOUT
          </Heading>
        </VStack>

        <Alert status="info" bg="#1a1200" border="1px solid #2a1a00" borderRadius="lg" mb={6}>
          <AlertIcon color="brand.400" />
          <AlertDescription fontSize="12px" color="gray.400">
            <Text as="span" color="brand.400" fontWeight={600}>Modo demo.</Text> La integración real con Mercado Pago
            se activará conectando el backend. Ver comentarios en{' '}
            <Text as="code" fontSize="11px" color="gray.500">CheckoutPage.tsx</Text>.
          </AlertDescription>
        </Alert>

        <Grid templateColumns={{ base: '1fr', lg: '1fr 380px' }} gap={8} alignItems="flex-start">
          {/* Order summary */}
          <VStack align="stretch" spacing={4}>
            <Text fontWeight={700} fontSize="14px" color="gray.400" textTransform="uppercase" letterSpacing="0.08em">
              Artículos ({itemCount})
            </Text>

            <VStack
              align="stretch"
              spacing={0}
              divider={<Divider borderColor="#1e1e1e" />}
              bg="#111111"
              borderRadius="xl"
              overflow="hidden"
              border="1px solid #1e1e1e"
            >
              {state.items.map((item) => {
                const franchise = FRANCHISE_CONFIG[item.product.franchise]
                return (
                  <HStack key={item.product.id} p={4} spacing={3}>
                    <Box
                      w="56px"
                      h="75px"
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
                    <VStack align="flex-start" spacing={1} flex={1} minW={0}>
                      <Badge
                        bg={franchise.color}
                        color={franchise.textColor}
                        fontSize="9px"
                        px={2}
                        py="2px"
                        borderRadius="full"
                      >
                        {franchise.label}
                      </Badge>
                      <Text fontSize="13px" fontWeight={600} color="gray.200" noOfLines={1}>
                        {item.product.name}
                      </Text>
                      <Text fontSize="12px" color="gray.600">
                        {item.quantity} × {formatPrice(item.product.price)}
                      </Text>
                    </VStack>
                    <Text fontSize="14px" fontWeight={700} color="brand.400" flexShrink={0}>
                      {formatPrice(item.product.price * item.quantity)}
                    </Text>
                  </HStack>
                )
              })}
            </VStack>

            <Button
              variant="ghost"
              size="sm"
              color="gray.600"
              leftIcon={<FiArrowLeft size={13} />}
              _hover={{ color: 'white' }}
              alignSelf="flex-start"
              as={Link}
              to="/carrito"
            >
              Editar carrito
            </Button>
          </VStack>

          {/* Payment panel */}
          <Box
            bg="#111111"
            border="1px solid #1e1e1e"
            borderRadius="xl"
            p={6}
            position={{ lg: 'sticky' }}
            top="88px"
          >
            <Text fontWeight={700} fontSize="15px" color="white" mb={5}>
              Resumen de pago
            </Text>

            <VStack align="stretch" spacing={3} mb={4}>
              <HStack justify="space-between">
                <Text fontSize="13px" color="gray.500">Subtotal</Text>
                <Text fontSize="13px" color="gray.300">{formatPrice(total)}</Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="13px" color="gray.500">Envío</Text>
                {shippingCost === 0 ? (
                  <Badge bg="brand.400" color="gray.900" fontSize="10px" px={2} borderRadius="full">
                    GRATIS
                  </Badge>
                ) : (
                  <Text fontSize="13px" color="gray.300">{formatPrice(shippingCost)}</Text>
                )}
              </HStack>
            </VStack>

            <Divider borderColor="#1e1e1e" mb={4} />

            <HStack justify="space-between" mb={6}>
              <Text fontWeight={700} fontSize="16px" color="white">Total</Text>
              <Text fontFamily="heading" fontSize="32px" color="brand.400" letterSpacing="0.02em">
                {formatPrice(orderTotal)}
              </Text>
            </HStack>

            {/* MercadoPago button — mock */}
            <Button
              w="full"
              size="lg"
              bg="#009ee3"
              color="white"
              fontWeight={700}
              fontSize="15px"
              borderRadius="md"
              _hover={{ bg: '#007cc1', transform: 'translateY(-1px)', boxShadow: '0 4px 20px rgba(0,158,227,0.4)' }}
              _active={{ transform: 'translateY(0)' }}
              transition="all 0.2s"
              onClick={handlePayment}
              mb={3}
            >
              🔵 Pagar con Mercado Pago
            </Button>

            <VStack spacing={2} mt={4}>
              {[
                { icon: FiShield, text: 'Pago 100% seguro y encriptado' },
                { icon: FiTruck, text: 'Envío en 24 horas laborables' },
                { icon: FiRefreshCw, text: 'Devoluciones en 30 días' },
              ].map(({ icon: Icon, text }) => (
                <HStack key={text} spacing={2} justify="center">
                  <Icon size={13} color="#666" />
                  <Text fontSize="11px" color="gray.700">{text}</Text>
                </HStack>
              ))}
            </VStack>
          </Box>
        </Grid>
      </Container>
    </Box>
  )
}
