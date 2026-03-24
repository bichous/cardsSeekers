import { Box, Flex, Text, HStack } from '@chakra-ui/react'
import { Link } from 'react-router-dom'
import { FiShoppingCart, FiTruck, FiCreditCard } from 'react-icons/fi'

interface Props {
  currentStep: 1 | 2 | 3
}

const STEPS = [
  { label: 'Carrito', icon: FiShoppingCart, href: '/carrito' },
  { label: 'Envío', icon: FiTruck, href: null },
  { label: 'Pago', icon: FiCreditCard, href: null },
]

export function CheckoutStepper({ currentStep }: Props) {
  return (
    <Flex align="center" mb={8} gap={0}>
      {STEPS.map((step, i) => {
        const stepNum = (i + 1) as 1 | 2 | 3
        const isCompleted = stepNum < currentStep
        const isActive = stepNum === currentStep
        const Icon = step.icon

        const content = (
          <Flex
            align="center"
            gap={2}
            opacity={isActive || isCompleted ? 1 : 0.35}
            cursor={isCompleted && step.href ? 'pointer' : 'default'}
          >
            <Flex
              w="28px"
              h="28px"
              borderRadius="full"
              bg={isActive ? 'brand.400' : isCompleted ? 'brand.400' : '#1e1e1e'}
              border="2px solid"
              borderColor={isActive || isCompleted ? 'brand.400' : '#333'}
              align="center"
              justify="center"
              flexShrink={0}
            >
              {isCompleted ? (
                <Text fontSize="11px" fontWeight={700} color="#0d0d0d">✓</Text>
              ) : (
                <Icon size={13} color={isActive ? '#0d0d0d' : '#666'} />
              )}
            </Flex>
            <Text
              fontSize="12px"
              fontWeight={isActive ? 700 : 500}
              color={isActive ? 'brand.400' : isCompleted ? 'gray.300' : 'gray.600'}
              display={{ base: 'none', sm: 'block' }}
            >
              {step.label}
            </Text>
          </Flex>
        )

        return (
          <HStack key={step.label} spacing={0} flex={i < STEPS.length - 1 ? 1 : 0} align="center">
            {isCompleted && step.href ? (
              <Box as={Link} to={step.href} _hover={{ textDecoration: 'none' }}>
                {content}
              </Box>
            ) : (
              content
            )}
            {i < STEPS.length - 1 && (
              <Box
                flex={1}
                h="1px"
                bg={isCompleted ? 'brand.400' : '#1e1e1e'}
                mx={3}
                transition="background 0.3s"
              />
            )}
          </HStack>
        )
      })}
    </Flex>
  )
}
