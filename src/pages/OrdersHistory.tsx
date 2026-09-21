import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Calendar, Clock, CheckCircle, XCircle, Truck, ShoppingBag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getUserOrders, type Order } from '../services/orderService';
import { getProductById } from '../services/productService';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

// Load orders from localStorage
const loadOrdersFromStorage = (): Order[] | null => {
  try {
    const savedOrders = localStorage.getItem('puscart_orders');
    if (savedOrders) {
      const orders = JSON.parse(savedOrders);
      // Check if orders are less than 5 minutes old
      const timestamp = localStorage.getItem('puscart_orders_timestamp');
      if (timestamp) {
        const age = Date.now() - parseInt(timestamp);
        if (age < 5 * 60 * 1000) { // 5 minutes
          return orders;
        }
      }
    }
  } catch (error) {
    // Error loading orders from localStorage
  }
  return null;
};

// Filter types
type FilterType = 'all' | 'pending' | 'delivered' | 'cancelled';

const OrdersHistory: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [productNames, setProductNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // First try to load from localStorage for instant response
        const cachedOrders = loadOrdersFromStorage();
        if (cachedOrders) {
          setOrders(cachedOrders);
          setLoading(false);
        }

        // Then fetch fresh data from database
        const userOrders = await getUserOrders();
        setOrders(userOrders);

        // Save to localStorage with timestamp
        try {
          localStorage.setItem('puscart_orders', JSON.stringify(userOrders));
          localStorage.setItem('puscart_orders_timestamp', Date.now().toString());
        } catch (error) {
          // Error saving orders to localStorage
        }

        setError(null);
      } catch (err) {
        setError('Failed to load orders. Please try again.')
        // Set empty orders array to prevent crashes
        setOrders([])
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  // Add a function to manually refresh orders (for instant updates after checkout)
  const refreshOrders = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userOrders = await getUserOrders();
      setOrders(userOrders);
      
      // Update localStorage
      try {
        localStorage.setItem('puscart_orders', JSON.stringify(userOrders));
        localStorage.setItem('puscart_orders_timestamp', Date.now().toString());
      } catch (error) {
        // Error saving orders to localStorage
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to refresh orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Listen for custom event to refresh orders (triggered from checkout)
  useEffect(() => {
    const handleOrderPlaced = () => {
      refreshOrders();
    };

    window.addEventListener('order-placed', handleOrderPlaced);
    return () => window.removeEventListener('order-placed', handleOrderPlaced);
  }, [user]);

  // Fetch product names when orders change
  useEffect(() => {
    const fetchProductNames = async () => {
      const productIds = new Set<string>();
      const names: Record<string, string> = {};

      // Collect all unique product IDs from orders
      orders.forEach(order => {
        const items = order.order_items || order.products || [];
        items.forEach(item => {
          if (item.product_id) {
            productIds.add(item.product_id);
          }
        });
      });

      // Fetch product names for each unique product ID
      for (const productId of Array.from(productIds)) {
        try {
          const product = await getProductById(productId);
          if (product) {
            names[productId] = product.name;
          }
        } catch (error) {
          // Error fetching product
        }
      }

      setProductNames(names);
    };

    if (orders.length > 0) {
      fetchProductNames();
    }
  }, [orders]);

  // Filter orders based on active filter
  useEffect(() => {
    if (orders.length === 0) {
      setFilteredOrders([]);
      return;
    }

    let filtered = orders;

    switch (activeFilter) {
      case 'pending':
        filtered = orders.filter(order =>
          (order.payment_status !== 'paid' && order.payment_status !== 'failed' && order.payment_status !== 'refunded') ||
          order.delivery_status === 'pending' ||
          order.delivery_status === 'processing'
        );
        break;
      case 'delivered':
        filtered = orders.filter(order => order.delivery_status === 'delivered');
        break;
      case 'cancelled':
        filtered = orders.filter(order => order.delivery_status === 'cancelled');
        break;
      default:
        filtered = orders;
    }

    setFilteredOrders(filtered);
  }, [orders, activeFilter]);

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
        return <CheckCircle className="w-4 h-4" />;
      case 'shipped':
        return <Truck className="w-4 h-4" />;
      case 'processing':
        return <Clock className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      case 'paid':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 pt-14 md:pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
          {/* Loading Header */}
          <div className="mb-8">
            <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl w-48 animate-pulse"></div>
          </div>

          {/* Filter Tabs Skeleton */}
          <div className="flex space-x-2 mb-8 overflow-x-auto pb-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full w-24 animate-pulse"></div>
            ))}
          </div>

          {/* Order Cards Skeleton */}
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 overflow-hidden"
              >
                <div className="p-6 space-y-4">
                  {/* Header Skeleton */}
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl w-32 animate-pulse"></div>
                      <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-24 animate-pulse"></div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="h-7 bg-gradient-to-r from-blue-200 to-blue-300 rounded-xl w-20 animate-pulse"></div>
                      <div className="flex space-x-2 justify-end">
                        <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full w-16 animate-pulse"></div>
                        <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full w-16 animate-pulse"></div>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Info Skeleton */}
                  <div className="border-t border-gray-100 pt-4 space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse"></div>
                      <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-48 animate-pulse"></div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse"></div>
                      <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-32 animate-pulse"></div>
                    </div>
                  </div>

                  {/* Products Skeleton */}
                  <div className="border-t border-gray-100 pt-4">
                    <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-24 mb-3 animate-pulse"></div>
                    <div className="flex items-center space-x-4">
                      <div className="h-16 w-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl animate-pulse"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-32 animate-pulse"></div>
                        <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-20 animate-pulse"></div>
                      </div>
                      <div className="text-right">
                        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-12 animate-pulse"></div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons Skeleton */}
                  <div className="flex space-x-3 pt-4">
                    <div className="h-10 bg-gradient-to-r from-blue-200 to-blue-300 rounded-full flex-1 animate-pulse"></div>
                    <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex-1 animate-pulse"></div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 pt-14 md:pt-20">
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
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Oops! Something went wrong</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-full font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
              >
                Try Again
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 pt-14 md:pt-10 pb-16 md:pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">Track and manage your delivery orders</p>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-0 sm:space-x-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            {[
              { id: 'all', label: 'All Orders', count: orders.length },
              {
                id: 'pending', label: 'Pending', count: orders.filter(o =>
                  (o.payment_status !== 'paid' && o.payment_status !== 'failed' && o.payment_status !== 'refunded') ||
                  o.delivery_status === 'pending' ||
                  o.delivery_status === 'processing'
                ).length
              },
              { id: 'delivered', label: 'Delivered', count: orders.filter(o => o.delivery_status === 'delivered').length },
              { id: 'cancelled', label: 'Cancelled', count: orders.filter(o => o.delivery_status === 'cancelled').length }
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id as FilterType)}
                className={`flex-1 sm:flex-none px-3 sm:px-6 py-2.5 sm:py-3 rounded-full font-medium transition-all duration-200 text-sm sm:text-base flex items-center justify-center gap-1 sm:gap-2 min-w-0 ${activeFilter === filter.id
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white border border-gray-200'
                  }`}
              >
                <span className="truncate">{filter.label}</span>
                {filter.count > 0 && (
                  <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs flex-shrink-0 ${activeFilter === filter.id ? 'bg-white/20' : 'bg-gray-100 text-gray-600'
                    }`}>
                    {filter.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Empty State */}
        {filteredOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center py-16"
          >
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 max-w-md mx-auto border border-white/20">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No Orders Yet</h3>
              <p className="text-gray-600 mb-8">
                {activeFilter === 'all'
                  ? "Start shopping to see your orders here"
                  : `No ${activeFilter} orders found`
                }
              </p>
              {activeFilter === 'all' && (
                <a
                  href="/shop"
                  className="inline-flex items-center bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-full font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg shadow-blue-500/25"
                >
                  Start Shopping
                  <ArrowRight className="w-5 h-5 ml-2" />
                </a>
              )}
            </div>
          </motion.div>
        ) : (
          /* Order Cards */
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <AnimatePresence>
              {filteredOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -2, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
                  className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 overflow-hidden"
                >
                  <div className="p-6">
                    {/* Order Header */}
                    <div className="flex justify-between items-start mb-6">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-xl font-bold text-gray-900">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </h3>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(order.payment_status === 'paid' ? order.payment_status : order.delivery_status)}`}>
                            {getStatusIcon(order.payment_status === 'paid' ? order.payment_status : order.delivery_status)}
                            <span>{order.payment_status === 'paid' ? order.payment_status : order.delivery_status}</span>
                          </div>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          {formatDate(order.created_at)}
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="text-2xl font-bold text-gray-900">
                          Rs.{order.total_amount.toLocaleString()}
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(order.payment_status)}`}>
                          {getStatusIcon(order.payment_status)}
                          <span>{order.payment_status}</span>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Info */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4 mb-6">
                      <div className="flex items-start space-x-3 mb-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900 mb-1">Delivery Address</p>
                          <p className="text-sm text-gray-600">{order.delivery_address}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                          <Phone className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 mb-1">Contact</p>
                          <p className="text-sm text-gray-600">{order.phone}</p>
                        </div>
                      </div>
                    </div>

                    {/* Products Preview */}
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Order Items</h4>
                      <div className="space-y-2">
                        {(order.order_items || order.products)?.slice(0, 2).map((item, _itemIndex) => (
                          <div key={item.id} className="bg-gray-50 rounded-2xl p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-900 mb-1">
                                  {(() => {
                                    // First try the nested structure from database
                                    if (item.products && typeof item.products === 'object' && 'name' in item.products) {
                                      return (item.products as any).name;
                                    }
                                    if (item.products && typeof item.products === 'string') {
                                      try {
                                        const parsed = JSON.parse(item.products);
                                        return parsed.name || 'Product';
                                      } catch (e) {
                                        return 'Product';
                                      }
                                    }
                                    // Use fetched product names
                                    if (item.product_id && productNames[item.product_id]) {
                                      return productNames[item.product_id];
                                    }
                                    return 'Product';
                                  })()}
                                </p>
                                <div className="flex items-center space-x-4 text-xs text-gray-600">
                                  <span>Quantity: {item.quantity}</span>
                                  <span>Price: Rs.{item.price}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-gray-900">Rs.{item.price * item.quantity}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                        {(order.order_items || order.products) && (order.order_items || order.products)!.length > 2 && (
                          <div className="text-center py-2">
                            <p className="text-sm text-gray-600">+{(order.order_items || order.products)!.length - 2} more items</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3 pt-4">
                      <Link
                        to={`/track-order/${order.id}`}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/25"
                      >
                        <Truck className="w-4 h-4" />
                        <span>Track Order</span>
                      </Link>
                      <Link
                        to={`/order-details/${order.id}`}
                        className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                      >
                        <ArrowRight className="w-4 h-4" />
                        <span>View Details</span>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default OrdersHistory;
