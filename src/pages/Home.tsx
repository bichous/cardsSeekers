import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Button,
  SimpleGrid,
  HStack,
  VStack,
  Badge,
  Grid,
} from '@chakra-ui/react'
import { Link, useNavigate } from 'react-router-dom'
import { FiArrowRight, FiZap } from 'react-icons/fi'
import { FRANCHISE_CONFIG, type Franchise } from '../types'
import { useProducts } from '../hooks/useProducts'
import { ProductCard } from '../components/ProductCard'

const FRANCHISE_CARDS: { id: Franchise; description: string }[] = [
  {
    id: 'pokemon',
    description: 'ETB, Booster Boxes, Tins y las cartas más cotizadas del momento.',
  },
  {
    id: 'yugioh',
    description: 'Estructuras, sets del meta actual y singles competitivos.',
  },
  {
    id: 'onepiece',
    description: 'Mazos de inicio, booster boxes y las rarezas más buscadas.',
  },
  {
    id: 'digimon',
    description: 'Starter Decks, Booster Boxes y cartas alternativas de Digimon Card Game.',
  },
  {
    id: 'gundam',
    description: 'Kits de modelos, cartas de Gundam War y productos exclusivos.',
  },
  {
    id: 'magicthegathering',
    description: 'Commander Decks, Set Boosters, Bundles y singles del formato.',
  },
  {
    id: 'dragonballsuper',
    description: 'Starter Decks, Booster Boxes y cartas Super Rare de DBS Card Game.',
  },
  {
    id: 'finalfantasy',
    description: 'Starter Sets, Opus Collections y cartas premium de FF TCG.',
  },
]

const STATS = [
  { value: '+500', label: 'Productos' },
  { value: '8', label: 'Franquicias' },
  { value: '24h', label: 'Envío express' },
  { value: '100%', label: 'Originales' },
]

