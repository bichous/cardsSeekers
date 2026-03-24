import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Flex, Spinner } from '@chakra-ui/react'

export function AdminGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <Flex minH="100vh" align="center" justify="center">
        <Spinner color="brand.400" size="xl" />
      </Flex>
    )
  }

  if (!user || (user.rol !== 'admin' && user.rol !== 'staff')) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
