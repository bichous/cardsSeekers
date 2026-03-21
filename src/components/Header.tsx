import {
  Box,
  Flex,
  HStack,
  Button,
  IconButton,
  Text,
  Container,
  Drawer,
  DrawerBody,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  useDisclosure,
} from '@chakra-ui/react'
import { HamburgerIcon } from '@chakra-ui/icons'
import { FiShoppingCart } from 'react-icons/fi'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useCart } from '../context/CartContext'

const NAV_LINKS = [
  { label: 'Inicio', to: '/' },
  { label: 'Catálogo', to: '/catalogo' },
  { label: 'Pokémon', to: '/catalogo?franchise=pokemon' },
  { label: 'Yu-Gi-Oh!', to: '/catalogo?franchise=yugioh' },
  { label: 'One Piece', to: '/catalogo?franchise=onepiece' },
]

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { itemCount, toggleCart } = useCart()
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleNavClick = (to: string) => {
    onClose()
    navigate(to)
  }

  return (
    <>
      <Box
        as="header"
        position="fixed"
        top={0}
        left={0}
        right={0}
        zIndex={100}
        transition="all 0.3s"
        bg={scrolled ? 'rgba(13,13,13,0.95)' : 'transparent'}
        backdropFilter={scrolled ? 'blur(12px)' : 'none'}
        borderBottom="1px solid"
        borderColor={scrolled ? '#2a2a2a' : 'transparent'}
      >
        <Container maxW="1280px">
          <Flex h="64px" align="center" justify="space-between">
            {/* Logo */}
            <Link to="/" aria-label="Cards Seekers – Inicio">
              <Text
                fontFamily="heading"
                fontSize={{ base: '22px', md: '26px' }}
                letterSpacing="0.08em"
                lineHeight={1}
              >
                <Text as="span" color="white">CARDS </Text>
                <Text
                  as="span"
                  bgGradient="linear(to-r, brand.400, accent.400)"
                  bgClip="text"
                >
                  SEEKERS
                </Text>
              </Text>
            </Link>

            {/* Desktop nav */}
            <HStack as="nav" spacing={1} display={{ base: 'none', lg: 'flex' }}>
              {NAV_LINKS.map((link) => (
                <NavLink key={link.to} to={link.to} end={link.to === '/'}>
                  {({ isActive }) => (
                    <Button
                      variant="ghost_nav"
                      size="sm"
                      px={3}
                      color={isActive ? 'brand.400' : 'gray.300'}
                      fontWeight={isActive ? 600 : 400}
                      _hover={{ color: 'brand.400' }}
                    >
                      {link.label}
                    </Button>
                  )}
                </NavLink>
              ))}
            </HStack>

            {/* Actions */}
            <HStack spacing={2}>
              <Box position="relative">
                <IconButton
                  aria-label={`Carrito (${itemCount} artículos)`}
                  icon={<FiShoppingCart size={20} />}
                  variant="ghost_nav"
                  size="sm"
                  color={itemCount > 0 ? 'brand.400' : 'gray.300'}
                  onClick={toggleCart}
                />
                {itemCount > 0 && (
                  <Box
                    position="absolute"
                    top="-4px"
                    right="-4px"
                    bg="accent.400"
                    color="white"
                    borderRadius="full"
                    minW="18px"
                    h="18px"
                    fontSize="10px"
                    fontWeight={700}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    pointerEvents="none"
                  >
                    {itemCount > 99 ? '99+' : itemCount}
                  </Box>
                )}
              </Box>

              {/* Mobile hamburger */}
              <IconButton
                aria-label="Abrir menú"
                icon={<HamburgerIcon />}
                variant="ghost_nav"
                size="sm"
                display={{ base: 'flex', lg: 'none' }}
                onClick={onOpen}
              />
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Mobile menu Drawer */}
      <Drawer isOpen={isOpen} onClose={onClose} placement="right" size="xs">
        <DrawerOverlay bg="rgba(0,0,0,0.75)" />
        <DrawerContent bg="#111111" borderLeft="1px solid #2a2a2a">
          <DrawerCloseButton color="gray.400" top={4} right={4} />
          <DrawerBody pt={16} pb={8}>
            <Text
              fontFamily="heading"
              fontSize="20px"
              letterSpacing="0.08em"
              mb={8}
            >
              <Text as="span" color="white">CARDS </Text>
              <Text as="span" bgGradient="linear(to-r, brand.400, accent.400)" bgClip="text">
                SEEKERS
              </Text>
            </Text>
            <VStack align="stretch" spacing={1}>
              {NAV_LINKS.map((link) => (
                <Button
                  key={link.to}
                  variant="ghost"
                  justifyContent="flex-start"
                  color="gray.300"
                  fontWeight={500}
                  fontSize="15px"
                  py={3}
                  px={2}
                  h="auto"
                  _hover={{ color: 'brand.400', bg: 'rgba(255,208,0,0.06)' }}
                  onClick={() => handleNavClick(link.to)}
                >
                  {link.label}
                </Button>
              ))}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  )
}
