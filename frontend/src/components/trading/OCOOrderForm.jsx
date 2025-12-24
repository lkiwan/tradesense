import React, { useState } from 'react';
import { Target, ShieldAlert, Info, Loader2, X, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import api from '../../services/api';

const OCOOrderForm = ({ symbol, positionSide = 'long', onClose, onSuccess, positionId = null, currentPrice = 0 }) => {
  const [formData, setFormData] = useState({
    quantity: '',
    takeProfitPrice: '',
    stopLossPrice: '',
    expiresInHours: '24'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculatePnL = (price, type) => {
    if (!price || !currentPrice) return null;
    const diff = positionSide === 'long'
      ? (parseFloat(price) - currentPrice)
      : (currentPrice - parseFloat(price));
    return diff;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.quantity || !formData.takeProfitPrice || !formData.stopLossPrice) {
      setError('All fields are required');
      return;
    }

    // Validate prices based on position side
    const tp = parseFloat(formData.takeProfitPrice);
    const sl = parseFloat(formData.stopLossPrice);

    if (positionSide === 'long') {
      if (tp <= currentPrice) {
        setError('Take profit must be above current price for long positions');
        return;
      }
      if (sl >= currentPrice) {
        setError('Stop loss must be below current price for long positions');
        return;
      }
    } else {
      if (tp >= currentPrice) {
        setError('Take profit must be below current price for short positions');
        return;
      }
      if (sl <= currentPrice) {
        setError('Stop loss must be above current price for short positions');
        return;
      }
    }

    try {
      setLoading(true);

      const payload = {
        symbol,
        quantity: parseFloat(formData.quantity),
        position_side: positionSide,
        order1_price: tp, // Take Profit (Limit)
        order2_price: sl, // Stop Loss (Stop)
        position_id: positionId
      };

      if (formData.expiresInHours) {
        payload.expires_in_hours = parseInt(formData.expiresInHours);
      }

      await api.post('/orders/oco', payload);

      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create OCO order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1a1a2e] rounded-xl border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <Target className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">OCO Order</h3>
            <p className="text-sm text-gray-400">{symbol} - {positionSide.toUpperCase()} Position</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-purple-300">
            <p className="font-medium mb-1">One-Cancels-Other (OCO)</p>
            <p className="text-purple-300/70">
              Set both Take Profit and Stop Loss. When one triggers, the other is automatically cancelled.
            </p>
          </div>
        </div>
      </div>

      {/* Current Price Display */}
      {currentPrice > 0 && (
        <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Current Price</span>
            <span className="text-xl font-bold text-white">{currentPrice.toFixed(5)}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
            placeholder={positionSide === 'long' ? 'Above current price' : 'Below current price'}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
          />
          {formData.takeProfitPrice && currentPrice > 0 && (
            <div className="mt-2 text-sm">
              <span className="text-gray-400">Potential: </span>
              <span className={calculatePnL(formData.takeProfitPrice) >= 0 ? 'text-green-400' : 'text-red-400'}>
                {calculatePnL(formData.takeProfitPrice)?.toFixed(5)} points
              </span>
            </div>
          )}
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
            placeholder={positionSide === 'long' ? 'Below current price' : 'Above current price'}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
          />
          {formData.stopLossPrice && currentPrice > 0 && (
            <div className="mt-2 text-sm">
              <span className="text-gray-400">Risk: </span>
              <span className="text-red-400">
                {Math.abs(calculatePnL(formData.stopLossPrice) || 0).toFixed(5)} points
              </span>
            </div>
          )}
        </div>

        {/* Risk/Reward Display */}
        {formData.takeProfitPrice && formData.stopLossPrice && currentPrice > 0 && (
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Risk/Reward Ratio</span>
              <span className="text-lg font-bold text-white">
                1:{(Math.abs(calculatePnL(formData.takeProfitPrice)) / Math.abs(calculatePnL(formData.stopLossPrice))).toFixed(2)}
              </span>
            </div>
          </div>
        )}

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
          className="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating Order...
            </>
          ) : (
            <>
              <Target className="w-5 h-5" />
              Create OCO Order
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default OCOOrderForm;
