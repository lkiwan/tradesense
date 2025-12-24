import { useState } from 'react'
import {
  TrendingUp, TrendingDown, Clock, ChevronLeft, ChevronRight
} from 'lucide-react'

const TradeRow = ({ trade }) => {
  const isProfit = trade.profit >= 0

  return (
    <tr className="border-b border-slate-700/50 hover:bg-slate-800/50 transition-colors">
      <td className="py-3 px-4">
        <div className="font-medium text-white">{trade.symbol}</div>
      </td>
      <td className="py-3 px-4">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
          trade.direction === 'buy'
            ? 'bg-green-500/20 text-green-400'
            : 'bg-red-500/20 text-red-400'
        }`}>
          {trade.direction === 'buy' ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {trade.direction.toUpperCase()}
        </span>
      </td>
      <td className="py-3 px-4 text-slate-400">
        {trade.lot_size}
      </td>
      <td className="py-3 px-4 text-slate-300">
        {trade.entry_price?.toFixed(5)}
      </td>
      <td className="py-3 px-4 text-slate-300">
        {trade.exit_price?.toFixed(5)}
      </td>
      <td className="py-3 px-4">
        <span className={`font-medium ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
          {isProfit ? '+' : ''}${trade.profit?.toFixed(2)}
        </span>
        {trade.profit_pips && (
          <span className="text-xs text-slate-500 ml-1">
            ({trade.profit_pips} pips)
          </span>
        )}
      </td>
      <td className="py-3 px-4 text-slate-400 text-sm">
        {trade.closed_at ? new Date(trade.closed_at).toLocaleDateString() : '-'}
      </td>
    </tr>
  )
}

const TradeHistory = ({
  trades = [],
  pagination = {},
  onPageChange,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="bg-slate-800 rounded-lg p-8">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-700 rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (!trades || trades.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-8 text-center">
        <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">No trade history available.</p>
      </div>
    )
  }

  const { page = 1, pages = 1, total = 0 } = pagination

  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <h3 className="text-lg font-semibold text-white">Trade History</h3>
        <span className="text-sm text-slate-400">
          {total} total trades
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-slate-400 uppercase bg-slate-800/50">
              <th className="py-3 px-4">Symbol</th>
              <th className="py-3 px-4">Direction</th>
              <th className="py-3 px-4">Lot Size</th>
              <th className="py-3 px-4">Entry</th>
              <th className="py-3 px-4">Exit</th>
              <th className="py-3 px-4">Profit/Loss</th>
              <th className="py-3 px-4">Date</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade, index) => (
              <TradeRow key={index} trade={trade} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between p-4 border-t border-slate-700">
          <div className="text-sm text-slate-400">
            Page {page} of {pages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1}
              className="p-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 rounded-lg text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= pages}
              className="p-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 rounded-lg text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default TradeHistory
