import { motion } from 'framer-motion'
import { Flame, Trophy, TrendingDown, Zap } from 'lucide-react'
import AnimatedCounter from './AnimatedCounter'

/**
 * TradingStreaks - Win/Loss streak visualization
 *
 * @param {number} currentStreak - Current streak count (positive = wins, negative = losses)
 * @param {number} maxWinStreak - Best winning streak
 * @param {number} maxLossStreak - Worst losing streak
 * @param {Array} recentTrades - Recent trades [{ result: 'win' | 'loss' }]
 */
export default function TradingStreaks({
  currentStreak = 0,
  maxWinStreak = 0,
  maxLossStreak = 0,
  recentTrades = []
}) {
  const isWinning = currentStreak > 0
  const streakAbs = Math.abs(currentStreak)

  // Generate streak visualization (last 20 trades)
  const recentResults = recentTrades.slice(-20)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-gradient-to-br from-dark-100 to-dark-200 border border-dark-200 rounded-xl p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-lg flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          Trading Streaks
        </h3>
      </div>

      {/* Current streak */}
      <div className={`
        p-4 rounded-xl mb-4 relative overflow-hidden
        ${isWinning ? 'bg-green-500/10 border border-green-500/30' : currentStreak < 0 ? 'bg-red-500/10 border border-red-500/30' : 'bg-dark-300'}
      `}>
        {/* Animated glow for active streak */}
        {streakAbs >= 3 && (
          <motion.div
            className={`absolute inset-0 ${isWinning ? 'bg-green-400' : 'bg-red-400'}`}
            animate={{
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        )}

        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm mb-1">Current Streak</p>
            <div className="flex items-center gap-2">
              <span className={`text-3xl font-bold ${isWinning ? 'text-green-400' : currentStreak < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                <AnimatedCounter value={streakAbs} />
              </span>
              <span className={`text-lg ${isWinning ? 'text-green-400' : currentStreak < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                {isWinning ? 'Wins' : currentStreak < 0 ? 'Losses' : 'No streak'}
              </span>
            </div>
          </div>

          {/* Fire icon for hot streaks */}
          {streakAbs >= 3 && (
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatDelay: 1
              }}
            >
              <Flame className={`w-10 h-10 ${isWinning ? 'text-green-400' : 'text-red-400'}`} />
            </motion.div>
          )}
        </div>
      </div>

      {/* Best/Worst streaks */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-dark-300/50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-4 h-4 text-green-400" />
            <span className="text-gray-500 text-xs">Best Win Streak</span>
          </div>
          <p className="text-green-400 font-bold text-xl">
            <AnimatedCounter value={maxWinStreak} />
          </p>
        </div>

        <div className="p-3 bg-dark-300/50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <span className="text-gray-500 text-xs">Worst Loss Streak</span>
          </div>
          <p className="text-red-400 font-bold text-xl">
            <AnimatedCounter value={maxLossStreak} />
          </p>
        </div>
      </div>

      {/* Recent trades visualization */}
      {recentResults.length > 0 && (
        <div className="border-t border-dark-200 pt-4">
          <p className="text-gray-500 text-xs mb-2">Recent Trades</p>
          <div className="flex gap-1 flex-wrap">
            {recentResults.map((trade, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`
                  w-4 h-4 rounded-sm
                  ${trade.result === 'win' ? 'bg-green-500' : 'bg-red-500'}
                `}
                title={trade.result === 'win' ? 'Win' : 'Loss'}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs">
            <span className="text-gray-500">Last {recentResults.length} trades</span>
            <span className="text-gray-400">
              {recentResults.filter(t => t.result === 'win').length}W / {recentResults.filter(t => t.result === 'loss').length}L
            </span>
          </div>
        </div>
      )}

      {/* Streak milestones */}
      <div className="mt-4 pt-4 border-t border-dark-200">
        <p className="text-gray-500 text-xs mb-2">Streak Milestones</p>
        <div className="flex gap-2">
          {[3, 5, 10, 15, 20].map((milestone) => (
            <motion.div
              key={milestone}
              whileHover={{ scale: 1.1 }}
              className={`
                px-2 py-1 rounded-full text-xs font-medium
                ${maxWinStreak >= milestone
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-dark-300 text-gray-500'
                }
              `}
            >
              {milestone}+
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
