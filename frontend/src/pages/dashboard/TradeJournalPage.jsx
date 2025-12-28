import { useState, useEffect } from 'react'
import {
  Plus, Search, Star, Edit3, Trash2, TrendingUp, TrendingDown,
  Calendar, BarChart3, Download, RefreshCw, Brain, Activity,
  Trophy, AlertTriangle, CheckCircle, XCircle, X, ChevronDown,
  FileText, Copy, Clock, DollarSign, Target, Percent, ShoppingCart
} from 'lucide-react'
import api from '../../services/api'
import { showSuccessToast, showErrorToast } from '../../utils/errorHandler'

// Constants
const EMOTIONS = [
  'confident', 'fearful', 'greedy', 'patient', 'impatient',
  'frustrated', 'calm', 'excited', 'anxious', 'neutral'
]

const SETUP_QUALITIES = ['A+', 'A', 'B', 'C', 'D']
const EXECUTION_RATINGS = ['perfect', 'good', 'average', 'poor', 'terrible']
const SESSIONS = ['asian', 'london', 'new_york', 'overlap']
const TIMEFRAMES = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1']

const COMMON_TAGS = [
  'trend_following', 'breakout', 'pullback', 'reversal', 'scalp',
  'day_trade', 'swing', 'support_resistance', 'fibonacci', 'price_action'
]

