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
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useDisclosure,
} from '@chakra-ui/react'
import { HamburgerIcon } from '@chakra-ui/icons'
import { FiShoppingCart, FiUser, FiLogOut, FiPackage, FiSettings } from 'react-icons/fi'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

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
  const { user, logout } = useAuth()
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
              {/* Cart */}
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

              {/* User menu (desktop) */}
              <Box display={{ base: 'none', lg: 'block' }}>
                {user ? (
                  <Menu placement="bottom-end">
                    <MenuButton
                      as={Box}
                      cursor="pointer"
                      display="flex"
                      alignItems="center"
                      gap={2}
                      px={2}
                      py={1}
                      borderRadius="md"
                      _hover={{ bg: 'rgba(255,208,0,0.06)' }}
                      transition="background 0.15s"
                    >
                      <HStack spacing={2}>
                        <Avatar
                          src={user.avatar ?? undefined}
                          name={user.nombre ?? user.email}
                          size="xs"
                          bg="brand.400"
                          color="gray.900"
                        />
                        <Text fontSize="13px" color="gray.300" fontWeight={500}>
                          {user.nombre ?? user.email.split('@')[0]}
                        </Text>
                      </HStack>
                    </MenuButton>
                    <MenuList
                      bg="#111111"
                      border="1px solid #2a2a2a"
                      py={1}
                      minW="180px"
                    >
                      <Box px={3} py={2} borderBottom="1px solid #1e1e1e" mb={1}>
                        <Text fontSize="12px" color="gray.400" noOfLines={1}>
                          {user.email}
                        </Text>
                        {user.rol !== 'client' && (
                          <Text fontSize="10px" color="brand.400" fontWeight={700} textTransform="uppercase" letterSpacing="0.1em">
                            {user.rol}
                          </Text>
                        )}
                      </Box>
                      <MenuItem
                        icon={<FiPackage size={14} />}
                        fontSize="13px"
                        color="gray.300"
                        bg="transparent"
                        _hover={{ bg: 'rgba(255,208,0,0.06)', color: 'brand.400' }}
                        onClick={() => navigate('/mis-pedidos')}
                      >
                        Mis pedidos
                      </MenuItem>
                      {(user.rol === 'admin' || user.rol === 'staff') && (
                        <MenuItem
                          icon={<FiSettings size={14} />}
                          fontSize="13px"
                          color="gray.300"
                          bg="transparent"
                          _hover={{ bg: 'rgba(255,208,0,0.06)', color: 'brand.400' }}
                          onClick={() => navigate('/admin/productos')}
                        >
                          Back Office
                        </MenuItem>
                      )}
                      <MenuDivider borderColor="#1e1e1e" my={1} />
                      <MenuItem
                        icon={<FiLogOut size={14} />}
                        fontSize="13px"
                        color="gray.500"
                        bg="transparent"
                        _hover={{ bg: 'rgba(255,80,80,0.06)', color: 'red.400' }}
                        onClick={logout}
                      >
                        Cerrar sesión
                      </MenuItem>
                    </MenuList>
                  </Menu>
                ) : (
                  <Button
                    variant="ghost_nav"
                    size="sm"
                    leftIcon={<FiUser size={16} />}
                    color="gray.300"
                    _hover={{ color: 'brand.400' }}
                    onClick={() => navigate('/login')}
                  >
                    Iniciar sesión
                  </Button>
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
            <Text fontFamily="heading" fontSize="20px" letterSpacing="0.08em" mb={8}>
              <Text as="span" color="white">CARDS </Text>
              <Text as="span" bgGradient="linear(to-r, brand.400, accent.400)" bgClip="text">
                SEEKERS
              </Text>
            </Text>

            {/* Mobile user section */}
            {user ? (
              <Box
                mb={6}
                p={3}
                bg="#0d0d0d"
                borderRadius="lg"
                border="1px solid #1e1e1e"
              >
                <HStack spacing={3} mb={3}>
                  <Avatar
                    src={user.avatar ?? undefined}
                    name={user.nombre ?? user.email}
                    size="sm"
                    bg="brand.400"
                    color="gray.900"
                  />
                  <VStack align="flex-start" spacing={0}>
                    <Text fontSize="13px" color="white" fontWeight={600}>
                      {user.nombre ? `${user.nombre} ${user.apellidos ?? ''}`.trim() : user.email.split('@')[0]}
                    </Text>
                    <Text fontSize="11px" color="gray.600" noOfLines={1}>{user.email}</Text>
                  </VStack>
                </HStack>
                {(user.rol === 'admin' || user.rol === 'staff') && (
                  <Button
                    w="full"
                    size="xs"
                    variant="ghost"
                    color="brand.400"
                    leftIcon={<FiSettings size={12} />}
                    _hover={{ color: 'brand.300' }}
                    mb={1}
                    onClick={() => handleNavClick('/admin/productos')}
                  >
                    Back Office
                  </Button>
                )}
                <Button
                  w="full"
                  size="xs"
                  variant="ghost"
                  color="gray.600"
                  leftIcon={<FiLogOut size={12} />}
                  _hover={{ color: 'red.400' }}
                  onClick={() => { logout(); onClose() }}
                >
                  Cerrar sesión
                </Button>
              </Box>
            ) : (
              <Button
                w="full"
                mb={6}
                variant="outline_brand"
                size="sm"
                leftIcon={<FiUser size={14} />}
                onClick={() => handleNavClick('/login')}
              >
                Iniciar sesión
              </Button>
            )}

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
