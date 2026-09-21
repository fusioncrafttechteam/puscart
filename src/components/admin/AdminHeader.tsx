import React, { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronDown, LogOut, Menu, Store } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getAdminPageMeta } from './adminNav'

interface AdminHeaderProps {
  onMenuClick: () => void
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ onMenuClick }) => {
  const location = useLocation()
  const { appUser, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const meta = getAdminPageMeta(location.pathname)

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    window.addEventListener('mousedown', onPointerDown)
    return () => window.removeEventListener('mousedown', onPointerDown)
  }, [])

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="text-xs text-slate-400">
              Admin / <span className="text-slate-500">{meta.title}</span>
            </p>
            <h1 className="truncate text-lg font-semibold text-slate-900">{meta.title}</h1>
          </div>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-left hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-700">
              {(appUser?.name || 'A').charAt(0).toUpperCase()}
            </span>
            <span className="hidden min-w-0 sm:block">
              <span className="block max-w-32 truncate text-sm font-medium text-slate-900">
                {appUser?.name || 'Admin'}
              </span>
              <span className="block text-xs text-slate-500">Administrator</span>
            </span>
            <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" aria-hidden="true" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
            >
              <Link
                to="/"
                role="menuitem"
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => setMenuOpen(false)}
              >
                <Store className="h-4 w-4" aria-hidden="true" />
                View store
              </Link>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  setMenuOpen(false)
                  void signOut()
                }}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default AdminHeader
