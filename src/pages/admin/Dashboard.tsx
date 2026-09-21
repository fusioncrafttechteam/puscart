import React, { lazy, Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ClipboardList,
  Clock3,
  IndianRupee,
  ShoppingBag,
  Users,
} from 'lucide-react'
import { supabase } from '../../services/supabase'
import DashboardCard from '../../components/admin/DashboardCard'
import StatusBadge from '../../components/admin/StatusBadge'
import { getPaymentTone } from '../../components/admin/statusTones'
import EmptyState from '../../components/admin/EmptyState'
import { AdminPageSkeleton } from '../../components/admin/AdminSkeletons'
import type { ChartPoint } from './DashboardCharts'

const DashboardCharts = lazy(() => import('./DashboardCharts'))

interface DashboardStats {
  totalProducts: number
  totalRevenue: number
  totalUsers: number
  totalOrders: number
  pendingOrders: number
}

interface RecentOrder {
  id: string
  total_amount: number
  payment_status: string
  delivery_status: string
  created_at: string
  users?: { name: string | null; email: string | null } | null
}

interface PaidOrderRow {
  total_amount: number | null
  created_at: string
}

interface DashboardCache {
  at: number
  stats: DashboardStats
  chartData: ChartPoint[]
  recentOrders: RecentOrder[]
}

