import {
  Box,
  Container,
  Flex,
  HStack,
  Text,
  VStack,
  Divider,
  Link as ChakraLink,
} from '@chakra-ui/react'
import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <Box
      as="footer"
      bg="#0a0a0a"
      borderTop="1px solid #1e1e1e"
      mt="auto"
    >
      <Container maxW="1280px" py={{ base: 10, md: 14 }}>
        <Flex
          direction={{ base: 'column', md: 'row' }}
          gap={{ base: 10, md: 0 }}
          justify="space-between"
        >
          {/* Brand */}
          <VStack align={{ base: 'center', md: 'flex-start' }} spacing={3} maxW="280px">
            <Text
              fontFamily="heading"
              fontSize="28px"
              letterSpacing="0.08em"
              lineHeight={1}
            >
              <Text as="span" color="white">CARDS </Text>
              <Text as="span" bgGradient="linear(to-r, brand.400, accent.400)" bgClip="text">
                SEEKERS
              </Text>
            </Text>
            <Text color="gray.500" fontSize="13px" lineHeight={1.6} textAlign={{ base: 'center', md: 'left' }}>
              Tu tienda de referencia en Pokémon,<br />Yu-Gi-Oh! y One Piece TCG.
            </Text>
            <HStack spacing={4} mt={1}>
              {['Instagram', 'Twitter', 'TikTok'].map((red) => (
                <ChakraLink
                  key={red}
                  href="#"
                  fontSize="12px"
                  color="gray.600"
                  _hover={{ color: 'brand.400' }}
                  transition="color 0.2s"
                >
                  {red}
                </ChakraLink>
              ))}
            </HStack>
          </VStack>

          {/* Links columns */}
          <Flex gap={{ base: 10, md: 16 }} justify={{ base: 'center', md: 'flex-end' }} flexWrap="wrap">
            <VStack align="flex-start" spacing={3}>
              <Text fontWeight={600} fontSize="12px" color="gray.400" textTransform="uppercase" letterSpacing="0.1em">
                Franquicias
              </Text>
              {[
                { label: 'Pokémon', to: '/catalogo?franchise=pokemon' },
                { label: 'Yu-Gi-Oh!', to: '/catalogo?franchise=yugioh' },
                { label: 'One Piece', to: '/catalogo?franchise=onepiece' },
              ].map((item) => (
                <ChakraLink
                  key={item.to}
                  as={Link}
                  to={item.to}
                  fontSize="13px"
                  color="gray.500"
                  _hover={{ color: 'brand.400' }}
                  transition="color 0.2s"
                >
                  {item.label}
                </ChakraLink>
              ))}
            </VStack>

            <VStack align="flex-start" spacing={3}>
              <Text fontWeight={600} fontSize="12px" color="gray.400" textTransform="uppercase" letterSpacing="0.1em">
                Categorías
              </Text>
              {[
                { label: 'Sellados', to: '/catalogo?type=sealed' },
                { label: 'Cartas Sueltas', to: '/catalogo?type=singles' },
                { label: 'Ver todo', to: '/catalogo' },
              ].map((item) => (
                <ChakraLink
                  key={item.to}
                  as={Link}
                  to={item.to}
                  fontSize="13px"
                  color="gray.500"
                  _hover={{ color: 'brand.400' }}
                  transition="color 0.2s"
                >
                  {item.label}
                </ChakraLink>
              ))}
            </VStack>

            <VStack align="flex-start" spacing={3}>
              <Text fontWeight={600} fontSize="12px" color="gray.400" textTransform="uppercase" letterSpacing="0.1em">
                Info
              </Text>
              <ChakraLink
                as={Link}
                to="/order-lookup"
                fontSize="13px"
                color="gray.500"
                _hover={{ color: 'brand.400' }}
                transition="color 0.2s"
              >
                Consultar Orden
              </ChakraLink>
              {['Sobre nosotros', 'Envíos', 'Devoluciones', 'Contacto'].map((label) => (
                <ChakraLink
                  key={label}
                  href="#"
                  fontSize="13px"
                  color="gray.500"
                  _hover={{ color: 'brand.400' }}
                  transition="color 0.2s"
                >
                  {label}
                </ChakraLink>
              ))}
            </VStack>
          </Flex>
        </Flex>

        <Divider borderColor="#1e1e1e" my={8} />

        <Flex
          justify="space-between"
          align="center"
          direction={{ base: 'column', md: 'row' }}
          gap={2}
        >
          <Text fontSize="12px" color="gray.600">
            © {new Date().getFullYear()} Cards Seekers. Todos los derechos reservados.
          </Text>
          <Text fontSize="12px" color="gray.700">
            Pokémon, Yu-Gi-Oh! y One Piece son marcas de sus respectivos propietarios.
          </Text>
        </Flex>
      </Container>
    </Box>
  )
}
