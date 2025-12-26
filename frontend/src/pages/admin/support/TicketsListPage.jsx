import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Filter, MessageSquare, Clock, CheckCircle, XCircle,
  AlertCircle, Eye, MoreVertical, RefreshCw, Download, User,
  Tag, Calendar, ArrowUpRight
} from 'lucide-react'
import { AdminLayout, DataTable, StatusBadge } from '../../../components/admin'
import adminApi from '../../../services/adminApi'

const TicketsListPage = () => {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    avgResponseTime: '2h 15m'
  })

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    category: '',
    dateRange: '30d'
  })

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0
  })

  useEffect(() => {
    fetchTickets()
  }, [filters, pagination.page])

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const response = await adminApi.getTickets({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      })
      setTickets(response.data.tickets || [])
      setStats(response.data.stats || {})
      setPagination(prev => ({ ...prev, total: response.data.total || 0 }))
    } catch (error) {
      console.error('Error fetching tickets:', error)
      // Mock data
      setTickets([
        {
          id: 'TKT-001',
          user: { id: 1, username: 'trader_pro', email: 'trader@example.com' },
          subject: 'Cannot withdraw funds',
          category: 'payout',
          priority: 'high',
          status: 'open',
          messages_count: 3,
          last_reply: 'user',
          created_at: '2024-12-24T10:30:00Z',
          updated_at: '2024-12-24T14:45:00Z'
        },
        {
          id: 'TKT-002',
          user: { id: 2, username: 'fx_master', email: 'fx@example.com' },
          subject: 'Challenge rules clarification',
          category: 'challenge',
          priority: 'medium',
          status: 'in_progress',
          messages_count: 5,
          last_reply: 'admin',
          assigned_to: { id: 10, username: 'support_agent' },
          created_at: '2024-12-23T16:45:00Z',
          updated_at: '2024-12-24T09:00:00Z'
        },
        {
          id: 'TKT-003',
          user: { id: 3, username: 'crypto_king', email: 'crypto@example.com' },
          subject: 'Account verification issue',
          category: 'account',
          priority: 'low',
          status: 'resolved',
          messages_count: 8,
          last_reply: 'admin',
          resolved_at: '2024-12-22T15:30:00Z',
          created_at: '2024-12-20T11:00:00Z',
          updated_at: '2024-12-22T15:30:00Z'
        },
        {
          id: 'TKT-004',
          user: { id: 4, username: 'swing_trader', email: 'swing@example.com' },
          subject: 'Platform bug report',
          category: 'technical',
          priority: 'high',
          status: 'open',
          messages_count: 1,
          last_reply: 'user',
          created_at: '2024-12-24T08:00:00Z',
          updated_at: '2024-12-24T08:00:00Z'
        }
      ])
      setStats({
        total: 156,
        open: 23,
        inProgress: 15,
        resolved: 98,
        closed: 20,
        avgResponseTime: '2h 15m'
      })
      setPagination(prev => ({ ...prev, total: 4 }))
    } finally {
      setLoading(false)
    }
  }

  const getStatusConfig = (status) => {
    const configs = {
      open: { color: 'yellow', icon: AlertCircle, label: 'Open' },
      in_progress: { color: 'blue', icon: Clock, label: 'In Progress' },
      resolved: { color: 'green', icon: CheckCircle, label: 'Resolved' },
      closed: { color: 'gray', icon: XCircle, label: 'Closed' }
    }
    return configs[status] || configs.open
  }

  const getPriorityConfig = (priority) => {
    const configs = {
      low: { color: 'bg-gray-500/20 text-gray-400', label: 'Low' },
      medium: { color: 'bg-yellow-500/20 text-yellow-400', label: 'Medium' },
      high: { color: 'bg-orange-500/20 text-orange-400', label: 'High' },
      urgent: { color: 'bg-red-500/20 text-red-400', label: 'Urgent' }
    }
    return configs[priority] || configs.medium
  }

  const getCategoryIcon = (category) => {
    const icons = {
      payout: '💰',
      challenge: '🎯',
      account: '👤',
      technical: '🔧',
      billing: '💳',
      other: '📝'
    }
    return icons[category] || '📝'
  }

  const columns = [
    {
      key: 'id',
      label: 'Ticket',
      render: (value, row) => (
        <div>
          <span className="text-white font-mono">{value}</span>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityConfig(row.priority).color}`}>
              {getPriorityConfig(row.priority).label}
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'subject',
      label: 'Subject',
      render: (value, row) => (
        <div className="max-w-xs">
          <p className="text-white font-medium truncate">{value}</p>
          <p className="text-gray-500 text-sm flex items-center gap-1">
            <span>{getCategoryIcon(row.category)}</span>
            <span className="capitalize">{row.category}</span>
          </p>
        </div>
      )
    },
    {
      key: 'user',
      label: 'Customer',
      render: (user) => (
        <div>
          <p className="text-white">{user?.username}</p>
          <p className="text-gray-500 text-sm">{user?.email}</p>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (status) => {
        const config = getStatusConfig(status)
        return <StatusBadge status={status.replace('_', ' ')} color={config.color} />
      }
    },
    {
      key: 'messages_count',
      label: 'Messages',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <MessageSquare size={14} className="text-gray-500" />
          <span className="text-gray-300">{value}</span>
          {row.last_reply === 'user' && (
            <span className="w-2 h-2 rounded-full bg-yellow-500" title="Awaiting response" />
          )}
        </div>
      )
    },
    {
      key: 'assigned_to',
      label: 'Assigned',
      render: (assigned) => (
        assigned ? (
          <span className="text-gray-300">{assigned.username}</span>
        ) : (
          <span className="text-gray-500">Unassigned</span>
        )
      )
    },
    {
      key: 'updated_at',
      label: 'Last Update',
      render: (value) => (
        <span className="text-gray-400 text-sm">
          {new Date(value).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      )
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/admin/tickets/${row.id.replace('TKT-', '')}`)}
            className="p-1.5 rounded-lg bg-dark-200 text-gray-400 hover:text-white hover:bg-dark-300 transition-colors"
            title="View Ticket"
          >
            <Eye size={16} />
          </button>
          <button
            className="p-1.5 rounded-lg bg-dark-200 text-gray-400 hover:text-white hover:bg-dark-300 transition-colors"
            title="More Actions"
          >
            <MoreVertical size={16} />
          </button>
        </div>
      )
    }
  ]

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'open', label: 'Open' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' }
  ]

  const priorityOptions = [
    { value: '', label: 'All Priority' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ]

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: 'payout', label: 'Payout' },
    { value: 'challenge', label: 'Challenge' },
    { value: 'account', label: 'Account' },
    { value: 'technical', label: 'Technical' },
    { value: 'billing', label: 'Billing' },
    { value: 'other', label: 'Other' }
  ]

  const statCards = [
    { label: 'Total Tickets', value: stats.total, icon: MessageSquare, color: 'text-white', bg: 'bg-dark-200' },
    { label: 'Open', value: stats.open, icon: AlertCircle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Resolved', value: stats.resolved, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' }
  ]

  return (
    <AdminLayout
      title="Support Tickets"
      subtitle="Manage customer support requests"
      breadcrumbs={[
        { label: 'Admin', href: '/admin/dashboard' },
        { label: 'Support Tickets' }
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

      {/* Avg Response Time */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-4 border border-dark-200 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-blue-500/20">
            <Clock size={24} className="text-blue-500" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Average Response Time</p>
            <p className="text-xl font-bold text-white">{stats.avgResponseTime}</p>
          </div>
        </div>
        <button
          onClick={() => setFilters(prev => ({ ...prev, status: 'open' }))}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors"
        >
          <AlertCircle size={18} />
          {stats.open} tickets need attention
        </button>
      </div>

      {/* Filters */}
      <div className="bg-dark-100 rounded-xl border border-dark-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search by subject, username, or ticket ID..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full bg-dark-200 text-white rounded-lg pl-10 pr-4 py-2 border border-dark-300 focus:border-primary focus:outline-none"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="bg-dark-200 text-white rounded-lg px-4 py-2 border border-dark-300 focus:border-primary focus:outline-none"
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={filters.priority}
            onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
            className="bg-dark-200 text-white rounded-lg px-4 py-2 border border-dark-300 focus:border-primary focus:outline-none"
          >
            {priorityOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            className="bg-dark-200 text-white rounded-lg px-4 py-2 border border-dark-300 focus:border-primary focus:outline-none"
          >
            {categoryOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={fetchTickets}
              className="p-2 rounded-lg bg-dark-200 text-gray-400 hover:text-white hover:bg-dark-300 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>
            <button
              className="p-2 rounded-lg bg-dark-200 text-gray-400 hover:text-white hover:bg-dark-300 transition-colors"
              title="Export"
            >
              <Download size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={tickets}
        loading={loading}
        pagination={{
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total,
          onPageChange: (page) => setPagination(prev => ({ ...prev, page }))
        }}
        emptyMessage="No tickets found"
      />
    </AdminLayout>
  )
}

export default TicketsListPage
