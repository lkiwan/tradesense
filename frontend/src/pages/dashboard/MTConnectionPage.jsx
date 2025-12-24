import { useState, useEffect } from 'react'
import {
  Monitor, Plus, Wifi, WifiOff, RefreshCw, Settings, Trash2,
  Server, Key, Shield, AlertCircle, CheckCircle, Clock,
  TrendingUp, DollarSign, Activity, Link2, Unlink, Eye, EyeOff
} from 'lucide-react'
import api from '../../services/api'
import { showSuccessToast, showErrorToast } from '../../utils/errorHandler'

const MTConnectionPage = () => {
  const [connections, setConnections] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [selectedConnection, setSelectedConnection] = useState(null)
  const [syncing, setSyncing] = useState(null)
  const [positions, setPositions] = useState([])

  // Add connection form state
  const [formData, setFormData] = useState({
    login: '',
    password: '',
    server: '',
    platform: 'mt5',
    broker_name: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    fetchConnections()
  }, [])

  const fetchConnections = async () => {
    try {
      setLoading(true)
      const response = await api.get('/mt/connections')
      setConnections(response.data.connections || [])
    } catch (error) {
      console.error('Failed to fetch connections:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async (e) => {
    e.preventDefault()

    if (!formData.login || !formData.password || !formData.server) {
      showErrorToast({ message: 'Please fill all required fields' })
      return
    }

    try {
      setConnecting(true)
      const response = await api.post('/mt/connect', formData)
      showSuccessToast('MT account connected successfully!')
      setConnections([...connections, response.data.connection])
      setShowAddModal(false)
      setFormData({ login: '', password: '', server: '', platform: 'mt5', broker_name: '' })
    } catch (error) {
      showErrorToast(error)
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = async (connectionId) => {
    if (!confirm('Are you sure you want to disconnect this account?')) return

    try {
      await api.post(`/mt/disconnect/${connectionId}`)
      showSuccessToast('Account disconnected')
      fetchConnections()
    } catch (error) {
      showErrorToast(error)
    }
  }

  const handleReconnect = async (connectionId) => {
    try {
      await api.post(`/mt/reconnect/${connectionId}`)
      showSuccessToast('Account reconnected')
      fetchConnections()
    } catch (error) {
      showErrorToast(error)
    }
  }

  const handleSync = async (connectionId) => {
    try {
      setSyncing(connectionId)
      const response = await api.post(`/mt/sync/${connectionId}`)
      showSuccessToast(`Synced ${response.data.sync_stats.positions_synced} positions`)
      setPositions(response.data.positions || [])
      fetchConnections()
    } catch (error) {
      showErrorToast(error)
    } finally {
      setSyncing(null)
    }
  }

  const handleDelete = async (connectionId) => {
    if (!confirm('Are you sure you want to permanently delete this connection?')) return

    try {
      await api.delete(`/mt/delete/${connectionId}`)
      showSuccessToast('Connection deleted')
      setConnections(connections.filter(c => c.id !== connectionId))
    } catch (error) {
      showErrorToast(error)
    }
  }

  const handleUpdateSettings = async (e) => {
    e.preventDefault()
    if (!selectedConnection) return

    try {
      await api.put(`/mt/settings/${selectedConnection.id}`, selectedConnection.settings)
      showSuccessToast('Settings updated')
      setShowSettingsModal(false)
      fetchConnections()
    } catch (error) {
      showErrorToast(error)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
        return <Wifi className="text-green-500" size={20} />
      case 'disconnected':
        return <WifiOff className="text-gray-500" size={20} />
      case 'error':
        return <AlertCircle className="text-red-500" size={20} />
      case 'syncing':
        return <RefreshCw className="text-blue-500 animate-spin" size={20} />
      default:
        return <Clock className="text-yellow-500" size={20} />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'disconnected': return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
      case 'error': return 'bg-red-500/10 text-red-500 border-red-500/20'
      default: return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">MT4/MT5 Connection</h1>
          <p className="text-gray-400 mt-1">Connect your MetaTrader accounts for real trading</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
        >
          <Plus size={18} />
          Connect Account
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Monitor className="text-blue-500 mt-0.5" size={20} />
          <div>
            <h3 className="text-blue-500 font-medium">MetaTrader Integration</h3>
            <p className="text-gray-400 text-sm mt-1">
              Connect your MT4 or MT5 account to sync trades automatically and execute orders directly from TradeSense.
              Your credentials are encrypted and securely stored.
            </p>
          </div>
        </div>
      </div>

      {/* Connections List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-dark-100 rounded-xl p-6 animate-pulse">
              <div className="h-6 bg-dark-200 rounded w-1/3 mb-4" />
              <div className="h-4 bg-dark-200 rounded w-1/2 mb-2" />
              <div className="h-4 bg-dark-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : connections.length === 0 ? (
        <div className="bg-dark-100 rounded-xl p-12 text-center">
          <Monitor className="mx-auto text-gray-600 mb-4" size={48} />
          <h3 className="text-lg font-medium text-white mb-2">No Connections</h3>
          <p className="text-gray-400 mb-6">Connect your MT4 or MT5 account to get started</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
          >
            <Plus size={18} />
            Connect Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {connections.map(conn => (
            <div key={conn.id} className="bg-dark-100 rounded-xl overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-dark-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(conn.status)}
                    <div>
                      <h3 className="font-medium text-white">
                        {conn.broker_name || conn.server}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {conn.platform.toUpperCase()} • Login: {conn.login}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(conn.status)}`}>
                    {conn.status}
                  </span>
                </div>
              </div>

              {/* Account Info */}
              {conn.account_info && conn.account_info.balance && (
                <div className="p-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Balance</p>
                    <p className="text-lg font-semibold text-white">
                      ${conn.account_info.balance?.toLocaleString() || '0.00'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Equity</p>
                    <p className="text-lg font-semibold text-white">
                      ${conn.account_info.equity?.toLocaleString() || '0.00'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Leverage</p>
                    <p className="text-white">1:{conn.account_info.leverage || 100}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Free Margin</p>
                    <p className="text-white">
                      ${conn.account_info.free_margin?.toLocaleString() || '0.00'}
                    </p>
                  </div>
                </div>
              )}

              {/* Last Sync */}
              {conn.last_sync_at && (
                <div className="px-4 pb-2">
                  <p className="text-xs text-gray-500">
                    Last synced: {new Date(conn.last_sync_at).toLocaleString()}
                  </p>
                </div>
              )}

              {/* Error Message */}
              {conn.connection_error && (
                <div className="px-4 pb-4">
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <p className="text-red-400 text-sm">{conn.connection_error}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="p-4 bg-dark-200/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {conn.status === 'connected' ? (
                    <>
                      <button
                        onClick={() => handleSync(conn.id)}
                        disabled={syncing === conn.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm transition-colors disabled:opacity-50"
                      >
                        <RefreshCw size={14} className={syncing === conn.id ? 'animate-spin' : ''} />
                        Sync
                      </button>
                      <button
                        onClick={() => handleDisconnect(conn.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg text-sm transition-colors"
                      >
                        <Unlink size={14} />
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleReconnect(conn.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm transition-colors"
                    >
                      <Link2 size={14} />
                      Reconnect
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedConnection(conn)
                      setShowSettingsModal(true)
                    }}
                    className="p-2 hover:bg-dark-200 rounded-lg transition-colors"
                  >
                    <Settings size={16} className="text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(conn.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Positions Section */}
      {positions.length > 0 && (
        <div className="bg-dark-100 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-dark-200">
            <h3 className="font-medium text-white">Open Positions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-200/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Symbol</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Type</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Volume</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Open Price</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Current</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-200">
                {positions.map((pos, idx) => (
                  <tr key={idx} className="hover:bg-dark-200/30">
                    <td className="px-4 py-3 font-medium text-white">{pos.symbol}</td>
                    <td className="px-4 py-3">
                      <span className={pos.type?.includes('BUY') ? 'text-green-500' : 'text-red-500'}>
                        {pos.type?.includes('BUY') ? 'BUY' : 'SELL'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-white">{pos.volume}</td>
                    <td className="px-4 py-3 text-right text-gray-400">{pos.openPrice}</td>
                    <td className="px-4 py-3 text-right text-white">{pos.currentPrice}</td>
                    <td className={`px-4 py-3 text-right font-medium ${pos.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {pos.profit >= 0 ? '+' : ''}${pos.profit?.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Connection Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-100 rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-dark-200">
              <h2 className="text-xl font-bold text-white">Connect MT Account</h2>
              <p className="text-gray-400 text-sm mt-1">Enter your MetaTrader credentials</p>
            </div>
            <form onSubmit={handleConnect} className="p-6 space-y-4">
              {/* Platform */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Platform</label>
                <div className="flex gap-3">
                  {['mt4', 'mt5'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormData({ ...formData, platform: p })}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                        formData.platform === p
                          ? 'bg-primary-500 text-white'
                          : 'bg-dark-200 text-gray-400 hover:bg-dark-300'
                      }`}
                    >
                      {p.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Broker Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Broker Name (Optional)</label>
                <input
                  type="text"
                  value={formData.broker_name}
                  onChange={e => setFormData({ ...formData, broker_name: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                  placeholder="e.g. IC Markets"
                />
              </div>

              {/* Server */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Server *</label>
                <input
                  type="text"
                  value={formData.server}
                  onChange={e => setFormData({ ...formData, server: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                  placeholder="e.g. ICMarkets-Demo"
                  required
                />
              </div>

              {/* Login */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Login *</label>
                <input
                  type="text"
                  value={formData.login}
                  onChange={e => setFormData({ ...formData, login: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                  placeholder="Your MT login"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 pr-10 bg-dark-200 border border-dark-300 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                    placeholder="Your MT password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Security Note */}
              <div className="bg-dark-200/50 rounded-lg p-3 flex items-start gap-2">
                <Shield className="text-green-500 mt-0.5" size={16} />
                <p className="text-xs text-gray-400">
                  Your credentials are encrypted and securely stored. We use industry-standard encryption to protect your data.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 px-4 bg-dark-200 hover:bg-dark-300 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={connecting}
                  className="flex-1 py-2 px-4 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {connecting ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Link2 size={16} />
                      Connect
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && selectedConnection && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-100 rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-dark-200">
              <h2 className="text-xl font-bold text-white">Connection Settings</h2>
              <p className="text-gray-400 text-sm mt-1">{selectedConnection.broker_name || selectedConnection.server}</p>
            </div>
            <form onSubmit={handleUpdateSettings} className="p-6 space-y-4">
              {/* Auto Sync */}
              <label className="flex items-center justify-between p-3 bg-dark-200/50 rounded-lg cursor-pointer">
                <div>
                  <p className="text-white font-medium">Auto Sync</p>
                  <p className="text-sm text-gray-400">Automatically sync account data</p>
                </div>
                <input
                  type="checkbox"
                  checked={selectedConnection.settings?.auto_sync_enabled}
                  onChange={e => setSelectedConnection({
                    ...selectedConnection,
                    settings: { ...selectedConnection.settings, auto_sync_enabled: e.target.checked }
                  })}
                  className="w-5 h-5 rounded text-primary-500 bg-dark-300 border-dark-400 focus:ring-primary-500"
                />
              </label>

              {/* Allow Trade Execution */}
              <label className="flex items-center justify-between p-3 bg-dark-200/50 rounded-lg cursor-pointer">
                <div>
                  <p className="text-white font-medium">Allow Trade Execution</p>
                  <p className="text-sm text-gray-400">Execute trades through MT</p>
                </div>
                <input
                  type="checkbox"
                  checked={selectedConnection.settings?.allow_trade_execution}
                  onChange={e => setSelectedConnection({
                    ...selectedConnection,
                    settings: { ...selectedConnection.settings, allow_trade_execution: e.target.checked }
                  })}
                  className="w-5 h-5 rounded text-primary-500 bg-dark-300 border-dark-400 focus:ring-primary-500"
                />
              </label>

              {/* Max Lot Size */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Max Lot Size</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={selectedConnection.settings?.max_lot_size || 1}
                  onChange={e => setSelectedConnection({
                    ...selectedConnection,
                    settings: { ...selectedConnection.settings, max_lot_size: parseFloat(e.target.value) }
                  })}
                  className="w-full px-4 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="flex-1 py-2 px-4 bg-dark-200 hover:bg-dark-300 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default MTConnectionPage
