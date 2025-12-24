import React from 'react';

const CopyPerformance = ({ performance, byMaster }) => {
  if (!performance) return null;

  const { total_profit, total_loss, net_profit, total_trades, active_copies } = performance;

  const getProfitColor = (value) => {
    if (value > 0) return 'text-green-400';
    if (value < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm mb-1">Net Profit</p>
          <p className={`text-2xl font-bold ${getProfitColor(net_profit)}`}>
            ${net_profit?.toLocaleString() || '0'}
          </p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm mb-1">Total Profit</p>
          <p className="text-2xl font-bold text-green-400">
            ${total_profit?.toLocaleString() || '0'}
          </p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm mb-1">Total Loss</p>
          <p className="text-2xl font-bold text-red-400">
            ${total_loss?.toLocaleString() || '0'}
          </p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm mb-1">Copied Trades</p>
          <p className="text-2xl font-bold text-white">
            {total_trades || 0}
          </p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm mb-1">Active Copies</p>
          <p className="text-2xl font-bold text-blue-400">
            {active_copies || 0}
          </p>
        </div>
      </div>

      {/* Performance by Master */}
      {byMaster && byMaster.length > 0 && (
        <div className="bg-gray-800 rounded-xl border border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-white font-semibold">Performance by Trader</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-750">
                  <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Trader</th>
                  <th className="text-right text-gray-400 text-sm font-medium px-4 py-3">Status</th>
                  <th className="text-right text-gray-400 text-sm font-medium px-4 py-3">Trades</th>
                  <th className="text-right text-gray-400 text-sm font-medium px-4 py-3">Profit</th>
                  <th className="text-right text-gray-400 text-sm font-medium px-4 py-3">Loss</th>
                  <th className="text-right text-gray-400 text-sm font-medium px-4 py-3">Net</th>
                </tr>
              </thead>
              <tbody>
                {byMaster.map((master, idx) => (
                  <tr key={master.master_id} className={idx % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'}>
                    <td className="px-4 py-3">
                      <span className="text-white font-medium">{master.display_name}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        master.status === 'active'
                          ? 'bg-green-500/20 text-green-400'
                          : master.status === 'paused'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {master.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-300">
                      {master.total_trades}
                    </td>
                    <td className="px-4 py-3 text-right text-green-400">
                      ${master.profit?.toFixed(2) || '0'}
                    </td>
                    <td className="px-4 py-3 text-right text-red-400">
                      ${master.loss?.toFixed(2) || '0'}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${getProfitColor(master.net)}`}>
                      ${master.net?.toFixed(2) || '0'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!byMaster || byMaster.length === 0) && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 text-center">
          <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-gray-400">No copy trading activity yet</p>
          <p className="text-gray-500 text-sm mt-1">Start copying traders to see your performance here</p>
        </div>
      )}
    </div>
  );
};

export default CopyPerformance;
