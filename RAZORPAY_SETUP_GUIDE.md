# Razorpay Integration Setup Guide

## Overview
This guide will help you set up Razorpay payment integration for your Puscart Delivery ecommerce application.

## Prerequisites
- Razorpay account (sign up at https://razorpay.com/)
- Node.js and npm installed

## Database Setup

### 1. Run the Razorpay migration
Execute the SQL migration to add Razorpay columns to your orders table:

```sql
-- Run this in your PostgreSQL database
\i database/add_razorpay_columns.sql
```

This will add:
- `razorpay_order_id` (TEXT) - Stores Razorpay order ID
- `razorpay_payment_id` (TEXT) - Stores Razorpay payment ID
- Indexes for better performance

## Backend Setup

### 1. Install server dependencies
```bash
cd server
npm install
```

### 2. Configure environment variables
Create `.env` file in the `server` directory:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Server Configuration
PORT=3001
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

Get your Razorpay keys from the Razorpay dashboard:
1. Login to Razorpay dashboard
2. Go to Settings > API Keys
3. Copy your Key ID and Key Secret

### 3. Start the backend server
```bash
cd server
npm run dev
```

The server will run on http://localhost:3001

## Frontend Setup

### 1. Configure environment variables
Create `.env` file in the root directory (copy from `.env.example`):

```env
# Razorpay Configuration
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id

# Backend API URL
VITE_API_URL=http://localhost:3001
```

Use the SAME Razorpay Key ID as in the backend (not the secret).

### 2. Start the frontend development server
```bash
npm run dev
```

The frontend will run on http://localhost:5173

## Payment Flow

### How it works:
1. User proceeds to checkout
2. Selects delivery address
3. Clicks "Pay Securely with Razorpay"
4. Order is created in database with status "pending"
5. Razorpay order is created on backend
6. Razorpay checkout modal opens
7. User completes payment (UPI/Card/NetBanking/Wallet)
8. Payment is verified with backend
9. Order status updated to "paid"
10. User redirected to Order Success page

### Error Handling:
- If payment is cancelled: Order status set to "failed"
- If payment verification fails: Order status set to "failed"
- User can retry payment from failed orders

## Testing

### Test Mode
Razorpay provides test mode for development:
- Use test credentials from Razorpay dashboard
- Test with sample payment methods:
  - Card: 4111 1111 1111 1111
  - UPI: test@razorpay
  - NetBanking: Select any test bank

### Testing the flow:
1. Add products to cart
2. Go to checkout
3. Add/select delivery address
4. Click "Pay Securely with Razorpay"
5. Complete test payment
6. Verify order status in database
7. Check Order Success page

## Production Deployment

### 1. Update environment variables
```env
# Production
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
```

### 2. Use production Razorpay keys
- Switch from test keys to live keys in Razorpay dashboard
- Update both frontend and backend environment variables

### 3. SSL Certificate
- Ensure your domain has SSL certificate (HTTPS)
- Razorpay requires HTTPS for production

## API Endpoints

### Create Razorpay Order
```
POST /api/create-razorpay-order
Content-Type: application/json

{
  "amount": 1000  // Amount in rupees
}
```

### Verify Payment
```
POST /api/verify-payment
Content-Type: application/json

{
  "razorpay_payment_id": "pay_...",
  "razorpay_order_id": "order_...",
  "razorpay_signature": "..."
}
```

## Troubleshooting

### Common Issues:

1. **"Razorpay SDK failed to load"**
   - Check internet connection
   - Verify CDN is accessible

2. **"Payment verification failed"**
   - Check backend server is running
   - Verify Razorpay keys are correct
   - Check console for detailed error

3. **CORS errors**
   - Verify FRONTEND_URL in backend .env
   - Ensure frontend URL is correct

4. **Order not created**
   - Check database connection
   - Verify user is authenticated
   - Check delivery address is selected

### Debug Tips:
- Check browser console for JavaScript errors
- Check backend server logs
- Verify database tables have correct columns
- Test with small amounts first

## Security Notes

- Never expose Razorpay Key Secret in frontend
- Always verify payment signature on backend
- Use HTTPS in production
- Implement proper error handling
- Log payment attempts for audit trail

## Support

For Razorpay-specific issues:
- Razorpay documentation: https://razorpay.com/docs/
- Razorpay support: support@razorpay.com

For application issues:
- Check the code implementation in:
  - `src/pages/Checkout.tsx`
  - `src/services/razorpayService.ts`
  - `src/services/orderService.ts`
  - `server/index.js`
