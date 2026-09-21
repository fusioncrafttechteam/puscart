import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package, MapPin, Phone, Calendar, ArrowLeft, Truck, CheckCircle, Clock, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { getUserOrders, type Order } from '../services/orderService';
import { useAuth } from '../contexts/AuthContext';

const OrderDetails: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!user || !orderId) {
        setLoading(false);
        return;
      }

      try {
        const userOrders = await getUserOrders();
        const foundOrder = userOrders.find(o => o.id === orderId);
        
        if (foundOrder) {
          setOrder(foundOrder);
        } else {
          setError('Order not found');
        }
      } catch (err) {
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [user, orderId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
      case 'shipped':
        return 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white';
      case 'processing':
        return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white';
      case 'cancelled':
        return 'bg-gradient-to-r from-red-500 to-rose-500 text-white';
      case 'failed':
        return 'bg-gradient-to-r from-red-500 to-rose-500 text-white';
      case 'paid':
        return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
      case 'pending':
        return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white';
      default:
        return 'bg-gradient-to-r from-gray-500 to-slate-500 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-5 h-5" />;
      case 'shipped':
        return <Truck className="w-5 h-5" />;
      case 'processing':
        return <Clock className="w-5 h-5" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5" />;
      case 'failed':
        return <XCircle className="w-5 h-5" />;
      case 'paid':
        return <CheckCircle className="w-5 h-5" />;
      case 'pending':
        return <Clock className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl w-48 mb-6"></div>
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 p-6">
              <div className="space-y-4">
                <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl w-32"></div>
                <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-24"></div>
                <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-48"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="bg-red-50 border border-red-200 rounded-3xl p-8 max-w-md mx-auto">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h3>
              <p className="text-gray-600 mb-6">{error || 'The order you are looking for does not exist.'}</p>
              <button 
                onClick={() => navigate('/orders')}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-full font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
              >
                Back to Orders
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 pt-20 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Orders
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Details</h1>
          <p className="text-gray-600">View complete information about your order</p>
        </motion.div>

        {/* Order Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 overflow-hidden mb-6"
        >
          <div className="p-6">
            {/* Order Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <h3 className="text-2xl font-bold text-gray-900">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </h3>
                  <div className={`px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2 ${getStatusColor(order.delivery_status)}`}>
                    {getStatusIcon(order.delivery_status)}
                    <span>{order.delivery_status.toUpperCase()}</span>
                  </div>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-5 h-5 mr-2" />
                  {formatDate(order.created_at)}
                </div>
              </div>
              <div className="text-right space-y-2">
                <div className="text-3xl font-bold text-gray-900">
                  Rs.{order.total_amount.toLocaleString()}
                </div>
                <div className={`px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2 ${getStatusColor(order.payment_status)}`}>
                  {getStatusIcon(order.payment_status)}
                  <span>{order.payment_status.toUpperCase()}</span>
                </div>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Delivery Information</h4>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-1">Delivery Address</p>
                    <p className="text-sm text-gray-600">{order.delivery_address}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-1">Contact Number</p>
                    <p className="text-sm text-gray-600">{order.phone}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h4>
              <div className="space-y-4">
                {order.products?.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 bg-gray-50 rounded-2xl p-4">
                    <div className="w-16 h-16 bg-white rounded-xl overflow-hidden flex-shrink-0">
                      {item.products?.image ? (
                        <img 
                          src={item.products.image} 
                          alt={item.products.name}
                          loading="lazy"
                          width="64"
                          height="64"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-medium text-gray-900">{item.products?.name || 'Product'}</p>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity} × Rs.{item.price}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">Rs.{item.price * item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Order Summary */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span className="text-gray-900">Total Amount</span>
                  <span className="text-gray-900">Rs.{order.total_amount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OrderDetails;