export function Home() {
  const navigate = useNavigate()
  const allProducts = useProducts()
  const featured = allProducts.filter((p) => p.featured).slice(0, 8)

  return (
    <Box>
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <Box
        as="section"
        minH="100vh"
        position="relative"
        display="flex"
        alignItems="center"
        overflow="hidden"
        style={{
          background:
            'radial-gradient(ellipse at 50% 45%, rgba(30,20,0,0.9) 0%, #0d0d0d 60%)',
        }}
      >
        {/* Decorative glow */}
        <Box
          position="absolute"
          top="30%"
          left="50%"
          transform="translate(-50%, -50%)"
          w={{ base: '300px', md: '600px' }}
          h={{ base: '300px', md: '600px' }}
          borderRadius="full"
          bg="rgba(255,208,0,0.04)"
          filter="blur(80px)"
          pointerEvents="none"
        />
        {/* Noise texture overlay */}
        <Box
          position="absolute"
          inset={0}
          opacity={0.03}
          pointerEvents="none"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
          }}
        />

        <Container maxW="1280px" py={{ base: 32, md: 24 }} position="relative" zIndex={1}>
          <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={16} alignItems="center">
            <VStack align="flex-start" spacing={6}>
              <HStack spacing={2}>
                <FiZap color="#FFD000" size={14} />
                <Text
                  fontSize="11px"
                  fontWeight={700}
                  color="brand.400"
                  letterSpacing="0.15em"
                  textTransform="uppercase"
                >
                  Tu tienda TCG de referencia
                </Text>
              </HStack>

              <Heading
                fontFamily="heading"
                fontSize={{ base: '72px', md: '96px', lg: '120px' }}
                lineHeight={0.88}
                letterSpacing="0.03em"
              >
                <Text as="span" color="white">
                  CARDS{' '}
                </Text>
                <Text
                  as="span"
                  bgGradient="linear(to-r, brand.400, accent.400)"
                  bgClip="text"
                >
                  SEEKERS
                </Text>
              </Heading>

              <Text
                fontSize={{ base: '15px', md: '17px' }}
                color="gray.400"
                maxW="460px"
                lineHeight={1.7}
              >
                Pokémon, Yu-Gi-Oh!, One Piece, Digimon, Magic: The Gathering y más.
                Productos sellados, cartas sueltas y colecciones exclusivas. Envío en 24 horas.
              </Text>

              <HStack spacing={3} flexWrap="wrap">
                <Button
                  variant="primary"
                  size="lg"
                  rightIcon={<FiArrowRight />}
                  onClick={() => navigate('/catalogo')}
                >
                  Explorar catálogo
                </Button>
                <Button
                  variant="outline_brand"
                  size="lg"
                  onClick={() => navigate('/catalogo?type=singles')}
                >
                  Cartas sueltas
                </Button>
              </HStack>

              {/* Stats */}
              <HStack spacing={6} pt={4} flexWrap="wrap">
                {STATS.map((s) => (
                  <VStack key={s.value} spacing={0} align="flex-start">
                    <Text
                      fontFamily="heading"
                      fontSize="28px"
                      color="brand.400"
                      lineHeight={1}
                      letterSpacing="0.02em"
                    >
                      {s.value}
                    </Text>
                    <Text fontSize="11px" color="gray.600" textTransform="uppercase" letterSpacing="0.08em">
                      {s.label}
                    </Text>
                  </VStack>
                ))}
              </HStack>
            </VStack>

            {/* Right side – decorative franchise badges */}
            <Box display={{ base: 'none', lg: 'block' }} position="relative" h="400px">
              {FRANCHISE_CARDS.slice(0, 3).map((fc, i) => {
                const cfg = FRANCHISE_CONFIG[fc.id]
                const offsets = [
                  { top: '0', left: '60px' },
                  { top: '140px', left: '0' },
                  { top: '270px', left: '100px' },
                ]
                return (
                  <Box
                    key={fc.id}
                    position="absolute"
                    {...offsets[i]}
                    bg="#161616"
                    border="1px solid #2a2a2a"
                    borderRadius="2xl"
                    p={5}
                    w="260px"
                    transition="transform 0.3s"
                    _hover={{ transform: 'scale(1.03)' }}
                    cursor="pointer"
                    onClick={() => navigate(`/catalogo?franchise=${fc.id}`)}
                    boxShadow="0 8px 32px rgba(0,0,0,0.4)"
                  >
                    <HStack spacing={3} mb={2}>
                      <Text fontSize="22px">{cfg.emoji}</Text>
                      <Text
                        fontFamily="heading"
                        fontSize="18px"
                        letterSpacing="0.05em"
                        color={cfg.color}
                      >
                        {cfg.label.toUpperCase()}
                      </Text>
                    </HStack>
                    <Text fontSize="12px" color="gray.500" lineHeight={1.5}>
                      {fc.description}
                    </Text>
                    <Text fontSize="11px" color="gray.700" mt={2}>
                      {allProducts.filter((p) => p.franchise === fc.id).length} productos disponibles
                    </Text>
                  </Box>
                )
              })}
            </Box>
          </Grid>
        </Container>
      </Box>

      {/* ── FRANQUICIAS ──────────────────────────────────────────────── */}
      <Box as="section" py={{ base: 16, md: 20 }} bg="#0a0a0a">
        <Container maxW="1280px">
          <VStack spacing={2} mb={10} align={{ base: 'center', md: 'flex-start' }}>
            <Text
              fontSize="11px"
              fontWeight={700}
              color="brand.400"
              letterSpacing="0.15em"
              textTransform="uppercase"
            >
              Explora por franquicia
            </Text>
            <Heading fontFamily="heading" fontSize={{ base: '40px', md: '52px' }} color="white" letterSpacing="0.03em">
              NUESTRAS FRANQUICIAS
            </Heading>
          </VStack>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5}>
            {FRANCHISE_CARDS.map((fc) => {
              const cfg = FRANCHISE_CONFIG[fc.id]
              const count = allProducts.filter((p) => p.franchise === fc.id).length
              return (
                <Box
                  key={fc.id}
                  as={Link}
                  to={`/catalogo?franchise=${fc.id}`}
                  bg="#161616"
                  borderRadius="2xl"
                  p={6}
                  border="1px solid #1e1e1e"
                  transition="all 0.25s"
                  _hover={{
                    borderColor: cfg.color,
                    transform: 'translateY(-4px)',
                    boxShadow: `0 16px 48px rgba(0,0,0,0.5)`,
                  }}
                  position="relative"
                  overflow="hidden"
                  display="block"
                >
                  {/* Background gradient accent */}
                  <Box
                    position="absolute"
                    top={0}
                    right={0}
                    w="200px"
                    h="200px"
                    borderRadius="full"
                    filter="blur(60px)"
                    opacity={0.06}
                    bg={cfg.color}
                    transform="translate(40%, -40%)"
                    pointerEvents="none"
                  />

                  <HStack spacing={3} mb={4}>
                    <Box
                      w="44px"
                      h="44px"
                      borderRadius="xl"
                      bg={`rgba(${cfg.color === '#FFD000' ? '255,208,0' : cfg.color === '#FF6B00' ? '255,107,0' : '255,69,0'},0.12)`}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontSize="22px"
                    >
                      {cfg.emoji}
                    </Box>
                    <VStack align="flex-start" spacing={0}>
                      <Text
                        fontFamily="heading"
                        fontSize="22px"
                        letterSpacing="0.05em"
                        color={cfg.color}
                        lineHeight={1}
                      >
                        {cfg.label.toUpperCase()}
                      </Text>
                      <Text fontSize="11px" color="gray.600">
                        {count} productos
                      </Text>
                    </VStack>
                  </HStack>

                  <Text fontSize="13px" color="gray.500" lineHeight={1.6} mb={4}>
                    {fc.description}
                  </Text>

                  <HStack spacing={1}>
                    <Text fontSize="12px" color={cfg.color} fontWeight={600}>
                      Ver productos
                    </Text>
                    <FiArrowRight size={12} color={cfg.color} />
                  </HStack>
                </Box>
              )
            })}
          </SimpleGrid>
        </Container>
      </Box>

      {/* ── PRODUCTOS DESTACADOS ─────────────────────────────────────── */}
      <Box as="section" py={{ base: 16, md: 20 }}>
        <Container maxW="1280px">
          <Flex justify="space-between" align="flex-end" mb={10} flexWrap="wrap" gap={4}>
            <VStack align="flex-start" spacing={1}>
              <Text
                fontSize="11px"
                fontWeight={700}
                color="brand.400"
                letterSpacing="0.15em"
                textTransform="uppercase"
              >
                Selección especial
              </Text>
              <Heading fontFamily="heading" fontSize={{ base: '40px', md: '52px' }} color="white" letterSpacing="0.03em">
                DESTACADOS
              </Heading>
            </VStack>
            <Button
              variant="outline_brand"
              size="sm"
              rightIcon={<FiArrowRight />}
              onClick={() => navigate('/catalogo')}
            >
              Ver todo el catálogo
            </Button>
          </Flex>

          <SimpleGrid
            columns={{ base: 2, sm: 3, lg: 4 }}
            spacing={{ base: 3, md: 5 }}
          >
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* ── BANNER NOVEDADES ─────────────────────────────────────────── */}
      <Box
        as="section"
        py={{ base: 16, md: 20 }}
        bg="#0a0a0a"
        borderTop="1px solid #1a1a1a"
      >
        <Container maxW="1280px">
          <Box
            bgGradient="linear(to-r, #1a1200, #0d0d0d)"
            border="1px solid #2a2a2a"
            borderRadius="2xl"
            p={{ base: 8, md: 14 }}
            position="relative"
            overflow="hidden"
          >
            <Box
              position="absolute"
              right="-60px"
              top="-60px"
              w="300px"
              h="300px"
              borderRadius="full"
              bg="rgba(255,208,0,0.04)"
              filter="blur(60px)"
              pointerEvents="none"
            />
            <Flex
              direction={{ base: 'column', md: 'row' }}
              align={{ md: 'center' }}
              justify="space-between"
              gap={6}
            >
              <VStack align={{ base: 'center', md: 'flex-start' }} spacing={2}>
                <Badge
                  bg="brand.400"
                  color="gray.900"
                  fontSize="10px"
                  fontWeight={700}
                  px={3}
                  py={1}
                  borderRadius="full"
                  letterSpacing="0.1em"
                >
                  NOVEDADES
                </Badge>
                <Heading
                  fontFamily="heading"
                  fontSize={{ base: '36px', md: '48px' }}
                  color="white"
                  letterSpacing="0.03em"
                  lineHeight={1}
                >
                  ÚLTIMAS LLEGADAS
                </Heading>
                <Text color="gray.500" fontSize="14px">
                  Los sets más recientes ya están disponibles
                </Text>
              </VStack>
              <Button
                variant="primary"
                size="lg"
                rightIcon={<FiArrowRight />}
                flexShrink={0}
                onClick={() => navigate('/catalogo')}
              >
                Ver novedades
              </Button>
            </Flex>
          </Box>
        </Container>
      </Box>
    </Box>
  )
}
