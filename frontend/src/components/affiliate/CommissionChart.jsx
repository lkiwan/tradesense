import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, DollarSign } from 'lucide-react';

const CommissionChart = ({ data = [], loading = false }) => {
  if (loading) {
    return (
      <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-dark-200 rounded w-1/3 mb-6"></div>
          <div className="h-64 bg-dark-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Calculate totals
  const totalEarnings = data.reduce((sum, d) => sum + d.amount, 0);
  const avgMonthly = data.length > 0 ? totalEarnings / data.length : 0;

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-100 border border-dark-200 rounded-lg p-3 shadow-xl">
          <p className="text-gray-400 text-sm mb-1">{label}</p>
          <p className="text-white font-bold text-lg">
            ${payload[0].value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Monthly Earnings</h3>
            <p className="text-sm text-gray-400">Last 12 months performance</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">
            ${totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-gray-400">Total Earnings</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-dark-200/50 rounded-lg p-4">
          <p className="text-xs text-gray-400 mb-1">Average Monthly</p>
          <p className="text-lg font-bold text-white">
            ${avgMonthly.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-dark-200/50 rounded-lg p-4">
          <p className="text-xs text-gray-400 mb-1">Best Month</p>
          <p className="text-lg font-bold text-green-500">
            ${Math.max(...data.map(d => d.amount), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                axisLine={{ stroke: '#374151' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
              <Bar
                dataKey="amount"
                fill="#10B981"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <DollarSign className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No earnings data yet</p>
              <p className="text-sm text-gray-500">Start referring to see your earnings chart</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommissionChart;
