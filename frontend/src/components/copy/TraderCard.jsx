import React from 'react';
import { Link } from 'react-router-dom';

const TraderCard = ({ trader, onStartCopy, onStopCopy }) => {
  const { profile, statistics, master_settings, is_copying } = trader;

  const getWinRateColor = (rate) => {
    if (rate >= 70) return 'text-green-400';
    if (rate >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getProfitColor = (profit) => {
    return profit >= 0 ? 'text-green-400' : 'text-red-400';
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500/50 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <Link to={`/trader/${profile.user_id}`} className="flex items-center gap-3 hover:opacity-80">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.display_name} className="w-12 h-12 rounded-full" />
            ) : (
              <span className="text-white font-bold text-lg">
                {profile.display_name?.charAt(0) || 'T'}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-white font-semibold">{profile.display_name}</h3>
            <p className="text-gray-400 text-sm">@{profile.username}</p>
          </div>
        </Link>
        {profile.is_verified && (
          <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-xs flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Verified
          </span>
        )}
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">{profile.bio}</p>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gray-700/50 rounded-lg p-3 text-center">
          <p className={`text-lg font-bold ${getWinRateColor(statistics?.win_rate || 0)}`}>
            {(statistics?.win_rate || 0).toFixed(1)}%
          </p>
          <p className="text-gray-400 text-xs">Win Rate</p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-3 text-center">
          <p className={`text-lg font-bold ${getProfitColor(statistics?.net_profit || 0)}`}>
            ${(statistics?.net_profit || 0).toLocaleString()}
          </p>
          <p className="text-gray-400 text-xs">Total Profit</p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-white">
            {statistics?.total_trades || 0}
          </p>
          <p className="text-gray-400 text-xs">Trades</p>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="flex items-center justify-between text-sm mb-4">
        <div className="flex items-center gap-4">
          <span className="text-gray-400">
            <span className="text-white font-medium">{profile.copier_count || 0}</span> copiers
          </span>
          <span className="text-gray-400">
            <span className="text-white font-medium">{profile.follower_count || 0}</span> followers
          </span>
        </div>
        {master_settings && (
          <span className="text-yellow-400">
            {master_settings.performance_fee_percent}% fee
          </span>
        )}
      </div>

      {/* Risk Metrics */}
      <div className="flex items-center gap-2 mb-4">
        <span className="bg-gray-700 px-2 py-1 rounded text-xs text-gray-300">
          Max DD: {statistics?.max_drawdown?.toFixed(1) || 0}%
        </span>
        <span className="bg-gray-700 px-2 py-1 rounded text-xs text-gray-300">
          Sharpe: {statistics?.sharpe_ratio?.toFixed(2) || 'N/A'}
        </span>
        {master_settings?.minimum_copy_amount && (
          <span className="bg-gray-700 px-2 py-1 rounded text-xs text-gray-300">
            Min: ${master_settings.minimum_copy_amount}
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {is_copying ? (
          <>
            <button
              onClick={() => onStopCopy(profile.user_id)}
              className="flex-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 py-2 rounded-lg font-medium transition-colors"
            >
              Stop Copying
            </button>
            <Link
              to={`/copy-trading/settings/${profile.user_id}`}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Settings
            </Link>
          </>
        ) : (
          <button
            onClick={() => onStartCopy(trader)}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-2 rounded-lg font-medium transition-all"
          >
            Start Copying
          </button>
        )}
        <Link
          to={`/trader/${profile.user_id}`}
          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          View
        </Link>
      </div>
    </div>
  );
};

export default TraderCard;
