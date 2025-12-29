import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import {
  Search, Filter, TrendingUp, TrendingDown, Clock, CheckCircle,
  XCircle, AlertTriangle, Eye, MoreVertical, RefreshCw, Download,
  Target, DollarSign, Calendar
} from 'lucide-react'
import { AdminLayout, DataTable, StatusBadge } from '../../../components/admin'
import adminApi from '../../../services/adminApi'
import ExportDropdown from '../../../components/common/ExportDropdown'
import {
  createPDF,
  savePDF,
  generateFileName,
  addHeader,
  addFooter,
  addSectionTitle,
  addChallengesSummaryStats,
  addChallengesTable,
  addChallengeStatusBreakdown
} from '../../../utils/exports/pdfExport'
import { exportChallengesListToExcel } from '../../../utils/exports/excelExport'

const ChallengesListPage = () => {
  const navigate = useNavigate()
  const [challenges, setChallenges] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    passed: 0,
    failed: 0,
    funded: 0
  })

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    type: '',
    phase: '',
    dateRange: '30d'
  })

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0
  })

  useEffect(() => {
    fetchChallenges()
    fetchStats()
  }, [filters, pagination.page])

  const fetchChallenges = async () => {
    setLoading(true)
    try {
      const response = await adminApi.getChallenges({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      })
      setChallenges(response.data.challenges || [])
      setPagination(prev => ({ ...prev, total: response.data.total || 0 }))
    } catch (error) {
      console.error('Error fetching challenges:', error)
      // Mock data for development
      setChallenges([
        {
          id: 1,
          user: { id: 1, username: 'trader_pro', email: 'trader@example.com' },
          model: { name: 'Standard 100K', account_size: 100000 },
          status: 'active',
          phase: 1,
          current_balance: 102500,
          profit: 2500,
          profit_percent: 2.5,
          max_drawdown: 1.2,
          trades_count: 45,
          start_date: '2024-12-01',
          end_date: '2025-01-01'
        },
        {
          id: 2,
          user: { id: 2, username: 'fx_master', email: 'fx@example.com' },
          model: { name: 'Aggressive 50K', account_size: 50000 },
          status: 'passed',
          phase: 2,
          current_balance: 55000,
          profit: 5000,
          profit_percent: 10,
          max_drawdown: 3.5,
          trades_count: 78,
          start_date: '2024-11-15',
          end_date: '2024-12-15'
        },
        {
          id: 3,
          user: { id: 3, username: 'crypto_king', email: 'crypto@example.com' },
          model: { name: 'Standard 25K', account_size: 25000 },
          status: 'failed',
          phase: 1,
          current_balance: 22000,
          profit: -3000,
          profit_percent: -12,
          max_drawdown: 12,
          trades_count: 23,
          start_date: '2024-12-10',
          end_date: null,
          failure_reason: 'Max drawdown exceeded'
        },
        {
          id: 4,
          user: { id: 4, username: 'swing_trader', email: 'swing@example.com' },
          model: { name: 'Standard 200K', account_size: 200000 },
          status: 'funded',
          phase: 'funded',
          current_balance: 215000,
          profit: 15000,
          profit_percent: 7.5,
          max_drawdown: 2.8,
          trades_count: 156,
          start_date: '2024-10-01',
          funded_date: '2024-11-15'
        }
      ])
      setPagination(prev => ({ ...prev, total: 4 }))
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await adminApi.getChallengeStats()
      setStats(response.data)
    } catch (error) {
      // Mock stats
      setStats({
        total: 1250,
        active: 320,
        passed: 450,
        failed: 380,
        funded: 100
      })
    }
  }

  const getStatusConfig = (status) => {
    const configs = {
      active: { color: 'blue', icon: Clock, label: 'Active' },
      passed: { color: 'green', icon: CheckCircle, label: 'Passed' },
      failed: { color: 'red', icon: XCircle, label: 'Failed' },
      funded: { color: 'purple', icon: Target, label: 'Funded' },
      pending: { color: 'yellow', icon: AlertTriangle, label: 'Pending' }
    }
    return configs[status] || configs.pending
  }

  // Export handlers
  const handleExportPDF = async () => {
    setExporting(true)
    try {
      const doc = createPDF()
      let yPosition = 20

      // Page 1: Header and Summary
      yPosition = addHeader(doc, 'Challenge Management Report', `${stats.total} Total Challenges`)
      yPosition += 10

      yPosition = addSectionTitle(doc, 'Challenge Statistics', yPosition)
      yPosition = addChallengesSummaryStats(doc, stats, yPosition)

      yPosition = addSectionTitle(doc, 'Status Breakdown', yPosition)
      yPosition = addChallengeStatusBreakdown(doc, stats, yPosition)

      // Page 2: Challenges Table
      doc.addPage()
      yPosition = 20

      yPosition = addSectionTitle(doc, 'Challenges List', yPosition)
      yPosition = addChallengesTable(doc, challenges, yPosition)

      // Add footer to all pages
      const pageCount = doc.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        addFooter(doc, i, pageCount)
      }

      savePDF(doc, generateFileName('ChallengesList', 'pdf'))
      toast.success('PDF exported successfully!')
    } catch (error) {
      console.error('Error exporting PDF:', error)
      toast.error('Failed to export PDF')
    } finally {
      setExporting(false)
    }
  }

  const handleExportExcel = async () => {
    setExporting(true)
    try {
      await exportChallengesListToExcel(challenges, stats)
      toast.success('Excel exported successfully!')
    } catch (error) {
      console.error('Error exporting Excel:', error)
      toast.error('Failed to export Excel')
    } finally {
      setExporting(false)
    }
  }

  const columns = [
    {
      key: 'id',
      label: 'ID',
      render: (value) => (
        <span className="text-gray-400 font-mono">#{value}</span>
      )
    },
    {
      key: 'user',
      label: 'Trader',
      render: (user) => (
        <div>
          <p className="font-medium text-white">{user?.username}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
      )
    },
    {
      key: 'model',
      label: 'Challenge',
      render: (model) => (
        <div>
          <p className="font-medium text-white">{model?.name}</p>
          <p className="text-sm text-gray-500">
            ${model?.account_size?.toLocaleString()}
          </p>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (status) => {
        const config = getStatusConfig(status)
        return <StatusBadge status={status} color={config.color} />
      }
    },
    {
      key: 'phase',
      label: 'Phase',
      render: (phase) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          phase === 'funded'
            ? 'bg-purple-500/20 text-purple-400'
            : 'bg-dark-200 text-gray-400'
        }`}>
          {phase === 'funded' ? 'Funded' : `Phase ${phase}`}
        </span>
      )
    },
    {
      key: 'profit',
      label: 'P&L',
      render: (profit, row) => (
        <div className="flex items-center gap-1">
          {profit >= 0 ? (
            <TrendingUp size={14} className="text-green-500" />
          ) : (
            <TrendingDown size={14} className="text-red-500" />
          )}
          <span className={profit >= 0 ? 'text-green-500' : 'text-red-500'}>
            ${Math.abs(profit).toLocaleString()} ({row.profit_percent?.toFixed(1)}%)
          </span>
        </div>
      )
    },
    {
      key: 'max_drawdown',
      label: 'Max DD',
      render: (value) => (
        <span className={`${value > 5 ? 'text-red-400' : value > 3 ? 'text-yellow-400' : 'text-green-400'}`}>
          {value?.toFixed(1)}%
        </span>
      )
    },
    {
      key: 'trades_count',
      label: 'Trades',
      render: (value) => <span className="text-gray-300">{value}</span>
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/admin/challenges/${row.id}`)}
            className="p-1.5 rounded-lg bg-dark-200 text-gray-400 hover:text-white hover:bg-dark-300 transition-colors"
            title="View Details"
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
    { value: 'active', label: 'Active' },
    { value: 'passed', label: 'Passed' },
    { value: 'failed', label: 'Failed' },
    { value: 'funded', label: 'Funded' }
  ]

  const phaseOptions = [
    { value: '', label: 'All Phases' },
    { value: '1', label: 'Phase 1' },
    { value: '2', label: 'Phase 2' },
    { value: 'funded', label: 'Funded' }
  ]

  const dateRangeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: 'all', label: 'All time' }
  ]

  const statCards = [
    { label: 'Total Challenges', value: stats.total, color: 'text-white', bg: 'bg-dark-200' },
    { label: 'Active', value: stats.active, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Passed', value: stats.passed, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Failed', value: stats.failed, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Funded', value: stats.funded, color: 'text-purple-400', bg: 'bg-purple-500/10' }
  ]

  return (
    <AdminLayout
      title="Challenge Management"
      subtitle="Monitor and manage all trading challenges"
      breadcrumbs={[
        { label: 'Admin', href: '/admin/dashboard' },
        { label: 'Challenges' }
      ]}
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {statCards.map((stat, index) => (
          <div key={index} className={`${stat.bg} rounded-xl p-4 border border-dark-200`}>
            <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
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
              placeholder="Search by username or email..."
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

          {/* Phase Filter */}
          <select
            value={filters.phase}
            onChange={(e) => setFilters(prev => ({ ...prev, phase: e.target.value }))}
            className="bg-dark-200 text-white rounded-lg px-4 py-2 border border-dark-300 focus:border-primary focus:outline-none"
          >
            {phaseOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Date Range */}
          <select
            value={filters.dateRange}
            onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
            className="bg-dark-200 text-white rounded-lg px-4 py-2 border border-dark-300 focus:border-primary focus:outline-none"
          >
            {dateRangeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={fetchChallenges}
              className="p-2 rounded-lg bg-dark-200 text-gray-400 hover:text-white hover:bg-dark-300 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>
            <ExportDropdown
              onExportPDF={handleExportPDF}
              onExportExcel={handleExportExcel}
              loading={exporting}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={challenges}
        loading={loading}
        pagination={{
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total,
          onPageChange: (page) => setPagination(prev => ({ ...prev, page }))
        }}
        emptyMessage="No challenges found"
      />
    </AdminLayout>
  )
}

export default ChallengesListPage
