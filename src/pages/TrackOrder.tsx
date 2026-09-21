import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package, MapPin, Phone, ArrowLeft, Truck, CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { getUserOrders, type Order } from '../services/orderService';
import { useAuth } from '../contexts/AuthContext';

const TrackOrder: React.FC = () => {
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

  const getTimelineSteps = (status: string) => {
    const allSteps = [
      { id: 'order_placed', label: 'Order Placed', completed: true, icon: Package },
      { id: 'confirmed', label: 'Order Confirmed', completed: status !== 'pending', icon: CheckCircle },
      { id: 'preparing', label: 'Preparing', completed: status === 'processing' || status === 'shipped' || status === 'delivered', icon: Clock },
      { id: 'packed', label: 'Packed', completed: status === 'processing' || status === 'shipped' || status === 'delivered', icon: Package },
      { id: 'shipped', label: 'Shipped', completed: status === 'shipped' || status === 'delivered', icon: Truck },
      { id: 'out_for_delivery', label: 'Out for Delivery', completed: status === 'shipped' || status === 'delivered', icon: Truck },
      { id: 'delivered', label: 'Delivered', completed: status === 'delivered', icon: CheckCircle }
    ];

    if (status === 'cancelled' || status === 'failed') {
      return allSteps.slice(0, 2);
    }

    return allSteps;
  };

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

  const getEstimatedDelivery = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Expected in 2-3 days';
      case 'processing':
        return 'Expected tomorrow';
      case 'shipped':
        return 'Expected today';
      case 'delivered':
        return 'Delivered';
      default:
        return 'Contact support';
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Your order has been placed and is awaiting confirmation.';
      case 'processing':
        return 'Your order is being prepared and will be packed soon.';
      case 'shipped':
        return 'Your order has been shipped and is on the way.';
      case 'delivered':
        return 'Your order has been delivered successfully.';
      case 'cancelled':
        return 'Your order has been cancelled.';
      case 'failed':
        return 'Your order payment failed. Please try again.';
      default:
        return 'Your order is being processed.';
    }
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

  const timelineSteps = getTimelineSteps(order.delivery_status);

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Order</h1>
          <p className="text-gray-600">Follow your order's journey to your doorstep</p>
        </motion.div>

        {/* Order Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 overflow-hidden mb-6"
        >
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  #{order.id.slice(0, 8).toUpperCase()}
                </h3>
                <p className="text-sm text-gray-600">{formatDate(order.created_at)}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  Rs.{order.total_amount.toLocaleString()}
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusColor(order.delivery_status)}`}>
                  {getStatusIcon(order.delivery_status)}
                  <span>{order.delivery_status.toUpperCase()}</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Estimated Delivery</p>
                  <p className="text-lg font-bold text-blue-600">{getEstimatedDelivery(order.delivery_status)}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Truck className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="bg-white rounded-xl p-3">
                <p className="text-sm text-gray-600">{getStatusMessage(order.delivery_status)}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 overflow-hidden mb-6"
        >
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Order Timeline</h3>

            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gray-200"></div>

              {/* Timeline Steps */}
              <div className="space-y-8">
                {timelineSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="flex items-start space-x-4"
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center z-10 ${step.completed
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                        : 'bg-gray-200 text-gray-400'
                        }`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 pt-2">
                        <h4 className={`font-semibold ${step.completed ? 'text-gray-900' : 'text-gray-400'
                          }`}>
                          {step.label}
                        </h4>
                        <p className={`text-sm ${step.completed ? 'text-gray-600' : 'text-gray-400'
                          }`}>
                          {step.completed ? 'Completed' : 'Pending'}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Delivery Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 overflow-hidden"
        >
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Delivery Information</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 mb-1">Delivery Address</p>
                  <p className="text-sm text-gray-600">{order.delivery_address}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 mb-1">Contact Number</p>
                  <p className="text-sm text-gray-600">{order.phone}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Button */}
        {order.delivery_status !== 'delivered' && order.delivery_status !== 'cancelled' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6"
          >
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-full font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg shadow-blue-500/25 flex items-center justify-center"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Refresh Status
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TrackOrder;
