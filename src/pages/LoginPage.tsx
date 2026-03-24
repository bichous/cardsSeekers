import { useState } from 'react'
import {
  Box,
  Container,
  VStack,
  Text,
  Heading,
  Divider,
} from '@chakra-ui/react'
import { GoogleLogin, CredentialResponse } from '@react-oauth/google'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)

  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const handleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) return
    setError(null)
    try {
      await login(response.credential)
      navigate(from, { replace: true })
    } catch {
      setError('Error al iniciar sesión. Inténtalo de nuevo.')
    }
  }

  return (
    <Box pt="88px" pb={20} minH="100vh">
      <Container maxW="420px">
        <VStack spacing={8} pt={16} align="center">
          <VStack spacing={2} textAlign="center">
            <Text
              fontSize="11px"
              color="brand.400"
              fontWeight={700}
              letterSpacing="0.15em"
              textTransform="uppercase"
            >
              Bienvenido
            </Text>
            <Heading
              fontFamily="heading"
              fontSize="48px"
              color="white"
              letterSpacing="0.04em"
            >
              MI CUENTA
            </Heading>
            <Text fontSize="13px" color="gray.500" maxW="300px">
              Inicia sesión para guardar tu carrito, consultar pedidos y agilizar el checkout.
            </Text>
          </VStack>

          <Box
            bg="#111111"
            border="1px solid #1e1e1e"
            borderRadius="xl"
            p={8}
            w="full"
          >
            <VStack spacing={5}>
              <Text fontSize="14px" fontWeight={600} color="white">
                Continúa con tu cuenta de Google
              </Text>
              <Divider borderColor="#1e1e1e" />
              <Box>
                <GoogleLogin
                  onSuccess={handleSuccess}
                  onError={() => setError('Error al conectar con Google.')}
                  theme="filled_black"
                  shape="rectangular"
                  size="large"
                  text="continue_with"
                  locale="es_MX"
                />
              </Box>
              {error && (
                <Text fontSize="12px" color="red.400" textAlign="center">
                  {error}
                </Text>
              )}
              <Text fontSize="11px" color="gray.700" textAlign="center">
                Al continuar aceptas nuestros Términos de Servicio y Política de Privacidad.
              </Text>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  )
}
