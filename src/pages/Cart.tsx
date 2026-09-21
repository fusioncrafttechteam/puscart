import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, Trash2, Tag } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { getOfferBanners } from '../services/productService';
import { getDeliverySettings, calculateDeliveryFee } from '../services/settingsService';

const Cart: React.FC = () => {
  const { user } = useAuth();
  const { state, updateQuantity, removeItem } = useCart();
  const { items: cartItems } = state;
  const navigate = useNavigate();

  // Coupon states
  const [offers, setOffers] = useState<any[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [deliverySettings, setDeliverySettings] = useState<any>(null);

  // Fetch offers and delivery settings on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [offersData, settingsData] = await Promise.all([
          getOfferBanners(),
          getDeliverySettings()
        ]);
        setOffers(offersData);
        setDeliverySettings(settingsData);
      } catch (error) {
        // Error fetching data
      }
    };
    fetchData();
  }, []);

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const calculateTotal = () => {
    return state.total;
  };

  // Coupon functions
  const validateCoupon = (code: string) => {
    const normalizedCode = code.toUpperCase().trim();
    const foundOffer = offers.find(offer =>
      offer.code.toUpperCase() === normalizedCode
    );

    if (!foundOffer) {
      setCouponError('Invalid coupon code');
      return null;
    }

    return foundOffer;
  };

  const parseDiscount = (discountString: string) => {
    // Parse discount like "20%" or "50 OFF"
    if (discountString.includes('%')) {
      return {
        type: 'percentage',
        value: parseFloat(discountString.replace('%', ''))
      };
    } else {
      return {
        type: 'fixed',
        value: parseFloat(discountString.replace(/[^0-9.]/g, ''))
      };
    }
  };

  const calculateDiscount = (subtotal: number, discountString: string) => {
    const discount = parseDiscount(discountString);

    if (discount.type === 'percentage') {
      return subtotal * (discount.value / 100);
    } else {
      return Math.min(discount.value, subtotal); // Don't discount more than subtotal
    }
  };

  const applyCoupon = () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setIsApplyingCoupon(true);
    setCouponError('');

    const validOffer = validateCoupon(couponCode);

    if (validOffer) {
      setAppliedCoupon(validOffer);
      setCouponCode('');
      setCouponError('');
    }

    setIsApplyingCoupon(false);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
  };

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-background pt-14 md:pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <ShoppingCart className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please sign in</h2>
          <p className="text-gray-600 mb-6">Sign in to view your cart and manage orders</p>
          <Link to="/login" className="btn-primary">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Empty cart
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background pt-0 md:pt-10 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="w-12 h-12 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Add items from the shop to continue
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors duration-200 shadow-md hover:shadow-lg w-full"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const total = calculateTotal();
  const deliveryFee = calculateDeliveryFee(total, deliverySettings);
  const tax = total * 0.00;

  // Calculate discount if coupon is applied
  const discountAmount = appliedCoupon ? calculateDiscount(total, appliedCoupon.discount) : 0;
  const subtotalAfterDiscount = total - discountAmount;
  const finalTotal = subtotalAfterDiscount + deliveryFee + tax;

  return (
    <div className="min-h-screen bg-background pt-14 md:pt-20">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-soft p-4 sm:p-6">
              {cartItems.map((item) => (
                <div key={item.product.id} className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 py-4 border-b border-gray-200 last:border-0">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    loading="lazy"
                    decoding="async"
                    width="80"
                    height="80"
                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg"
                  />

                  <div className="flex-1 w-full">
                    <h3 className="font-medium text-gray-900 text-sm sm:text-base">{item.product.name}</h3>
                    <p className="text-sm text-gray-500 hidden sm:block">{item.product.description?.substring(0, 50)}...</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-blue-600 font-bold text-sm sm:text-base">
                        ₹{item.product.offer_price || item.product.price}
                      </span>
                      {item.product.offer_price && (
                        <span className="text-gray-400 line-through text-sm">
                          ₹{item.product.price}2
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full sm:w-auto sm:flex-col sm:space-y-2">
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        onClick={() => handleQuantityChange(item.product.id, Math.max(0.5, Number((item.quantity - 0.5).toFixed(1))))}
                        className="w-8 h-8 rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center justify-center transition-colors duration-200"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-10 text-center font-medium text-sm sm:text-base flex items-center justify-center">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.product.id, Number((item.quantity + 0.5).toFixed(1)))}
                        className="w-8 h-8 rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center justify-center transition-colors duration-200"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-right sm:text-center">
                      <p className="font-bold text-gray-900 text-sm sm:text-base">
                        ₹{((item.product.offer_price || item.product.price) * item.quantity).toFixed(2)}
                      </p>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="text-red-500 hover:text-red-600 mt-1 sm:mt-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:sticky lg:top-24">
            <div className="bg-white rounded-2xl shadow-soft p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

              {/* Coupon Code Section */}
              <div className="mb-6">
                <div className="flex items-center mb-2">
                  <Tag className="w-4 h-4 mr-2 text-blue-600" />
                  <h3 className="text-sm font-medium text-gray-900">Coupon Code</h3>
                </div>

                {!appliedCoupon ? (
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value);
                          setCouponError('');
                        }}
                        placeholder="Enter coupon code"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        onKeyPress={(e) => e.key === 'Enter' && applyCoupon()}
                      />
                      <button
                        onClick={applyCoupon}
                        disabled={isApplyingCoupon}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        {isApplyingCoupon ? 'Applying...' : 'Apply'}
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-red-600 text-xs">{couponError}</p>
                    )}
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-800">
                          Coupon Applied: {appliedCoupon.code}
                        </p>
                        <p className="text-xs text-green-600">
                          Discount: {appliedCoupon.discount}
                        </p>
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600 text-sm sm:text-base">
                  <span>Subtotal</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600 text-sm sm:text-base">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600 text-sm sm:text-base">
                  <span>Delivery Fee</span>
                  <span>{deliveryFee === 0 ? 'Free' : `₹${deliveryFee.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-gray-600 text-sm sm:text-base">
                  <span>Tax</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between font-semibold text-gray-900 text-base sm:text-lg">
                    <span>Total</span>
                    <span>₹{finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    navigate('/checkout', {
                      state: {
                        appliedCoupon: appliedCoupon,
                        discountAmount: discountAmount
                      }
                    });
                  }}
                  className="btn-primary w-full flex items-center justify-center py-3 sm:py-4 px-4 sm:px-6 text-sm sm:text-base min-h-[44px] sm:min-h-[48px]"
                >
                  Proceed to Checkout
                </button>

                <Link
                  to="/shop"
                  className="w-full text-center text-blue-600 hover:text-blue-700 py-3 sm:py-4 px-4 sm:px-6 text-sm sm:text-base min-h-[44px] sm:min-h-[48px] flex items-center justify-center"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
