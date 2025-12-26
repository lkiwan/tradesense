import { useState, useEffect } from 'react'
import {
  FileText, Search, Filter, Download, RefreshCw, Calendar,
  User, Shield, AlertTriangle, CheckCircle, XCircle, Eye,
  Clock, Activity, Settings, Database, CreditCard, Target
} from 'lucide-react'
import { AdminLayout, DataTable } from '../../../components/admin'
import superAdminApi from '../../../services/superAdminApi'

const AuditSecurityPage = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState(null)

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    action: '',
    actor: '',
    severity: '',
    dateFrom: '',
    dateTo: ''
  })

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0
  })

  // Stats
  const [stats, setStats] = useState({
    totalLogs: 0,
    criticalEvents: 0,
    warningEvents: 0,
    infoEvents: 0
  })

  useEffect(() => {
    fetchAuditLogs()
  }, [filters, pagination.page])

  const fetchAuditLogs = async () => {
    setLoading(true)
    try {
      const response = await superAdminApi.security.getAuditLogs({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      })
      setLogs(response.data.logs || [])
      setStats(response.data.stats || {})
      setPagination(prev => ({ ...prev, total: response.data.total || 0 }))
    } catch (error) {
      console.error('Error fetching audit logs:', error)
      // Mock data
      setLogs([
        {
          id: 1,
          timestamp: '2024-12-24T15:45:00Z',
          actor: { id: 1, username: 'superadmin', role: 'superadmin' },
          action: 'user.ban',
          target: { type: 'user', id: 123, name: 'suspicious_user' },
          description: 'Banned user for suspicious trading activity',
          ip_address: '192.168.1.100',
          severity: 'warning',
          metadata: { reason: 'Policy violation', duration: 'permanent' }
        },
        {
          id: 2,
          timestamp: '2024-12-24T15:30:00Z',
          actor: { id: 2, username: 'finance_admin', role: 'admin' },
          action: 'payout.approve',
          target: { type: 'payout', id: 456, name: 'PAY-456' },
          description: 'Approved payout request for $5,000',
          ip_address: '192.168.1.101',
          severity: 'info',
          metadata: { amount: 5000, currency: 'USD' }
        },
        {
          id: 3,
          timestamp: '2024-12-24T15:15:00Z',
          actor: { id: 1, username: 'superadmin', role: 'superadmin' },
          action: 'config.update',
          target: { type: 'config', id: null, name: 'trading_settings' },
          description: 'Updated trading configuration',
          ip_address: '192.168.1.100',
          severity: 'warning',
          metadata: { changes: ['spread_markup', 'max_leverage'] }
        },
        {
          id: 4,
          timestamp: '2024-12-24T15:00:00Z',
          actor: { id: 3, username: 'support_lead', role: 'admin' },
          action: 'ticket.close',
          target: { type: 'ticket', id: 789, name: 'TKT-789' },
          description: 'Closed support ticket',
          ip_address: '192.168.1.102',
          severity: 'info',
          metadata: { resolution: 'resolved' }
        },
        {
          id: 5,
          timestamp: '2024-12-24T14:45:00Z',
          actor: { id: 1, username: 'superadmin', role: 'superadmin' },
          action: 'security.ip_block',
          target: { type: 'ip', id: null, name: '45.33.21.100' },
          description: 'Blocked IP address for suspicious activity',
          ip_address: '192.168.1.100',
          severity: 'critical',
          metadata: { reason: 'Brute force attempt', blocked_for: '24h' }
        },
        {
          id: 6,
          timestamp: '2024-12-24T14:30:00Z',
          actor: { id: 2, username: 'finance_admin', role: 'admin' },
          action: 'challenge.pass',
          target: { type: 'challenge', id: 321, name: 'CHG-321' },
          description: 'Manually passed challenge for user',
          ip_address: '192.168.1.101',
          severity: 'warning',
          metadata: { user_id: 456, reason: 'Technical issue compensation' }
        },
        {
          id: 7,
          timestamp: '2024-12-24T14:15:00Z',
          actor: { id: 1, username: 'superadmin', role: 'superadmin' },
          action: 'admin.promote',
          target: { type: 'user', id: 789, name: 'new_admin' },
          description: 'Promoted user to admin role',
          ip_address: '192.168.1.100',
          severity: 'critical',
          metadata: { new_role: 'admin', permissions: ['users', 'tickets'] }
        },
        {
          id: 8,
          timestamp: '2024-12-24T14:00:00Z',
          actor: { id: 0, username: 'system', role: 'system' },
          action: 'system.backup',
          target: { type: 'database', id: null, name: 'production_db' },
          description: 'Automated database backup completed',
          ip_address: 'localhost',
          severity: 'info',
          metadata: { size: '2.5GB', duration: '45s' }
        }
      ])
      setStats({
        totalLogs: 1250,
        criticalEvents: 23,
        warningEvents: 156,
        infoEvents: 1071
      })
      setPagination(prev => ({ ...prev, total: 8 }))
    } finally {
      setLoading(false)
    }
  }

  const getSeverityConfig = (severity) => {
    const configs = {
      critical: { color: 'text-red-400', bg: 'bg-red-500/10', icon: AlertTriangle },
      warning: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: AlertTriangle },
      info: { color: 'text-blue-400', bg: 'bg-blue-500/10', icon: FileText }
    }
    return configs[severity] || configs.info
  }

  const getActionIcon = (action) => {
    const icons = {
      'user.ban': XCircle,
      'user.unban': CheckCircle,
      'payout.approve': CreditCard,
      'payout.reject': XCircle,
      'config.update': Settings,
      'ticket.close': CheckCircle,
      'security.ip_block': Shield,
      'challenge.pass': Target,
      'challenge.fail': XCircle,
      'admin.promote': User,
      'admin.demote': User,
      'system.backup': Database
    }
    return icons[action] || Activity
  }

  const handleExport = () => {
    // Export logic would go here
    console.log('Exporting audit logs...')
  }

  const columns = [
    {
      key: 'timestamp',
      label: 'Time',
      render: (value) => (
        <div className="text-sm">
          <p className="text-white font-mono">
            {new Date(value).toLocaleTimeString()}
          </p>
          <p className="text-gray-500 text-xs">
            {new Date(value).toLocaleDateString()}
          </p>
        </div>
      )
    },
    {
      key: 'severity',
      label: 'Severity',
      render: (value) => {
        const config = getSeverityConfig(value)
        const Icon = config.icon
        return (
          <div className={`flex items-center gap-2 ${config.color}`}>
            <div className={`p-1 rounded ${config.bg}`}>
              <Icon size={14} />
            </div>
            <span className="capitalize text-sm">{value}</span>
          </div>
        )
      }
    },
    {
      key: 'action',
      label: 'Action',
      render: (value) => {
        const Icon = getActionIcon(value)
        return (
          <div className="flex items-center gap-2">
            <Icon size={16} className="text-gray-400" />
            <span className="text-white font-mono text-sm">{value}</span>
          </div>
        )
      }
    },
    {
      key: 'actor',
      label: 'Actor',
      render: (value) => (
        <div>
          <p className="text-white">{value?.username}</p>
          <p className="text-gray-500 text-xs capitalize">{value?.role}</p>
        </div>
      )
    },
    {
      key: 'description',
      label: 'Description',
      render: (value) => (
        <span className="text-gray-300 text-sm">{value}</span>
      )
    },
    {
      key: 'target',
      label: 'Target',
      render: (value) => (
        value?.name ? (
          <span className="text-gray-400 font-mono text-sm">{value.name}</span>
        ) : (
          <span className="text-gray-500 text-sm">-</span>
        )
      )
    },
    {
      key: 'ip_address',
      label: 'IP Address',
      render: (value) => (
        <span className="text-gray-400 font-mono text-sm">{value}</span>
      )
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <button
          onClick={() => setSelectedLog(row)}
          className="p-1.5 rounded-lg bg-dark-200 text-gray-400 hover:text-white hover:bg-dark-300 transition-colors"
          title="View Details"
        >
          <Eye size={16} />
        </button>
      )
    }
  ]

  const actionOptions = [
    { value: '', label: 'All Actions' },
    { value: 'user.ban', label: 'User Ban' },
    { value: 'user.unban', label: 'User Unban' },
    { value: 'payout.approve', label: 'Payout Approve' },
    { value: 'payout.reject', label: 'Payout Reject' },
    { value: 'config.update', label: 'Config Update' },
    { value: 'security.ip_block', label: 'IP Block' },
    { value: 'admin.promote', label: 'Admin Promote' },
    { value: 'admin.demote', label: 'Admin Demote' }
  ]

  const severityOptions = [
    { value: '', label: 'All Severities' },
    { value: 'critical', label: 'Critical' },
    { value: 'warning', label: 'Warning' },
    { value: 'info', label: 'Info' }
  ]

  const statCards = [
    { label: 'Total Logs', value: stats.totalLogs, icon: FileText, color: 'text-white', bg: 'bg-dark-200' },
    { label: 'Critical', value: stats.criticalEvents, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Warnings', value: stats.warningEvents, icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'Info', value: stats.infoEvents, icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10' }
  ]

  return (
    <AdminLayout
      title="Audit & Security Logs"
      subtitle="Review all system and admin actions"
      breadcrumbs={[
        { label: 'SuperAdmin', href: '/superadmin/dashboard' },
        { label: 'Audit Logs' }
      ]}
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat, index) => (
          <div key={index} className={`${stat.bg} rounded-xl p-4 border border-dark-200`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-400">{stat.label}</p>
              <stat.icon size={18} className={stat.color} />
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>
              {stat.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-dark-100 rounded-xl border border-dark-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search logs..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full bg-dark-200 text-white rounded-lg pl-10 pr-4 py-2 border border-dark-300 focus:border-primary focus:outline-none"
            />
          </div>

          {/* Action Filter */}
          <select
            value={filters.action}
            onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
            className="bg-dark-200 text-white rounded-lg px-4 py-2 border border-dark-300 focus:border-primary focus:outline-none"
          >
            {actionOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Severity Filter */}
          <select
            value={filters.severity}
            onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
            className="bg-dark-200 text-white rounded-lg px-4 py-2 border border-dark-300 focus:border-primary focus:outline-none"
          >
            {severityOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Date From */}
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
            className="bg-dark-200 text-white rounded-lg px-4 py-2 border border-dark-300 focus:border-primary focus:outline-none"
          />

          {/* Date To */}
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
            className="bg-dark-200 text-white rounded-lg px-4 py-2 border border-dark-300 focus:border-primary focus:outline-none"
          />

          {/* Actions */}
          <button
            onClick={fetchAuditLogs}
            className="p-2 rounded-lg bg-dark-200 text-gray-400 hover:text-white hover:bg-dark-300 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-dark-200 text-gray-400 rounded-lg hover:text-white hover:bg-dark-300 transition-colors"
          >
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={logs}
        loading={loading}
        pagination={{
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total,
          onPageChange: (page) => setPagination(prev => ({ ...prev, page }))
        }}
        emptyMessage="No audit logs found"
      />

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-100 rounded-xl border border-dark-200 w-full max-w-2xl">
            <div className="p-6 border-b border-dark-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Audit Log Details</h3>
                <p className="text-gray-500 text-sm">
                  {new Date(selectedLog.timestamp).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 rounded-lg bg-dark-200 text-gray-400 hover:text-white"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Action</label>
                  <p className="text-white font-mono">{selectedLog.action}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Severity</label>
                  <p className={`capitalize ${getSeverityConfig(selectedLog.severity).color}`}>
                    {selectedLog.severity}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Actor</label>
                  <p className="text-white">{selectedLog.actor?.username} ({selectedLog.actor?.role})</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">IP Address</label>
                  <p className="text-white font-mono">{selectedLog.ip_address}</p>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-500">Description</label>
                <p className="text-white">{selectedLog.description}</p>
              </div>

              {selectedLog.target?.name && (
                <div>
                  <label className="text-sm text-gray-500">Target</label>
                  <p className="text-white">
                    {selectedLog.target.type}: {selectedLog.target.name}
                    {selectedLog.target.id && ` (ID: ${selectedLog.target.id})`}
                  </p>
                </div>
              )}

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <label className="text-sm text-gray-500">Metadata</label>
                  <pre className="mt-2 p-4 bg-dark-200 rounded-lg text-sm text-gray-300 overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-dark-200 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-dark-200 text-gray-400 rounded-lg hover:text-white hover:bg-dark-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AuditSecurityPage
