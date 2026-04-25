# Razorpay Integration - Complete Root Cause Fix Guide

## Issues Fixed

### ✅ 1. Service Worker Manifest Structure
- **Issue**: "serviceworker must be a dictionary" error
- **Fix**: Created proper `manifest.json` with correct serviceworker object structure

### ✅ 2. Mixed Content & Security Issues
- **Issue**: HTTPS Razorpay checkout requesting HTTP localhost images
- **Fix**: 
  - Updated image URLs to use HTTPS or relative paths
  - Added comprehensive CSP headers
  - Implemented proper error handling for failed images

### ✅ 3. Permissions Policy Violations
- **Issue**: Accelerometer, deviceorientation, devicemotion errors
- **Fix**: Added restrictive permissions policy headers in both backend and frontend

### ✅ 4. Script Loading Issues
- **Issue**: Razorpay script loading errors and static preload warnings
- **Fix**: 
  - Improved script loading with async/defer
  - Added duplicate script check
  - Enhanced error handling

### ✅ 5. Backend Order Creation
- **Issue**: Missing security headers, CORS issues, improper error handling
- **Fix**: 
  - Added comprehensive security headers
  - Enhanced CORS configuration
  - Improved error handling and logging
  - Added payment webhook endpoint

## Corrected Files

### 1. `public/manifest.json`
```json
{
  "name": "Puscart Delivery Service",
  "short_name": "Puscart",
  "description": "Fast and reliable grocery delivery service",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#00C4CC",
  "orientation": "portrait",
  "scope": "/",
  "icons": [
    {
      "src": "/src/assets/Puscart logo.jpeg",
      "sizes": "192x192",
      "type": "image/jpeg",
      "purpose": "any maskable"
    },
    {
      "src": "/src/assets/Puscart logo.jpeg",
      "sizes": "512x512",
      "type": "image/jpeg",
      "purpose": "any maskable"
    }
  ],
  "serviceworker": {
    "src": "/service-worker.js",
    "scope": "/",
    "type": "classic"
  }
}
```

### 2. `src/services/razorpayService.ts`
```typescript
export interface RazorpayOrder {
  razorpay_order_id: string
  amount: number
  currency: string
  receipt: string
  status: string
  order_id: string
}

export interface PaymentVerification {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

// Create Razorpay order
export const createRazorpayOrder = async (orderData: {
  amount: number;
  user_id: string;
  delivery_address: string;
  phone: string;
  cart_items: Array<{
    product_id: string;
    quantity: number;
    price: number;
  }>;
}): Promise<RazorpayOrder & { order_id: string }> => {
  try {
    // Use relative URL for production compatibility
    const baseUrl = import.meta.env.PROD ? '' : 'http://192.168.1.4:3001';
    const response = await fetch(`${baseUrl}/api/create-razorpay-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Backend error:', errorData)
      
      // Provide specific error messages based on the error type
      if (errorData.error?.includes('Invalid user_id format')) {
        throw new Error('Invalid user session. Please login again and try.')
      } else if (errorData.error?.includes('Invalid product_id format')) {
        throw new Error('Invalid product data. Please refresh the page and try again.')
      } else if (errorData.error?.includes('violates foreign key constraint')) {
        throw new Error('User account not found. Please login again.')
      } else {
        throw new Error(errorData.error || 'Failed to create Razorpay order')
      }
    }

    const order = await response.json()
    return order
  } catch (error) {
    console.error('Error creating Razorpay order:', error)
    throw error
  }
}

