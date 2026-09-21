import React from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BarChart3, ClipboardList } from 'lucide-react'

export interface ChartPoint {
  month: string
  revenue: number
  orders: number
}

interface DashboardChartsProps {
  data: ChartPoint[]
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Monthly revenue</h2>
            <p className="text-sm text-slate-500">Paid orders over the last 6 months</p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
            <BarChart3 className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value) => [`₹${Number(value).toFixed(2)}`, 'Revenue']}
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#0284c7"
                strokeWidth={2}
                dot={{ fill: '#0284c7', r: 3 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Orders growth</h2>
            <p className="text-sm text-slate-500">Paid order volume by month</p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <ClipboardList className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value) => [value, 'Orders']}
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
              />
              <Bar dataKey="orders" fill="#10b981" radius={[6, 6, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  )
}

export default DashboardCharts
