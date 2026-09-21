import {
  ClipboardList,
  Image,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Tags,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface AdminNavItem {
  name: string
  href: string
  icon: LucideIcon
}

export const adminNav: AdminNavItem[] = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Products', href: '/admin/products', icon: ShoppingBag },
  { name: 'Categories', href: '/admin/categories', icon: Tags },
  { name: 'Offer Banners', href: '/admin/banners', icon: Image },
  { name: 'Orders', href: '/admin/orders', icon: ClipboardList },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Delivery Settings', href: '/admin/delivery-settings', icon: Settings },
  { name: 'Activity Logs', href: '/admin/activity-logs', icon: ShieldCheck },
]

export const adminPageMeta: Record<string, { title: string; description: string }> = {
  '/admin': {
    title: 'Dashboard',
    description: 'Overview of store performance',
  },
  '/admin/products': {
    title: 'Products',
    description: 'Manage catalog, pricing, and stock',
  },
  '/admin/categories': {
    title: 'Categories',
    description: 'Organize products and homepage order',
  },
  '/admin/banners': {
    title: 'Offer Banners',
    description: 'Manage promotional banners',
  },
  '/admin/orders': {
    title: 'Orders',
    description: 'Track payments and deliveries',
  },
  '/admin/users': {
    title: 'Users',
    description: 'View customers and admin accounts',
  },
  '/admin/delivery-settings': {
    title: 'Delivery Settings',
    description: 'Configure delivery fees and coverage',
  },
  '/admin/activity-logs': {
    title: 'Activity Logs',
    description: 'Review admin and store activity',
  },
}

export function getAdminPageMeta(pathname: string) {
  return (
    adminPageMeta[pathname] ?? {
      title: 'Admin',
      description: 'Puscart administration',
    }
  )
}
