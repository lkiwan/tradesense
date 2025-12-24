import React, { useState, useEffect } from 'react';
import {
  Layers, TrendingUp, TrendingDown, Target, ShieldAlert,
  Info, Loader2, X, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import api from '../../services/api';

const BracketOrderForm = ({ symbol, onClose, onSuccess, currentPrice = 0 }) => {
  const [formData, setFormData] = useState({
    side: 'buy',
    quantity: '',
    entryType: 'market',
    entryPrice: '',
    takeProfitPrice: '',
    stopLossPrice: '',
    trailingStopEnabled: false,
    trailingStopDistance: '',
    expiresInHours: '24'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [riskReward, setRiskReward] = useState(null);

  // Calculate risk/reward when prices change
  useEffect(() => {
    const entry = formData.entryType === 'market' ? currentPrice : parseFloat(formData.entryPrice);
    const tp = parseFloat(formData.takeProfitPrice);
    const sl = parseFloat(formData.stopLossPrice);

    if (entry && tp && sl) {
      let risk, reward;
      if (formData.side === 'buy') {
        risk = entry - sl;
        reward = tp - entry;
      } else {
        risk = sl - entry;
        reward = entry - tp;
      }

      if (risk > 0) {
        setRiskReward({
          risk: Math.abs(risk),
          reward: Math.abs(reward),
          ratio: Math.abs(reward / risk)
        });
      } else {
        setRiskReward(null);
      }
    } else {
      setRiskReward(null);
    }
  }, [formData, currentPrice]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.quantity || !formData.takeProfitPrice || !formData.stopLossPrice) {
      setError('Quantity, Take Profit, and Stop Loss are required');
      return;
    }

    if (formData.entryType !== 'market' && !formData.entryPrice) {
      setError('Entry price is required for limit/stop orders');
      return;
    }

    const entry = formData.entryType === 'market' ? currentPrice : parseFloat(formData.entryPrice);
    const tp = parseFloat(formData.takeProfitPrice);
    const sl = parseFloat(formData.stopLossPrice);

    // Validate prices based on side
    if (formData.side === 'buy') {
      if (tp <= entry) {
        setError('Take profit must be above entry price for buy orders');
        return;
      }
      if (sl >= entry) {
        setError('Stop loss must be below entry price for buy orders');
        return;
      }
    } else {
      if (tp >= entry) {
        setError('Take profit must be below entry price for sell orders');
        return;
      }
      if (sl <= entry) {
        setError('Stop loss must be above entry price for sell orders');
        return;
      }
    }

    try {
      setLoading(true);

      const payload = {
        symbol,
        side: formData.side,
        quantity: parseFloat(formData.quantity),
        entry_type: formData.entryType,
        take_profit_price: tp,
        stop_loss_price: sl,
        trailing_stop_enabled: formData.trailingStopEnabled
      };

      if (formData.entryType !== 'market') {
        payload.entry_price = parseFloat(formData.entryPrice);
      }

      if (formData.trailingStopEnabled && formData.trailingStopDistance) {
        payload.trailing_stop_distance = parseFloat(formData.trailingStopDistance);
      }

      if (formData.expiresInHours) {
        payload.expires_in_hours = parseInt(formData.expiresInHours);
      }

      await api.post('/orders/bracket', payload);

      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create bracket order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1a1a2e] rounded-xl border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Layers className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Bracket Order</h3>
            <p className="text-sm text-gray-400">{symbol}</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-300">
            <p className="font-medium mb-1">Entry + Take Profit + Stop Loss</p>
            <p className="text-blue-300/70">
              Define your complete trade setup upfront. Once entry is filled, TP and SL become active automatically.
            </p>
          </div>
        </div>
      </div>

      {/* Current Price */}
      {currentPrice > 0 && (
        <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Current Price</span>
            <span className="text-xl font-bold text-white">{currentPrice.toFixed(5)}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Side Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Direction
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, side: 'buy' }))}
              className={`px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                formData.side === 'buy'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              Buy (Long)
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, side: 'sell' }))}
              className={`px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                formData.side === 'sell'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              <TrendingDown className="w-5 h-5" />
              Sell (Short)
            </button>
          </div>
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Quantity (Lots)
          </label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            step="0.01"
            min="0.01"
            placeholder="0.01"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Entry Type */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Entry Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['market', 'limit', 'stop'].map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, entryType: type }))}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.entryType === type
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Entry Price (for limit/stop) */}
        {formData.entryType !== 'market' && (
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Entry Price
            </label>
            <input
              type="number"
              name="entryPrice"
              value={formData.entryPrice}
              onChange={handleChange}
              step="0.00001"
              placeholder="Entry price"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        )}

        {/* Take Profit */}
        <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <ArrowUpRight className="w-5 h-5 text-green-400" />
            <label className="text-sm font-medium text-green-400">
              Take Profit Price
            </label>
          </div>
          <input
            type="number"
            name="takeProfitPrice"
            value={formData.takeProfitPrice}
            onChange={handleChange}
            step="0.00001"
            placeholder={formData.side === 'buy' ? 'Above entry' : 'Below entry'}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
          />
        </div>

        {/* Stop Loss */}
        <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            <label className="text-sm font-medium text-red-400">
              Stop Loss Price
            </label>
          </div>
          <input
            type="number"
            name="stopLossPrice"
            value={formData.stopLossPrice}
            onChange={handleChange}
            step="0.00001"
            placeholder={formData.side === 'buy' ? 'Below entry' : 'Above entry'}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
          />
        </div>

        {/* Risk/Reward Display */}
        {riskReward && (
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500 mb-1">Risk</p>
                <p className="text-red-400 font-semibold">{riskReward.risk.toFixed(5)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Reward</p>
                <p className="text-green-400 font-semibold">{riskReward.reward.toFixed(5)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">R:R Ratio</p>
                <p className={`font-bold ${riskReward.ratio >= 2 ? 'text-green-400' : riskReward.ratio >= 1 ? 'text-yellow-400' : 'text-red-400'}`}>
                  1:{riskReward.ratio.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Trailing Stop Option */}
        <div className="bg-gray-800/30 rounded-lg p-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="trailingStopEnabled"
              checked={formData.trailingStopEnabled}
              onChange={handleChange}
              className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500"
            />
            <div>
              <span className="text-white font-medium">Enable Trailing Stop</span>
              <p className="text-xs text-gray-500">Lock in profits as price moves in your favor</p>
            </div>
          </label>

          {formData.trailingStopEnabled && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Trail Distance (Points)
              </label>
              <input
                type="number"
                name="trailingStopDistance"
                value={formData.trailingStopDistance}
                onChange={handleChange}
                step="0.1"
                min="0.1"
                placeholder="10.0"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}
        </div>

        {/* Expiration */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Expires In
          </label>
          <select
            name="expiresInHours"
            value={formData.expiresInHours}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="1">1 Hour</option>
            <option value="4">4 Hours</option>
            <option value="24">24 Hours</option>
            <option value="48">48 Hours</option>
            <option value="168">1 Week</option>
            <option value="">Good Till Cancelled</option>
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${
            formData.side === 'buy'
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-red-500 hover:bg-red-600 text-white'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating Order...
            </>
          ) : (
            <>
              <Layers className="w-5 h-5" />
              Create Bracket Order
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default BracketOrderForm;
