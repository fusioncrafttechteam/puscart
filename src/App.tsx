import React, { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { ThemeProvider } from './contexts/ThemeContext'
import Navbar from './components/Navbar'
import MobileNavbar from './components/MobileNavbar'
import BottomNavigation from './components/BottomNavigation'
import ProtectedRoute from './components/ProtectedRoute'
import { AdminRouteFallback } from './components/admin/AdminSkeletons'

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
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const AdminProducts = lazy(() => import('./pages/admin/Products'))
const AdminCategories = lazy(() => import('./pages/admin/Categories'))
const AdminBanners = lazy(() => import('./pages/admin/Banners'))
const AdminOrders = lazy(() => import('./pages/admin/Orders'))
const AdminUsers = lazy(() => import('./pages/admin/Users'))
const DeliverySettings = lazy(() => import('./pages/admin/DeliverySettings'))
const ActivityLogs = lazy(() => import('./pages/admin/ActivityLogs'))

const StorefrontChrome: React.FC = () => (
  <>
    <div className="md:hidden fixed top-0 left-0 right-0 z-50">
      <MobileNavbar />
    </div>
    <div className="hidden md:block">
      <Navbar />
    </div>
    <BottomNavigation />
  </>
)

const AppContent: React.FC = () => {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')

  return (
    <div className={`min-h-screen bg-background overflow-x-hidden ${isAdminRoute ? '' : 'pb-16 md:pb-0'}`}>
      {!isAdminRoute && <StorefrontChrome />}

      <main className={`${isAdminRoute ? '' : 'pt-14 md:pt-20'} overflow-x-hidden`}>
        <Suspense fallback={<AdminRouteFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />

            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/shipping-policy" element={<ShippingPolicy />} />
            <Route path="/cancellation-policy" element={<CancellationPolicy />} />

            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <Cart />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <OrdersHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/order-details/:orderId"
              element={
                <ProtectedRoute>
                  <OrderDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/track-order/:orderId"
              element={
                <ProtectedRoute>
                  <TrackOrder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/order-success"
              element={
                <ProtectedRoute>
                  <OrderSuccess />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="banners" element={<AdminBanners />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="delivery-settings" element={<DeliverySettings />} />
              <Route path="activity-logs" element={<ActivityLogs />} />
            </Route>

            <Route path="/error" element={<ErrorPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
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
