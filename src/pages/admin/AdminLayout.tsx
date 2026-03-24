import { ReactNode } from 'react'
import {
  Box,
  Flex,
  VStack,
  Text,
  Icon,
  HStack,
  Divider,
  Avatar,
} from '@chakra-ui/react'
import { NavLink, useNavigate } from 'react-router-dom'
import { FiPackage, FiShoppingBag, FiChevronLeft } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'

interface NavItemProps {
  to: string
  icon: React.ElementType
  label: string
}

function NavItem({ to, icon, label }: NavItemProps) {
  return (
    <Box
      as={NavLink}
      to={to}
      end
      w="full"
      px={4}
      py={3}
      borderRadius="lg"
      display="flex"
      alignItems="center"
      gap={3}
      fontSize="14px"
      fontWeight={500}
      color="gray.400"
      transition="all 0.15s"
      _hover={{ bg: '#1e1e1e', color: 'white' }}
      sx={{
        '&.active': {
          bg: '#1e1e1e',
          color: 'brand.400',
          borderLeft: '2px solid',
          borderLeftColor: 'brand.400',
          borderRadius: '0 8px 8px 0',
          pl: '14px',
        },
      }}
    >
      <Icon as={icon} boxSize={4} />
      {label}
    </Box>
  )
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <Flex minH="100vh" bg="#0d0d0d">
      {/* Sidebar */}
      <Box
        w="240px"
        flexShrink={0}
        bg="#111111"
        borderRight="1px solid #1e1e1e"
        display="flex"
        flexDirection="column"
        position="fixed"
        top={0}
        left={0}
        h="100vh"
        zIndex={10}
      >
        {/* Logo */}
        <Box px={5} py={5} borderBottom="1px solid #1e1e1e">
          <Text
            fontFamily="heading"
            fontSize="16px"
            fontWeight={700}
            color="brand.400"
            letterSpacing="0.1em"
          >
            BACK OFFICE
          </Text>
          <Text fontSize="11px" color="gray.600" letterSpacing="0.05em">
            CardSeekers
          </Text>
        </Box>

        {/* Nav */}
        <VStack flex={1} px={3} py={4} spacing={1} align="stretch">
          <Text fontSize="10px" color="gray.700" fontWeight={600} letterSpacing="0.1em" px={4} mb={1}>
            INVENTARIO
          </Text>
          <NavItem to="/admin/productos" icon={FiPackage} label="Productos" />
          <Divider borderColor="#1e1e1e" my={3} />
          <Text fontSize="10px" color="gray.700" fontWeight={600} letterSpacing="0.1em" px={4} mb={1}>
            VENTAS
          </Text>
          <NavItem to="/admin/pedidos" icon={FiShoppingBag} label="Pedidos" />
        </VStack>

        {/* Footer */}
        <Box px={4} py={4} borderTop="1px solid #1e1e1e">
          <HStack spacing={3} mb={3}>
            <Avatar
              src={user?.avatar ?? undefined}
              name={user?.nombre ?? user?.email}
              size="sm"
              bg="brand.400"
              color="#0d0d0d"
            />
            <VStack spacing={0} align="flex-start" flex={1} minW={0}>
              <Text fontSize="12px" fontWeight={600} color="white" noOfLines={1}>
                {user?.nombre ?? user?.email}
              </Text>
              <Text fontSize="10px" color="gray.600" textTransform="uppercase" letterSpacing="0.05em">
                {user?.rol}
              </Text>
            </VStack>
          </HStack>
          <Box
            as="button"
            display="flex"
            alignItems="center"
            gap={2}
            fontSize="12px"
            color="gray.600"
            _hover={{ color: 'gray.300' }}
            transition="color 0.15s"
            onClick={() => navigate('/')}
          >
            <Icon as={FiChevronLeft} boxSize={3} />
            Volver a la tienda
          </Box>
        </Box>
      </Box>

      {/* Content */}
      <Box ml="240px" flex={1} minH="100vh">
        {children}
      </Box>
    </Flex>
  )
}
