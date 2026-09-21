import React from 'react'
import type { BadgeTone } from './statusTones'

interface StatusBadgeProps {
  label: string
  tone?: BadgeTone
}

const toneClasses: Record<BadgeTone, string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  warning: 'bg-amber-50 text-amber-700 ring-amber-600/15',
  danger: 'bg-red-50 text-red-700 ring-red-600/15',
  info: 'bg-sky-50 text-sky-700 ring-sky-600/15',
  neutral: 'bg-slate-100 text-slate-600 ring-slate-500/10',
  purple: 'bg-violet-50 text-violet-700 ring-violet-600/15',
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ label, tone = 'neutral' }) => {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${toneClasses[tone]}`}
    >
      {label}
    </span>
  )
}

export default StatusBadge
