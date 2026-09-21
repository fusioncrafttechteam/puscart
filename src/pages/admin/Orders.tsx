import React, { useState, useEffect } from 'react'

import { supabase } from '../../services/supabase'
import type { ProductItem } from '../../services/orderService'
import {
  EyeIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import AdminSidebar from '../../components/AdminSidebar'


interface Order {
  id: string
  user_id: string
  total_amount: number
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  delivery_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  delivery_address: string
  phone: string
  created_at: string
  users?: {
    name: string
    email: string
  }[]
  products?: any
}

const AdminOrders: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)



  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [searchTerm, statusFilter])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showOrderModal) {
        closeOrderModal()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showOrderModal])

  const fetchOrders = async () => {
    try {
      // Get orders without user join
      let query = supabase
        .from('orders')
        .select(`
          id,
          user_id,
          total_amount,
          payment_status,
          delivery_status,
          delivery_address,
          phone,
          created_at,
          products
        `)
        .order('created_at', { ascending: false })

      const { data: ordersData, error } = await query

      if (error) throw error

      // Get user information for each order
      const ordersWithUsers = await Promise.all(
        (ordersData || []).map(async (order: any) => {
          let userInfo = null
          if (order.user_id) {
            try {
              // Use public users table
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id, name, email')
                .eq('id', order.user_id)
                .single()

              if (!userError && userData) {
                userInfo = {
                  name: userData.name || userData.email?.split('@')[0] || 'Unknown',
                  email: userData.email || 'Unknown'
                }
              }
            } catch (userErr) {
              // Error fetching user
            }
          }

          return {
            ...order,
            users: userInfo ? [userInfo] : []
          }
        })
      )

      let filteredOrders = ordersWithUsers

      // Apply search filter
      if (searchTerm) {
        filteredOrders = filteredOrders.filter((order: any) => {
          const userName = order.users?.[0]?.name || ''
          const userEmail = order.users?.[0]?.email || ''
          const orderId = order.id || ''
          return userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
            orderId.toLowerCase().includes(searchTerm.toLowerCase())
        })
      }

      // Apply status filter
      if (statusFilter) {
        filteredOrders = filteredOrders.filter((order: any) => {
          return order.delivery_status === statusFilter
        })
      }

      setOrders(filteredOrders as Order[])
    } catch (error) {
      // Fallback to empty state on error
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: Order['delivery_status']) => {
    setUpdatingStatus(true)
    try {
      const { error } = await supabase
        .from('orders')
        .update({ delivery_status: newStatus })
        .eq('id', orderId)

      if (error) throw error

      await fetchOrders()
    } catch (error) {
      // Error updating order status
    } finally {
      setUpdatingStatus(false)
    }
  }

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order)
    setShowOrderModal(true)
  }

  const closeOrderModal = () => {
    setShowOrderModal(false)
    setSelectedOrder(null)
  }

  const exportToCSV = () => {
    const csvContent = [
      ['Order ID', 'Customer', 'Email', 'Total Amount', 'Payment Method', 'Order Status', 'Created Date'],
      ...orders.map((order: any) => [
        order.id,
        order.users?.[0]?.name || 'N/A',
        order.users?.[0]?.email || 'N/A',
        order.total_amount,
        order.payment_method,
        order.order_status,
        new Date(order.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'pending':
      case 'processing':
        return 'bg-yellow-100 text-yellow-800'
      case 'shipped':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex pt-14 md:pt-0 overflow-x-hidden">
      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      {/* Main content */}
      <div className="flex-1 w-full max-w-full overflow-x-hidden">

        {/* Orders content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
              <button
                onClick={exportToCSV}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                Export CSV
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by customer, email, or payment ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Products
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Delivery Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.id.slice(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{order.users?.[0]?.name || 'N/A'}</div>
                          <div className="text-gray-500">{order.users?.[0]?.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.products?.length || 0} items
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.payment_status)}`}>
                          {order.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.delivery_status)}`}>
                            {order.delivery_status}
                          </span>
                          <div className="relative">
                            <select
                              value={order.delivery_status}
                              onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['delivery_status'])}
                              disabled={updatingStatus}
                              className="text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{order.total_amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => viewOrderDetails(order)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden divide-y divide-gray-200">
              {orders.map((order) => (
                <div key={order.id} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Order: {order.id.slice(0, 8)}...</p>
                      <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <button
                      onClick={() => viewOrderDetails(order)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Customer:</span>
                      <div className="text-sm text-right">
                        <p className="font-medium">{order.users?.[0]?.name || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{order.users?.[0]?.email}</p>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Products:</span>
                      <span className="text-sm">{order.products?.length || 0} items</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Payment Status:</span>
                      <span className="text-sm">{order.payment_status}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Status:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.delivery_status)}`}>
                        {order.delivery_status}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Delivery Status:</span>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.delivery_status)}`}>
                          {order.delivery_status}
                        </span>
                        <select
                          value={order.delivery_status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['delivery_status'])}
                          disabled={updatingStatus}
                          className="text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Total:</span>
                      <span className="text-sm font-medium">₹{order.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {orders.length === 0 && (
              <div className="text-center py-12">
                <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
                <p className="mt-1 text-sm text-gray-500">No orders match your current filters.</p>
              </div>
            )}
          </div>

          {/* Order Details Modal */}
          {showOrderModal && selectedOrder && (
            <div
              className="fixed inset-0 z-50 overflow-y-auto"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  closeOrderModal()
                }
              }}
            >
              <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                  <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full relative z-10">
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Order Details
                      </h3>
                      <button
                        onClick={closeOrderModal}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <span className="sr-only">Close</span>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="space-y-6">
                      {/* Customer Info */}
                      <div>
                        <h4 className="text-md font-medium text-gray-900 mb-2">Customer Information</h4>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p><strong>Name:</strong> {selectedOrder.users?.[0]?.name}</p>
                          <p><strong>Email:</strong> {selectedOrder.users?.[0]?.email}</p>
                          <p><strong>Phone:</strong> {selectedOrder.phone}</p>
                          <p><strong>Delivery Address:</strong> {selectedOrder.delivery_address}</p>
                          <p><strong>Payment Status:</strong> {selectedOrder.payment_status}</p>
                          <p><strong>Delivery Status:</strong> {selectedOrder.delivery_status}</p>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div>
                        <h4 className="text-md font-medium text-gray-900 mb-2">Order Items</h4>
                        <div className="space-y-2">
                          {selectedOrder.products?.map((item: ProductItem) => (
                            <div key={item.id} className="flex items-center space-x-4 bg-gray-50 p-3 rounded-lg">

                              <div className="flex-1">
                                <p className="font-medium">{item.products?.name}</p>
                                <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                              </div>
                              <p className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Order Summary */}
                      <div>
                        <h4 className="text-md font-medium text-gray-900 mb-2">Order Summary</h4>
                        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>₹{selectedOrder.total_amount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Payment Status:</span>
                            <span className="text-sm">{selectedOrder.payment_status}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Delivery Status:</span>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedOrder.delivery_status)}`}>
                              {selectedOrder.delivery_status}
                            </span>
                          </div>
                          <div className="border-t pt-2 flex justify-between font-medium">
                            <span>Total:</span>
                            <span>₹{selectedOrder.total_amount.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      onClick={closeOrderModal}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

export default AdminOrders
