import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, ShoppingBag, Home } from 'lucide-react';

const OrderSuccess: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const orderId = location.state?.orderId;

  if (!orderId) {
    // If no order ID, redirect to home
    React.useEffect(() => {
      navigate('/');
    }, [navigate]);
    return null;
  }

  return (
    <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-soft p-8 text-center">
          {/* Success Icon */}
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-gray-600 mb-6">
            Your order has been placed successfully and will be delivered soon.
          </p>

          {/* Order Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500 mb-1">Order ID</p>
            <p className="font-mono text-lg font-semibold text-gray-900">
              {orderId.slice(0, 8).toUpperCase()}
            </p>
          </div>

          {/* Next Steps */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center space-x-3 text-left">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 text-sm font-semibold">1</span>
              </div>
              <p className="text-sm text-gray-600">Order confirmation sent to your email</p>
            </div>
            <div className="flex items-center space-x-3 text-left">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 text-sm font-semibold">2</span>
              </div>
              <p className="text-sm text-gray-600">Your order is being processed</p>
            </div>
            <div className="flex items-center space-x-3 text-left">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 text-sm font-semibold">3</span>
              </div>
              <p className="text-sm text-gray-600">Delivery within an Hour</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              to="/orders"
              className="w-full btn-primary flex items-center justify-center space-x-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>View My Orders</span>
            </Link>
            <Link
              to="/"
              className="w-full bg-gray-100 text-gray-700 font-medium py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
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
