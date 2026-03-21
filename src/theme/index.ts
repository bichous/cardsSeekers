import { extendTheme, type ThemeConfig } from '@chakra-ui/react'

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
}

const colors = {
  brand: {
    50: '#fff9db',
    100: '#ffeda8',
    200: '#ffe070',
    300: '#ffd23a',
    400: '#FFD000',
    500: '#e6bb00',
    600: '#b39200',
    700: '#806800',
    800: '#4d3f00',
    900: '#1a1500',
  },
  accent: {
    300: '#ff8c36',
    400: '#FF6B00',
    500: '#e05f00',
    600: '#b84e00',
    700: '#8a3a00',
  },
}

const fonts = {
  heading: '"Bebas Neue", "Impact", sans-serif',
  body: '"Inter", system-ui, -apple-system, sans-serif',
}

const styles = {
  global: {
    'html, body': {
      bg: '#0d0d0d',
      color: 'white',
    },
    a: { color: 'inherit', textDecoration: 'none' },
  },
}

const components = {
  Button: {
    baseStyle: {
      fontWeight: 600,
      borderRadius: 'md',
      transition: 'all 0.2s',
      _focus: { boxShadow: '0 0 0 3px rgba(255,208,0,0.45)' },
    },
    variants: {
      primary: {
        bg: 'brand.400',
        color: 'gray.900',
        fontWeight: 700,
        _hover: {
          bg: 'brand.300',
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 20px rgba(255,208,0,0.35)',
        },
        _active: { transform: 'translateY(0)', bg: 'brand.500' },
      },
      accent: {
        bg: 'accent.400',
        color: 'white',
        fontWeight: 700,
        _hover: {
          bg: 'accent.300',
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 20px rgba(255,107,0,0.35)',
        },
        _active: { transform: 'translateY(0)', bg: 'accent.500' },
      },
      outline_brand: {
        border: '1.5px solid',
        borderColor: 'brand.400',
        color: 'brand.400',
        bg: 'transparent',
        _hover: {
          bg: 'rgba(255,208,0,0.08)',
          transform: 'translateY(-1px)',
        },
        _active: { transform: 'translateY(0)' },
      },
      ghost_nav: {
        color: 'gray.300',
        bg: 'transparent',
        fontWeight: 500,
        letterSpacing: '0.02em',
        _hover: { color: 'brand.400', bg: 'transparent' },
      },
    },
    defaultProps: { variant: 'primary' },
  },
  Input: {
    variants: {
      dark: {
        field: {
          bg: '#1a1a1a',
          border: '1px solid #2a2a2a',
          color: 'white',
          _placeholder: { color: '#666' },
          _hover: { borderColor: '#3a3a3a' },
          _focus: { borderColor: 'brand.400', boxShadow: '0 0 0 1px #FFD000' },
        },
      },
    },
    defaultProps: { variant: 'dark' },
  },
  Select: {
    variants: {
      dark: {
        field: {
          bg: '#1a1a1a',
          border: '1px solid #2a2a2a',
          color: 'white',
          _hover: { borderColor: '#3a3a3a' },
          _focus: { borderColor: 'brand.400', boxShadow: '0 0 0 1px #FFD000' },
        },
        icon: { color: '#666' },
      },
    },
    defaultProps: { variant: 'dark' },
  },
  Drawer: {
    variants: {
      alwaysOpen: {
        dialog: {
          pointerEvents: 'auto',
        },
        dialogContainer: {
          pointerEvents: 'none',
        },
      },
    },
  },
}

const theme = extendTheme({ config, colors, fonts, styles, components })

export default theme
