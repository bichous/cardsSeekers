import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthContext'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { CartDrawer } from './components/CartDrawer'
import { AdminGuard } from './components/AdminGuard'
import { AdminLayout } from './pages/admin/AdminLayout'
import { ProductsPage } from './pages/admin/ProductsPage'
import { OrdersPage } from './pages/admin/OrdersPage'
import { Home } from './pages/Home'
import { Catalog } from './pages/Catalog'
import { ProductDetail } from './pages/ProductDetail'
import { CartPage } from './pages/CartPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { LoginPage } from './pages/LoginPage'
import { OrderLookupPage } from './pages/OrderLookupPage'
import { Box } from '@chakra-ui/react'

function AdminRoutes() {
  return (
    <AdminGuard>
      <AdminLayout>
        <Routes>
          <Route path="productos" element={<ProductsPage />} />
          <Route path="pedidos" element={<OrdersPage />} />
          <Route index element={<ProductsPage />} />
        </Routes>
      </AdminLayout>
    </AdminGuard>
  )
}

function StoreRoutes() {
  return (
    <>
      <Header />
      <CartDrawer />
      <Box as="main" flex={1}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalogo" element={<Catalog />} />
          <Route path="/producto/:id" element={<ProductDetail />} />
          <Route path="/carrito" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/order-lookup" element={<OrderLookupPage />} />
        </Routes>
      </Box>
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''}>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Routes>
              <Route path="/admin/*" element={<AdminRoutes />} />
              <Route path="/*" element={<StoreRoutes />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  )
}
