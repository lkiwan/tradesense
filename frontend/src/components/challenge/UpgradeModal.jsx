import React, { useState, useEffect } from 'react';
import { X, TrendingUp, AlertTriangle, Check, DollarSign, ArrowRight, Sparkles } from 'lucide-react';
import api from '../../services/api';

const UpgradeModal = ({ isOpen, onClose, challenge, onSuccess }) => {
  const [pricing, setPricing] = useState(null);
  const [selectedSizeId, setSelectedSizeId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && challenge) {
      fetchPricing();
    }
  }, [isOpen, challenge]);

  useEffect(() => {
    if (pricing?.upgrade_options?.length > 0 && !selectedSizeId) {
      setSelectedSizeId(pricing.upgrade_options[0].account_size_id);
    }
  }, [pricing]);

  const fetchPricing = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/api/challenges/${challenge.id}/upgrade/price`);
      setPricing(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load upgrade options');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedOption = () => {
    return pricing?.upgrade_options?.find(opt => opt.account_size_id === selectedSizeId);
  };

  const handleUpgrade = async () => {
    if (!selectedSizeId) {
      setError('Please select an upgrade option');
      return;
    }

    try {
      setProcessing(true);
      setError(null);
      const response = await api.post(`/api/challenges/${challenge.id}/upgrade`, {
        target_size_id: selectedSizeId
      });
      onSuccess?.(response.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upgrade challenge');
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  const selectedOption = getSelectedOption();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Upgrade Challenge</h2>
                <p className="text-white/80 text-sm">Move to a larger account size</p>
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
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : error && !pricing ? (
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
          ) : pricing?.upgrade_options?.length === 0 ? (
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                You're already at the highest account size for this model!
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
              >
                Close
              </button>
            </div>
          ) : pricing && (
            <>
              {/* Current Account */}
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Current Account</p>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      ${pricing.current_balance?.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500">Balance</span>
                  </div>
                </div>
              </div>

              {/* Upgrade Options */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Upgrade to:
                </p>
                <div className="space-y-3">
                  {pricing.upgrade_options?.map((option) => (
                    <button
                      key={option.account_size_id}
                      onClick={() => setSelectedSizeId(option.account_size_id)}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        selectedSizeId === option.account_size_id
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            selectedSizeId === option.account_size_id
                              ? 'bg-purple-500 text-white'
                              : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                          }`}>
                            <TrendingUp className="w-5 h-5" />
                          </div>
                          <div>
                            <p className={`font-bold text-lg ${
                              selectedSizeId === option.account_size_id
                                ? 'text-purple-600 dark:text-purple-400'
                                : 'text-gray-900 dark:text-white'
                            }`}>
                              ${option.balance?.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-500">
                              {((option.balance / pricing.current_balance - 1) * 100).toFixed(0)}% increase
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            ${option.pricing.final_price?.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">Upgrade fee</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Option Details */}
              {selectedOption && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <ArrowRight className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-purple-800 dark:text-purple-200">Price Breakdown</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Price difference (${pricing.current_balance?.toLocaleString()} → ${selectedOption.balance?.toLocaleString()})
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        ${selectedOption.pricing.price_difference?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Upgrade fee ({selectedOption.pricing.fee_percent}%)
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        ${selectedOption.pricing.fee_amount?.toLocaleString()}
                      </span>
                    </div>
                    <hr className="border-gray-200 dark:border-gray-600 my-2" />
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900 dark:text-white">Total</span>
                      <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
                        ${selectedOption.pricing.final_price?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Info */}
              <div className="space-y-2 mb-6">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">What happens:</p>
                <ul className="space-y-2">
                  {[
                    'Your profit percentage is preserved',
                    'Balance scales proportionally',
                    'All trades remain intact',
                    'Phase progress is kept'
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Check className="w-4 h-4 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                  {error}
                </div>
              )}

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
                  onClick={handleUpgrade}
                  disabled={processing || !selectedSizeId}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
                >
                  {processing ? (
                    <TrendingUp className="w-5 h-5 animate-pulse" />
                  ) : (
                    <>
                      <DollarSign className="w-5 h-5" />
                      Pay ${selectedOption?.pricing.final_price?.toLocaleString() || '0'}
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

export default UpgradeModal;
