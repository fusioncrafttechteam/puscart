import React, { lazy, Suspense } from 'react'
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
import SkeletonLoader from './components/SkeletonLoader'

// Lazy load pages for code splitting
const Home = lazy(() => import('./pages/Home'))
const Shop = lazy(() => import('./pages/Shop'))
const ProductDetails = lazy(() => import('./pages/ProductDetails'))
const Cart = lazy(() => import('./pages/Cart'))
const Checkout = lazy(() => import('./pages/Checkout'))
const OrdersHistory = lazy(() => import('./pages/OrdersHistory'))
const OrderDetails = lazy(() => import('./pages/OrderDetails'))
const TrackOrder = lazy(() => import('./pages/TrackOrder'))
const Profile = lazy(() => import('./pages/Profile'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const SignIn = lazy(() => import('./pages/SignIn'))
const SignUp = lazy(() => import('./pages/SignUp'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const ErrorPage = lazy(() => import('./pages/ErrorPage'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions'))
const RefundPolicy = lazy(() => import('./pages/RefundPolicy'))
const ShippingPolicy = lazy(() => import('./pages/ShippingPolicy'))
const CancellationPolicy = lazy(() => import('./pages/CancellationPolicy'))

// Admin Pages - Lazy loaded
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const AdminProducts = lazy(() => import('./pages/admin/Products'))
const AdminCategories = lazy(() => import('./pages/admin/Categories'))
const AdminBanners = lazy(() => import('./pages/admin/Banners'))
const AdminOrders = lazy(() => import('./pages/admin/Orders'))
const AdminUsers = lazy(() => import('./pages/admin/Users'))
const DeliverySettings = lazy(() => import('./pages/admin/DeliverySettings'))
const ActivityLogs = lazy(() => import('./pages/admin/ActivityLogs'))

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
      {/* Main content with responsive top padding */}
      <main className="pt-14 md:pt-20 overflow-x-hidden">
        <Suspense fallback={<SkeletonLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />

            {/* Legal Pages */}
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/shipping-policy" element={<ShippingPolicy />} />
            <Route path="/cancellation-policy" element={<CancellationPolicy />} />

            {/* Authentication Routes */}
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/reset-password" element={<ResetPassword />} />

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
            <Route path="/order-details/:orderId" element={
              <ProtectedRoute>
                <OrderDetails />
              </ProtectedRoute>
            } />
            <Route path="/track-order/:orderId" element={
              <ProtectedRoute>
                <TrackOrder />
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
            <Route path="/admin/delivery-settings" element={
              <ProtectedRoute requireAdmin>
                <DeliverySettings />
              </ProtectedRoute>
            } />
            <Route path="/admin/activity-logs" element={
              <ProtectedRoute requireAdmin>
                <ActivityLogs />
              </ProtectedRoute>
            } />

            {/* Error Pages */}
            <Route path="/error" element={<ErrorPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
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