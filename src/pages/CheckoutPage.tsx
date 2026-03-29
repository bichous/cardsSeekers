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
 *           currency_id: 'MXN',
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
 *   initMercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY, { locale: 'es-MX' })
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

import { useState, useEffect, useRef } from 'react'
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
  Input,
  Select,
  Checkbox,
  FormControl,
  FormLabel,
  FormErrorMessage,
  SimpleGrid,
  InputGroup,
  InputRightElement,
} from '@chakra-ui/react'
import { Link, useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiArrowRight, FiShield, FiTruck, FiRefreshCw } from 'react-icons/fi'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { FRANCHISE_CONFIG, formatPrice } from '../types'
import { CheckoutStepper } from '../components/CheckoutStepper'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

type CheckoutStep = 'shipping' | 'payment' | 'processing' | 'success'

interface ShippingData {
  email: string
  nombre: string
  apellidos: string
  telefono: string
  calle: string
  numExterior: string
  sinNumero: boolean
  numInterior: string
  referencia: string
  codigoPostal: string
  mismosDataFacturacion: boolean
  facturarEmpresa: boolean
  rfc: string
  razonSocial: string
  regimenFiscal: string
  usoFactura: string
}

const REGIMENES_FISCALES = [
  { value: '601', label: '601 – General de Ley Personas Morales' },
  { value: '603', label: '603 – Personas Morales con Fines no Lucrativos' },
  { value: '605', label: '605 – Sueldos y Salarios' },
  { value: '606', label: '606 – Arrendamiento' },
  { value: '612', label: '612 – Personas Físicas con Actividades Empresariales' },
  { value: '616', label: '616 – Sin obligaciones fiscales' },
  { value: '621', label: '621 – Incorporación Fiscal' },
  { value: '626', label: '626 – Régimen Simplificado de Confianza' },
]

const USOS_CFDI = [
  { value: 'G01', label: 'G01 – Adquisición de mercancias' },
  { value: 'G03', label: 'G03 – Gastos en general' },
  { value: 'I01', label: 'I01 – Construcciones' },
  { value: 'I04', label: 'I04 – Equipo de cómputo y accesorios' },
  { value: 'D01', label: 'D01 – Honorarios médicos y gastos hospitalarios' },
  { value: 'S01', label: 'S01 – Sin efectos fiscales' },
  { value: 'CP01', label: 'CP01 – Pagos' },
]

const ORDER_NUMBER = `CS-${Date.now().toString().slice(-6)}`

const inputStyles = {
  bg: '#1a1a1a',
  border: '1px solid #2a2a2a',
  color: 'white',
  _placeholder: { color: 'gray.600' },
  _focus: { borderColor: 'brand.400', boxShadow: 'none' },
  _hover: { borderColor: '#3a3a3a' },
  size: 'md' as const,
}

const selectStyles = {
  ...inputStyles,
  sx: { option: { bg: '#1a1a1a' } },
}

const labelStyles = {
  fontSize: '11px' as const,
  fontWeight: 600 as const,
  color: 'gray.500',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  mb: 1,
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Box pb={3} borderBottom="1px solid #1e1e1e">
      <Text fontSize="14px" fontWeight={700} color="white" letterSpacing="0.05em">
        {children}
      </Text>
    </Box>
  )
}

