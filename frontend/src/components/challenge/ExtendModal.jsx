import React, { useState, useEffect } from 'react';
import { X, Clock, AlertTriangle, Check, DollarSign, Calendar } from 'lucide-react';
import api from '../../services/api';

const ExtendModal = ({ isOpen, onClose, challenge, onSuccess }) => {
  const [pricing, setPricing] = useState(null);
  const [selectedDays, setSelectedDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && challenge) {
      fetchPricing(selectedDays);
    }
  }, [isOpen, challenge, selectedDays]);

  const fetchPricing = async (days) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/api/challenges/${challenge.id}/extend/price?days=${days}`);
      setPricing(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load pricing');
    } finally {
      setLoading(false);
    }
  };

  const handleExtend = async () => {
    try {
      setProcessing(true);
      setError(null);
      const response = await api.post(`/api/challenges/${challenge.id}/extend`, {
        days: selectedDays
      });
      onSuccess?.(response.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to extend challenge');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Extend Challenge</h2>
                <p className="text-white/80 text-sm">Add more time to complete</p>
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
          {loading && !pricing ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <p className="text-red-500">{error}</p>
              <button
                onClick={() => fetchPricing(selectedDays)}
                className="mt-4 text-blue-500 hover:underline"
              >
                Try again
              </button>
            </div>
          ) : pricing && (
            <>
              {/* Extension Options */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Select extension period:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {pricing.extension_options?.map((option) => (
                    <button
                      key={option.days}
                      onClick={() => setSelectedDays(option.days)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedDays === option.days
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                      }`}
                    >
                      <p className={`font-bold text-lg ${
                        selectedDays === option.days
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {option.days} Days
                      </p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        ${option.price}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Current Dates */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">Current End Date</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatDate(pricing.current_end_date)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-green-500" />
                    <span className="text-green-700 dark:text-green-400">New End Date</span>
                  </div>
                  <span className="font-semibold text-green-700 dark:text-green-400">
                    {formatDate(pricing.new_end_date)}
                  </span>
                </div>
              </div>

              {/* Pricing Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 dark:text-gray-400">
                    Extension ({selectedDays} days)
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ${pricing.pricing.final_price?.toLocaleString()}
                  </span>
                </div>
                <hr className="border-gray-200 dark:border-gray-600 my-3" />
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900 dark:text-white">Total</span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    ${pricing.pricing.final_price?.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-2 mb-6">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">What you get:</p>
                <ul className="space-y-2">
                  {[
                    `${selectedDays} additional days to complete`,
                    'Keep all your current progress',
                    'Keep all your trades',
                    'More time to hit your targets'
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
                  onClick={handleExtend}
                  disabled={processing}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all disabled:opacity-50"
                >
                  {processing ? (
                    <Clock className="w-5 h-5 animate-spin" />
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

export default ExtendModal;
