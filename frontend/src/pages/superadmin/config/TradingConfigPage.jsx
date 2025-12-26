import { useState, useEffect } from 'react'
import {
  TrendingUp, Clock, DollarSign, Shield, AlertTriangle,
  Save, RefreshCw, Plus, Trash2, Edit2, Check, X,
  BarChart3, Target, Percent, Globe
} from 'lucide-react'
import { AdminLayout, ConfirmationModal } from '../../../components/admin'
import superAdminApi from '../../../services/superAdminApi'
import toast from 'react-hot-toast'

const TradingConfigPage = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('spreads')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [editingInstrument, setEditingInstrument] = useState(null)

  // Configuration state
  const [config, setConfig] = useState({
    // Trading Hours
    tradingHours: {
      enabled: true,
      timezone: 'UTC',
      sessions: [
        { name: 'Sydney', start: '22:00', end: '07:00', days: [0, 1, 2, 3, 4] },
        { name: 'Tokyo', start: '00:00', end: '09:00', days: [0, 1, 2, 3, 4] },
        { name: 'London', start: '08:00', end: '17:00', days: [0, 1, 2, 3, 4] },
        { name: 'New York', start: '13:00', end: '22:00', days: [0, 1, 2, 3, 4] }
      ],
      weekendTrading: false,
      holidayTrading: false
    },

    // Spread Settings
    spreads: {
      defaultMarkup: 0.5,
      dynamicSpread: true,
      maxSpreadMultiplier: 3.0,
      instruments: [
        { symbol: 'EURUSD', baseSpread: 0.8, markup: 0.3, minSpread: 0.5, maxSpread: 5.0, enabled: true },
        { symbol: 'GBPUSD', baseSpread: 1.2, markup: 0.4, minSpread: 0.8, maxSpread: 8.0, enabled: true },
        { symbol: 'USDJPY', baseSpread: 1.0, markup: 0.3, minSpread: 0.6, maxSpread: 6.0, enabled: true },
        { symbol: 'XAUUSD', baseSpread: 25.0, markup: 5.0, minSpread: 15.0, maxSpread: 100.0, enabled: true },
        { symbol: 'BTCUSD', baseSpread: 50.0, markup: 10.0, minSpread: 30.0, maxSpread: 200.0, enabled: true }
      ]
    },

    // Risk Management
    riskManagement: {
      maxDailyLoss: 5.0,
      maxTotalLoss: 10.0,
      profitTarget: 10.0,
      maxPositionSize: 10.0,
      maxOpenTrades: 10,
      maxLotSize: 100,
      minLotSize: 0.01,
      leverageLimit: 100,
      marginCallLevel: 100,
      stopOutLevel: 50
    },

    // Trading Restrictions
    restrictions: {
      newsTrading: true,
      newsBlackoutMinutes: 5,
      weekendHolding: false,
      hedgingAllowed: true,
      scalpingAllowed: true,
      minHoldingTime: 60,
      maxHoldingDays: 30,
      expertAdvisorsAllowed: true,
      copyTradingAllowed: true
    }
  })

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    setLoading(true)
    try {
      const response = await superAdminApi.getTradingConfig()
      if (response.data) {
        setConfig(prev => ({ ...prev, ...response.data }))
      }
    } catch (error) {
      console.error('Error fetching config:', error)
      // Use mock data on error
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await superAdminApi.updateTradingConfig(config)
      toast.success('Trading configuration saved successfully')
      setShowConfirmModal(false)
    } catch (error) {
      console.error('Error saving config:', error)
      toast.error('Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (section, field, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  const handleInstrumentChange = (index, field, value) => {
    setConfig(prev => ({
      ...prev,
      spreads: {
        ...prev.spreads,
        instruments: prev.spreads.instruments.map((inst, i) =>
          i === index ? { ...inst, [field]: value } : inst
        )
      }
    }))
  }

  const addInstrument = () => {
    setConfig(prev => ({
      ...prev,
      spreads: {
        ...prev.spreads,
        instruments: [
          ...prev.spreads.instruments,
          { symbol: '', baseSpread: 1.0, markup: 0.5, minSpread: 0.5, maxSpread: 10.0, enabled: true }
        ]
      }
    }))
    setEditingInstrument(config.spreads.instruments.length)
  }

  const removeInstrument = (index) => {
    setConfig(prev => ({
      ...prev,
      spreads: {
        ...prev.spreads,
        instruments: prev.spreads.instruments.filter((_, i) => i !== index)
      }
    }))
  }

  const tabs = [
    { id: 'spreads', label: 'Spreads & Instruments', icon: BarChart3 },
    { id: 'hours', label: 'Trading Hours', icon: Clock },
    { id: 'risk', label: 'Risk Management', icon: Shield },
    { id: 'restrictions', label: 'Trading Rules', icon: Target }
  ]

  const renderToggle = (section, field, label, description) => (
    <div className="flex items-center justify-between p-4 bg-dark-200 rounded-lg">
      <div>
        <p className="text-white font-medium">{label}</p>
        {description && <p className="text-gray-500 text-sm">{description}</p>}
      </div>
      <button
        onClick={() => handleInputChange(section, field, !config[section]?.[field])}
        className={`relative w-14 h-7 rounded-full transition-colors ${
          config[section]?.[field] ? 'bg-primary' : 'bg-dark-300'
        }`}
      >
        <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
          config[section]?.[field] ? 'translate-x-8' : 'translate-x-1'
        }`} />
      </button>
    </div>
  )

  const renderNumberInput = (section, field, label, suffix = '', min = 0, max = 1000, step = 1) => (
    <div>
      <label className="block text-sm text-gray-400 mb-2">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={config[section]?.[field] || 0}
          onChange={(e) => handleInputChange(section, field, parseFloat(e.target.value))}
          min={min}
          max={max}
          step={step}
          className="w-full bg-dark-200 text-white rounded-lg px-4 py-3 border border-dark-300 focus:border-primary focus:outline-none"
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">{suffix}</span>
        )}
      </div>
    </div>
  )

  if (loading) {
    return (
      <AdminLayout title="Trading Configuration">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout
      title="Trading Configuration"
      subtitle="Manage spreads, trading hours, and risk parameters"
      breadcrumbs={[
        { label: 'SuperAdmin', href: '/superadmin/dashboard' },
        { label: 'Trading Configuration' }
      ]}
    >
      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-primary text-white'
                : 'bg-dark-100 text-gray-400 hover:text-white hover:bg-dark-200'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Spreads & Instruments Tab */}
      {activeTab === 'spreads' && (
        <div className="space-y-6">
          {/* Global Spread Settings */}
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Global Spread Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderNumberInput('spreads', 'defaultMarkup', 'Default Markup', 'pips', 0, 10, 0.1)}
              {renderNumberInput('spreads', 'maxSpreadMultiplier', 'Max Spread Multiplier', 'x', 1, 10, 0.1)}
              <div className="flex items-end">
                {renderToggle('spreads', 'dynamicSpread', 'Dynamic Spreads', '')}
              </div>
            </div>
          </div>

          {/* Instruments Table */}
          <div className="bg-dark-100 rounded-xl border border-dark-200 overflow-hidden">
            <div className="p-4 border-b border-dark-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Instrument Spreads</h3>
              <button
                onClick={addInstrument}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                <Plus size={18} />
                Add Instrument
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-dark-200">
                    <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Symbol</th>
                    <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Base Spread</th>
                    <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Markup</th>
                    <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Min Spread</th>
                    <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Max Spread</th>
                    <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Enabled</th>
                    <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {config.spreads.instruments.map((instrument, index) => (
                    <tr key={index} className="border-t border-dark-200">
                      <td className="px-4 py-3">
                        {editingInstrument === index ? (
                          <input
                            type="text"
                            value={instrument.symbol}
                            onChange={(e) => handleInstrumentChange(index, 'symbol', e.target.value.toUpperCase())}
                            className="bg-dark-300 text-white rounded px-2 py-1 w-24 border border-dark-400 focus:border-primary focus:outline-none"
                          />
                        ) : (
                          <span className="text-white font-mono">{instrument.symbol}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editingInstrument === index ? (
                          <input
                            type="number"
                            value={instrument.baseSpread}
                            onChange={(e) => handleInstrumentChange(index, 'baseSpread', parseFloat(e.target.value))}
                            step="0.1"
                            className="bg-dark-300 text-white rounded px-2 py-1 w-20 border border-dark-400 focus:border-primary focus:outline-none"
                          />
                        ) : (
                          <span className="text-gray-300">{instrument.baseSpread}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editingInstrument === index ? (
                          <input
                            type="number"
                            value={instrument.markup}
                            onChange={(e) => handleInstrumentChange(index, 'markup', parseFloat(e.target.value))}
                            step="0.1"
                            className="bg-dark-300 text-white rounded px-2 py-1 w-20 border border-dark-400 focus:border-primary focus:outline-none"
                          />
                        ) : (
                          <span className="text-gray-300">{instrument.markup}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editingInstrument === index ? (
                          <input
                            type="number"
                            value={instrument.minSpread}
                            onChange={(e) => handleInstrumentChange(index, 'minSpread', parseFloat(e.target.value))}
                            step="0.1"
                            className="bg-dark-300 text-white rounded px-2 py-1 w-20 border border-dark-400 focus:border-primary focus:outline-none"
                          />
                        ) : (
                          <span className="text-gray-300">{instrument.minSpread}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editingInstrument === index ? (
                          <input
                            type="number"
                            value={instrument.maxSpread}
                            onChange={(e) => handleInstrumentChange(index, 'maxSpread', parseFloat(e.target.value))}
                            step="0.1"
                            className="bg-dark-300 text-white rounded px-2 py-1 w-20 border border-dark-400 focus:border-primary focus:outline-none"
                          />
                        ) : (
                          <span className="text-gray-300">{instrument.maxSpread}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleInstrumentChange(index, 'enabled', !instrument.enabled)}
                          className={`w-10 h-5 rounded-full transition-colors ${
                            instrument.enabled ? 'bg-green-500' : 'bg-gray-600'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-white transition-transform ml-0.5 ${
                            instrument.enabled ? 'translate-x-5' : ''
                          }`} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {editingInstrument === index ? (
                            <>
                              <button
                                onClick={() => setEditingInstrument(null)}
                                className="p-1.5 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={() => setEditingInstrument(null)}
                                className="p-1.5 rounded bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
                              >
                                <X size={14} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setEditingInstrument(index)}
                                className="p-1.5 rounded bg-dark-300 text-gray-400 hover:text-white"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => removeInstrument(index)}
                                className="p-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Trading Hours Tab */}
      {activeTab === 'hours' && (
        <div className="space-y-6">
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Trading Hours Settings</h3>
              {renderToggle('tradingHours', 'enabled', '', '')}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Timezone</label>
                <select
                  value={config.tradingHours?.timezone || 'UTC'}
                  onChange={(e) => handleInputChange('tradingHours', 'timezone', e.target.value)}
                  className="w-full bg-dark-200 text-white rounded-lg px-4 py-3 border border-dark-300 focus:border-primary focus:outline-none"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">New York (EST)</option>
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                  <option value="Australia/Sydney">Sydney (AEST)</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {renderToggle('tradingHours', 'weekendTrading', 'Weekend Trading', 'Allow trading on weekends')}
              {renderToggle('tradingHours', 'holidayTrading', 'Holiday Trading', 'Allow trading on market holidays')}
            </div>
          </div>

          {/* Trading Sessions */}
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Market Sessions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {config.tradingHours?.sessions?.map((session, index) => (
                <div key={index} className="bg-dark-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white font-medium">{session.name}</span>
                    <Globe size={16} className="text-gray-500" />
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Open: </span>
                      <span className="text-green-400">{session.start}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Close: </span>
                      <span className="text-red-400">{session.end}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Risk Management Tab */}
      {activeTab === 'risk' && (
        <div className="space-y-6">
          {/* Loss Limits */}
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-lg bg-red-500/20">
                <Shield size={24} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Loss Limits</h3>
                <p className="text-gray-500 text-sm">Configure maximum loss thresholds</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderNumberInput('riskManagement', 'maxDailyLoss', 'Max Daily Loss', '%', 0, 100, 0.5)}
              {renderNumberInput('riskManagement', 'maxTotalLoss', 'Max Total Loss', '%', 0, 100, 0.5)}
              {renderNumberInput('riskManagement', 'profitTarget', 'Profit Target', '%', 0, 100, 0.5)}
            </div>
          </div>

          {/* Position Limits */}
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-lg bg-blue-500/20">
                <BarChart3 size={24} className="text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Position Limits</h3>
                <p className="text-gray-500 text-sm">Set trading position constraints</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderNumberInput('riskManagement', 'maxPositionSize', 'Max Position Size', '%', 0, 100, 0.5)}
              {renderNumberInput('riskManagement', 'maxOpenTrades', 'Max Open Trades', '', 1, 100, 1)}
              {renderNumberInput('riskManagement', 'maxLotSize', 'Max Lot Size', 'lots', 0.01, 1000, 0.01)}
              {renderNumberInput('riskManagement', 'minLotSize', 'Min Lot Size', 'lots', 0.01, 10, 0.01)}
            </div>
          </div>

          {/* Leverage & Margin */}
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-lg bg-yellow-500/20">
                <Percent size={24} className="text-yellow-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Leverage & Margin</h3>
                <p className="text-gray-500 text-sm">Configure leverage and margin call levels</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderNumberInput('riskManagement', 'leverageLimit', 'Max Leverage', ':1', 1, 500, 1)}
              {renderNumberInput('riskManagement', 'marginCallLevel', 'Margin Call Level', '%', 0, 200, 5)}
              {renderNumberInput('riskManagement', 'stopOutLevel', 'Stop Out Level', '%', 0, 100, 5)}
            </div>
          </div>
        </div>
      )}

      {/* Trading Rules Tab */}
      {activeTab === 'restrictions' && (
        <div className="space-y-6">
          {/* News Trading */}
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">News Trading Rules</h3>
            <div className="space-y-4">
              {renderToggle('restrictions', 'newsTrading', 'Allow News Trading', 'Enable trading during high-impact news events')}
              {!config.restrictions?.newsTrading && (
                <div className="mt-4">
                  {renderNumberInput('restrictions', 'newsBlackoutMinutes', 'Blackout Period', 'minutes', 1, 60, 1)}
                </div>
              )}
            </div>
          </div>

          {/* Holding Rules */}
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Holding Rules</h3>
            <div className="space-y-4">
              {renderToggle('restrictions', 'weekendHolding', 'Weekend Holding', 'Allow positions to be held over weekends')}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {renderNumberInput('restrictions', 'minHoldingTime', 'Min Holding Time', 'seconds', 0, 3600, 1)}
                {renderNumberInput('restrictions', 'maxHoldingDays', 'Max Holding Days', 'days', 1, 365, 1)}
              </div>
            </div>
          </div>

          {/* Trading Strategies */}
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Allowed Strategies</h3>
            <div className="space-y-4">
              {renderToggle('restrictions', 'hedgingAllowed', 'Hedging', 'Allow opening opposite positions on the same instrument')}
              {renderToggle('restrictions', 'scalpingAllowed', 'Scalping', 'Allow short-term scalping strategies')}
              {renderToggle('restrictions', 'expertAdvisorsAllowed', 'Expert Advisors (EAs)', 'Allow automated trading systems')}
              {renderToggle('restrictions', 'copyTradingAllowed', 'Copy Trading', 'Allow copy trading and signal following')}
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end gap-4 mt-8">
        <button
          onClick={fetchConfig}
          className="flex items-center gap-2 px-6 py-3 bg-dark-200 text-gray-400 rounded-lg hover:text-white hover:bg-dark-300 transition-colors"
        >
          <RefreshCw size={18} />
          Reset Changes
        </button>
        <button
          onClick={() => setShowConfirmModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Save size={18} />
          Save Configuration
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <ConfirmationModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleSave}
          title="Save Trading Configuration"
          message="Are you sure you want to save these trading configuration changes? This will affect all active challenges and trading accounts."
          confirmText={saving ? 'Saving...' : 'Save Changes'}
          variant="warning"
        />
      )}
    </AdminLayout>
  )
}

export default TradingConfigPage