export function CheckoutPage() {
  const { state, total, itemCount, clearCart } = useCart()
  const { user, token, updateUser } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState<CheckoutStep>('shipping')

  const shippingCost = total >= 999 ? 0 : 99
  const orderTotal = total + shippingCost

  const prefilled = useRef(false)
  const [form, setForm] = useState<ShippingData>({
    email: user?.email ?? '',
    nombre: user?.nombre ?? '',
    apellidos: user?.apellidos ?? '',
    telefono: user?.telefono ?? '',
    calle: user?.shippingInfo?.calle ?? '',
    numExterior: user?.shippingInfo?.numExterior ?? '',
    sinNumero: false,
    numInterior: user?.shippingInfo?.numInterior ?? '',
    referencia: user?.shippingInfo?.referencia ?? '',
    codigoPostal: user?.shippingInfo?.codigoPostal ?? '',
    mismosDataFacturacion: true,
    facturarEmpresa: false,
    rfc: '',
    razonSocial: '',
    regimenFiscal: '',
    usoFactura: '',
  })

  // Pre-llenar formulario cuando el usuario termine de cargar
  useEffect(() => {
    if (!user || prefilled.current) return
    prefilled.current = true
    setForm((f) => ({
      ...f,
      email: user.email,
      nombre: user.nombre ?? f.nombre,
      apellidos: user.apellidos ?? f.apellidos,
      telefono: user.telefono ?? f.telefono,
      calle: user.shippingInfo?.calle ?? f.calle,
      numExterior: user.shippingInfo?.numExterior ?? f.numExterior,
      numInterior: user.shippingInfo?.numInterior ?? f.numInterior,
      referencia: user.shippingInfo?.referencia ?? f.referencia,
      codigoPostal: user.shippingInfo?.codigoPostal ?? f.codigoPostal,
    }))
  }, [user])

  const set = (field: keyof ShippingData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const toggle = (field: keyof ShippingData) => () =>
    setForm((f) => ({ ...f, [field]: !f[field] }))

  const [submitted, setSubmitted] = useState(false)

  const getErrors = () => ({
    email: !form.email.trim(),
    nombre: !form.nombre.trim(),
    apellidos: !form.apellidos.trim(),
    telefono: !form.telefono.trim(),
    calle: !form.calle.trim(),
    numExterior: !form.sinNumero && !form.numExterior.trim(),
    codigoPostal: cpStatus !== 'valid',
    rfc: form.facturarEmpresa && !form.rfc.trim(),
    razonSocial: form.facturarEmpresa && !form.razonSocial.trim(),
    regimenFiscal: form.facturarEmpresa && !form.regimenFiscal,
    usoFactura: form.facturarEmpresa && !form.usoFactura,
  })

  const handleContinue = () => {
    setSubmitted(true)
    const errs = getErrors()
    if (Object.values(errs).some(Boolean)) return
    setStep('payment')
  }

  // ── CP VALIDATION ─────────────────────────────────────────────────────
  const [cpStatus, setCpStatus] = useState<'idle' | 'loading' | 'valid' | 'error'>('idle')
  const [cpData, setCpData] = useState<{ colonia: string; municipio: string; estado: string } | null>(null)

  useEffect(() => {
    const cp = form.codigoPostal
    if (cp.length !== 5) {
      setCpStatus('idle')
      setCpData(null)
      return
    }
    let cancelled = false
    setCpStatus('loading')
    fetch(`https://sepomex.icalialabs.com/api/v1/zip_codes?zip_code=${cp}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then((data) => {
        if (cancelled || !data.zip_codes?.length) throw new Error()
        const entry = data.zip_codes[0]
        setCpData({
          colonia: entry.d_asenta,
          municipio: entry.d_mnpio,
          estado: entry.d_estado,
        })
        setCpStatus('valid')
      })
      .catch(() => { if (!cancelled) { setCpStatus('error'); setCpData(null) } })
    return () => { cancelled = true }
  }, [form.codigoPostal])

  if (state.items.length === 0 && step !== 'success') {
    navigate('/carrito')
    return null
  }

  const handlePayment = async () => {
    setStep('processing')

    try {
      // Si está autenticado, guardar datos del usuario
      if (user && token) {
        await updateUser({
          nombre: form.nombre || undefined,
          apellidos: form.apellidos || undefined,
          telefono: form.telefono || undefined,
          shippingInfo: cpStatus === 'valid' && form.calle ? {
            calle: form.calle,
            numExterior: form.sinNumero ? null : form.numExterior,
            numInterior: form.numInterior || null,
            referencia: form.referencia || null,
            codigoPostal: form.codigoPostal,
            colonia: cpData?.colonia ?? null,
            municipio: cpData?.municipio ?? null,
            estado: cpData?.estado ?? null,
          } : undefined,
        })
      }

      // Registrar pedido en la base de datos (autenticado o guest)
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          total: orderTotal,
          items: state.items.map((item) => ({
            productId: item.product.id,
            productName: item.product.name,
            productImage: item.product.images[0] ?? null,
            quantity: item.quantity,
            price: item.product.price,
          })),
          // Si no está autenticado, enviar datos guest
          ...(!user && {
            guest: {
              email: form.email,
              name: `${form.nombre} ${form.apellidos}`,
              phone: form.telefono,
            },
          }),
        }),
      })
    } catch (error) {
      console.error('Error creando pedido:', error)
      // No bloquear el flujo si falla el guardado
    }

    // TODO: llamar a POST /api/checkout/preference y redirigir a initPoint
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
              <Button variant="primary" onClick={() => navigate('/')}>Volver a la tienda</Button>
              <Button variant="outline_brand" onClick={() => navigate('/catalogo')}>Seguir comprando</Button>
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
              <Text fontWeight={700} fontSize="18px" color="white">Procesando tu pago…</Text>
              <Text fontSize="13px" color="gray.500">No cierres esta ventana. Te redirigiremos en breve.</Text>
            </VStack>
          </Flex>
        </Container>
      </Box>
    )
  }

  // ── ORDER SUMMARY SIDEBAR (shared between steps) ─────────────────────
  const OrderSummary = (
    <Box
      bg="#111111"
      border="1px solid #1e1e1e"
      borderRadius="xl"
      p={6}
      position={{ lg: 'sticky' }}
      top="88px"
    >
      <Text fontWeight={700} fontSize="15px" color="white" mb={4}>
        Resumen del pedido
      </Text>

      <VStack align="stretch" spacing={0} divider={<Divider borderColor="#1a1a1a" />} mb={4}>
        {state.items.map((item) => {
          const franchise = FRANCHISE_CONFIG[item.product.franchise]
          return (
            <HStack key={item.product.id} py={3} spacing={3}>
              <Box w="44px" h="58px" borderRadius="md" overflow="hidden" flexShrink={0} bg="#0d0d0d">
                <Image src={item.product.images[0]} alt={item.product.name} w="full" h="full" objectFit="cover" />
              </Box>
              <VStack align="flex-start" spacing={0} flex={1} minW={0}>
                <Badge bg={franchise.color} color={franchise.textColor} fontSize="8px" px={2} py="1px" borderRadius="full">
                  {franchise.label}
                </Badge>
                <Text fontSize="12px" fontWeight={600} color="gray.200" noOfLines={1}>{item.product.name}</Text>
                <Text fontSize="11px" color="gray.600">×{item.quantity}</Text>
              </VStack>
              <Text fontSize="13px" fontWeight={700} color="brand.400" flexShrink={0}>
                {formatPrice(item.product.price * item.quantity)}
              </Text>
            </HStack>
          )
        })}
      </VStack>

      <Divider borderColor="#1e1e1e" mb={3} />
      <VStack align="stretch" spacing={2} mb={3}>
        <HStack justify="space-between">
          <Text fontSize="12px" color="gray.500">Subtotal ({itemCount})</Text>
          <Text fontSize="12px" color="gray.300">{formatPrice(total)}</Text>
        </HStack>
        <HStack justify="space-between">
          <Text fontSize="12px" color="gray.500">Envío</Text>
          {shippingCost === 0 ? (
            <Badge bg="brand.400" color="gray.900" fontSize="9px" px={2} borderRadius="full">GRATIS</Badge>
          ) : (
            <Text fontSize="12px" color="gray.300">{formatPrice(shippingCost)}</Text>
          )}
        </HStack>
      </VStack>
      <Divider borderColor="#1e1e1e" mb={3} />
      <HStack justify="space-between">
        <Text fontWeight={700} fontSize="14px" color="white">Total</Text>
        <Text fontFamily="heading" fontSize="28px" color="brand.400" letterSpacing="0.02em">
          {formatPrice(orderTotal)}
        </Text>
      </HStack>
    </Box>
  )

  // ── SHIPPING FORM ─────────────────────────────────────────────────────
  if (step === 'shipping') {
    return (
      <Box pt="88px" pb={20} minH="100vh">
        <Container maxW="1000px">
          <VStack align="flex-start" spacing={0} mb={6}>
            <Text fontSize="11px" color="brand.400" fontWeight={700} letterSpacing="0.15em" textTransform="uppercase">
              Finalizar compra
            </Text>
            <Heading fontFamily="heading" fontSize={{ base: '40px', md: '52px' }} color="white" letterSpacing="0.03em">
              CHECKOUT
            </Heading>
          </VStack>

          <CheckoutStepper currentStep={2} />

          <Grid templateColumns={{ base: '1fr', lg: '1fr 340px' }} gap={8} alignItems="flex-start">
            {/* Form */}
            <VStack align="stretch" spacing={7}>
              {(() => {
                const e = submitted ? getErrors() : {} as ReturnType<typeof getErrors>

              return (<>

              {/* Info para usuarios no autenticados */}
              {!user && (
                <Alert
                  status="info"
                  bg="rgba(0, 153, 255, 0.08)"
                  border="1px solid"
                  borderColor="rgba(0, 153, 255, 0.2)"
                  borderRadius="lg"
                >
                  <AlertIcon color="cyan.400" />
                  <AlertDescription fontSize="13px" color="gray.300">
                    No necesitas crear una cuenta. Completa el formulario con tus datos y podrás realizar tu compra como invitado.
                    Te enviaremos un email con los detalles de tu pedido.
                  </AlertDescription>
                </Alert>
              )}

              {/* Datos de contacto */}
              <VStack align="stretch" spacing={4}>
                <SectionTitle>Datos de contacto</SectionTitle>
                <FormControl isInvalid={!!e.email}>
                  <FormLabel {...labelStyles}>Email</FormLabel>
                  <Input
                    {...inputStyles}
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={form.email}
                    onChange={set('email')}
                  />
                  <FormErrorMessage fontSize="11px">El email es obligatorio</FormErrorMessage>
                </FormControl>
              </VStack>

              {/* Datos del destinatario */}
              <VStack align="stretch" spacing={4}>
                <SectionTitle>Datos del destinatario</SectionTitle>

                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                  <FormControl isInvalid={!!e.nombre}>
                    <FormLabel {...labelStyles}>Nombre</FormLabel>
                    <Input {...inputStyles} placeholder="Nombre" value={form.nombre} onChange={set('nombre')} />
                    <FormErrorMessage fontSize="11px">Obligatorio</FormErrorMessage>
                  </FormControl>
                  <FormControl isInvalid={!!e.apellidos}>
                    <FormLabel {...labelStyles}>Apellidos</FormLabel>
                    <Input {...inputStyles} placeholder="Apellidos" value={form.apellidos} onChange={set('apellidos')} />
                    <FormErrorMessage fontSize="11px">Obligatorio</FormErrorMessage>
                  </FormControl>
                </SimpleGrid>

                <FormControl isInvalid={!!e.telefono}>
                  <FormLabel {...labelStyles}>Teléfono</FormLabel>
                  <Input
                    {...inputStyles}
                    type="tel"
                    placeholder="10 dígitos"
                    value={form.telefono}
                    onChange={set('telefono')}
                  />
                  <FormErrorMessage fontSize="11px">El teléfono es obligatorio</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!e.calle}>
                  <FormLabel {...labelStyles}>Calle</FormLabel>
                  <Input {...inputStyles} placeholder="Nombre de la calle" value={form.calle} onChange={set('calle')} />
                  <FormErrorMessage fontSize="11px">La calle es obligatoria</FormErrorMessage>
                </FormControl>

                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                  <FormControl isInvalid={!!e.numExterior}>
                    <FormLabel {...labelStyles}>Número exterior</FormLabel>
                    <Input
                      {...inputStyles}
                      placeholder={form.sinNumero ? 'S/N' : 'Ej. 123'}
                      value={form.sinNumero ? '' : form.numExterior}
                      onChange={set('numExterior')}
                      isDisabled={form.sinNumero}
                    />
                    <Checkbox
                      mt={2}
                      size="sm"
                      colorScheme="yellow"
                      isChecked={form.sinNumero}
                      onChange={toggle('sinNumero')}
                      sx={{ '& .chakra-checkbox__label': { fontSize: '11px', color: 'gray.500' } }}
                    >
                      Sin número
                    </Checkbox>
                    <FormErrorMessage fontSize="11px">Obligatorio o marca "Sin número"</FormErrorMessage>
                  </FormControl>
                  <FormControl>
                    <FormLabel {...labelStyles}>Número interior <Text as="span" color="gray.700">(opcional)</Text></FormLabel>
                    <Input {...inputStyles} placeholder="Ej. Depto 4B" value={form.numInterior} onChange={set('numInterior')} />
                  </FormControl>
                </SimpleGrid>

                <FormControl>
                  <FormLabel {...labelStyles}>
                    Referencia <Text as="span" color="gray.700">(entre calles, punto de referencia…)</Text>
                  </FormLabel>
                  <Input
                    {...inputStyles}
                    placeholder="Ej. Entre Av. Juárez y Madero"
                    value={form.referencia}
                    onChange={set('referencia')}
                  />
                </FormControl>

                <FormControl isInvalid={cpStatus === 'error' || (!!e.codigoPostal && cpStatus !== 'loading')}>
                  <FormLabel {...labelStyles}>Código postal</FormLabel>
                  {cpStatus === 'valid' && cpData ? (
                    <HStack
                      bg="#1a1a1a"
                      border="1px solid #2a5a2a"
                      borderRadius="md"
                      px={4}
                      py={3}
                      justify="space-between"
                    >
                      <HStack spacing={3}>
                        <Text fontSize="16px" color="green.400">✓</Text>
                        <VStack align="flex-start" spacing={0}>
                          <Text fontSize="13px" color="gray.200" fontWeight={600}>
                            CP {form.codigoPostal} – {cpData.colonia}
                          </Text>
                          <Text fontSize="12px" color="gray.500">
                            {cpData.municipio} – {cpData.estado}
                          </Text>
                        </VStack>
                      </HStack>
                      <Button
                        variant="ghost"
                        size="xs"
                        color="gray.600"
                        _hover={{ color: 'brand.400' }}
                        onClick={() => {
                          setForm((f) => ({ ...f, codigoPostal: '' }))
                          setCpStatus('idle')
                          setCpData(null)
                        }}
                      >
                        Cambiar
                      </Button>
                    </HStack>
                  ) : (
                    <InputGroup>
                      <Input
                        {...inputStyles}
                        placeholder="5 dígitos"
                        maxLength={5}
                        value={form.codigoPostal}
                        onChange={set('codigoPostal')}
                        borderColor={cpStatus === 'error' ? 'red.500' : undefined}
                        _focus={{
                          borderColor: cpStatus === 'error' ? 'red.500' : 'brand.400',
                          boxShadow: 'none',
                        }}
                      />
                      {cpStatus === 'loading' && (
                        <InputRightElement>
                          <Spinner size="xs" color="brand.400" />
                        </InputRightElement>
                      )}
                    </InputGroup>
                  )}
                  {cpStatus === 'error' && (
                    <FormErrorMessage fontSize="11px">Código postal no válido para México</FormErrorMessage>
                  )}
                  {!!e.codigoPostal && cpStatus === 'idle' && (
                    <FormErrorMessage fontSize="11px">Introduce y valida tu código postal</FormErrorMessage>
                  )}
                </FormControl>
              </VStack>

              {/* Datos de facturación */}
              <VStack align="stretch" spacing={4}>
                <SectionTitle>Datos de facturación</SectionTitle>

                <VStack align="stretch" spacing={3}>
                  <Checkbox
                    colorScheme="yellow"
                    isChecked={form.mismosDataFacturacion}
                    onChange={toggle('mismosDataFacturacion')}
                    sx={{ '& .chakra-checkbox__label': { fontSize: '13px', color: 'gray.300' } }}
                  >
                    Mis datos de facturación y entrega son los mismos
                  </Checkbox>

                  <Checkbox
                    colorScheme="yellow"
                    isChecked={form.facturarEmpresa}
                    onChange={toggle('facturarEmpresa')}
                    sx={{ '& .chakra-checkbox__label': { fontSize: '13px', color: 'gray.300' } }}
                  >
                    Facturar como empresa / persona jurídica
                  </Checkbox>
                </VStack>

                {form.facturarEmpresa && (
                  <Box bg="#0f0f0f" border="1px solid #1e1e1e" borderRadius="lg" p={5}>
                    <VStack align="stretch" spacing={4}>
                      <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                        <FormControl isInvalid={!!e.rfc}>
                          <FormLabel {...labelStyles}>RFC (Empresa)</FormLabel>
                          <Input
                            {...inputStyles}
                            placeholder="Ej. ABC123456XY7"
                            maxLength={13}
                            value={form.rfc}
                            onChange={set('rfc')}
                          />
                          <FormErrorMessage fontSize="11px">Obligatorio</FormErrorMessage>
                        </FormControl>
                        <FormControl isInvalid={!!e.razonSocial}>
                          <FormLabel {...labelStyles}>Razón social</FormLabel>
                          <Input
                            {...inputStyles}
                            placeholder="Nombre legal de la empresa"
                            value={form.razonSocial}
                            onChange={set('razonSocial')}
                          />
                          <FormErrorMessage fontSize="11px">Obligatorio</FormErrorMessage>
                        </FormControl>
                      </SimpleGrid>

                      <FormControl isInvalid={!!e.regimenFiscal}>
                        <FormLabel {...labelStyles}>Régimen fiscal</FormLabel>
                        <Select
                          {...selectStyles}
                          placeholder="Selecciona un régimen"
                          value={form.regimenFiscal}
                          onChange={set('regimenFiscal')}
                        >
                          {REGIMENES_FISCALES.map((r) => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </Select>
                        <FormErrorMessage fontSize="11px">Selecciona un régimen fiscal</FormErrorMessage>
                      </FormControl>

                      <FormControl isInvalid={!!e.usoFactura}>
                        <FormLabel {...labelStyles}>Uso de factura (CFDI)</FormLabel>
                        <Select
                          {...selectStyles}
                          placeholder="Selecciona uso de CFDI"
                          value={form.usoFactura}
                          onChange={set('usoFactura')}
                        >
                          {USOS_CFDI.map((u) => (
                            <option key={u.value} value={u.value}>{u.label}</option>
                          ))}
                        </Select>
                        <FormErrorMessage fontSize="11px">Selecciona el uso del CFDI</FormErrorMessage>
                      </FormControl>
                    </VStack>
                  </Box>
                )}
              </VStack>

              <HStack justify="space-between" pt={2}>
                <Button
                  variant="ghost"
                  size="sm"
                  color="gray.600"
                  leftIcon={<FiArrowLeft size={13} />}
                  _hover={{ color: 'white' }}
                  as={Link}
                  to="/carrito"
                >
                  Volver al carrito
                </Button>
                <Button
                  variant="primary"
                  rightIcon={<FiArrowRight size={14} />}
                  onClick={handleContinue}
                >
                  Continuar al pago
                </Button>
              </HStack>

              </>)})()}
            </VStack>

            {/* Sidebar */}
            {OrderSummary}
          </Grid>
        </Container>
      </Box>
    )
  }

  // ── PAYMENT ───────────────────────────────────────────────────────────
  return (
    <Box pt="88px" pb={20} minH="100vh">
      <Container maxW="1000px">
        <VStack align="flex-start" spacing={0} mb={6}>
          <Text fontSize="11px" color="brand.400" fontWeight={700} letterSpacing="0.15em" textTransform="uppercase">
            Finalizar compra
          </Text>
          <Heading fontFamily="heading" fontSize={{ base: '40px', md: '52px' }} color="white" letterSpacing="0.03em">
            CHECKOUT
          </Heading>
        </VStack>

        <CheckoutStepper currentStep={3} />

        <Alert status="info" bg="#1a1200" border="1px solid #2a1a00" borderRadius="lg" mb={6}>
          <AlertIcon color="brand.400" />
          <AlertDescription fontSize="12px" color="gray.400">
            <Text as="span" color="brand.400" fontWeight={600}>Modo demo.</Text> La integración real con Mercado Pago
            se activará conectando el backend. Ver comentarios en{' '}
            <Text as="code" fontSize="11px" color="gray.500">CheckoutPage.tsx</Text>.
          </AlertDescription>
        </Alert>

        <Grid templateColumns={{ base: '1fr', lg: '1fr 340px' }} gap={8} alignItems="flex-start">
          {/* Shipping summary */}
          <VStack align="stretch" spacing={5}>
            <Box bg="#111111" border="1px solid #1e1e1e" borderRadius="xl" p={5}>
              <HStack justify="space-between" mb={4}>
                <Text fontSize="13px" fontWeight={700} color="white">Dirección de entrega</Text>
                <Button
                  variant="ghost"
                  size="xs"
                  color="gray.600"
                  _hover={{ color: 'brand.400' }}
                  onClick={() => setStep('shipping')}
                >
                  Editar
                </Button>
              </HStack>
              <VStack align="stretch" spacing={1}>
                <Text fontSize="13px" color="gray.300">{form.nombre} {form.apellidos}</Text>
                <Text fontSize="13px" color="gray.500">
                  {form.calle} {form.sinNumero ? 'S/N' : form.numExterior}{form.numInterior ? `, ${form.numInterior}` : ''}
                </Text>
                {form.referencia && <Text fontSize="12px" color="gray.600">{form.referencia}</Text>}
                <Text fontSize="13px" color="gray.500">
                  CP {form.codigoPostal}{cpData ? ` – ${cpData.colonia} · ${cpData.municipio} – ${cpData.estado}` : ''}
                </Text>
                <Text fontSize="13px" color="gray.500">{form.email}</Text>
                <Text fontSize="13px" color="gray.500">{form.telefono}</Text>
              </VStack>
            </Box>

            <HStack justify="flex-start" pt={1}>
              <Button
                variant="ghost"
                size="sm"
                color="gray.600"
                leftIcon={<FiArrowLeft size={13} />}
                _hover={{ color: 'white' }}
                onClick={() => setStep('shipping')}
              >
                Volver a envío
              </Button>
            </HStack>
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
            <Text fontWeight={700} fontSize="15px" color="white" mb={5}>Resumen de pago</Text>

            <VStack align="stretch" spacing={3} mb={4}>
              <HStack justify="space-between">
                <Text fontSize="13px" color="gray.500">Subtotal</Text>
                <Text fontSize="13px" color="gray.300">{formatPrice(total)}</Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="13px" color="gray.500">Envío</Text>
                {shippingCost === 0 ? (
                  <Badge bg="brand.400" color="gray.900" fontSize="10px" px={2} borderRadius="full">GRATIS</Badge>
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
