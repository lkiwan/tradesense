import {
  TrendingUp, TrendingDown, Target, Award,
  BarChart2, Calendar, Clock, Zap, Shield, Activity
} from 'lucide-react'

const StatCard = ({ icon: Icon, label, value, suffix = '', color = 'text-white', bgColor = 'bg-slate-800' }) => (
  <div className={`${bgColor} rounded-lg p-4`}>
    <div className="flex items-center gap-2 mb-2">
      <Icon className={`w-4 h-4 ${color}`} />
      <span className="text-xs text-slate-400">{label}</span>
    </div>
    <div className={`text-xl font-bold ${color}`}>
      {value}{suffix}
    </div>
  </div>
)

const StatisticsGrid = ({ statistics }) => {
  if (!statistics) {
    return (
      <div className="bg-slate-800 rounded-lg p-8 text-center">
        <BarChart2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">No trading statistics available yet.</p>
        <p className="text-sm text-slate-500 mt-2">
          Statistics will appear after completing trades.
        </p>
      </div>
    )
  }

  const profitColor = statistics.net_profit >= 0 ? 'text-green-400' : 'text-red-400'
  const winRateColor = statistics.win_rate >= 50 ? 'text-green-400' : statistics.win_rate >= 40 ? 'text-yellow-400' : 'text-red-400'
  const streakColor = statistics.current_streak > 0 ? 'text-green-400' : statistics.current_streak < 0 ? 'text-red-400' : 'text-slate-400'

  return (
    <div className="space-y-6">
      {/* Overview Section */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={Target}
            label="Total Trades"
            value={statistics.total_trades}
            color="text-cyan-400"
          />
          <StatCard
            icon={TrendingUp}
            label="Win Rate"
            value={statistics.win_rate}
            suffix="%"
            color={winRateColor}
          />
          <StatCard
            icon={statistics.net_profit >= 0 ? TrendingUp : TrendingDown}
            label="Net Profit"
            value={`$${Math.abs(statistics.net_profit).toLocaleString()}`}
            color={profitColor}
          />
          <StatCard
            icon={BarChart2}
            label="Profit Factor"
            value={statistics.profit_factor}
            color="text-cyan-400"
          />
        </div>
      </div>

      {/* Win/Loss Breakdown */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Win/Loss Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={TrendingUp}
            label="Winning Trades"
            value={statistics.winning_trades}
            color="text-green-400"
          />
          <StatCard
            icon={TrendingDown}
            label="Losing Trades"
            value={statistics.losing_trades}
            color="text-red-400"
          />
          <StatCard
            icon={TrendingUp}
            label="Total Profit"
            value={`$${statistics.total_profit.toLocaleString()}`}
            color="text-green-400"
          />
          <StatCard
            icon={TrendingDown}
            label="Total Loss"
            value={`$${statistics.total_loss.toLocaleString()}`}
            color="text-red-400"
          />
        </div>
      </div>

      {/* Risk Metrics */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Risk Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={Shield}
            label="Max Drawdown"
            value={statistics.max_drawdown}
            suffix="%"
            color={statistics.max_drawdown > 5 ? 'text-red-400' : 'text-green-400'}
          />
          <StatCard
            icon={Activity}
            label="Sharpe Ratio"
            value={statistics.sharpe_ratio}
            color={statistics.sharpe_ratio > 1 ? 'text-green-400' : 'text-yellow-400'}
          />
          <StatCard
            icon={Activity}
            label="Sortino Ratio"
            value={statistics.sortino_ratio}
            color={statistics.sortino_ratio > 1 ? 'text-green-400' : 'text-yellow-400'}
          />
          <StatCard
            icon={Target}
            label="Avg R:R"
            value={statistics.avg_risk_reward}
            color="text-cyan-400"
          />
        </div>
      </div>

      {/* Trade Averages */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Trade Averages</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={TrendingUp}
            label="Avg Winning Trade"
            value={`$${statistics.avg_profit_per_trade.toLocaleString()}`}
            color="text-green-400"
          />
          <StatCard
            icon={TrendingDown}
            label="Avg Losing Trade"
            value={`$${statistics.avg_loss_per_trade.toLocaleString()}`}
            color="text-red-400"
          />
          <StatCard
            icon={Award}
            label="Best Trade"
            value={`$${statistics.best_trade.toLocaleString()}`}
            color="text-green-400"
          />
          <StatCard
            icon={TrendingDown}
            label="Worst Trade"
            value={`$${Math.abs(statistics.worst_trade).toLocaleString()}`}
            color="text-red-400"
          />
        </div>
      </div>

      {/* Streaks & Consistency */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Streaks & Consistency</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={Zap}
            label="Current Streak"
            value={`${statistics.current_streak > 0 ? '+' : ''}${statistics.current_streak}`}
            color={streakColor}
          />
          <StatCard
            icon={TrendingUp}
            label="Best Win Streak"
            value={statistics.longest_win_streak}
            color="text-green-400"
          />
          <StatCard
            icon={TrendingDown}
            label="Worst Lose Streak"
            value={statistics.longest_lose_streak}
            color="text-red-400"
          />
          <StatCard
            icon={Calendar}
            label="Profitable Days"
            value={`${statistics.profitable_days_rate}%`}
            color={statistics.profitable_days_rate >= 50 ? 'text-green-400' : 'text-yellow-400'}
          />
        </div>
      </div>

      {/* Trading Activity */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Trading Activity</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={Calendar}
            label="Trading Days"
            value={statistics.trading_days}
            color="text-cyan-400"
          />
          <StatCard
            icon={Clock}
            label="Avg Trades/Day"
            value={statistics.avg_trades_per_day}
            color="text-cyan-400"
          />
          <StatCard
            icon={Activity}
            label="Most Traded"
            value={statistics.most_traded_pair || 'N/A'}
            color="text-cyan-400"
          />
          <StatCard
            icon={Award}
            label="Most Profitable"
            value={statistics.most_profitable_pair || 'N/A'}
            color="text-green-400"
          />
        </div>
      </div>

      {/* Last Updated */}
      {statistics.last_calculated && (
        <div className="text-xs text-slate-500 text-right">
          Last updated: {new Date(statistics.last_calculated).toLocaleString()}
        </div>
      )}
    </div>
  )
}

export default StatisticsGrid