// Verify payment
export const verifyPayment = async (paymentData: PaymentVerification): Promise<void> => {
  try {
    // Use relative URL for production compatibility
    const baseUrl = import.meta.env.PROD ? '' : 'http://192.168.1.4:3001';
    const response = await fetch(`${baseUrl}/api/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    })

    if (!response.ok) {
      throw new Error('Payment verification failed')
    }

    return await response.json()
  } catch (error) {
    console.error('Error verifying payment:', error)
    throw error
  }
}

// Load Razorpay script with proper error handling
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // Check if script is already loaded
    if ((window as any).Razorpay) {
      resolve(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.defer = true
    
    script.onload = () => {
      console.log('Razorpay script loaded successfully')
      resolve(true)
    }
    
    script.onerror = (error) => {
      console.error('Failed to load Razorpay script:', error)
      resolve(false)
    }
    
    document.head.appendChild(script)
  })
}
```

### 3. Backend Order Route (Key sections)
```javascript
// Security headers
app.use((req, res, next) => {
  // Remove permissions for biometric tracking
  res.setHeader('Permissions-Policy', 'accelerometer=(), camera=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()')
  // Prevent mixed content
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://checkout.razorpay.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.razorpay.com;")
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY')
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff')
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block')
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  next()
})

// Enhanced CORS configuration
app.use(cors({
  origin: ['http://192.168.1.4:5174', 'http://localhost:5174', 'http://localhost:5175', 'https://your-production-domain.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

// Razorpay order creation with enhanced options
const options = {
  amount: Math.round(amount * 100),
  currency: 'INR',
  receipt: `order_${orderData.id}`,
  payment_capture: 1,
  notes: {
    order_id: orderData.id,
    user_id: user_id,
    delivery_address: delivery_address,
    phone: phone,
    items_count: cart_items.length
  },
  callback_url: `${req.protocol}://${req.get('host')}/api/payment-callback`,
  callback_method: 'post'
}
```

### 4. Environment Configuration

#### Frontend `.env.example`
```env
VITE_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXXXX
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_BASE_URL=http://localhost:3001
VITE_APP_NAME=Puscart Delivery Service
VITE_APP_VERSION=1.0.0
VITE_ENABLE_MOCK_PAYMENTS=false
VITE_ENABLE_ANALYTICS=false
```

#### Backend `.env.example`
```env
PORT=3001
NODE_ENV=development
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=your_razorpay_secret_key
ALLOWED_ORIGINS=http://localhost:5174,http://localhost:5175,http://192.168.1.4:5174
JWT_SECRET=your-jwt-secret-key
SESSION_SECRET=your-session-secret-key
DATABASE_URL=postgresql://user:password@localhost:5432/puscart
LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=true
```

## Razorpay Integration Flow Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Razorpay      │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │ 1. User Clicks Pay    │                       │
         │──────────────────────>│                       │
         │                       │                       │
         │ 2. Create Order       │                       │
         │──────────────────────>│                       │
         │                       │                       │
         │                       │ 3. Validate & Save   │
         │                       │    Order in DB       │
         │                       │                       │
         │                       │ 4. Create Razorpay   │
         │                       │    Order             │
         │                       │──────────────────────>│
         │                       │                       │
         │                       │ 5. Return Order ID   │
         │                       │<──────────────────────│
         │                       │                       │
         │ 6. Open Razorpay      │                       │
         │    Popup              │                       │
         │<──────────────────────│                       │
         │                       │                       │
         │ 7. User Pays          │                       │
         │──────────────────────>│                       │
         │                       │                       │
         │ 8. Payment Success    │                       │
         │    (payment_id,       │                       │
         │     order_id,         │                       │
         │     signature)        │                       │
         │<──────────────────────│                       │
         │                       │                       │
         │ 9. Verify Payment     │                       │
         │──────────────────────>│                       │
         │                       │                       │
         │                       │10. Verify Signature  │
         │                       │    with Razorpay     │
         │                       │──────────────────────>│
         │                       │                       │
         │                       │11. Update Order      │
         │                       │    Status to PAID     │
         │                       │                       │
         │12. Success Response   │                       │
         │<──────────────────────│                       │
         │                       │                       │
         │13. Redirect to        │                       │
         │    Success Page       │                       │
         │                       │                       │
```

## Implementation Checklist

### ✅ Security
- [x] CSP headers implemented
- [x] Permissions policy set
- [x] CORS configuration enhanced
- [x] XSS protection enabled
- [x] Clickjacking prevention

### ✅ Performance
- [x] Script loading optimized
- [x] Service worker caching
- [x] Image error handling
- [x] Duplicate script prevention

### ✅ Reliability
- [x] Comprehensive error handling
- [x] Payment webhook endpoint
- [x] Offline payment sync
- [x] Proper logging

### ✅ User Experience
- [x] Loading states
- [x] Error messages
- [x] Success feedback
- [x] Modal dismiss handling

## Testing Instructions

1. **Setup Environment Variables**
   ```bash
   cp .env.example .env
   # Update with actual values
   ```

2. **Start Development Servers**
   ```bash
   # Backend
   cd myapp/server
   npm install
   npm run dev

   # Frontend
   cd myapp
   npm install
   npm run dev
   ```

3. **Test Payment Flow**
   - Add items to cart
   - Proceed to checkout
   - Select delivery address
   - Click "Pay Securely with Razorpay"
   - Complete payment in popup
   - Verify redirect to success page

4. **Check Console for Errors**
   - No serviceworker errors
   - No mixed content warnings
   - No permissions policy violations
   - No unsafe header errors

## Production Deployment

1. **Update Environment Variables**
   - Replace test keys with production keys
   - Update allowed origins
   - Set NODE_ENV=production

2. **Configure SSL**
   - Ensure HTTPS is enabled
   - Update all URLs to use HTTPS

3. **Test Production Flow**
   - Verify payment processing
   - Check webhook delivery
   - Test error scenarios

This comprehensive fix addresses all identified root causes and provides a production-ready Razorpay integration.
