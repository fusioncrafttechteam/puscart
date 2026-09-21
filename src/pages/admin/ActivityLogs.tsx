/**
 * Admin Activity Logs Page
 * Displays admin activity logs for security and compliance
 */

import React, { useState, useEffect } from 'react'
import { adminAuditService } from '../../services/adminAuditService'
import { useAuth } from '../../contexts/AuthContext'
import { AdminPageSkeleton } from '../../components/admin/AdminSkeletons'
import { Shield, Clock, Search, Filter } from 'lucide-react'

interface ActivityLog {
  id: string
  admin_name: string
  action: string
  entity_type: string
  entity_id?: string
  entity_name?: string
  details: Record<string, any>
  created_at: string
}

const ActivityLogs: React.FC = () => {
  const { isAdmin } = useAuth()
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [page, setPage] = useState(1)
  const logsPerPage = 20

  useEffect(() => {
    if (!isAdmin) return

    loadLogs()
  }, [isAdmin, page])

  const loadLogs = async () => {
    try {
      setLoading(true)
      const allLogs = await adminAuditService.getAllLogs(100, (page - 1) * logsPerPage)
      setLogs(allLogs as ActivityLog[])
    } catch (error) {
      console.error('Failed to load activity logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.admin_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.entity_name && log.entity_name.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesFilter = filterType === 'all' || log.entity_type === filterType

    return matchesSearch && matchesFilter
  })

  const entityTypes = ['all', ...new Set(logs.map(log => log.entity_type))]

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  }

  const getActionColor = (action: string) => {
    if (action.includes('delete') || action.includes('blocked')) return 'text-red-600 bg-red-50'
    if (action.includes('create') || action.includes('added')) return 'text-green-600 bg-green-50'
    if (action.includes('update') || action.includes('edited')) return 'text-blue-600 bg-blue-50'
    return 'text-gray-600 bg-gray-50'
  }

  if (!isAdmin) {
    return (
      <div className="p-8">
        <p className="text-red-600">Access denied. Admin privileges required.</p>
      </div>
    )
  }

  if (loading) {
    return <AdminPageSkeleton />
  }

  return (
    <div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-6 h-6" />
              Activity Logs
            </h1>
            <p className="text-gray-600 mt-1">Track all admin actions for security and compliance</p>
          </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {entityTypes.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No logs found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {formatDate(log.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {log.admin_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <div className="font-medium text-gray-900">{log.entity_type}</div>
                        {log.entity_name && <div className="text-xs">{log.entity_name}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <details className="cursor-pointer">
                        <summary className="text-blue-600 hover:underline">View details</summary>
                        <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto max-h-32">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredLogs.length > logsPerPage && (
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">Page {page}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 border border-gray-300 rounded-md"
          >
            Next
          </button>
        </div>
      )}
        </div>
    </div>
  )
}

export default ActivityLogs
