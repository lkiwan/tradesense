import React, { useState } from 'react';

const CopySettingsModal = ({ trader, onClose, onConfirm }) => {
  const [settings, setSettings] = useState({
    copy_mode: 'proportional',
    copy_ratio: 1.0,
    fixed_lot_size: 0.1,
    fixed_amount: 100,
    max_lot_size: 1.0,
    max_open_trades: 10,
    max_daily_trades: 20,
    max_drawdown_percent: 20,
    stop_loss_adjustment: 0,
    take_profit_adjustment: 0,
    copy_buy: true,
    copy_sell: true
  });

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(settings);
  };

  const { profile, statistics, master_settings } = trader;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {profile.display_name?.charAt(0) || 'T'}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Copy {profile.display_name}</h2>
                <p className="text-gray-400 text-sm">Configure your copy settings</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Trader Stats Summary */}
        <div className="p-6 border-b border-gray-700 bg-gray-750">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-green-400 font-bold">{(statistics?.win_rate || 0).toFixed(1)}%</p>
              <p className="text-gray-400 text-xs">Win Rate</p>
            </div>
            <div className="text-center">
              <p className="text-white font-bold">{statistics?.total_trades || 0}</p>
              <p className="text-gray-400 text-xs">Total Trades</p>
            </div>
            <div className="text-center">
              <p className="text-yellow-400 font-bold">{master_settings?.performance_fee_percent || 20}%</p>
              <p className="text-gray-400 text-xs">Performance Fee</p>
            </div>
            <div className="text-center">
              <p className="text-blue-400 font-bold">${master_settings?.minimum_copy_amount || 100}</p>
              <p className="text-gray-400 text-xs">Min Amount</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Copy Mode */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Copy Mode</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'proportional', label: 'Proportional', desc: 'Match lot ratio' },
                { value: 'fixed_lot', label: 'Fixed Lot', desc: 'Same lot size' },
                { value: 'fixed_amount', label: 'Fixed Amount', desc: 'Risk per trade' }
              ].map(mode => (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => handleChange('copy_mode', mode.value)}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    settings.copy_mode === mode.value
                      ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                      : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <p className="font-medium">{mode.label}</p>
                  <p className="text-xs text-gray-400">{mode.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Mode-specific Settings */}
          {settings.copy_mode === 'proportional' && (
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Copy Ratio (e.g., 0.5 = half size, 2 = double)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="10"
                value={settings.copy_ratio}
                onChange={(e) => handleChange('copy_ratio', parseFloat(e.target.value))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {settings.copy_mode === 'fixed_lot' && (
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Fixed Lot Size
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="100"
                value={settings.fixed_lot_size}
                onChange={(e) => handleChange('fixed_lot_size', parseFloat(e.target.value))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {settings.copy_mode === 'fixed_amount' && (
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Fixed Amount per Trade ($)
              </label>
              <input
                type="number"
                step="10"
                min="10"
                value={settings.fixed_amount}
                onChange={(e) => handleChange('fixed_amount', parseFloat(e.target.value))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {/* Risk Management */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Max Lot Size
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={settings.max_lot_size}
                onChange={(e) => handleChange('max_lot_size', parseFloat(e.target.value))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Max Open Trades
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={settings.max_open_trades}
                onChange={(e) => handleChange('max_open_trades', parseInt(e.target.value))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Max Daily Trades
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={settings.max_daily_trades}
                onChange={(e) => handleChange('max_daily_trades', parseInt(e.target.value))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Max Drawdown (%)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={settings.max_drawdown_percent}
                onChange={(e) => handleChange('max_drawdown_percent', parseFloat(e.target.value))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Trade Direction */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Trade Direction
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.copy_buy}
                  onChange={(e) => handleChange('copy_buy', e.target.checked)}
                  className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-gray-300">Copy Buy Orders</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.copy_sell}
                  onChange={(e) => handleChange('copy_sell', e.target.checked)}
                  className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-gray-300">Copy Sell Orders</span>
              </label>
            </div>
          </div>

          {/* SL/TP Adjustments */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                SL Adjustment (pips)
              </label>
              <input
                type="number"
                step="1"
                value={settings.stop_loss_adjustment}
                onChange={(e) => handleChange('stop_loss_adjustment', parseInt(e.target.value))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
              <p className="text-gray-500 text-xs mt-1">+ widen, - tighten</p>
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                TP Adjustment (pips)
              </label>
              <input
                type="number"
                step="1"
                value={settings.take_profit_adjustment}
                onChange={(e) => handleChange('take_profit_adjustment', parseInt(e.target.value))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
              <p className="text-gray-500 text-xs mt-1">+ extend, - reduce</p>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-yellow-400 font-medium">Risk Warning</p>
                <p className="text-gray-400 text-sm">
                  Past performance does not guarantee future results. Copy trading involves risk.
                  Only invest what you can afford to lose.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 rounded-lg font-medium transition-all"
            >
              Start Copying
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CopySettingsModal;
