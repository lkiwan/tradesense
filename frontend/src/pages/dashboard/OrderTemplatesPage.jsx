import { useState, useEffect } from 'react'
import {
  Plus, Search, Star, Edit3, Trash2, Copy, MoreVertical,
  TrendingUp, TrendingDown, Shield, Zap, Activity, Target,
  Play, Settings, X, Check
} from 'lucide-react'
import api from '../../services/api'
import { showSuccessToast, showErrorToast } from '../../utils/errorHandler'

const ICONS = {
  template: Settings,
  zap: Zap,
  'trending-up': TrendingUp,
  activity: Activity,
  shield: Shield,
  target: Target
}

const COLORS = [
  '#6366f1', '#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b',
  '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#06b6d4'
]

const OrderTemplatesPage = () => {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [menuOpen, setMenuOpen] = useState(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#6366f1',
    icon: 'template',
    symbol: '',
    symbol_locked: false,
    order_type: 'market',
    order_side: null,
    position_sizing: {
      lot_size: 0.1,
      use_risk_based_sizing: false,
      risk_percent: 1
    },
    stop_loss: {
      enabled: true,
      type: 'pips',
      value: 20
    },
    take_profit: {
      enabled: true,
      type: 'pips',
      value: 40
    },
    trailing_stop: {
      enabled: false,
      type: 'pips',
      value: 15,
      activation: 20
    },
    break_even: {
      enabled: false,
      trigger: 15,
      offset: 1
    },
    is_favorite: false
  })

  useEffect(() => {
    loadTemplates()
  }, [activeTab])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const params = activeTab === 'favorites' ? { favorites: 'true' } : {}
      const response = await api.get('/templates', { params })
      setTemplates(response.data?.templates || [])
    } catch (error) {
      showErrorToast('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (template = null) => {
    if (template) {
      setEditingTemplate(template)
      setFormData({
        name: template.name,
        description: template.description || '',
        color: template.color,
        icon: template.icon,
        symbol: template.symbol || '',
        symbol_locked: template.symbol_locked,
        order_type: template.order_type,
        order_side: template.order_side,
        position_sizing: template.position_sizing || {
          lot_size: 0.1,
          use_risk_based_sizing: false,
          risk_percent: 1
        },
        stop_loss: template.stop_loss || { enabled: true, type: 'pips', value: 20 },
        take_profit: template.take_profit || { enabled: true, type: 'pips', value: 40 },
        trailing_stop: template.trailing_stop || { enabled: false, type: 'pips', value: 15, activation: 20 },
        break_even: template.break_even || { enabled: false, trigger: 15, offset: 1 },
        is_favorite: template.is_favorite
      })
    } else {
      setEditingTemplate(null)
      setFormData({
        name: '',
        description: '',
        color: '#6366f1',
        icon: 'template',
        symbol: '',
        symbol_locked: false,
        order_type: 'market',
        order_side: null,
        position_sizing: { lot_size: 0.1, use_risk_based_sizing: false, risk_percent: 1 },
        stop_loss: { enabled: true, type: 'pips', value: 20 },
        take_profit: { enabled: true, type: 'pips', value: 40 },
        trailing_stop: { enabled: false, type: 'pips', value: 15, activation: 20 },
        break_even: { enabled: false, trigger: 15, offset: 1 },
        is_favorite: false
      })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingTemplate(null)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showErrorToast('Template name is required')
      return
    }

    try {
      if (editingTemplate) {
        await api.put(`/api/templates/${editingTemplate.id}`, formData)
        showSuccessToast('Template updated successfully')
      } else {
        await api.post('/templates', formData)
        showSuccessToast('Template created successfully')
      }
      handleCloseDialog()
      loadTemplates()
    } catch (error) {
      showErrorToast(error.response?.data?.error || 'Failed to save template')
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return

    try {
      await api.delete(`/api/templates/${deleteConfirm.id}`)
      showSuccessToast('Template deleted')
      setDeleteConfirm(null)
      loadTemplates()
    } catch (error) {
      showErrorToast('Failed to delete template')
    }
  }

  const handleToggleFavorite = async (template) => {
    try {
      await api.post(`/api/templates/${template.id}/toggle-favorite`)
      loadTemplates()
    } catch (error) {
      showErrorToast('Failed to update favorite')
    }
  }

  const handleDuplicate = async (template) => {
    try {
      await api.post(`/api/templates/${template.id}/duplicate`)
      showSuccessToast('Template duplicated')
      loadTemplates()
    } catch (error) {
      showErrorToast('Failed to duplicate template')
    }
    setMenuOpen(null)
  }

  const handleUseTemplate = async (template) => {
    try {
      await api.post(`/api/templates/${template.id}/use`)
      showSuccessToast(`Template "${template.name}" loaded - Ready to trade!`)
    } catch (error) {
      showErrorToast('Failed to use template')
    }
  }

  const handleInitDefaults = async () => {
    try {
      const response = await api.post('/templates/init-defaults')
      showSuccessToast(response.data.message)
      loadTemplates()
    } catch (error) {
      showErrorToast('Failed to create default templates')
    }
  }

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (t.symbol && t.symbol.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const getIconComponent = (iconName) => {
    return ICONS[iconName] || Settings
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 border border-primary-500/30">
            <Settings className="text-primary-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Order Templates</h1>
            <p className="text-gray-400 text-sm">Save and reuse your favorite order configurations</p>
          </div>
        </div>
        <button
          onClick={() => handleOpenDialog()}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-all hover:shadow-lg hover:shadow-primary-500/25"
        >
          <Plus size={18} />
          New Template
        </button>
      </div>

      {/* Search & Tabs */}
      <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-dark-200/50 border border-dark-200 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex bg-dark-200/50 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'all'
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              All Templates
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'favorites'
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Favorites
              {templates.filter(t => t.is_favorite).length > 0 && (
                <span className="px-1.5 py-0.5 bg-primary-500/30 rounded text-xs">
                  {templates.filter(t => t.is_favorite).length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-12 text-center">
          <Settings className="mx-auto text-gray-600 mb-4" size={64} />
          <h3 className="text-xl font-bold text-white mb-2">No templates found</h3>
          <p className="text-gray-400 mb-6">
            {templates.length === 0
              ? 'Create your first template or load default templates to get started.'
              : 'No templates match your search criteria.'}
          </p>
          {templates.length === 0 && (
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => handleOpenDialog()}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
              >
                Create Template
              </button>
              <button
                onClick={handleInitDefaults}
                className="px-4 py-2 bg-dark-200 hover:bg-dark-300 text-white rounded-lg font-medium transition-colors"
              >
                Load Defaults
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTemplates.map((template) => {
            const IconComponent = getIconComponent(template.icon)
            return (
              <div
                key={template.id}
                className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 overflow-hidden hover:border-primary-500/30 transition-all hover:shadow-lg hover:-translate-y-1 group"
                style={{ borderTopColor: template.color, borderTopWidth: '3px' }}
              >
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: template.color + '20' }}
                      >
                        <IconComponent style={{ color: template.color }} size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white truncate">{template.name}</h3>
                        {template.symbol && (
                          <span className="text-xs px-1.5 py-0.5 bg-dark-200 rounded text-gray-400">
                            {template.symbol}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleFavorite(template)}
                      className="p-1.5 rounded-lg hover:bg-dark-200 transition-colors"
                    >
                      {template.is_favorite ? (
                        <Star className="text-yellow-400 fill-yellow-400" size={18} />
                      ) : (
                        <Star className="text-gray-500 hover:text-gray-300" size={18} />
                      )}
                    </button>
                  </div>

                  {/* Description */}
                  {template.description && (
                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                      {template.description}
                    </p>
                  )}

                  {/* Quick Info */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {template.position_sizing?.lot_size && (
                      <span className="px-2 py-1 bg-dark-200/50 border border-dark-200 rounded text-xs text-gray-300">
                        {template.position_sizing.lot_size} Lots
                      </span>
                    )}
                    {template.stop_loss?.enabled && (
                      <span className="px-2 py-1 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400">
                        SL: {template.stop_loss.value}
                      </span>
                    )}
                    {template.take_profit?.enabled && (
                      <span className="px-2 py-1 bg-green-500/10 border border-green-500/30 rounded text-xs text-green-400">
                        {template.take_profit.type === 'rr_ratio'
                          ? `RR: 1:${template.take_profit.rr_ratio}`
                          : `TP: ${template.take_profit.value}`}
                      </span>
                    )}
                    {template.trailing_stop?.enabled && (
                      <span className="px-2 py-1 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-400">
                        Trail
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  {template.stats && template.stats.times_used > 0 && (
                    <div className="flex gap-4 text-xs text-gray-500 mb-4">
                      <span>Used: {template.stats.times_used}x</span>
                      {template.stats.win_rate !== null && (
                        <span>Win: {template.stats.win_rate}%</span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-dark-200">
                    <button
                      onClick={() => handleUseTemplate(template)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <Play size={14} />
                      Use
                    </button>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleOpenDialog(template)}
                        className="p-2 rounded-lg hover:bg-dark-200 text-gray-400 hover:text-white transition-colors"
                      >
                        <Edit3 size={16} />
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setMenuOpen(menuOpen === template.id ? null : template.id)}
                          className="p-2 rounded-lg hover:bg-dark-200 text-gray-400 hover:text-white transition-colors"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {menuOpen === template.id && (
                          <div className="absolute right-0 bottom-full mb-2 w-36 bg-dark-100 border border-dark-200 rounded-lg shadow-xl overflow-hidden z-10">
                            <button
                              onClick={() => handleDuplicate(template)}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-dark-200 transition-colors"
                            >
                              <Copy size={14} />
                              Duplicate
                            </button>
                            <button
                              onClick={() => {
                                setDeleteConfirm(template)
                                setMenuOpen(null)
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-dark-200 transition-colors"
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCloseDialog} />
          <div className="relative bg-dark-100 rounded-2xl border border-dark-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-dark-200">
              <h2 className="text-xl font-bold text-white">
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </h2>
              <button
                onClick={handleCloseDialog}
                className="p-2 rounded-lg hover:bg-dark-200 text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto max-h-[60vh] space-y-6">
              {/* Basic Info */}
              <div>
                <h4 className="text-sm font-medium text-primary-400 mb-3">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Template Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-dark-200 border border-dark-200 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="My Trading Template"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Symbol (optional)</label>
                    <input
                      type="text"
                      value={formData.symbol}
                      onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                      className="w-full bg-dark-200 border border-dark-200 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="EURUSD"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-400 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                      className="w-full bg-dark-200 border border-dark-200 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                      placeholder="Describe your template..."
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-400 mb-2">Color</label>
                    <div className="flex gap-2 flex-wrap">
                      {COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => setFormData({ ...formData, color })}
                          className={`w-8 h-8 rounded-lg transition-all ${
                            formData.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-100' : ''
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Position Sizing */}
              <div className="pt-4 border-t border-dark-200">
                <h4 className="text-sm font-medium text-primary-400 mb-3">Position Sizing</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Lot Size</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.position_sizing.lot_size}
                      onChange={(e) => setFormData({
                        ...formData,
                        position_sizing: { ...formData.position_sizing, lot_size: parseFloat(e.target.value) }
                      })}
                      className="w-full bg-dark-200 border border-dark-200 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={formData.position_sizing.use_risk_based_sizing}
                          onChange={(e) => setFormData({
                            ...formData,
                            position_sizing: { ...formData.position_sizing, use_risk_based_sizing: e.target.checked }
                          })}
                          className="sr-only"
                        />
                        <div className={`w-11 h-6 rounded-full transition-colors ${
                          formData.position_sizing.use_risk_based_sizing ? 'bg-primary-500' : 'bg-dark-200'
                        }`}>
                          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                            formData.position_sizing.use_risk_based_sizing ? 'translate-x-5' : ''
                          }`} />
                        </div>
                      </div>
                      <span className="text-sm text-gray-300">Use Risk-Based Sizing</span>
                    </label>
                  </div>
                  {formData.position_sizing.use_risk_based_sizing && (
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Risk % Per Trade</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0.1"
                        max="10"
                        value={formData.position_sizing.risk_percent}
                        onChange={(e) => setFormData({
                          ...formData,
                          position_sizing: { ...formData.position_sizing, risk_percent: parseFloat(e.target.value) }
                        })}
                        className="w-full bg-dark-200 border border-dark-200 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Stop Loss & Take Profit */}
              <div className="pt-4 border-t border-dark-200">
                <h4 className="text-sm font-medium text-primary-400 mb-3">Stop Loss & Take Profit</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Stop Loss */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={formData.stop_loss.enabled}
                          onChange={(e) => setFormData({
                            ...formData,
                            stop_loss: { ...formData.stop_loss, enabled: e.target.checked }
                          })}
                          className="sr-only"
                        />
                        <div className={`w-11 h-6 rounded-full transition-colors ${
                          formData.stop_loss.enabled ? 'bg-red-500' : 'bg-dark-200'
                        }`}>
                          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                            formData.stop_loss.enabled ? 'translate-x-5' : ''
                          }`} />
                        </div>
                      </div>
                      <span className="text-sm text-gray-300">Stop Loss</span>
                    </label>
                    {formData.stop_loss.enabled && (
                      <div className="flex gap-2">
                        <select
                          value={formData.stop_loss.type}
                          onChange={(e) => setFormData({
                            ...formData,
                            stop_loss: { ...formData.stop_loss, type: e.target.value }
                          })}
                          className="bg-dark-200 border border-dark-200 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="pips">Pips</option>
                          <option value="points">Points</option>
                          <option value="percent">%</option>
                        </select>
                        <input
                          type="number"
                          value={formData.stop_loss.value}
                          onChange={(e) => setFormData({
                            ...formData,
                            stop_loss: { ...formData.stop_loss, value: parseFloat(e.target.value) }
                          })}
                          className="w-24 bg-dark-200 border border-dark-200 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* Take Profit */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={formData.take_profit.enabled}
                          onChange={(e) => setFormData({
                            ...formData,
                            take_profit: { ...formData.take_profit, enabled: e.target.checked }
                          })}
                          className="sr-only"
                        />
                        <div className={`w-11 h-6 rounded-full transition-colors ${
                          formData.take_profit.enabled ? 'bg-green-500' : 'bg-dark-200'
                        }`}>
                          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                            formData.take_profit.enabled ? 'translate-x-5' : ''
                          }`} />
                        </div>
                      </div>
                      <span className="text-sm text-gray-300">Take Profit</span>
                    </label>
                    {formData.take_profit.enabled && (
                      <div className="flex gap-2">
                        <select
                          value={formData.take_profit.type}
                          onChange={(e) => setFormData({
                            ...formData,
                            take_profit: { ...formData.take_profit, type: e.target.value }
                          })}
                          className="bg-dark-200 border border-dark-200 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="pips">Pips</option>
                          <option value="points">Points</option>
                          <option value="rr_ratio">R:R Ratio</option>
                        </select>
                        <input
                          type="number"
                          value={formData.take_profit.type === 'rr_ratio'
                            ? (formData.take_profit.rr_ratio || 2)
                            : formData.take_profit.value}
                          onChange={(e) => {
                            if (formData.take_profit.type === 'rr_ratio') {
                              setFormData({
                                ...formData,
                                take_profit: { ...formData.take_profit, rr_ratio: parseFloat(e.target.value) }
                              })
                            } else {
                              setFormData({
                                ...formData,
                                take_profit: { ...formData.take_profit, value: parseFloat(e.target.value) }
                              })
                            }
                          }}
                          className="w-24 bg-dark-200 border border-dark-200 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Advanced Features */}
              <div className="pt-4 border-t border-dark-200">
                <h4 className="text-sm font-medium text-primary-400 mb-3">Advanced Features</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Trailing Stop */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={formData.trailing_stop.enabled}
                          onChange={(e) => setFormData({
                            ...formData,
                            trailing_stop: { ...formData.trailing_stop, enabled: e.target.checked }
                          })}
                          className="sr-only"
                        />
                        <div className={`w-11 h-6 rounded-full transition-colors ${
                          formData.trailing_stop.enabled ? 'bg-blue-500' : 'bg-dark-200'
                        }`}>
                          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                            formData.trailing_stop.enabled ? 'translate-x-5' : ''
                          }`} />
                        </div>
                      </div>
                      <span className="text-sm text-gray-300">Trailing Stop</span>
                    </label>
                    {formData.trailing_stop.enabled && (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Trail (pips)"
                          value={formData.trailing_stop.value}
                          onChange={(e) => setFormData({
                            ...formData,
                            trailing_stop: { ...formData.trailing_stop, value: parseFloat(e.target.value) }
                          })}
                          className="w-24 bg-dark-200 border border-dark-200 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <input
                          type="number"
                          placeholder="Activate at"
                          value={formData.trailing_stop.activation}
                          onChange={(e) => setFormData({
                            ...formData,
                            trailing_stop: { ...formData.trailing_stop, activation: parseFloat(e.target.value) }
                          })}
                          className="w-24 bg-dark-200 border border-dark-200 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* Break Even */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={formData.break_even.enabled}
                          onChange={(e) => setFormData({
                            ...formData,
                            break_even: { ...formData.break_even, enabled: e.target.checked }
                          })}
                          className="sr-only"
                        />
                        <div className={`w-11 h-6 rounded-full transition-colors ${
                          formData.break_even.enabled ? 'bg-purple-500' : 'bg-dark-200'
                        }`}>
                          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                            formData.break_even.enabled ? 'translate-x-5' : ''
                          }`} />
                        </div>
                      </div>
                      <span className="text-sm text-gray-300">Break Even</span>
                    </label>
                    {formData.break_even.enabled && (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Trigger (pips)"
                          value={formData.break_even.trigger}
                          onChange={(e) => setFormData({
                            ...formData,
                            break_even: { ...formData.break_even, trigger: parseFloat(e.target.value) }
                          })}
                          className="w-24 bg-dark-200 border border-dark-200 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <input
                          type="number"
                          placeholder="Offset"
                          value={formData.break_even.offset}
                          onChange={(e) => setFormData({
                            ...formData,
                            break_even: { ...formData.break_even, offset: parseFloat(e.target.value) }
                          })}
                          className="w-24 bg-dark-200 border border-dark-200 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Add to favorites */}
                <label className="flex items-center gap-3 cursor-pointer mt-4">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formData.is_favorite}
                      onChange={(e) => setFormData({ ...formData, is_favorite: e.target.checked })}
                      className="sr-only"
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors ${
                      formData.is_favorite ? 'bg-yellow-500' : 'bg-dark-200'
                    }`}>
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                        formData.is_favorite ? 'translate-x-5' : ''
                      }`} />
                    </div>
                  </div>
                  <span className="text-sm text-gray-300">Add to Favorites</span>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-dark-200">
              <button
                onClick={handleCloseDialog}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
              >
                {editingTemplate ? 'Update' : 'Create'}
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
            <h3 className="text-lg font-bold text-white mb-2">Delete Template</h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete "{deleteConfirm.name}"? This action cannot be undone.
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

export default OrderTemplatesPage
