import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import {
  EyeIcon,
  MagnifyingGlassIcon,
  NoSymbolIcon,
  CheckIcon,
  ShoppingBagIcon,
  TagIcon,
  PhotoIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
  ArrowRightOnRectangleIcon,
  HomeIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../../contexts/AuthContext'

interface User {
  id: string
  name: string
  email: string
  phone: string
  role: 'user' | 'admin'
  is_blocked: boolean
  created_at: string
  orders_count: number
}

const AdminUsers: React.FC = () => {
  const { signOut } = useAuth()
  const location = useLocation()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [updating, setUpdating] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: HomeIcon },
    { name: 'Products', href: '/admin/products', icon: ShoppingBagIcon },
    { name: 'Categories', href: '/admin/categories', icon: TagIcon },
    { name: 'Offer Banners', href: '/admin/banners', icon: PhotoIcon },
    { name: 'Orders', href: '/admin/orders', icon: ClipboardDocumentListIcon },
    { name: 'Users', href: '/admin/users', icon: UsersIcon },
  ]

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [searchTerm, roleFilter])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showUserModal) {
        closeUserModal()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showUserModal])

  const fetchUsers = async () => {
    try {
      // Get users from public users table
      let query = supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
      }

      const { data: usersData, error } = await query

      if (error) throw error

      if (!usersData || usersData.length === 0) {
        setUsers([])
        return
      }

      // Get all order counts in a single query for better performance
      const userIds = usersData.map(user => user.id)
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('user_id')
        .in('user_id', userIds)

      if (ordersError) {
        // Continue without order counts
      }

      // Group order counts by user_id
      const orderCounts: Record<string, number> = {}
      if (ordersData) {
        ordersData.forEach(order => {
          orderCounts[order.user_id] = (orderCounts[order.user_id] || 0) + 1
        })
      }

      // Transform users and add order counts
      const usersWithOrderCount = usersData.map((user: any) => {
        return {
          id: user.id,
          name: user.name || user.email?.split('@')[0] || 'Unknown',
          email: user.email || 'Unknown',
          phone: user.phone || '',
          role: user.role || 'user',
          is_blocked: user.is_blocked || false,
          created_at: user.created_at,
          orders_count: orderCounts[user.id] || 0
        }
      })

      // Apply role filter if needed
      let filteredUsers = usersWithOrderCount
      if (roleFilter) {
        filteredUsers = usersWithOrderCount.filter(user => user.role === roleFilter)
      }

      setUsers(filteredUsers)
    } catch (error) {
      // Fallback to empty state on error
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const toggleBlockUser = async (userId: string, isBlocked: boolean) => {
    setUpdating(true)
    try {
      // Update user in public users table
      const { error } = await supabase
        .from('users')
        .update({ is_blocked: !isBlocked })
        .eq('id', userId)

      if (error) throw error

      await fetchUsers()
    } catch (error) {
      // Error updating user status
    } finally {
      setUpdating(false)
    }
  }

  const viewUserProfile = (user: User) => {
    setSelectedUser(user)
    setShowUserModal(true)
  }

  const closeUserModal = () => {
    setShowUserModal(false)
    setSelectedUser(null)
  }

  const handleSignOut = async () => {
    await signOut()
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
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 hidden lg:block">
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>

        <nav className="mt-8">
          <div className="px-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${location.pathname === item.href
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </div>

          <div className="mt-8 px-4">
            <button
              onClick={handleSignOut}
              className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 w-full"
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </nav>
      </div>
      {/* Main content */}
      <div className="flex-1 w-full max-w-full overflow-x-hidden">

        {/* Users content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Roles</option>
                <option value="user">Users</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.orders_count || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.is_blocked
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {user.is_blocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => viewUserProfile(user)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  {user.role !== 'admin' && (
                    <button
                      onClick={() => toggleBlockUser(user.id, user.is_blocked)}
                      disabled={updating}
                      className={user.is_blocked ? 'text-green-600 hover:text-green-900' : 'text-red-600 hover:text-red-900'}
                      title={user.is_blocked ? 'Unblock user' : 'Block user'}
                    >
                      {user.is_blocked ? (
                        <CheckIcon className="h-4 w-4" />
                      ) : (
                        <NoSymbolIcon className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </td>
              </tr>
                ))}
            </tbody>
          </table>
            </div>

        {/* Mobile Card View */}
        <div className="lg:hidden divide-y divide-gray-200">
          {users.map((user) => (
            <div key={user.id} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{new Date(user.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => viewUserProfile(user)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </button>
                  {user.role !== 'admin' && (
                    <button
                      onClick={() => toggleBlockUser(user.id, user.is_blocked)}
                      disabled={updating}
                      className={user.is_blocked ? 'text-green-600 hover:text-green-900' : 'text-red-600 hover:text-red-900'}
                      title={user.is_blocked ? 'Unblock user' : 'Block user'}
                    >
                      {user.is_blocked ? (
                        <CheckIcon className="h-5 w-5" />
                      ) : (
                        <NoSymbolIcon className="h-5 w-5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Email:</span>
                  <span className="text-sm text-right">{user.email}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Phone:</span>
                  <span className="text-sm">{user.phone}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Role:</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                  : 'bg-gray-100 text-gray-800'
                    }`}>
                  {user.role}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Orders:</span>
                <span className="text-sm">{user.orders_count || 0}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Status:</span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.is_blocked
                        ? 'bg-red-100 text-red-800'
                : 'bg-green-100 text-green-800'
                    }`}>
                {user.is_blocked ? 'Blocked' : 'Active'}
              </span>
            </div>
                </div>
      </div>
            ))}
    </div>

          {users.length === 0 && (
            <div className="text-center py-12">
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">No users match your current filters.</p>
            </div>
          )}
          </div>
        </div>

        {/* User Profile Modal */}
        {showUserModal && selectedUser && (
          <div
            className="fixed inset-0 z-50 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                closeUserModal()
              }
            }}
          >
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      User Profile
                    </h3>
                    <button
                      onClick={closeUserModal}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <span className="sr-only">Close</span>
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedUser.name}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedUser.phone}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Role</label>
                      <p className="mt-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${selectedUser.role === 'admin'
                                  ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                              }`}>
                          {selectedUser.role}
                        </span>
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <p className="mt-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${selectedUser.is_blocked
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-green-100 text-green-800'
                                }`}>
                          {selectedUser.is_blocked ? 'Blocked' : 'Active'}
                        </span>
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Orders Count</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedUser.orders_count || 0}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Joined Date</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(selectedUser.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={closeUserModal}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminUsers
