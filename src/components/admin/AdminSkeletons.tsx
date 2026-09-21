import React from 'react'

export const AdminPageSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 rounded-xl border border-slate-200 bg-white p-5">
            <div className="h-4 w-24 rounded bg-slate-200" />
            <div className="mt-4 h-7 w-16 rounded bg-slate-200" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="h-80 rounded-xl border border-slate-200 bg-white" />
        <div className="h-80 rounded-xl border border-slate-200 bg-white" />
      </div>
      <div className="h-72 rounded-xl border border-slate-200 bg-white" />
    </div>
  )
}

export const AdminTableSkeleton: React.FC<{ rows?: number }> = ({ rows = 8 }) => {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-6 py-4">
        <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 px-6 py-4">
            <div className="h-10 w-10 animate-pulse rounded-lg bg-slate-200" />
            <div className="h-4 flex-1 animate-pulse rounded bg-slate-200" />
            <div className="hidden h-4 w-24 animate-pulse rounded bg-slate-200 sm:block" />
            <div className="h-4 w-16 animate-pulse rounded bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  )
}

export const AdminRouteFallback: React.FC = () => {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-sky-600 border-t-transparent"
          aria-hidden="true"
        />
        <p className="text-sm text-slate-500">Loading page…</p>
      </div>
    </div>
  )
}
