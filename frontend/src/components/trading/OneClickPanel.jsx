import { useState, useEffect, useCallback } from 'react'
import {
  TrendingUp, TrendingDown, Settings, X, Zap, Keyboard,
  Volume2, VolumeX, ChevronDown, ChevronUp, Star, RefreshCw,
  Shield, Target, AlertTriangle
} from 'lucide-react'
import api from '../../services/api'
import { useTradingHotkeys } from '../../hooks/useHotkeys'
import { toast } from 'react-hot-toast'

const OneClickPanel = ({ symbol = 'EURUSD', currentPrice = 1.0850, challengeId }) => {
  // Settings state
  const [settings, setSettings] = useState({
    one_click_enabled: false,
    default_lot_size: 0.01,
    quick_lot_1: 0.01,
    quick_lot_2: 0.05,
    quick_lot_3: 0.1,
    quick_lot_4: 0.5,
    default_sl_enabled: true,
    default_sl_type: 'pips',
    default_sl_value: 20,
    default_tp_enabled: true,
    default_tp_type: 'pips',
    default_tp_value: 40,
    hotkey_buy: 'B',
    hotkey_sell: 'S',
    hotkey_close_all: 'X',
    sound_enabled: true,
    confirmation_required: false
  })

  // UI state
  const [selectedLot, setSelectedLot] = useState(0.01)
  const [showSettings, setShowSettings] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [loading, setLoading] = useState(false)
  const [executing, setExecuting] = useState(null)
  const [lastExecution, setLastExecution] = useState(null)
  const [favorites, setFavorites] = useState([])
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: null })

  // Load settings on mount
  useEffect(() => {
    loadSettings()
    loadFavorites()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await api.get('/quick-trading/settings')
      if (response.data) {
        setSettings(prev => ({ ...prev, ...response.data }))
        setSelectedLot(parseFloat(response.data.default_lot_size) || 0.01)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  const loadFavorites = async () => {
    try {
      const response = await api.get('/quick-trading/favorites')
      const data = response.data
      if (Array.isArray(data)) {
        setFavorites(data)
      } else if (data && Array.isArray(data.favorites)) {
        setFavorites(data.favorites)
      } else {
        setFavorites([])
      }
    } catch (error) {
      console.error('Failed to load favorites:', error)
      setFavorites([])
    }
  }

  const saveSettings = async () => {
    try {
      await api.put('/quick-trading/settings', settings)
      setShowSettings(false)
      toast.success('Settings saved successfully')
    } catch (error) {
      toast.error('Failed to save settings')
    }
  }

  const playSound = (type) => {
    if (!settings.sound_enabled) return
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      if (type === 'buy') {
        oscillator.frequency.value = 800
        oscillator.type = 'sine'
      } else if (type === 'sell') {
        oscillator.frequency.value = 400
        oscillator.type = 'sine'
      } else if (type === 'error') {
        oscillator.frequency.value = 200
        oscillator.type = 'square'
      }

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.1)
    } catch (e) {
      console.log('Sound not supported')
    }
  }

  const executeOrder = useCallback(async (side) => {
    if (!settings.one_click_enabled) {
      toast.error('Enable One-Click Trading first')
      return
    }

    if (settings.confirmation_required && !confirmDialog.open) {
      setConfirmDialog({ open: true, type: side })
      return
    }

    setExecuting(side)
    setLoading(true)

    const startTime = Date.now()

    try {
      const orderData = {
        symbol,
        side,
        lot_size: selectedLot,
        challenge_id: challengeId,
        sl_pips: settings.default_sl_enabled ? settings.default_sl_value : null,
        tp_pips: settings.default_tp_enabled ? settings.default_tp_value : null
      }

      const response = await api.post('/quick-trading/execute', orderData)

      const executionTime = Date.now() - startTime
      setLastExecution({
        side,
        lot: selectedLot,
        price: response.data.price || currentPrice,
        time: executionTime,
        timestamp: new Date()
      })

      playSound(side)
      toast.success(`${side.toUpperCase()} ${selectedLot} ${symbol} @ ${response.data.price || currentPrice} (${executionTime}ms)`)
    } catch (error) {
      playSound('error')
      toast.error(error.response?.data?.error || 'Order execution failed')
    } finally {
      setExecuting(null)
      setLoading(false)
      setConfirmDialog({ open: false, type: null })
    }
  }, [settings, selectedLot, symbol, challengeId, currentPrice, confirmDialog.open])

  const closeAllPositions = useCallback(async () => {
    if (!settings.one_click_enabled) {
      toast.error('One-click trading is disabled')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/quick-trading/close-all', {
        challenge_id: challengeId,
        symbol: symbol
      })
      toast.success(`Closed ${response.data.closed_count} positions`)
    } catch (error) {
      toast.error('Failed to close positions')
    } finally {
      setLoading(false)
    }
  }, [settings.one_click_enabled, challengeId, symbol])

  const reversePosition = async () => {
    if (!settings.one_click_enabled) {
      toast.error('One-click trading is disabled')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/quick-trading/reverse', {
        challenge_id: challengeId,
        symbol: symbol,
        lot_size: selectedLot
      })
      toast.success(`Position reversed: ${response.data.new_side}`)
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reverse position')
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = async () => {
    try {
      const favList = Array.isArray(favorites) ? favorites : []
      if (favList.includes(symbol)) {
        await api.delete(`/quick-trading/favorites/${symbol}`)
        setFavorites(favList.filter(s => s !== symbol))
      } else {
        await api.post('/quick-trading/favorites', { symbol })
        setFavorites([...favList, symbol])
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }

  // Hotkey handlers
  const handleBuy = useCallback(() => executeOrder('buy'), [executeOrder])
  const handleSell = useCallback(() => executeOrder('sell'), [executeOrder])
  const handleCloseAll = useCallback(() => closeAllPositions(), [closeAllPositions])

  // Register hotkeys
  useTradingHotkeys({
    onBuy: handleBuy,
    onSell: handleSell,
    onCloseAll: handleCloseAll,
    enabled: settings.one_click_enabled,
    hotkeys: {
      buy: settings.hotkey_buy,
      sell: settings.hotkey_sell,
      closeAll: settings.hotkey_close_all,
      cancelOrders: 'C'
    }
  })

  const quickLots = [
    settings.quick_lot_1,
    settings.quick_lot_2,
    settings.quick_lot_3,
    settings.quick_lot_4
  ]

  const isFavorite = Array.isArray(favorites) && favorites.includes(symbol)

  return (
    <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-dark-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/20 rounded-lg">
            <Zap className="text-orange-400" size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-white">One-Click Trading</h3>
            <p className="text-xs text-gray-500">Instant execution</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFavorite}
            className={`p-2 rounded-lg transition-colors ${isFavorite ? 'text-yellow-400' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Star size={18} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-200 transition-colors"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Enable Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard size={16} className={settings.one_click_enabled ? 'text-primary' : 'text-gray-500'} />
            <span className={`text-sm font-medium ${settings.one_click_enabled ? 'text-primary' : 'text-gray-500'}`}>
              {settings.one_click_enabled ? 'ONE-CLICK ENABLED' : 'One-Click Disabled'}
            </span>
          </div>
          <button
            onClick={() => setSettings({ ...settings, one_click_enabled: !settings.one_click_enabled })}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              settings.one_click_enabled ? 'bg-primary' : 'bg-dark-300'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                settings.one_click_enabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Warning if disabled */}
        {!settings.one_click_enabled && (
          <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <AlertTriangle size={16} className="text-amber-500" />
            <span className="text-xs text-amber-500">Enable one-click trading to use hotkeys and instant execution</span>
          </div>
        )}

        {/* Symbol & Price Display */}
        <div className="text-center py-4">
          <div className="text-xl font-bold text-primary mb-1">{symbol}</div>
          <div className="text-3xl font-bold text-white font-mono">
            {typeof currentPrice === 'number' ? currentPrice.toFixed(5) : currentPrice}
          </div>
        </div>

        {/* Quick Lot Selection */}
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Lot Size</label>
          <div className="grid grid-cols-4 gap-2 mb-2">
            {quickLots.map((lot, index) => (
              <button
                key={index}
                onClick={() => setSelectedLot(parseFloat(lot))}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  selectedLot === parseFloat(lot)
                    ? 'bg-primary text-black'
                    : 'bg-dark-200 text-gray-300 hover:bg-dark-300'
                }`}
              >
                {lot}
              </button>
            ))}
          </div>
          <input
            type="number"
            value={selectedLot}
            onChange={(e) => setSelectedLot(parseFloat(e.target.value) || 0.01)}
            step="0.01"
            min="0.01"
            className="w-full px-4 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white text-center font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Buy/Sell Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => executeOrder('buy')}
            disabled={!settings.one_click_enabled || loading}
            className={`relative py-6 rounded-xl font-bold text-lg transition-all ${
              settings.one_click_enabled
                ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg shadow-green-500/20'
                : 'bg-dark-300 text-gray-600 cursor-not-allowed'
            }`}
          >
            {executing === 'buy' ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
            ) : (
              <div className="flex items-center justify-center gap-2">
                <TrendingUp size={20} />
                <span>BUY</span>
              </div>
            )}
            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs opacity-60">
              [{settings.hotkey_buy}]
            </span>
          </button>

          <button
            onClick={() => executeOrder('sell')}
            disabled={!settings.one_click_enabled || loading}
            className={`relative py-6 rounded-xl font-bold text-lg transition-all ${
              settings.one_click_enabled
                ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/20'
                : 'bg-dark-300 text-gray-600 cursor-not-allowed'
            }`}
          >
            {executing === 'sell' ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
            ) : (
              <div className="flex items-center justify-center gap-2">
                <TrendingDown size={20} />
                <span>SELL</span>
              </div>
            )}
            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs opacity-60">
              [{settings.hotkey_sell}]
            </span>
          </button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={closeAllPositions}
            disabled={!settings.one_click_enabled || loading}
            className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X size={16} />
            <span className="text-sm font-medium">Close All [{settings.hotkey_close_all}]</span>
          </button>
          <button
            onClick={reversePosition}
            disabled={!settings.one_click_enabled || loading}
            className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={16} />
            <span className="text-sm font-medium">Reverse</span>
          </button>
        </div>

        {/* Risk Settings Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between py-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <span className="flex items-center gap-2">
            <Shield size={14} />
            Risk Settings
          </span>
          {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {/* Advanced Options */}
        {showAdvanced && (
          <div className="p-3 bg-dark-200/50 rounded-lg space-y-3">
            {/* Stop Loss */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSettings({ ...settings, default_sl_enabled: !settings.default_sl_enabled })}
                  className={`w-8 h-4 rounded-full transition-colors ${
                    settings.default_sl_enabled ? 'bg-red-500' : 'bg-dark-300'
                  }`}
                >
                  <span
                    className={`block w-3 h-3 rounded-full bg-white transition-transform ${
                      settings.default_sl_enabled ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
                <span className="text-xs text-gray-400">Stop Loss</span>
              </div>
              {settings.default_sl_enabled && (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={settings.default_sl_value}
                    onChange={(e) => setSettings({ ...settings, default_sl_value: parseFloat(e.target.value) })}
                    className="w-16 px-2 py-1 bg-dark-300 border border-dark-200 rounded text-white text-xs text-center"
                  />
                  <span className="text-xs text-gray-500">pips</span>
                </div>
              )}
            </div>

            {/* Take Profit */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSettings({ ...settings, default_tp_enabled: !settings.default_tp_enabled })}
                  className={`w-8 h-4 rounded-full transition-colors ${
                    settings.default_tp_enabled ? 'bg-green-500' : 'bg-dark-300'
                  }`}
                >
                  <span
                    className={`block w-3 h-3 rounded-full bg-white transition-transform ${
                      settings.default_tp_enabled ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
                <span className="text-xs text-gray-400">Take Profit</span>
              </div>
              {settings.default_tp_enabled && (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={settings.default_tp_value}
                    onChange={(e) => setSettings({ ...settings, default_tp_value: parseFloat(e.target.value) })}
                    className="w-16 px-2 py-1 bg-dark-300 border border-dark-200 rounded text-white text-xs text-center"
                  />
                  <span className="text-xs text-gray-500">pips</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Last Execution Info */}
        {lastExecution && (
          <div className="p-3 bg-dark-200/50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Last Execution</div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                lastExecution.side === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {lastExecution.side.toUpperCase()}
              </span>
              <span className="text-sm text-white">
                {lastExecution.lot} @ {lastExecution.price.toFixed(5)}
              </span>
              <span className="ml-auto px-2 py-0.5 rounded bg-dark-300 text-xs text-gray-400">
                {lastExecution.time}ms
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
          <div className="relative bg-dark-100 rounded-xl border border-dark-200 w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Settings size={20} />
                Quick Trading Settings
              </h3>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-dark-200 rounded-lg">
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Quick Lot Sizes */}
              <div>
                <label className="text-sm font-medium text-gray-400 mb-2 block">Quick Lot Sizes</label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((n) => (
                    <input
                      key={n}
                      type="number"
                      value={settings[`quick_lot_${n}`]}
                      onChange={(e) => setSettings({ ...settings, [`quick_lot_${n}`]: parseFloat(e.target.value) })}
                      step="0.01"
                      min="0.01"
                      className="px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white text-center text-sm"
                      placeholder={`Lot ${n}`}
                    />
                  ))}
                </div>
              </div>

              {/* Hotkeys */}
              <div>
                <label className="text-sm font-medium text-gray-400 mb-2 block">Hotkeys</label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Buy</label>
                    <input
                      type="text"
                      value={settings.hotkey_buy}
                      onChange={(e) => setSettings({ ...settings, hotkey_buy: e.target.value.toUpperCase().charAt(0) })}
                      maxLength={1}
                      className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white text-center font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Sell</label>
                    <input
                      type="text"
                      value={settings.hotkey_sell}
                      onChange={(e) => setSettings({ ...settings, hotkey_sell: e.target.value.toUpperCase().charAt(0) })}
                      maxLength={1}
                      className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white text-center font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Close All</label>
                    <input
                      type="text"
                      value={settings.hotkey_close_all}
                      onChange={(e) => setSettings({ ...settings, hotkey_close_all: e.target.value.toUpperCase().charAt(0) })}
                      maxLength={1}
                      className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white text-center font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Preferences */}
              <div>
                <label className="text-sm font-medium text-gray-400 mb-2 block">Preferences</label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {settings.sound_enabled ? <Volume2 size={16} className="text-gray-400" /> : <VolumeX size={16} className="text-gray-400" />}
                      <span className="text-sm text-gray-300">Sound Feedback</span>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, sound_enabled: !settings.sound_enabled })}
                      className={`w-10 h-5 rounded-full transition-colors ${
                        settings.sound_enabled ? 'bg-primary' : 'bg-dark-300'
                      }`}
                    >
                      <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                        settings.sound_enabled ? 'translate-x-5' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Require Confirmation</span>
                    <button
                      onClick={() => setSettings({ ...settings, confirmation_required: !settings.confirmation_required })}
                      className={`w-10 h-5 rounded-full transition-colors ${
                        settings.confirmation_required ? 'bg-primary' : 'bg-dark-300'
                      }`}
                    >
                      <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                        settings.confirmation_required ? 'translate-x-5' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 px-4 py-2 bg-dark-200 text-white rounded-lg hover:bg-dark-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveSettings}
                className="flex-1 px-4 py-2 bg-primary text-black rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDialog({ open: false, type: null })} />
          <div className="relative bg-dark-100 rounded-xl border border-dark-200 w-full max-w-sm p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-4">
              Confirm {confirmDialog.type?.toUpperCase()} Order
            </h3>
            <p className="text-gray-300 mb-2">
              Execute {confirmDialog.type?.toUpperCase()} {selectedLot} {symbol}?
            </p>
            {settings.default_sl_enabled && (
              <p className="text-sm text-gray-500">Stop Loss: {settings.default_sl_value} pips</p>
            )}
            {settings.default_tp_enabled && (
              <p className="text-sm text-gray-500">Take Profit: {settings.default_tp_value} pips</p>
            )}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setConfirmDialog({ open: false, type: null })}
                className="flex-1 px-4 py-2 bg-dark-200 text-white rounded-lg hover:bg-dark-300"
              >
                Cancel
              </button>
              <button
                onClick={() => executeOrder(confirmDialog.type)}
                className={`flex-1 px-4 py-2 rounded-lg font-medium text-white ${
                  confirmDialog.type === 'buy' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                Confirm {confirmDialog.type?.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OneClickPanel
