import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LogOut, Store, X } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { adminNav } from './adminNav'
import logo from '../../assets/Puscart logo.jpeg'

interface AdminSidebarProps {
  open: boolean
  onClose: () => void
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ open, onClose }) => {
  const location = useLocation()
  const { signOut, appUser } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  const isActive = (href: string) => {
    if (href === '/admin') return location.pathname === '/admin'
    return location.pathname.startsWith(href)
  }

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-out lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <Link to="/admin" className="flex items-center gap-2.5" onClick={onClose}>
            <img src={logo} alt="" width={32} height={32} className="h-8 w-8 rounded-lg object-contain" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Puscart</p>
              <p className="text-[11px] text-slate-500">Admin Console</p>
            </div>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Admin">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Menu
          </p>
          <ul className="space-y-1">
            {adminNav.map((item) => {
              const active = isActive(item.href)
              const Icon = item.icon
              return (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-sky-50 text-sky-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    {item.name}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="border-t border-slate-200 p-3">
          <div className="mb-2 rounded-lg bg-slate-50 px-3 py-2">
            <p className="truncate text-sm font-medium text-slate-900">{appUser?.name || 'Admin'}</p>
            <p className="truncate text-xs text-slate-500">{appUser?.email}</p>
          </div>
          <Link
            to="/"
            className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          >
            <Store className="h-5 w-5" aria-hidden="true" />
            View store
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          >
            <LogOut className="h-5 w-5" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}

export default AdminSidebar
