import React, { useState, useEffect } from 'react';
import { X, RefreshCw, AlertTriangle, Check, DollarSign } from 'lucide-react';
import api from '../../services/api';

const ResetModal = ({ isOpen, onClose, challenge, onSuccess }) => {
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && challenge) {
      fetchPricing();
    }
  }, [isOpen, challenge]);

  const fetchPricing = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/api/challenges/${challenge.id}/reset/price`);
      setPricing(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load pricing');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      setProcessing(true);
      setError(null);
      const response = await api.post(`/api/challenges/${challenge.id}/reset`);
      onSuccess?.(response.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset challenge');
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Reset Challenge</h2>
                <p className="text-white/80 text-sm">Start fresh with your challenge</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <p className="text-red-500">{error}</p>
              <button
                onClick={fetchPricing}
                className="mt-4 text-blue-500 hover:underline"
              >
                Try again
              </button>
            </div>
          ) : pricing && (
            <>
              {/* Warning */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">This action cannot be undone</p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      All your trades will be deleted and your balance will be reset to the initial amount.
                    </p>
                  </div>
                </div>
              </div>

              {/* Current Status */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-400">Current Balance</span>
                  <span className={`font-semibold ${
                    pricing.current_balance < pricing.pricing.reset_balance
                      ? 'text-red-500'
                      : 'text-green-500'
                  }`}>
                    ${pricing.current_balance?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-400">Reset To</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ${pricing.pricing.reset_balance?.toLocaleString() || challenge.initial_balance?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-400">Phase</span>
                  <span className="font-semibold text-gray-900 dark:text-white capitalize">
                    {pricing.phase} → Evaluation
                  </span>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Original Price</span>
                  <span className="text-gray-500 line-through">
                    ${pricing.pricing.original_price?.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-green-600 dark:text-green-400">
                    Discount ({pricing.pricing.discount_percent}%)
                  </span>
                  <span className="text-green-600 dark:text-green-400">
                    -${pricing.pricing.discount_amount?.toLocaleString()}
                  </span>
                </div>
                <hr className="border-gray-200 dark:border-gray-600 my-3" />
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900 dark:text-white">Total</span>
                  <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    ${pricing.pricing.final_price?.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* What You Get */}
              <div className="space-y-2 mb-6">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">What happens:</p>
                <ul className="space-y-2">
                  {[
                    'Balance reset to initial amount',
                    'All trades cleared',
                    'Phase reset to Evaluation',
                    'Trading days counter reset',
                    'Fresh start, same account'
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Check className="w-4 h-4 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={processing}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  disabled={processing}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50"
                >
                  {processing ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <DollarSign className="w-5 h-5" />
                      Pay ${pricing.pricing.final_price?.toLocaleString()}
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetModal;
