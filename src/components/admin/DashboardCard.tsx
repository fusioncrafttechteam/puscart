import React from 'react'
import type { LucideIcon } from 'lucide-react'

interface DashboardCardProps {
  title: string
  value: string
  hint?: string
  icon: LucideIcon
  tone?: 'sky' | 'emerald' | 'violet' | 'amber'
}

const toneClasses = {
  sky: 'bg-sky-50 text-sky-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  violet: 'bg-violet-50 text-violet-600',
  amber: 'bg-amber-50 text-amber-600',
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  hint,
  icon: Icon,
  tone = 'sky',
}) => {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 truncate text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${toneClasses[tone]}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
    </article>
  )
}

export default DashboardCard