const CACHE_TTL_MS = 30_000
let dashboardCache: DashboardCache | null = null

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function processMonthlyData(orders: PaidOrderRow[]): ChartPoint[] {
  const monthlyMap = new Map<string, { revenue: number; orders: number }>()
  const now = new Date()

  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    monthlyMap.set(monthKey, { revenue: 0, orders: 0 })
  }

  orders.forEach((order) => {
    const date = new Date(order.created_at)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const existing = monthlyMap.get(monthKey)
    if (!existing) return
    monthlyMap.set(monthKey, {
      revenue: existing.revenue + (order.total_amount || 0),
      orders: existing.orders + 1,
    })
  })

  return Array.from(monthlyMap.entries()).map(([month, data]) => ({
    month: monthNames[Number.parseInt(month.split('-')[1], 10) - 1],
    revenue: data.revenue,
    orders: data.orders,
  }))
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>(
    dashboardCache?.stats ?? {
      totalProducts: 0,
      totalRevenue: 0,
      totalUsers: 0,
      totalOrders: 0,
      pendingOrders: 0,
    }
  )
  const [chartData, setChartData] = useState<ChartPoint[]>(dashboardCache?.chartData ?? [])
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>(dashboardCache?.recentOrders ?? [])
  const [loading, setLoading] = useState(!dashboardCache)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const now = Date.now()

    if (dashboardCache && now - dashboardCache.at < CACHE_TTL_MS) {
      setStats(dashboardCache.stats)
      setChartData(dashboardCache.chartData)
      setRecentOrders(dashboardCache.recentOrders)
      setLoading(false)
      return
    }

    const load = async (isInitial = false) => {
      if (isInitial) setLoading(true)
      setError(null)

      try {
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

        const [
          productsCount,
          usersCount,
          ordersCount,
          pendingCount,
          paidOrdersResult,
          recentResult,
        ] = await Promise.all([
          supabase.from('products').select('id', { count: 'exact', head: true }),
          supabase.from('users').select('id', { count: 'exact', head: true }),
          supabase.from('orders').select('id', { count: 'exact', head: true }),
          supabase
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .in('delivery_status', ['pending', 'processing']),
          supabase
            .from('orders')
            .select('total_amount, created_at')
            .eq('payment_status', 'paid')
            .gte('created_at', sixMonthsAgo.toISOString())
            .order('created_at', { ascending: true }),
          supabase
            .from('orders')
            .select('id, total_amount, payment_status, delivery_status, created_at, users(name, email)')
            .order('created_at', { ascending: false })
            .limit(8),
        ])

        if (cancelled) return

        const paidOrders = (paidOrdersResult.data ?? []) as PaidOrderRow[]
        const totalRevenue = paidOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
        const nextStats: DashboardStats = {
          totalProducts: productsCount.count || 0,
          totalRevenue,
          totalUsers: usersCount.count || 0,
          totalOrders: ordersCount.count || 0,
          pendingOrders: pendingCount.count || 0,
        }
        const nextChart = processMonthlyData(paidOrders)
        const nextRecent: RecentOrder[] = (recentResult.data ?? []).map((row) => {
          const relatedUser = Array.isArray(row.users) ? row.users[0] : row.users
          return {
            id: row.id,
            total_amount: row.total_amount,
            payment_status: row.payment_status,
            delivery_status: row.delivery_status,
            created_at: row.created_at,
            users: relatedUser ?? null,
          }
        })

        dashboardCache = {
          at: Date.now(),
          stats: nextStats,
          chartData: nextChart,
          recentOrders: nextRecent,
        }

        setStats(nextStats)
        setChartData(nextChart)
        setRecentOrders(nextRecent)
      } catch (loadError) {
        console.error('Error fetching dashboard data:', loadError)
        if (!cancelled) setError('Unable to load dashboard data. Please try again.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load(true)

    let refreshTimer: number | undefined
    const channel = supabase
      .channel('admin-dashboard-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        if (document.hidden) return
        dashboardCache = null
        window.clearTimeout(refreshTimer)
        refreshTimer = window.setTimeout(() => {
          void load(false)
        }, 2000)
      })
      .subscribe()

    return () => {
      cancelled = true
      window.clearTimeout(refreshTimer)
      void supabase.removeChannel(channel)
    }
  }, [])

  if (loading) {
    return <AdminPageSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Store overview</h2>
          <p className="mt-1 text-sm text-slate-500">Here is what is happening with Puscart right now.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/products"
            className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            Add product
          </Link>
          <Link
            to="/admin/orders"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            View orders
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <DashboardCard title="Total users" value={String(stats.totalUsers)} icon={Users} tone="violet" />
        <DashboardCard title="Total orders" value={String(stats.totalOrders)} icon={ClipboardList} tone="sky" />
        <DashboardCard
          title="Revenue (6 months)"
          value={`₹${stats.totalRevenue.toFixed(2)}`}
          hint="From paid orders"
          icon={IndianRupee}
          tone="emerald"
        />
        <DashboardCard
          title="Pending items"
          value={String(stats.pendingOrders)}
          hint="Pending or processing"
          icon={Clock3}
          tone="amber"
        />
        <DashboardCard title="Products" value={String(stats.totalProducts)} icon={ShoppingBag} tone="sky" />
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="h-80 animate-pulse rounded-xl border border-slate-200 bg-white" />
            <div className="h-80 animate-pulse rounded-xl border border-slate-200 bg-white" />
          </div>
        }
      >
        <DashboardCharts data={chartData} />
      </Suspense>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Recent orders</h2>
              <p className="text-sm text-slate-500">Latest store activity</p>
            </div>
            <Link to="/admin/orders" className="text-sm font-medium text-sky-700 hover:text-sky-800">
              View all
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <EmptyState title="No orders yet" description="New orders will appear here as customers check out." />
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Order
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Customer
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Payment
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Delivery
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 text-sm font-medium text-slate-900">
                          {order.id.slice(0, 8)}
                        </td>
                        <td className="px-5 py-3 text-sm text-slate-600">
                          {order.users?.name || 'Guest'}
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge label={order.payment_status} tone={getPaymentTone(order.payment_status)} />
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge label={order.delivery_status} tone={getPaymentTone(order.delivery_status)} />
                        </td>
                        <td className="px-5 py-3 text-right text-sm font-medium text-slate-900">
                          ₹{Number(order.total_amount).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="divide-y divide-slate-100 md:hidden">
                {recentOrders.map((order) => (
                  <div key={order.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{order.id.slice(0, 8)}</p>
                        <p className="text-xs text-slate-500">{order.users?.name || 'Guest'}</p>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">₹{Number(order.total_amount).toFixed(2)}</p>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <StatusBadge label={order.payment_status} tone={getPaymentTone(order.payment_status)} />
                      <StatusBadge label={order.delivery_status} tone={getPaymentTone(order.delivery_status)} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Quick actions</h2>
          <p className="mt-1 text-sm text-slate-500">Jump to common admin tasks.</p>
          <div className="mt-4 grid gap-2">
            <Link to="/admin/products" className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Manage products
            </Link>
            <Link to="/admin/categories" className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Reorder categories
            </Link>
            <Link to="/admin/banners" className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Update offer banners
            </Link>
            <Link to="/admin/users" className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Review users
            </Link>
          </div>
          {stats.pendingOrders > 0 && (
            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">
              {stats.pendingOrders} order{stats.pendingOrders === 1 ? '' : 's'} still need attention.
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default AdminDashboard
