import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Info, Loader2, X } from 'lucide-react';
import api from '../../services/api';

const TrailingStopForm = ({ symbol, side, onClose, onSuccess, positionId = null }) => {
  const [formData, setFormData] = useState({
    quantity: '',
    trailType: 'amount',
    trailAmount: '',
    trailPercent: '',
    activationPrice: '',
    expiresInHours: '24'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.quantity) {
      setError('Quantity is required');
      return;
    }

    if (formData.trailType === 'amount' && !formData.trailAmount) {
      setError('Trail amount is required');
      return;
    }

    if (formData.trailType === 'percent' && !formData.trailPercent) {
      setError('Trail percent is required');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        symbol,
        side,
        quantity: parseFloat(formData.quantity),
        trail_type: formData.trailType,
        position_id: positionId
      };

      if (formData.trailType === 'amount') {
        payload.trail_amount = parseFloat(formData.trailAmount);
      } else {
        payload.trail_percent = parseFloat(formData.trailPercent);
      }

      if (formData.activationPrice) {
        payload.activation_price = parseFloat(formData.activationPrice);
      }

      if (formData.expiresInHours) {
        payload.expires_in_hours = parseInt(formData.expiresInHours);
      }

      await api.post('/orders/trailing-stop', payload);

      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create trailing stop order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1a1a2e] rounded-xl border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${side === 'sell' ? 'bg-red-500/20' : 'bg-green-500/20'} flex items-center justify-center`}>
            {side === 'sell' ? (
              <TrendingDown className="w-5 h-5 text-red-400" />
            ) : (
              <TrendingUp className="w-5 h-5 text-green-400" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Trailing Stop Order</h3>
            <p className="text-sm text-gray-400">{symbol} - {side.toUpperCase()}</p>
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
            <p className="font-medium mb-1">How Trailing Stop Works</p>
            <p className="text-blue-300/70">
              The stop price follows the market price at a set distance. When the market moves in your favor,
              the stop follows. When it reverses by the trail amount, the order triggers.
            </p>
          </div>
        </div>
      </div>

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

        {/* Trail Type */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Trail Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, trailType: 'amount' }))}
              className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                formData.trailType === 'amount'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Fixed Amount
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, trailType: 'percent' }))}
              className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                formData.trailType === 'percent'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Percentage
            </button>
          </div>
        </div>

        {/* Trail Amount/Percent */}
        {formData.trailType === 'amount' ? (
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Trail Amount (Points/Pips)
            </label>
            <input
              type="number"
              name="trailAmount"
              value={formData.trailAmount}
              onChange={handleChange}
              step="0.1"
              min="0.1"
              placeholder="10.0"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Trail Percent (%)
            </label>
            <input
              type="number"
              name="trailPercent"
              value={formData.trailPercent}
              onChange={handleChange}
              step="0.1"
              min="0.1"
              max="50"
              placeholder="1.0"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        )}

        {/* Activation Price (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Activation Price (Optional)
          </label>
          <input
            type="number"
            name="activationPrice"
            value={formData.activationPrice}
            onChange={handleChange}
            step="0.00001"
            placeholder="Price to start trailing"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Leave empty to start trailing immediately
          </p>
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
          className={`w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
            side === 'sell'
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
          } disabled:opacity-50`}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating Order...
            </>
          ) : (
            <>
              Create Trailing Stop
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default TrailingStopForm;
