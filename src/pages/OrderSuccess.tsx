import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, ShoppingBag, Home, Truck, Calendar, Package } from 'lucide-react';

const OrderSuccess: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const orderId = location.state?.orderId;
  const orderData = location.state?.orderData;

  if (!orderId) {
    // If no order ID, redirect to home
    React.useEffect(() => {
      navigate('/');
    }, [navigate]);
    return null;
  }

  // Calculate estimated delivery date (2-3 days from now)
  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 2);
  const deliveryDateStr = estimatedDelivery.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Calculate total items
  const totalItems = orderData?.products?.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 pt-14 md:pt-20 flex items-center justify-center pb-16">
      <div className="max-w-lg w-full mx-auto px-4">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 p-8 text-center">
          {/* Success Icon with Animation */}
          <div className="mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto relative">
              <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-20"></div>
              <CheckCircle className="w-12 h-12 text-green-600 relative z-10" />
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Order Placed Successfully!
          </h1>
          <p className="text-gray-600 mb-6">
            Thank you for your order. We'll deliver it to you soon.
          </p>

          {/* Order Summary Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 mb-6 text-left">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Order ID</p>
                <p className="font-mono text-lg font-bold text-gray-900">
                  #{orderId.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                <p className="text-xl font-bold text-gray-900">
                  ₹{orderData?.total_amount?.toLocaleString() || '0'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
              <div className="flex items-center space-x-2">
                <Package className="w-4 h-4 text-blue-600" />
                <span>{totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Estimated: {deliveryDateStr}</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Truck className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-900">Estimated Delivery</span>
                </div>
                <span className="text-sm font-bold text-blue-600">{deliveryDateStr}</span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="space-y-3 mb-6 text-left">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-semibold">1</span>
              </div>
              <p className="text-sm text-gray-700">Order confirmation sent to your email</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-semibold">2</span>
              </div>
              <p className="text-sm text-gray-700">Your order is being processed</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-semibold">3</span>
              </div>
              <p className="text-sm text-gray-700">Delivery within 2-3 days</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              to={`/track-order/${orderId}`}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium py-4 px-6 rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2"
            >
              <Truck className="w-5 h-5" />
              <span>Track Order</span>
            </Link>
            <Link
              to="/orders"
              className="w-full bg-gray-100 text-gray-700 font-medium py-4 px-6 rounded-2xl hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Go to My Orders</span>
            </Link>
            <Link
              to="/"
              className="w-full text-gray-600 font-medium py-3 px-6 hover:text-gray-900 transition-colors flex items-center justify-center space-x-2"
            >
              <Home className="w-4 h-4" />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