const TradeJournalPage = () => {
  // Main tab state
  const [mainTab, setMainTab] = useState('journal')

  // Journal State
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('entries')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalEntries, setTotalEntries] = useState(0)
  const [analytics, setAnalytics] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [filters, setFilters] = useState({
    symbol: '',
    startDate: '',
    endDate: '',
    isWin: '',
    setupQuality: ''
  })

  // Orders State
  const [orders, setOrders] = useState([
    { id: 1, symbol: 'EURUSD', type: 'buy_limit', price: 1.0850, lot: 0.5, sl: 1.0800, tp: 1.0950, status: 'pending', created: '2024-01-25 10:30' },
    { id: 2, symbol: 'GBPUSD', type: 'sell_stop', price: 1.2700, lot: 1.0, sl: 1.2800, tp: 1.2550, status: 'pending', created: '2024-01-25 09:15' },
    { id: 3, symbol: 'USDJPY', type: 'buy_limit', price: 147.50, lot: 0.3, sl: 146.80, tp: 148.50, status: 'triggered', created: '2024-01-24 14:00' },
  ])

  // Templates State
  const [templates, setTemplates] = useState([
    { id: 1, name: 'Breakout Setup', symbol: 'EURUSD', type: 'buy', riskPercent: 1.5, rr: 2, description: 'Enter on confirmed breakout above resistance with volume' },
    { id: 2, name: 'Pullback Entry', symbol: 'Any', type: 'any', riskPercent: 2, rr: 3, description: 'Wait for pullback to key level, enter on confirmation candle' },
    { id: 3, name: 'Scalp London', symbol: 'GBPUSD', type: 'any', riskPercent: 0.5, rr: 1.5, description: 'Quick trades during London open volatility' },
  ])

  // Main tabs definition
  const mainTabs = [
    { id: 'orders', label: 'Pending Orders', icon: ShoppingCart },
    { id: 'templates', label: 'Trade Templates', icon: Copy },
    { id: 'journal', label: 'Journal', icon: Brain }
  ]

  // Form state
  const [formData, setFormData] = useState({
    symbol: '',
    trade_type: 'buy',
    lot_size: '',
    entry_price: '',
    exit_price: '',
    stop_loss: '',
    take_profit: '',
    profit_loss: '',
    profit_pips: '',
    trade_date: new Date().toISOString().split('T')[0],
    entry_time: '',
    exit_time: '',
    session: '',
    timeframe: '',
    setup_description: '',
    setup_quality: '',
    entry_reason: '',
    exit_reason: '',
    what_went_well: '',
    what_went_wrong: '',
    lessons_learned: '',
    execution_rating: '',
    followed_plan: null,
    emotion_before: '',
    emotion_during: '',
    emotion_after: '',
    confidence_level: 5,
    stress_level: 5,
    tags: [],
    strategy_name: '',
    is_mistake: false,
    notes: '',
    overall_rating: 0,
    is_favorite: false
  })

  useEffect(() => {
    if (mainTab === 'journal') {
      loadEntries()
      loadAnalytics()
    }
  }, [mainTab, page, rowsPerPage, filters])

  const loadEntries = async () => {
    try {
      setLoading(true)
      const params = {
        page: page + 1,
        per_page: rowsPerPage,
        ...(filters.symbol && { symbol: filters.symbol }),
        ...(filters.startDate && { start_date: filters.startDate }),
        ...(filters.endDate && { end_date: filters.endDate }),
        ...(filters.isWin && { is_win: filters.isWin }),
        ...(filters.setupQuality && { setup_quality: filters.setupQuality })
      }

      const response = await api.get('/journal', { params })
      setEntries(response.data?.entries || [])
      setTotalEntries(response.data?.total || 0)
    } catch (error) {
      showErrorToast('Failed to load journal entries')
    } finally {
      setLoading(false)
    }
  }

  const loadAnalytics = async () => {
    try {
      const response = await api.get('/journal/analytics')
      setAnalytics(response.data)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    }
  }

  const handleOpenDialog = (entry = null) => {
    if (entry) {
      setEditingEntry(entry)
      setFormData({
        ...entry,
        trade_date: entry.trade_date || new Date().toISOString().split('T')[0],
        tags: entry.tags || [],
        confidence_level: entry.confidence_level || 5,
        stress_level: entry.stress_level || 5
      })
    } else {
      setEditingEntry(null)
      setFormData({
        symbol: '',
        trade_type: 'buy',
        lot_size: '',
        entry_price: '',
        exit_price: '',
        stop_loss: '',
        take_profit: '',
        profit_loss: '',
        profit_pips: '',
        trade_date: new Date().toISOString().split('T')[0],
        entry_time: '',
        exit_time: '',
        session: '',
        timeframe: '',
        setup_description: '',
        setup_quality: '',
        entry_reason: '',
        exit_reason: '',
        what_went_well: '',
        what_went_wrong: '',
        lessons_learned: '',
        execution_rating: '',
        followed_plan: null,
        emotion_before: '',
        emotion_during: '',
        emotion_after: '',
        confidence_level: 5,
        stress_level: 5,
        tags: [],
        strategy_name: '',
        is_mistake: false,
        notes: '',
        overall_rating: 0,
        is_favorite: false
      })
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.symbol.trim()) {
      showErrorToast('Symbol is required')
      return
    }

    try {
      const payload = {
        ...formData,
        lot_size: formData.lot_size ? parseFloat(formData.lot_size) : null,
        entry_price: formData.entry_price ? parseFloat(formData.entry_price) : null,
        exit_price: formData.exit_price ? parseFloat(formData.exit_price) : null,
        stop_loss: formData.stop_loss ? parseFloat(formData.stop_loss) : null,
        take_profit: formData.take_profit ? parseFloat(formData.take_profit) : null,
        profit_loss: formData.profit_loss ? parseFloat(formData.profit_loss) : null,
        profit_pips: formData.profit_pips ? parseFloat(formData.profit_pips) : null
      }

      if (editingEntry) {
        await api.put(`/api/journal/${editingEntry.id}`, payload)
        showSuccessToast('Journal entry updated')
      } else {
        await api.post('/journal', payload)
        showSuccessToast('Journal entry created')
      }
      setDialogOpen(false)
      loadEntries()
      loadAnalytics()
    } catch (error) {
      showErrorToast(error.response?.data?.error || 'Failed to save entry')
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return

    try {
      await api.delete(`/api/journal/${deleteConfirm.id}`)
      showSuccessToast('Entry deleted')
      setDeleteConfirm(null)
      loadEntries()
      loadAnalytics()
    } catch (error) {
      showErrorToast('Failed to delete entry')
    }
  }

  const handleToggleFavorite = async (entry) => {
    try {
      await api.post(`/api/journal/${entry.id}/toggle-favorite`)
      loadEntries()
    } catch (error) {
      showErrorToast('Failed to update')
    }
  }

  const handleExportCSV = async () => {
    try {
      const response = await api.get('/journal/export/csv', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `trade_journal_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      showSuccessToast('Journal exported successfully')
    } catch (error) {
      showErrorToast('Failed to export')
    }
  }

  const getPnLColor = (pnl) => {
    if (!pnl) return 'text-gray-400'
    return parseFloat(pnl) >= 0 ? 'text-green-400' : 'text-red-400'
  }

  const resetFilters = () => {
    setFilters({ symbol: '', startDate: '', endDate: '', isWin: '', setupQuality: '' })
  }

  const handleCancelOrder = (orderId) => {
    setOrders(orders.filter(o => o.id !== orderId))
    showSuccessToast('Order cancelled')
  }

  const handleDeleteTemplate = (templateId) => {
    setTemplates(templates.filter(t => t.id !== templateId))
    showSuccessToast('Template deleted')
  }

  const handleUseTemplate = (template) => {
    showSuccessToast(`Template "${template.name}" applied to new order`)
  }

  const totalPages = Math.ceil(totalEntries / rowsPerPage)

  // ============ RENDER ORDERS TAB ============
  const renderOrdersTab = () => (
    <div className="space-y-6">
      {/* Orders Header */}
      <div className="flex items-center justify-between">
        <p className="text-gray-400 text-sm">Manage your pending limit and stop orders</p>
        <button
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-all hover:shadow-lg hover:shadow-primary-500/25"
        >
          <Plus size={18} />
          New Order
        </button>
      </div>

      {/* Orders Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-4 border border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <ShoppingCart size={18} className="text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{orders.filter(o => o.status === 'pending').length}</p>
              <p className="text-xs text-gray-400">Pending Orders</p>
            </div>
          </div>
        </div>
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-4 border border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <TrendingUp size={18} className="text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{orders.filter(o => o.type.includes('buy')).length}</p>
              <p className="text-xs text-gray-400">Buy Orders</p>
            </div>
          </div>
        </div>
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-4 border border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <TrendingDown size={18} className="text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{orders.filter(o => o.type.includes('sell')).length}</p>
              <p className="text-xs text-gray-400">Sell Orders</p>
            </div>
          </div>
        </div>
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-4 border border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <DollarSign size={18} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{orders.reduce((acc, o) => acc + o.lot, 0).toFixed(2)}</p>
              <p className="text-xs text-gray-400">Total Lots</p>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="relative overflow-hidden bg-gradient-to-br from-dark-100/80 to-dark-200/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/5 hover:border-primary-500/20 transition-all duration-300 shadow-lg">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="mx-auto text-gray-600 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-white mb-2">No pending orders</h3>
            <p className="text-gray-400 mb-4">Create a limit or stop order to get started</p>
            <button className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors">
              Create Order
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-200/50 border-b border-dark-200">
                <tr className="text-xs text-gray-500 uppercase">
                  <th className="px-4 py-3 text-left font-medium">Symbol</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-right font-medium">Price</th>
                  <th className="px-4 py-3 text-right font-medium">Lot</th>
                  <th className="px-4 py-3 text-right font-medium">SL</th>
                  <th className="px-4 py-3 text-right font-medium">TP</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Created</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-dark-200/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{order.symbol}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                        order.type.includes('buy')
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-red-500/10 text-red-400'
                      }`}>
                        {order.type.includes('buy') ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {order.type.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-white font-medium">{order.price}</td>
                    <td className="px-4 py-3 text-right text-gray-300">{order.lot}</td>
                    <td className="px-4 py-3 text-right text-red-400">{order.sl}</td>
                    <td className="px-4 py-3 text-right text-green-400">{order.tp}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        order.status === 'pending'
                          ? 'bg-yellow-500/10 text-yellow-400'
                          : 'bg-green-500/10 text-green-400'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{order.created}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="p-1.5 rounded-lg hover:bg-dark-200 text-gray-400 hover:text-white transition-colors"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          className="p-1.5 rounded-lg hover:bg-dark-200 text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )

  // ============ RENDER TEMPLATES TAB ============
  const renderTemplatesTab = () => (
    <div className="space-y-6">
      {/* Templates Header */}
      <div className="flex items-center justify-between">
        <p className="text-gray-400 text-sm">Save and reuse your favorite trade setups</p>
        <button
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-all hover:shadow-lg hover:shadow-primary-500/25"
        >
          <Plus size={18} />
          New Template
        </button>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 text-center py-12">
          <Copy className="mx-auto text-gray-600 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-white mb-2">No templates yet</h3>
          <p className="text-gray-400 mb-4">Create templates for your favorite trade setups</p>
          <button className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors">
            Create First Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div key={template.id} className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-5 hover:border-primary-500/30 transition-all duration-300 group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${
                    template.type === 'buy' ? 'bg-green-500/10 border border-green-500/30' :
                    template.type === 'sell' ? 'bg-red-500/10 border border-red-500/30' :
                    'bg-primary-500/10 border border-primary-500/30'
                  }`}>
                    <FileText size={20} className={
                      template.type === 'buy' ? 'text-green-400' :
                      template.type === 'sell' ? 'text-red-400' :
                      'text-primary-400'
                    } />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-primary-400 transition-colors">{template.name}</h3>
                    <p className="text-xs text-gray-400">{template.symbol}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button className="p-1.5 rounded-lg hover:bg-dark-200 text-gray-400 hover:text-white transition-colors">
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="p-1.5 rounded-lg hover:bg-dark-200 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-400 mb-4 line-clamp-2">{template.description}</p>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1.5 text-sm">
                  <Percent size={14} className="text-yellow-400" />
                  <span className="text-gray-300">{template.riskPercent}% risk</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <Target size={14} className="text-blue-400" />
                  <span className="text-gray-300">1:{template.rr} R:R</span>
                </div>
              </div>

              <button
                onClick={() => handleUseTemplate(template)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-dark-200/50 hover:bg-primary-500/20 text-gray-300 hover:text-primary-400 rounded-lg border border-white/5 hover:border-primary-500/30 transition-all duration-300"
              >
                <Copy size={16} />
                Use Template
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // ============ RENDER JOURNAL TAB ============
  const renderJournalTab = () => (
    <div className="space-y-6">
      {/* Journal Actions */}
      <div className="flex justify-end gap-2">
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-dark-100 hover:bg-dark-200 text-white rounded-xl font-medium border border-dark-200 transition-all"
        >
          <Download size={18} />
          Export
        </button>
        <button
          onClick={() => handleOpenDialog()}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-all hover:shadow-lg hover:shadow-primary-500/25"
        >
          <Plus size={18} />
          New Entry
        </button>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-xl rounded-xl p-4 border border-purple-500/20">
            <Activity className="text-purple-400 mb-2" size={24} />
            <p className="text-2xl font-bold text-white">{analytics.total_entries}</p>
            <p className="text-xs text-gray-400">Total Entries</p>
          </div>

          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-xl rounded-xl p-4 border border-green-500/20">
            <TrendingUp className="text-green-400 mb-2" size={24} />
            <p className="text-2xl font-bold text-white">{analytics.win_rate}%</p>
            <p className="text-xs text-gray-400">Win Rate</p>
          </div>

          <div className={`bg-gradient-to-br ${analytics.total_pnl >= 0 ? 'from-green-500/20 to-green-600/20 border-green-500/20' : 'from-red-500/20 to-red-600/20 border-red-500/20'} backdrop-blur-xl rounded-xl p-4 border`}>
            {analytics.total_pnl >= 0 ? (
              <TrendingUp className="text-green-400 mb-2" size={24} />
            ) : (
              <TrendingDown className="text-red-400 mb-2" size={24} />
            )}
            <p className={`text-2xl font-bold ${analytics.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${Math.abs(analytics.total_pnl).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">Total P&L</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-xl rounded-xl p-4 border border-blue-500/20">
            <Trophy className="text-blue-400 mb-2" size={24} />
            <p className="text-2xl font-bold text-white">{analytics.streak?.current || 0}</p>
            <p className="text-xs text-gray-400">Win Streak</p>
          </div>
        </div>
      )}

      {/* Sub-tabs for Journal */}
      <div className="flex bg-dark-100/80 rounded-lg p-1 border border-dark-200">
        <button
          onClick={() => setActiveTab('entries')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
            activeTab === 'entries'
              ? 'bg-primary-500 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Activity size={18} />
          Entries
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
            activeTab === 'analytics'
              ? 'bg-primary-500 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <BarChart3 size={18} />
          Analytics
        </button>
      </div>

      {/* Journal Entries Sub-Tab */}
      {activeTab === 'entries' && (
        <>
          {/* Filters */}
          <div className="bg-gradient-to-br from-dark-100/80 to-dark-200/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/5 p-4 shadow-lg">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              <input
                type="text"
                placeholder="Symbol"
                value={filters.symbol}
                onChange={(e) => setFilters({ ...filters, symbol: e.target.value.toUpperCase() })}
                className="bg-dark-200 border border-dark-200 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="bg-dark-200 border border-dark-200 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="bg-dark-200 border border-dark-200 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <select
                value={filters.isWin}
                onChange={(e) => setFilters({ ...filters, isWin: e.target.value })}
                className="bg-dark-200 border border-dark-200 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Results</option>
                <option value="true">Winners</option>
                <option value="false">Losers</option>
              </select>
              <select
                value={filters.setupQuality}
                onChange={(e) => setFilters({ ...filters, setupQuality: e.target.value })}
                className="bg-dark-200 border border-dark-200 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Quality</option>
                {SETUP_QUALITIES.map(q => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
              <button
                onClick={resetFilters}
                className="p-2 bg-dark-200 hover:bg-dark-300 text-gray-400 hover:text-white rounded-lg transition-colors"
              >
                <RefreshCw size={18} />
              </button>
            </div>
          </div>

          {/* Entries Table */}
          <div className="relative overflow-hidden bg-gradient-to-br from-dark-100/80 to-dark-200/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/5 hover:border-primary-500/20 transition-all duration-300 shadow-lg">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-16">
                <Brain className="mx-auto text-gray-600 mb-4" size={64} />
                <h3 className="text-xl font-bold text-white mb-2">No journal entries yet</h3>
                <p className="text-gray-400 mb-4">Start documenting your trades to improve your performance</p>
                <button
                  onClick={() => handleOpenDialog()}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
                >
                  Create First Entry
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-dark-200/50 border-b border-dark-200">
                      <tr className="text-xs text-gray-500 uppercase">
                        <th className="px-4 py-3 text-left font-medium">Date</th>
                        <th className="px-4 py-3 text-left font-medium">Symbol</th>
                        <th className="px-4 py-3 text-left font-medium">Type</th>
                        <th className="px-4 py-3 text-right font-medium">P&L</th>
                        <th className="px-4 py-3 text-left font-medium">Setup</th>
                        <th className="px-4 py-3 text-left font-medium">Execution</th>
                        <th className="px-4 py-3 text-left font-medium">Tags</th>
                        <th className="px-4 py-3 text-left font-medium">Rating</th>
                        <th className="px-4 py-3 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-200">
                      {entries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-dark-200/30 transition-colors">
                          <td className="px-4 py-3 text-sm text-gray-300">{entry.trade_date}</td>
                          <td className="px-4 py-3 font-medium text-white">{entry.symbol}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                              entry.trade_type === 'buy'
                                ? 'bg-green-500/10 text-green-400'
                                : 'bg-red-500/10 text-red-400'
                            }`}>
                              {entry.trade_type === 'buy' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                              {entry.trade_type?.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <p className={`font-medium ${getPnLColor(entry.profit_loss)}`}>
                              {entry.profit_loss !== null ? `$${parseFloat(entry.profit_loss).toFixed(2)}` : '-'}
                            </p>
                            {entry.profit_pips && (
                              <p className="text-xs text-gray-500">{entry.profit_pips} pips</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {entry.setup_quality && (
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                entry.setup_quality === 'A+' || entry.setup_quality === 'A'
                                  ? 'bg-green-500/10 text-green-400'
                                  : 'bg-dark-200 text-gray-400'
                              }`}>
                                {entry.setup_quality}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {entry.execution_rating && (
                              <span className="px-2 py-1 bg-dark-200 rounded text-xs text-gray-400 capitalize">
                                {entry.execution_rating}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1 flex-wrap max-w-[150px]">
                              {(entry.tags || []).slice(0, 2).map(tag => (
                                <span key={tag} className="px-1.5 py-0.5 bg-dark-200 rounded text-xs text-gray-400">
                                  {tag}
                                </span>
                              ))}
                              {(entry.tags || []).length > 2 && (
                                <span className="px-1.5 py-0.5 bg-primary-500/20 rounded text-xs text-primary-400">
                                  +{entry.tags.length - 2}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  size={14}
                                  className={star <= (entry.overall_rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}
                                />
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleToggleFavorite(entry)}
                                className="p-1.5 rounded-lg hover:bg-dark-200 transition-colors"
                              >
                                <Star
                                  size={16}
                                  className={entry.is_favorite ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500'}
                                />
                              </button>
                              <button
                                onClick={() => handleOpenDialog(entry)}
                                className="p-1.5 rounded-lg hover:bg-dark-200 text-gray-400 hover:text-white transition-colors"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(entry)}
                                className="p-1.5 rounded-lg hover:bg-dark-200 text-gray-400 hover:text-red-400 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-dark-200">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">Rows per page:</span>
                    <select
                      value={rowsPerPage}
                      onChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10))
                        setPage(0)
                      }}
                      className="bg-dark-200 border border-dark-200 rounded px-2 py-1 text-white text-sm focus:outline-none"
                    >
                      {[5, 10, 25, 50].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400">
                      {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, totalEntries)} of {totalEntries}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setPage(Math.max(0, page - 1))}
                        disabled={page === 0}
                        className="p-1.5 rounded bg-dark-200 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronDown className="rotate-90" size={18} />
                      </button>
                      <button
                        onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                        disabled={page >= totalPages - 1}
                        className="p-1.5 rounded bg-dark-200 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronDown className="-rotate-90" size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Analytics Sub-Tab */}
      {activeTab === 'analytics' && analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance by Setup Quality */}
          <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-6">
            <h3 className="font-semibold text-white mb-4">Performance by Setup Quality</h3>
            <div className="space-y-4">
              {Object.entries(analytics.by_setup_quality || {}).map(([quality, data]) => (
                <div key={quality}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">{quality} Setup</span>
                    <span className="text-white">
                      {data.wins}/{data.count} wins ({data.count > 0 ? Math.round((data.wins/data.count)*100) : 0}%)
                    </span>
                  </div>
                  <div className="h-2 bg-dark-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${data.pnl >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${data.count > 0 ? (data.wins/data.count)*100 : 0}%` }}
                    />
                  </div>
                  <p className={`text-xs mt-1 ${data.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    P&L: ${data.pnl.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Performance by Emotion */}
          <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-6">
            <h3 className="font-semibold text-white mb-4">Performance by Pre-Trade Emotion</h3>
            <div className="space-y-4">
              {Object.entries(analytics.by_emotion || {}).slice(0, 5).map(([emotion, data]) => (
                <div key={emotion}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400 capitalize">{emotion}</span>
                    <span className="text-white">{data.wins}/{data.count} wins</span>
                  </div>
                  <div className="h-2 bg-dark-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${data.pnl >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${data.count > 0 ? (data.wins/data.count)*100 : 0}%` }}
                    />
                  </div>
                  <p className={`text-xs mt-1 ${data.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    P&L: ${data.pnl.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Top Tags */}
          <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-6">
            <h3 className="font-semibold text-white mb-4">Top Strategy Tags</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(analytics.by_tag || {}).map(([tag, data]) => (
                <span
                  key={tag}
                  className={`px-3 py-1.5 rounded-lg text-sm border ${
                    data.pnl >= 0
                      ? 'bg-green-500/10 border-green-500/30 text-green-400'
                      : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}
                >
                  {tag} ({data.count})
                </span>
              ))}
            </div>
          </div>

          {/* By Day of Week */}
          <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-6">
            <h3 className="font-semibold text-white mb-4">Performance by Day</h3>
            <div className="space-y-3">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                const data = analytics.by_day?.[i] || { count: 0, wins: 0, pnl: 0 }
                if (data.count === 0) return null
                return (
                  <div key={day} className="flex items-center gap-3">
                    <span className="w-10 text-sm text-gray-400">{day}</span>
                    <div className="flex-1 h-2 bg-dark-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${data.pnl >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${data.count > 0 ? (data.wins/data.count)*100 : 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-20 text-right">{data.count} trades</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
          <Brain className="text-purple-400" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Trade Journal</h1>
          <p className="text-gray-400 text-sm">Document, analyze, and learn from your trades</p>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex gap-2 bg-gradient-to-br from-dark-100/80 to-dark-200/80 backdrop-blur-xl rounded-xl sm:rounded-2xl p-1.5 border border-white/5 overflow-x-auto shadow-lg">
        {mainTabs.map(tab => {
          const IconComponent = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setMainTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap transition-all duration-300 ${
                mainTab === tab.id
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'text-gray-400 hover:text-white hover:bg-dark-200/50'
              }`}
            >
              <IconComponent size={16} />
              <span className="font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {mainTab === 'orders' && renderOrdersTab()}
      {mainTab === 'templates' && renderTemplatesTab()}
      {mainTab === 'journal' && renderJournalTab()}

      {/* Create/Edit Modal */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDialogOpen(false)} />
          <div className="relative bg-dark-100 rounded-2xl border border-dark-200 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-dark-200">
              <h2 className="text-xl font-bold text-white">
                {editingEntry ? 'Edit Journal Entry' : 'New Journal Entry'}
              </h2>
              <button
                onClick={() => setDialogOpen(false)}
                className="p-2 rounded-lg hover:bg-dark-200 text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto max-h-[60vh] space-y-6">
              {/* Trade Details */}
              <div>
                <h4 className="text-sm font-medium text-primary-400 mb-3">Trade Details</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Symbol *</label>
                    <input
                      type="text"
                      value={formData.symbol}
                      onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                      className="w-full bg-dark-200 border border-dark-200 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="EURUSD"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Type</label>
                    <select
                      value={formData.trade_type}
                      onChange={(e) => setFormData({ ...formData, trade_type: e.target.value })}
                      className="w-full bg-dark-200 border border-dark-200 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="buy">Buy</option>
                      <option value="sell">Sell</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Lot Size</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.lot_size}
                      onChange={(e) => setFormData({ ...formData, lot_size: e.target.value })}
                      className="w-full bg-dark-200 border border-dark-200 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Date</label>
                    <input
                      type="date"
                      value={formData.trade_date}
                      onChange={(e) => setFormData({ ...formData, trade_date: e.target.value })}
                      className="w-full bg-dark-200 border border-dark-200 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Entry Price</label>
                    <input
                      type="number"
                      step="0.00001"
                      value={formData.entry_price}
                      onChange={(e) => setFormData({ ...formData, entry_price: e.target.value })}
                      className="w-full bg-dark-200 border border-dark-200 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Exit Price</label>
                    <input
                      type="number"
                      step="0.00001"
                      value={formData.exit_price}
                      onChange={(e) => setFormData({ ...formData, exit_price: e.target.value })}
                      className="w-full bg-dark-200 border border-dark-200 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">P/L ($)</label>
                    <input
                      type="number"
                      value={formData.profit_loss}
                      onChange={(e) => setFormData({ ...formData, profit_loss: e.target.value })}
                      className="w-full bg-dark-200 border border-dark-200 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">P/L (pips)</label>
                    <input
                      type="number"
                      value={formData.profit_pips}
                      onChange={(e) => setFormData({ ...formData, profit_pips: e.target.value })}
                      className="w-full bg-dark-200 border border-dark-200 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Analysis */}
              <div className="pt-4 border-t border-dark-200">
                <h4 className="text-sm font-medium text-primary-400 mb-3">Analysis</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Setup Quality</label>
                    <select
                      value={formData.setup_quality}
                      onChange={(e) => setFormData({ ...formData, setup_quality: e.target.value })}
                      className="w-full bg-dark-200 border border-dark-200 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">-</option>
                      {SETUP_QUALITIES.map(q => <option key={q} value={q}>{q}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Execution</label>
                    <select
                      value={formData.execution_rating}
                      onChange={(e) => setFormData({ ...formData, execution_rating: e.target.value })}
                      className="w-full bg-dark-200 border border-dark-200 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 capitalize"
                    >
                      <option value="">-</option>
                      {EXECUTION_RATINGS.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Session</label>
                    <select
                      value={formData.session}
                      onChange={(e) => setFormData({ ...formData, session: e.target.value })}
                      className="w-full bg-dark-200 border border-dark-200 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 capitalize"
                    >
                      <option value="">-</option>
                      {SESSIONS.map(s => <option key={s} value={s} className="capitalize">{s.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Timeframe</label>
                    <select
                      value={formData.timeframe}
                      onChange={(e) => setFormData({ ...formData, timeframe: e.target.value })}
                      className="w-full bg-dark-200 border border-dark-200 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">-</option>
                      {TIMEFRAMES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-xs text-gray-400 mb-1">Setup Description</label>
                  <textarea
                    value={formData.setup_description}
                    onChange={(e) => setFormData({ ...formData, setup_description: e.target.value })}
                    rows={2}
                    className="w-full bg-dark-200 border border-dark-200 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-xs text-gray-400 mb-1">Lessons Learned</label>
                  <textarea
                    value={formData.lessons_learned}
                    onChange={(e) => setFormData({ ...formData, lessons_learned: e.target.value })}
                    rows={2}
                    className="w-full bg-dark-200 border border-dark-200 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                </div>
              </div>

              {/* Tags & Rating */}
              <div className="pt-4 border-t border-dark-200">
                <h4 className="text-sm font-medium text-primary-400 mb-3">Tags & Rating</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Tags</label>
                    <div className="flex flex-wrap gap-1 p-2 bg-dark-200 rounded-lg min-h-[40px]">
                      {formData.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-500/20 text-primary-400 rounded text-xs"
                        >
                          {tag}
                          <button
                            onClick={() => setFormData({
                              ...formData,
                              tags: formData.tags.filter((_, i) => i !== idx)
                            })}
                            className="hover:text-white"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {COMMON_TAGS.filter(t => !formData.tags.includes(t)).slice(0, 6).map(tag => (
                        <button
                          key={tag}
                          onClick={() => setFormData({ ...formData, tags: [...formData.tags, tag] })}
                          className="px-2 py-0.5 bg-dark-200 hover:bg-dark-300 text-gray-400 hover:text-white rounded text-xs transition-colors"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Strategy Name</label>
                    <input
                      type="text"
                      value={formData.strategy_name}
                      onChange={(e) => setFormData({ ...formData, strategy_name: e.target.value })}
                      className="w-full bg-dark-200 border border-dark-200 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Overall Rating</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setFormData({ ...formData, overall_rating: star })}
                          className="p-0.5"
                        >
                          <Star
                            size={20}
                            className={star <= formData.overall_rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <span className="text-sm text-gray-300">Mark as Mistake</span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={formData.is_mistake}
                        onChange={(e) => setFormData({ ...formData, is_mistake: e.target.checked })}
                        className="sr-only"
                      />
                      <div className={`w-11 h-6 rounded-full transition-colors ${
                        formData.is_mistake ? 'bg-red-500' : 'bg-dark-200'
                      }`}>
                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                          formData.is_mistake ? 'translate-x-5' : ''
                        }`} />
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-dark-200">
              <button
                onClick={() => setDialogOpen(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
              >
                {editingEntry ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-dark-100 rounded-2xl border border-dark-200 shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-white mb-2">Delete Entry</h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete this journal entry? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TradeJournalPage
