import React, { useState } from 'react';
import { Wallet, Clock, CheckCircle, XCircle, AlertCircle, DollarSign, ChevronRight } from 'lucide-react';

const PayoutHistory = ({
  payouts = [],
  summary = {},
  loading = false,
  onRequestPayout,
  pendingBalance = 0,
  minimumPayout = 100
}) => {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentDetails, setPaymentDetails] = useState({});
  const [requesting, setRequesting] = useState(false);

  const statusConfig = {
    pending: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/20', label: 'Pending' },
    processing: { icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-500/20', label: 'Processing' },
    completed: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/20', label: 'Completed' },
    rejected: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/20', label: 'Rejected' }
  };

  const paymentMethods = [
    { id: 'bank_transfer', label: 'Bank Transfer', fields: ['bank_name', 'account_number', 'routing_number'] },
    { id: 'paypal', label: 'PayPal', fields: ['email'] },
    { id: 'wise', label: 'Wise', fields: ['email'] },
    { id: 'crypto', label: 'Cryptocurrency', fields: ['wallet_address', 'network'] }
  ];

  const handleRequestPayout = async () => {
    if (!paymentMethod) return;

    setRequesting(true);
    try {
      await onRequestPayout(paymentMethod, paymentDetails);
      setShowRequestModal(false);
      setPaymentMethod('');
      setPaymentDetails({});
    } catch (error) {
      console.error('Payout request failed:', error);
    } finally {
      setRequesting(false);
    }
  };

  const canRequestPayout = pendingBalance >= minimumPayout;

  if (loading) {
    return (
      <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-dark-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-dark-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Payout History</h3>
              <p className="text-sm text-gray-400">Minimum payout: ${minimumPayout}</p>
            </div>
          </div>
          <button
            onClick={() => setShowRequestModal(true)}
            disabled={!canRequestPayout}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              canRequestPayout
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-dark-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Request Payout
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-dark-200/50 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-1">Available Balance</p>
            <p className={`text-xl font-bold ${canRequestPayout ? 'text-green-500' : 'text-white'}`}>
              ${pendingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            {!canRequestPayout && (
              <p className="text-xs text-gray-500 mt-1">
                ${(minimumPayout - pendingBalance).toFixed(2)} more needed
              </p>
            )}
          </div>
          <div className="bg-dark-200/50 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-1">Total Paid Out</p>
            <p className="text-xl font-bold text-white">
              ${(summary.total_paid || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Payout List */}
        {payouts.length === 0 ? (
          <div className="text-center py-8">
            <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No payout history yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Request your first payout when you reach ${minimumPayout}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {payouts.map((payout) => {
              const status = statusConfig[payout.status] || statusConfig.pending;
              const StatusIcon = status.icon;

              return (
                <div
                  key={payout.id}
                  className="flex items-center justify-between p-4 bg-dark-200/50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 ${status.bg} rounded-full flex items-center justify-center`}>
                      <StatusIcon className={`w-5 h-5 ${status.color}`} />
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        ${payout.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-gray-400">
                        {payout.payment_method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        {' • '}
                        {new Date(payout.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${status.bg} ${status.color}`}>
                      {status.label}
                    </span>
                    {payout.transaction_id && (
                      <p className="text-xs text-gray-500 mt-1">
                        #{payout.transaction_id.slice(0, 8)}
                      </p>
                    )}
                    {payout.rejection_reason && (
                      <p className="text-xs text-red-400 mt-1 max-w-[200px] truncate">
                        {payout.rejection_reason}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Request Payout Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-white">
              <h2 className="text-xl font-bold">Request Payout</h2>
              <p className="text-white/80 text-sm">
                Available: ${pendingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Payment Method
                </label>
                <div className="space-y-2">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => {
                        setPaymentMethod(method.id);
                        setPaymentDetails({});
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                        paymentMethod === method.id
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                      }`}
                    >
                      <span className={`font-medium ${
                        paymentMethod === method.id
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {method.label}
                      </span>
                      <ChevronRight className={`w-5 h-5 ${
                        paymentMethod === method.id ? 'text-green-500' : 'text-gray-400'
                      }`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Details Fields */}
              {paymentMethod && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Payment Details
                  </label>
                  <div className="space-y-3">
                    {paymentMethods.find(m => m.id === paymentMethod)?.fields.map((field) => (
                      <input
                        key={field}
                        type="text"
                        placeholder={field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        value={paymentDetails[field] || ''}
                        onChange={(e) => setPaymentDetails(prev => ({
                          ...prev,
                          [field]: e.target.value
                        }))}
                        className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRequestModal(false);
                    setPaymentMethod('');
                    setPaymentDetails({});
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestPayout}
                  disabled={!paymentMethod || requesting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50"
                >
                  {requesting ? (
                    <Clock className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <DollarSign className="w-5 h-5" />
                      Request ${pendingBalance.toFixed(2)}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PayoutHistory;
