import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { AddressProvider, useAddress } from '../contexts/AddressContext';
import AddressManager from '../components/address/AddressManager';
import { createPaidOrder } from '../services/paymentService';
import { razorpayService } from '../services/razorpayService';
import { getDeliverySettings, calculateDeliveryFee } from '../services/settingsService';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

const CheckoutContent: React.FC = () => {
  // Call all hooks first - this is required by React rules
  const { state: cartState, clearCart } = useCart();
  const { appUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderError, setOrderError] = useState<string>('');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [deliverySettings, setDeliverySettings] = useState<any>(null);

  // Unified address management
  const {
    addresses,
    error: addressesError,
    selectedAddressId,
    getDefaultAddress,
    clearError,
  } = useAddress();

  // Get coupon data from navigation state
  const couponData = location.state as {
    appliedCoupon?: any;
    discountAmount?: number;
  } || {};

  // Fetch delivery settings on component mount
  useEffect(() => {
    const fetchDeliverySettings = async () => {
      try {
        const settings = await getDeliverySettings();
        setDeliverySettings(settings);
      } catch (error) {
        console.error('Error fetching delivery settings:', error);
      }
    };
    fetchDeliverySettings();
  }, []);

  // Early return after all hooks are called
  if (cartState.items.length === 0) {
    return (
      <div className="min-h-screen bg-background pt-14 md:pt-20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <Link to="/shop" className="btn-primary">
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  const handlePlaceOrder = async () => {
    // Prevent multiple simultaneous order attempts
    if (isProcessing) {
      return;
    }

    const defaultAddress = getDefaultAddress();
    const addressToUse = selectedAddressId
      ? addresses.find(addr => addr.id === selectedAddressId)
      : defaultAddress;

    if (!addressToUse) {
      alert('Please select a delivery address');
      return;
    }

    if (!appUser) {
      alert('Please login to continue');
      return;
    }

    // Validate user ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(appUser.id)) {
      alert('Invalid user session. Please login again.');
      return;
    }

    // Validate cart state
    if (cartState.items.length === 0) {
      alert('Your cart is empty. Please add items before checkout.');
      return;
    }

    // Validate cart items
    for (const item of cartState.items) {
      if (!item.product || !item.product.id || item.quantity <= 0) {
        alert('Invalid cart items detected. Please refresh and try again.');
        return;
      }

      const price = item.product.offer_price || item.product.price;
      if (!price || price <= 0 || price > 100000) {
        alert('Invalid product prices detected. Please refresh and try again.');
        return;
      }
    }

    // Server-side amount validation will happen in payment service
    // But we do basic client validation for better UX
    if (total <= 0 || total > 100000) {
      alert('Invalid order total. Please check your cart.');
      return;
    }

    // Validate coupon if applied
    if (couponData.appliedCoupon && discountAmount > 0) {
      if (discountAmount >= cartState.total) {
        alert('Invalid discount applied. Please remove coupon and try again.');
        return;
      }
    }

    setIsProcessing(true);
    setOrderError('');
    setOrderSuccess(false);


    try {
      // Razorpay flow with verification
      let paymentResponse;
      try {
        paymentResponse = await razorpayService.processPayment(total, {
          receipt: `receipt_${appUser.id}_${Date.now()}`
        });
      } catch (paymentError: any) {
        // Check if it's an authentication error
        if (paymentError.message?.includes('not authenticated') ||
          paymentError.message?.includes('Session expired') ||
          paymentError.message?.includes('login again')) {
          setOrderError('Your session has expired. Please login again to continue.');
          // Redirect to login after a short delay
          setTimeout(() => {
            navigate('/login', { state: { from: '/checkout' } });
          }, 2000);
          return;
        }

        // Re-throw other payment errors
        throw paymentError;
      }

      // After successful payment verification, create the order with payment details
      const order = await createPaidOrder({
        total_amount: total,
        delivery_address: `${addressToUse.address_line_1}${addressToUse.address_line_2 ? ', ' + addressToUse.address_line_2 : ''}, ${addressToUse.city}, ${addressToUse.state} - ${addressToUse.pincode}`,
        phone: addressToUse.phone_number,
        delivery_address_id: addressToUse.id,
        payment_status: 'paid',
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        payment_record_id: paymentResponse.verification?.payment_record_id,
        items: cartState.items.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          price: item.product.offer_price || item.product.price
        }))
      });

      setOrderSuccess(true);

      // Clear cart after successful order
      clearCart();

      // Dispatch event to refresh orders in My Orders page
      window.dispatchEvent(new CustomEvent('order-placed'));

      // Redirect to success page immediately after receiving order confirmation
      if (order?.id) {
        setTimeout(() => {
          navigate('/order-success', {
            state: {
              orderId: order.id,
              orderData: order // Passing extra data for immediate summary display
            }
          });
        }, 300);
      } else {
        throw new Error('Order placed but confirmation not received.');
      }

    } catch (error: any) {
      setOrderError(error.message || 'Failed to place order. Please try again.');
    } finally {
      // Ensure cleanup regardless of success/failure
      setIsProcessing(false);
    }
  };


  const deliveryFee = calculateDeliveryFee(cartState.total, deliverySettings);
  const tax = cartState.total * 0.00;
  const discountAmount = couponData.discountAmount || 0;
  const subtotalAfterDiscount = cartState.total - discountAmount;
  const total = subtotalAfterDiscount + deliveryFee + tax;

  return (
    <div className="min-h-screen bg-background pt-14 md:pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Delivery Address Selection */}
              <div className="bg-white rounded-2xl shadow-soft p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Delivery Address</h2>
                </div>

                {addressesError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{addressesError}</p>
                    <button
                      onClick={clearError}
                      className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                <AddressManager
                  mode="checkout"
                  compact={false}
                  showAddButton={true}
                  onAddressSelect={(_addressId) => {
                    // Address selection is handled automatically by the context
                  }}
                />
              </div>


              {/* Order Processing Status */}
              {(isProcessing || orderSuccess || orderError) && (
                <div className="bg-white rounded-2xl shadow-soft p-6 mb-6 border-l-4 transition-all duration-300"
                  style={{
                    borderLeftColor: orderSuccess ? '#10b981' :
                      orderError ? '#ef4444' : '#3b82f6'
                  }}>
                  <div className="flex items-center space-x-3">
                    {isProcessing && (
                      <>
                        <div className="relative">
                          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                          <div className="absolute inset-0 w-6 h-6 bg-blue-100 rounded-full animate-ping opacity-20"></div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900">Placing Order</span>
                          <span className="text-xs text-gray-500">Processing your order...</span>
                        </div>
                      </>
                    )}
                    {orderSuccess && (
                      <>
                        <div className="relative">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                          <div className="absolute -inset-1 w-8 h-8 bg-green-100 rounded-full animate-ping opacity-20"></div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-green-700">Order Placed Successfully!</span>
                          <span className="text-xs text-green-600">Redirecting to order confirmation...</span>
                        </div>
                      </>
                    )}
                    {orderError && (
                      <>
                        <AlertCircle className="w-6 h-6 text-red-600" />
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-red-700">Order Failed</span>
                          <span className="text-xs text-red-600">Please try again</span>
                        </div>
                      </>
                    )}
                  </div>

                  {orderError && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg animate-fade-in">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-800">Order Error</p>
                          <p className="text-sm text-red-600 mt-1">{orderError}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Premium Razorpay Payment Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={isProcessing || orderSuccess}
                className={`
                  w-full font-semibold py-5 px-6 rounded-2xl transition-all duration-300 
                  flex items-center justify-center space-x-3 relative overflow-hidden
                  group shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]
                  ${isProcessing || orderSuccess
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-linear-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
                  }
                `}
              >
                {/* Razorpay branding icon */}
                {!isProcessing && !orderSuccess && (
                  <div className="flex items-center space-x-2 relative z-10">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
                      <path fill="white" d="M10 17l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9z" />
                    </svg>
                    <span className="font-medium text-lg">Pay Securely with Razorpay</span>
                  </div>
                )}

                {isProcessing ? (
                  <>
                    <div className="relative">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <div className="absolute inset-0 rounded-full h-5 w-5 bg-white opacity-20 animate-ping"></div>
                    </div>
                    <span className="relative z-10 font-medium">Processing Payment...</span>
                  </>
                ) : orderSuccess ? (
                  <>
                    <CheckCircle className="w-5 h-5 relative z-10" />
                    <span className="relative z-10 font-medium">Payment Successful</span>
                  </>
                ) : null}
              </button>

              {/* Secure Payment Trust Badge */}
              {!isProcessing && !orderSuccess && (
                <div className="mt-4 flex flex-col items-center space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">100% Secure Payments powered by Razorpay</span>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>UPI</span>
                    <span>•</span>
                    <span>Cards</span>
                    <span>•</span>
                    <span>Wallets</span>
                    <span>•</span>
                    <span>Net Banking</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-soft p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

              {/* Order Items */}
              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {cartState.items.map((item) => (
                  <div key={item.product.id} className="flex items-center space-x-3">
                    <img
                      src={item.product.image?.replace('http://localhost:', 'https://') || item.product.image}
                      alt={item.product.name}
                      loading="lazy"
                      width="48"
                      height="48"
                      className="w-12 h-12 rounded object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      ₹{((item.product.offer_price || item.product.price) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{cartState.total.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && couponData.appliedCoupon && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({couponData.appliedCoupon.code})</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span>{deliveryFee === 0 ? 'Free' : `₹${deliveryFee.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between font-semibold text-gray-900">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Checkout: React.FC = () => {
  // Call all hooks first - this is required by React rules
  const { appUser } = useAuth();
  const { state: cartState } = useCart();

  // Early returns after all hooks are called
  if (!appUser) {
    return (
      <div className="min-h-screen bg-background pt-14 md:pt-20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please login to continue</h2>
          <Link to="/login" className="btn-primary">
            Login
          </Link>
        </div>
      </div>
    );
  }

  if (cartState.items.length === 0) {
    return (
      <div className="min-h-screen bg-background pt-14 md:pt-20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <Link to="/shop" className="btn-primary">
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AddressProvider userId={appUser.id}>
      <CheckoutContent />
    </AddressProvider>
  );
};

export default Checkout;
