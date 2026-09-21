import React, { useEffect, useState } from 'react'
import { Eye, Search } from 'lucide-react'
import { supabase } from '../../services/supabase'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import StatusBadge from '../../components/admin/StatusBadge'
import { getPaymentTone } from '../../components/admin/statusTones'
import EmptyState from '../../components/admin/EmptyState'
import Pagination from '../../components/admin/Pagination'
import { AdminTableSkeleton } from '../../components/admin/AdminSkeletons'

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
  }
  order_items?: {
    id: string
    product_id: string
    quantity: number
    price: number
    products?: {
      name: string
      image: string
    }
  }[]
}

const PAGE_SIZE = 12

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debouncedSearch = useDebouncedValue(searchTerm, 350)

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter])

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true)
      setError(null)
      try {
        const from = (page - 1) * PAGE_SIZE
        const to = from + PAGE_SIZE - 1
        const search = debouncedSearch.trim()
        let matchedUserIds: string[] = []

        if (search) {
          const { data: matchedUsers, error: userSearchError } = await supabase
            .from('users')
            .select('id')
            .or(`name.ilike.%${search}%,email.ilike.%${search}%`)

          if (userSearchError) {
            console.error('Error searching customers:', userSearchError)
          } else {
            matchedUserIds = matchedUsers?.map((user) => user.id) ?? []
          }
        }

        let countQuery = supabase.from('orders').select('id', { count: 'exact', head: true })
        let dataQuery = supabase.from('orders').select('*')

        if (statusFilter) {
          countQuery = countQuery.eq('delivery_status', statusFilter)
          dataQuery = dataQuery.eq('delivery_status', statusFilter)
        }

        if (search) {
          const clauses = [`phone.ilike.%${search}%`]
          if (matchedUserIds.length > 0) {
            clauses.push(`user_id.in.(${matchedUserIds.join(',')})`)
          }
          const orFilter = clauses.join(',')
          countQuery = countQuery.or(orFilter)
          dataQuery = dataQuery.or(orFilter)
        }

        const [{ count, error: countError }, ordersResult] = await Promise.all([
          countQuery,
          dataQuery.order('created_at', { ascending: false }).range(from, to),
        ])

        if (countError) {
          console.error('Error counting orders:', countError)
        }

        const ordersError = ordersResult.error
        if (ordersError && ordersError.code !== 'PGRST103') {
          throw ordersError
        }

        const rows = ordersError ? [] : (ordersResult.data ?? [])
        const userIds = [...new Set(rows.map((row) => row.user_id).filter(Boolean))]
        const orderIds = rows.map((row) => row.id)

        const usersById = new Map<string, { name: string; email: string }>()
        const itemsByOrderId = new Map<string, NonNullable<Order['order_items']>>()

        if (userIds.length > 0) {
          const { data: userRows, error: usersError } = await supabase
            .from('users')
            .select('id, name, email')
            .in('id', userIds)

          if (usersError) {
            console.error('Error fetching order customers:', usersError)
          } else {
            userRows?.forEach((user) => {
              usersById.set(user.id, { name: user.name, email: user.email })
            })
          }
        }

        if (orderIds.length > 0) {
          const { data: itemRows, error: itemsError } = await supabase
            .from('order_items')
            .select('id, order_id, product_id, quantity, price')
            .in('order_id', orderIds)

          if (itemsError) {
            console.error('Error fetching order items:', itemsError)
          } else {
            const productIds = [...new Set((itemRows ?? []).map((item) => item.product_id).filter(Boolean))]
            const productsById = new Map<string, { name: string; image: string }>()

            if (productIds.length > 0) {
              const { data: productRows, error: productsError } = await supabase
                .from('products')
                .select('id, name, image')
                .in('id', productIds)

              if (productsError) {
                console.error('Error fetching order products:', productsError)
              } else {
                productRows?.forEach((product) => {
                  productsById.set(product.id, { name: product.name, image: product.image })
                })
              }
            }

            itemRows?.forEach((item) => {
              const current = itemsByOrderId.get(item.order_id) ?? []
              current.push({
                id: item.id,
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.price,
                products: productsById.get(item.product_id),
              })
              itemsByOrderId.set(item.order_id, current)
            })
          }
        }

        setOrders(
          rows.map((row) => ({
            ...row,
            users: usersById.get(row.user_id),
            order_items: itemsByOrderId.get(row.id) ?? [],
          })) as Order[]
        )
        setTotal(count ?? rows.length)
      } catch (fetchError) {
        console.error('Error fetching orders:', fetchError)
        const message =
          fetchError && typeof fetchError === 'object' && 'message' in fetchError
            ? String((fetchError as { message: unknown }).message)
            : 'Unable to load orders.'
        setError(message || 'Unable to load orders.')
      } finally {
        setLoading(false)
      }
    }

    void fetchOrders()
  }, [debouncedSearch, statusFilter, page])

  const updateDeliveryStatus = async (orderId: string, newStatus: Order['delivery_status']) => {
    setUpdatingStatus(true)
    try {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ delivery_status: newStatus })
        .eq('id', orderId)
      if (updateError) throw updateError
      setOrders((current) =>
        current.map((order) => (order.id === orderId ? { ...order, delivery_status: newStatus } : order))
      )
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, delivery_status: newStatus })
      }
    } catch (updateError) {
      console.error('Error updating delivery status:', updateError)
    } finally {
      setUpdatingStatus(false)
    }
  }

  const exportToCSV = () => {
    const csvContent = [
      ['Order ID', 'Customer', 'Email', 'Total Amount', 'Payment Status', 'Delivery Status', 'Created Date'],
      ...orders.map((order) => [
        order.id,
        order.users?.name || 'N/A',
        order.users?.email || 'N/A',
        order.total_amount,
        order.payment_status,
        order.delivery_status,
        new Date(order.created_at).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `orders_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  const inputClass =
    'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">Track payments, delivery status, and customer orders.</p>
        <button
          type="button"
          onClick={exportToCSV}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Export CSV
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="relative block">
            <span className="sr-only">Search orders</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by customer name or email..."
              className={`${inputClass} pl-9`}
            />
          </label>
          <label>
            <span className="sr-only">Filter by delivery status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={inputClass}>
              <option value="">All delivery statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <AdminTableSkeleton />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {['Order', 'Customer', 'Items', 'Payment', 'Delivery', 'Amount', 'Date', ''].map((heading) => (
                    <th
                      key={heading || 'actions'}
                      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 text-sm font-medium text-slate-900">{order.id.slice(0, 8)}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">
                      <div className="font-medium text-slate-900">{order.users?.name || 'N/A'}</div>
                      <div className="text-xs text-slate-500">{order.users?.email}</div>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">{order.order_items?.length || 0}</td>
                    <td className="px-5 py-3">
                      <StatusBadge label={order.payment_status} tone={getPaymentTone(order.payment_status)} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <StatusBadge label={order.delivery_status} tone={getPaymentTone(order.delivery_status)} />
                        <select
                          value={order.delivery_status}
                          disabled={updatingStatus}
                          onChange={(event) =>
                            void updateDeliveryStatus(order.id, event.target.value as Order['delivery_status'])
                          }
                          className="rounded-md border border-slate-200 text-xs"
                          aria-label={`Update delivery status for order ${order.id.slice(0, 8)}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm font-medium text-slate-900">₹{order.total_amount.toFixed(2)}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOrder(order)
                          setShowOrderModal(true)
                        }}
                        className="rounded-md p-1.5 text-sky-600 hover:bg-sky-50"
                        aria-label={`View order ${order.id.slice(0, 8)}`}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-slate-100 lg:hidden">
            {orders.map((order) => (
              <div key={order.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{order.id.slice(0, 8)}</p>
                    <p className="text-xs text-slate-500">{order.users?.name || 'N/A'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOrder(order)
                      setShowOrderModal(true)
                    }}
                    className="text-sm font-medium text-sky-700"
                  >
                    View
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <StatusBadge label={order.payment_status} tone={getPaymentTone(order.payment_status)} />
                  <StatusBadge label={order.delivery_status} tone={getPaymentTone(order.delivery_status)} />
                </div>
                <p className="mt-2 text-sm font-medium text-slate-900">₹{order.total_amount.toFixed(2)}</p>
              </div>
            ))}
          </div>

          {orders.length === 0 && (
            <EmptyState title="No orders found" description="No orders match your current filters." />
          )}

          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </div>
      )}

      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50"
            aria-label="Close dialog"
            onClick={() => setShowOrderModal(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-dialog-title"
            className="relative mx-auto w-full max-w-2xl rounded-2xl bg-white shadow-xl"
          >
            <div className="border-b border-slate-200 px-6 py-4">
              <h3 id="order-dialog-title" className="text-lg font-semibold text-slate-900">
                Order details
              </h3>
            </div>
            <div className="space-y-5 px-6 py-5">
              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                <p><span className="font-medium">Name:</span> {selectedOrder.users?.name}</p>
                <p><span className="font-medium">Email:</span> {selectedOrder.users?.email}</p>
                <p><span className="font-medium">Phone:</span> {selectedOrder.phone}</p>
                <p><span className="font-medium">Address:</span> {selectedOrder.delivery_address}</p>
              </div>
              <div className="space-y-2">
                {selectedOrder.order_items?.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                    <img
                      src={item.products?.image}
                      alt=""
                      width={56}
                      height={56}
                      loading="lazy"
                      className="h-14 w-14 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{item.products?.name}</p>
                      <p className="text-xs text-slate-500">Qty {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium">₹{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Total</span>
                <span className="font-semibold text-slate-900">₹{selectedOrder.total_amount.toFixed(2)}</span>
              </div>
            </div>
            <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 text-right">
              <button
                type="button"
                onClick={() => setShowOrderModal(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminOrders
