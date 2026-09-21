import React, { useState, useEffect, lazy, Suspense } from 'react'


import { supabase } from '../../services/supabase'
import {
  ShoppingBagIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  UsersIcon
} from '@heroicons/react/24/outline'
import AdminSidebar from '../../components/AdminSidebar'

// Lazy load chart components for better performance
const LineChart = lazy(() => import('recharts').then(module => ({ default: module.LineChart })))
const Line = lazy(() => import('recharts').then(module => ({ default: module.Line })))
const BarChart = lazy(() => import('recharts').then(module => ({ default: module.BarChart })))
const Bar = lazy(() => import('recharts').then(module => ({ default: module.Bar })))
const XAxis = lazy(() => import('recharts').then(module => ({ default: module.XAxis })))
const YAxis = lazy(() => import('recharts').then(module => ({ default: module.YAxis })))
const CartesianGrid = lazy(() => import('recharts').then(module => ({ default: module.CartesianGrid })))
const Tooltip = lazy(() => import('recharts').then(module => ({ default: module.Tooltip })))
const ResponsiveContainer = lazy(() => import('recharts').then(module => ({ default: module.ResponsiveContainer })))

interface DashboardStats {
  totalProducts: number
  totalRevenue: number
  totalUsers: number
  totalOrders: number
}

interface ChartData {
  month: string
  revenue: number
  orders: number
  users: number
}

const AdminDashboard: React.FC = () => {

  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalRevenue: 0,
    totalUsers: 0,
    totalOrders: 0
  })
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)



  useEffect(() => {
    fetchDashboardData()

    // Set up realtime subscriptions
    const ordersSubscription = supabase
      .channel('orders-changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          fetchDashboardData()
        }
      )
      .subscribe()

    const productsSubscription = supabase
      .channel('products-changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        () => {
          fetchDashboardData()
        }
      )
      .subscribe()

    const usersSubscription = supabase
      .channel('users-changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users'
        },
        () => {
          fetchDashboardData()
        }
      )
      .subscribe()

    return () => {
      ordersSubscription.unsubscribe()
      productsSubscription.unsubscribe()
      usersSubscription.unsubscribe()
    }
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      // Fetch stats
      const [
        productsCount,
        revenueResult,
        usersCount,
        ordersCount
      ] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('total_amount').eq('payment_status', 'paid'),
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true })
      ])

      const totalRevenue = revenueResult.data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0

      setStats({
        totalProducts: productsCount.count || 0,
        totalRevenue,
        totalUsers: usersCount.count || 0,
        totalOrders: ordersCount.count || 0
      })

      // Fetch chart data (monthly data for the last 6 months)
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

      const { data: monthlyData } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .eq('payment_status', 'paid')
        .gte('created_at', sixMonthsAgo.toISOString())
        .order('created_at', { ascending: true })

      // Process data for charts
      const monthlyStats = processMonthlyData(monthlyData || [])
      setChartData(monthlyStats)

    } catch (error) {
      // Error fetching dashboard data
    } finally {
      setLoading(false)
    }
  }

  const processMonthlyData = (orders: any[]): ChartData[] => {
    const monthlyMap = new Map<string, { revenue: number; orders: number }>()

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    // Initialize last 6 months
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthlyMap.set(monthKey, { revenue: 0, orders: 0 })
    }

    // Aggregate orders by month
    orders.forEach(order => {
      const date = new Date(order.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const existing = monthlyMap.get(monthKey) || { revenue: 0, orders: 0 }
      monthlyMap.set(monthKey, {
        revenue: existing.revenue + (order.total_amount || 0),
        orders: existing.orders + 1
      })
    })

    // Convert to chart format
    return Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month: monthNames[parseInt(month.split('-')[1]) - 1],
      revenue: data.revenue,
      orders: data.orders,
      users: 0 // We'll need to implement user registration tracking
    }))
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
      {/* Sidebar */}
      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main content */}
      <div className="flex-1 w-full max-w-full overflow-x-hidden">

        {/* Dashboard content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">Here's what's happening with your store today.</p>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200 border border-gray-100">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="shrink-0">
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                      <ShoppingBagIcon className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-5 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Products</dt>
                      <dd className="text-2xl font-bold text-gray-900 mt-1">{stats.totalProducts}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200 border border-gray-100">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="shrink-0">
                    <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                      <ChartBarIcon className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <div className="ml-5 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                      <dd className="text-2xl font-bold text-gray-900 mt-1">₹{stats.totalRevenue.toFixed(2)}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200 border border-gray-100">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="shrink-0">
                    <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center">
                      <UsersIcon className="h-6 w-6 text-indigo-600" />
                    </div>
                  </div>
                  <div className="ml-5 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                      <dd className="text-2xl font-bold text-gray-900 mt-1">{stats.totalUsers}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200 border border-gray-100">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="shrink-0">
                    <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                      <ClipboardDocumentListIcon className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                  <div className="ml-5 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
                      <dd className="text-2xl font-bold text-gray-900 mt-1">{stats.totalOrders}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
            <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200 border border-gray-100">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Monthly Revenue</h3>
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <ChartBarIcon className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <Suspense fallback={<div className="h-300 flex items-center justify-center text-gray-500">Loading chart...</div>}>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <Tooltip
                        formatter={(value) => [`₹${value}`, 'Revenue']}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        dot={{ fill: '#3B82F6', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Suspense>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200 border border-gray-100">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Orders Growth</h3>
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                    <ClipboardDocumentListIcon className="h-4 w-4 text-green-600" />
                  </div>
                </div>
                <Suspense fallback={<div className="h-300 flex items-center justify-center text-gray-500">Loading chart...</div>}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <Tooltip
                        formatter={(value) => [value, 'Orders']}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="orders" fill="#10B981" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}

    </div>
  )
}

export default AdminDashboard
