import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../../services/api'
import toast from 'react-hot-toast'
import {
  Shield,
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  Globe,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Loader2
} from 'lucide-react'

const ACTION_TYPE_COLORS = {
  AUTH: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  TRADE: 'bg-green-500/10 text-green-400 border-green-500/30',
  PAYOUT: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  ADMIN: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  SECURITY: 'bg-red-500/10 text-red-400 border-red-500/30',
  SYSTEM: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
  CHALLENGE: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  PAYMENT: 'bg-orange-500/10 text-orange-400 border-orange-500/30'
}

const STATUS_ICONS = {
  success: <CheckCircle size={14} className="text-green-400" />,
  failure: <XCircle size={14} className="text-red-400" />,
  warning: <AlertTriangle size={14} className="text-yellow-400" />
}

const AuditLogsPage = ({ embedded = false }) => {
  const [searchParams, setSearchParams] = useSearchParams()

  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [actionTypes, setActionTypes] = useState([])

  // Pagination
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1)
  const [perPage] = useState(50)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Filters
  const [filters, setFilters] = useState({
    action_type: searchParams.get('action_type') || '',
    action: searchParams.get('action') || '',
    status: searchParams.get('status') || '',
    user_id: searchParams.get('user_id') || '',
    search: searchParams.get('search') || '',
    start_date: searchParams.get('start_date') || '',
    end_date: searchParams.get('end_date') || ''
  })

  const [showFilters, setShowFilters] = useState(false)
  const [exporting, setExporting] = useState(false)

  const loadLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', page)
      params.append('per_page', perPage)

      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const response = await api.get(`/admin/audit?${params.toString()}`)
      setLogs(response.data.logs)
      setTotal(response.data.total)
      setTotalPages(response.data.pages)
    } catch (error) {
      console.error('Error loading audit logs:', error)
      toast.error('Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }, [page, perPage, filters])

  const loadStats = async () => {
    try {
      const response = await api.get('/admin/audit/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const loadActionTypes = async () => {
    try {
      const response = await api.get('/admin/audit/action-types')
      setActionTypes(response.data.actions_by_type || {})
    } catch (error) {
      console.error('Error loading action types:', error)
    }
  }

  useEffect(() => {
    loadLogs()
    loadStats()
    loadActionTypes()
  }, [loadLogs])

  useEffect(() => {
    // Update URL params
    const params = new URLSearchParams()
    if (page > 1) params.set('page', page)
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    setSearchParams(params)
  }, [page, filters, setSearchParams])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const clearFilters = () => {
    setFilters({
      action_type: '',
      action: '',
      status: '',
      user_id: '',
      search: '',
      start_date: '',
      end_date: ''
    })
    setPage(1)
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const response = await api.get(`/admin/audit/export?${params.toString()}`, {
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()

      toast.success('Audit logs exported successfully')
    } catch (error) {
      console.error('Error exporting:', error)
      toast.error('Failed to export audit logs')
    } finally {
      setExporting(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const hasActiveFilters = Object.values(filters).some(v => v)

  return (
    <div className={embedded ? "p-4" : "space-y-6"}>
      {/* Header - Hidden when embedded */}
      {!embedded && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-500/10">
                <Shield className="text-primary-400" size={24} />
              </div>
              Audit Logs
            </h1>
            <p className="text-gray-400 mt-1">
              Track all system activities and security events
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { loadLogs(); loadStats(); }}
              disabled={loading}
              className="p-2 bg-dark-100 hover:bg-dark-200 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {exporting ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Download size={18} />
              )}
              Export CSV
            </button>
          </div>
        </div>
      )}

      {/* Export button for embedded mode */}
      {embedded && (
        <div className="flex items-center justify-end gap-3 mb-4">
          <button
            onClick={() => { loadLogs(); loadStats(); }}
            disabled={loading}
            className="p-2 bg-dark-200 hover:bg-dark-300 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Download size={16} />
            )}
            Export
          </button>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Activity className="text-blue-400" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-400">Today</p>
                <p className="text-xl font-bold text-white">{stats.today_logs?.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Calendar className="text-green-400" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-400">This Week</p>
                <p className="text-xl font-bold text-white">{stats.week_logs?.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <FileText className="text-purple-400" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Logs</p>
                <p className="text-xl font-bold text-white">{stats.total_logs?.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <AlertTriangle className="text-red-400" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-400">Security Warnings</p>
                <p className="text-xl font-bold text-white">{stats.security_warnings || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-dark-100 rounded-xl border border-dark-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search logs..."
                className="w-full pl-10 pr-4 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>

          {/* Action Type Filter */}
          <select
            value={filters.action_type}
            onChange={(e) => handleFilterChange('action_type', e.target.value)}
            className="px-4 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white focus:outline-none focus:border-primary-500"
          >
            <option value="">All Types</option>
            {Object.keys(actionTypes).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-4 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white focus:outline-none focus:border-primary-500"
          >
            <option value="">All Status</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
            <option value="warning">Warning</option>
          </select>

          {/* Toggle Advanced Filters */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-primary-500/10 text-primary-400 border border-primary-500/30'
                : 'bg-dark-200 text-gray-400 hover:text-white'
            }`}
          >
            <Filter size={18} />
            Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 bg-primary-400 rounded-full" />
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-400 hover:text-white"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-dark-200">
            <div>
              <label className="block text-sm text-gray-400 mb-1">User ID</label>
              <input
                type="number"
                value={filters.user_id}
                onChange={(e) => handleFilterChange('user_id', e.target.value)}
                placeholder="Enter user ID"
                className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Action</label>
              <select
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white focus:outline-none focus:border-primary-500"
              >
                <option value="">All Actions</option>
                {filters.action_type && actionTypes[filters.action_type]?.map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">End Date</label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-dark-100 rounded-xl border border-dark-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-200">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Time</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Action</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Description</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">IP Address</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Loader2 className="animate-spin mx-auto text-primary-400" size={32} />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-dark-200/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock size={14} className="text-gray-500" />
                        <span className="text-gray-300">{formatDate(log.created_at)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-500" />
                        <span className="text-white">{log.username || '-'}</span>
                        {log.user_id && (
                          <span className="text-xs text-gray-500">#{log.user_id}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded border ${ACTION_TYPE_COLORS[log.action_type] || ACTION_TYPE_COLORS.SYSTEM}`}>
                        {log.action_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-white font-medium">{log.action}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-300 text-sm line-clamp-1" title={log.description}>
                        {log.description || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Globe size={14} />
                        {log.ip_address || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {STATUS_ICONS[log.status]}
                        <span className={`text-sm ${
                          log.status === 'success' ? 'text-green-400' :
                          log.status === 'failure' ? 'text-red-400' : 'text-yellow-400'
                        }`}>
                          {log.status}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-dark-200">
            <div className="text-sm text-gray-400">
              Showing {((page - 1) * perPage) + 1} to {Math.min(page * perPage, total)} of {total} logs
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 bg-dark-200 hover:bg-dark-300 rounded-lg text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-gray-400 px-3">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 bg-dark-200 hover:bg-dark-300 rounded-lg text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AuditLogsPage
