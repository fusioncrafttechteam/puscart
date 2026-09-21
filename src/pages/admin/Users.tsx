import React, { useEffect, useState } from 'react'
import { Ban, Check, Eye, Search } from 'lucide-react'
import { supabase } from '../../services/supabase'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import StatusBadge from '../../components/admin/StatusBadge'
import EmptyState from '../../components/admin/EmptyState'
import Pagination from '../../components/admin/Pagination'
import { AdminTableSkeleton } from '../../components/admin/AdminSkeletons'

interface User {
  id: string
  name: string
  email: string
  phone: string
  role: 'user' | 'admin'
  is_blocked: boolean
  created_at: string
  orders_count?: number
}

const PAGE_SIZE = 12

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debouncedSearch = useDebouncedValue(searchTerm, 350)

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, roleFilter])

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      setError(null)
      try {
        const from = (page - 1) * PAGE_SIZE
        const to = from + PAGE_SIZE - 1
        const search = debouncedSearch.trim()

        let countQuery = supabase.from('users').select('id', { count: 'exact', head: true })
        let dataQuery = supabase.from('users').select('*')

        if (search) {
          const orFilter = `name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
          countQuery = countQuery.or(orFilter)
          dataQuery = dataQuery.or(orFilter)
        }
        if (roleFilter) {
          countQuery = countQuery.eq('role', roleFilter)
          dataQuery = dataQuery.eq('role', roleFilter)
        }

        const { count, error: countError } = await countQuery
        if (countError) throw countError

        const { data, error: usersError } = await dataQuery
          .order('created_at', { ascending: false })
          .range(from, to)

        if (usersError) throw usersError

        const pageUsers = data ?? []
        const userIds = pageUsers.map((user) => user.id)
        const orderCountByUser = new Map<string, number>()

        if (userIds.length > 0) {
          const { data: orderRows, error: ordersError } = await supabase
            .from('orders')
            .select('user_id')
            .in('user_id', userIds)

          if (ordersError) {
            console.error('Error fetching user order counts:', ordersError)
          } else {
            orderRows?.forEach((row) => {
              orderCountByUser.set(row.user_id, (orderCountByUser.get(row.user_id) || 0) + 1)
            })
          }
        }

        setUsers(
          pageUsers.map((user) => ({
            ...user,
            orders_count: orderCountByUser.get(user.id) || 0,
          })) as User[]
        )
        setTotal(count || 0)
      } catch (fetchError) {
        console.error('Error fetching users:', fetchError)
        setError('Unable to load users.')
      } finally {
        setLoading(false)
      }
    }

    void fetchUsers()
  }, [debouncedSearch, roleFilter, page])

  const toggleBlockUser = async (userId: string, isBlocked: boolean) => {
    setUpdating(true)
    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ is_blocked: !isBlocked })
        .eq('id', userId)
      if (updateError) throw updateError
      setUsers((current) =>
        current.map((user) => (user.id === userId ? { ...user, is_blocked: !isBlocked } : user))
      )
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, is_blocked: !isBlocked })
      }
    } catch (updateError) {
      console.error('Error updating user status:', updateError)
    } finally {
      setUpdating(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20'

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">View customer accounts, roles, and block status.</p>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="relative block">
            <span className="sr-only">Search users</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by name, email, or phone..."
              className={`${inputClass} pl-9`}
            />
          </label>
          <label>
            <span className="sr-only">Filter by role</span>
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className={inputClass}>
              <option value="">All roles</option>
              <option value="user">Users</option>
              <option value="admin">Admins</option>
            </select>
          </label>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <AdminTableSkeleton />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {['Name', 'Email', 'Phone', 'Role', 'Orders', 'Status', 'Joined', 'Actions'].map((heading) => (
                    <th
                      key={heading}
                      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 text-sm font-medium text-slate-900">{user.name}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{user.email}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{user.phone}</td>
                    <td className="px-5 py-3">
                      <StatusBadge label={user.role} tone={user.role === 'admin' ? 'purple' : 'neutral'} />
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-900">{user.orders_count || 0}</td>
                    <td className="px-5 py-3">
                      <StatusBadge
                        label={user.is_blocked ? 'Blocked' : 'Active'}
                        tone={user.is_blocked ? 'danger' : 'success'}
                      />
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUser(user)
                            setShowUserModal(true)
                          }}
                          className="rounded-md p-1.5 text-sky-600 hover:bg-sky-50"
                          aria-label={`View ${user.name}`}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {user.role !== 'admin' && (
                          <button
                            type="button"
                            disabled={updating}
                            onClick={() => void toggleBlockUser(user.id, user.is_blocked)}
                            className={`rounded-md p-1.5 hover:bg-slate-50 ${
                              user.is_blocked ? 'text-emerald-600' : 'text-red-600'
                            }`}
                            aria-label={user.is_blocked ? `Unblock ${user.name}` : `Block ${user.name}`}
                          >
                            {user.is_blocked ? <Check className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-slate-100 lg:hidden">
            {users.map((user) => (
              <div key={user.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                  <StatusBadge
                    label={user.is_blocked ? 'Blocked' : 'Active'}
                    tone={user.is_blocked ? 'danger' : 'success'}
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <StatusBadge label={user.role} tone={user.role === 'admin' ? 'purple' : 'neutral'} />
                  <span className="text-xs text-slate-500">{user.orders_count || 0} orders</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUser(user)
                    setShowUserModal(true)
                  }}
                  className="mt-2 text-sm font-medium text-sky-700"
                >
                  View profile
                </button>
              </div>
            ))}
          </div>

          {users.length === 0 && (
            <EmptyState title="No users found" description="No users match your current filters." />
          )}

          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </div>
      )}

      {showUserModal && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50"
            aria-label="Close dialog"
            onClick={() => setShowUserModal(false)}
          />
          <div role="dialog" aria-modal="true" aria-labelledby="user-dialog-title" className="relative mx-auto w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="border-b border-slate-200 px-6 py-4">
              <h3 id="user-dialog-title" className="text-lg font-semibold text-slate-900">
                User profile
              </h3>
            </div>
            <dl className="space-y-3 px-6 py-5 text-sm">
              <div>
                <dt className="text-slate-500">Name</dt>
                <dd className="font-medium text-slate-900">{selectedUser.name}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Email</dt>
                <dd className="text-slate-900">{selectedUser.email}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Phone</dt>
                <dd className="text-slate-900">{selectedUser.phone}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Role</dt>
                <dd className="mt-1">
                  <StatusBadge label={selectedUser.role} tone={selectedUser.role === 'admin' ? 'purple' : 'neutral'} />
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Status</dt>
                <dd className="mt-1">
                  <StatusBadge
                    label={selectedUser.is_blocked ? 'Blocked' : 'Active'}
                    tone={selectedUser.is_blocked ? 'danger' : 'success'}
                  />
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Orders</dt>
                <dd className="text-slate-900">{selectedUser.orders_count || 0}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Joined</dt>
                <dd className="text-slate-900">{new Date(selectedUser.created_at).toLocaleDateString()}</dd>
              </div>
            </dl>
            <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 text-right">
              <button
                type="button"
                onClick={() => setShowUserModal(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUsers
