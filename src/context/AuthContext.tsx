import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export interface ShippingInfo {
  calle: string
  numExterior?: string | null
  numInterior?: string | null
  referencia?: string | null
  codigoPostal: string
  colonia?: string | null
  municipio?: string | null
  estado?: string | null
}

export interface User {
  id: string
  email: string
  nombre?: string | null
  apellidos?: string | null
  telefono?: string | null
  avatar?: string | null
  rol: 'admin' | 'client' | 'staff'
  shippingInfo?: ShippingInfo | null
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (googleCredential: string) => Promise<void>
  logout: () => void
  updateUser: (data: {
    nombre?: string
    apellidos?: string
    telefono?: string
    shippingInfo?: ShippingInfo
  }) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'))
  const [isLoading, setIsLoading] = useState(true)

  // Verificar token almacenado al iniciar
  useEffect(() => {
    if (!token) {
      setIsLoading(false)
      return
    }
    fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error('token invalid')
        return r.json() as Promise<User>
      })
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('auth_token')
        setToken(null)
      })
      .finally(() => setIsLoading(false))
  }, [token])

  const login = async (googleCredential: string) => {
    const res = await fetch(`${API_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: googleCredential }),
    })
    if (!res.ok) throw new Error('Autenticación fallida')
    const { token: newToken, user: newUser } = (await res.json()) as { token: string; user: User }
    localStorage.setItem('auth_token', newToken)
    setToken(newToken)
    setUser(newUser)
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    setToken(null)
    setUser(null)
  }

  const updateUser = async (data: {
    nombre?: string
    apellidos?: string
    telefono?: string
    shippingInfo?: ShippingInfo
  }) => {
    if (!token) return
    const res = await fetch(`${API_URL}/api/users/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Error al actualizar')
    const updated = (await res.json()) as User
    setUser(updated)
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
