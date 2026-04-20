import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { useCart } from './contexts/CartContext'
import { useAuth } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import MobileNavbar from './components/MobileNavbar'
import BottomNavigation from './components/BottomNavigation'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Shop from './pages/Shop'
import ProductDetails from './pages/ProductDetails'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrdersHistory from './pages/OrdersHistory'
import Profile from './pages/Profile'
import About from './pages/About'
import Contact from './pages/Contact'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import OrderSuccess from './pages/OrderSuccess'

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminProducts from './pages/admin/Products'
import AdminCategories from './pages/admin/Categories'
import AdminBanners from './pages/admin/Banners'
import AdminOrders from './pages/admin/Orders'
import AdminUsers from './pages/admin/Users'

const AppContent: React.FC = () => {
  const { state: cartState } = useCart()
  const { appUser, isAdmin } = useAuth()

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0 overflow-x-hidden">
      {/* Mobile Navbar - Fixed at top */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50">
        <MobileNavbar 
          isAuthenticated={!!appUser} 
          cartItemCount={cartState.itemCount} 
          isAdmin={isAdmin}
        />
      </div>
      {/* Desktop Navbar */}
      <div className="hidden md:block">
        <Navbar />
      </div>
      {/* Main content with top padding for mobile navbar */}
      <main className="md:mt-0 overflow-x-hidden">
        <div className="md:hidden h-14"></div> {/* Spacer for mobile navbar */}
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          
          {/* Authentication Routes */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          
          {/* Protected User Routes */}
          <Route path="/cart" element={
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          } />
          <Route path="/checkout" element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute>
              <OrdersHistory />
            </ProtectedRoute>
          } />
          <Route path="/order-success" element={
            <ProtectedRoute>
              <OrderSuccess />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          
          {/* Admin Routes - Require Admin Role */}
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/products" element={
            <ProtectedRoute requireAdmin>
              <AdminProducts />
            </ProtectedRoute>
          } />
          <Route path="/admin/categories" element={
            <ProtectedRoute requireAdmin>
              <AdminCategories />
            </ProtectedRoute>
          } />
          <Route path="/admin/banners" element={
            <ProtectedRoute requireAdmin>
              <AdminBanners />
            </ProtectedRoute>
          } />
          <Route path="/admin/orders" element={
            <ProtectedRoute requireAdmin>
              <AdminOrders />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute requireAdmin>
              <AdminUsers />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
      <BottomNavigation cartItemCount={cartState.itemCount} />
    </div>
  )
}

const App: React.FC = () => {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  )
}

export default App