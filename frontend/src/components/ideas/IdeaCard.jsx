import React from 'react';
import { Link } from 'react-router-dom';

const IdeaCard = ({ idea, onLike, onBookmark, compact = false }) => {
  const getTypeColor = (type) => {
    switch (type) {
      case 'long': return 'bg-green-500/20 text-green-400';
      case 'short': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'long': return '↑';
      case 'short': return '↓';
      default: return '↔';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'reached_target': return 'bg-green-500/20 text-green-400';
      case 'stopped_out': return 'bg-red-500/20 text-red-400';
      case 'cancelled': return 'bg-gray-500/20 text-gray-400';
      case 'expired': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-blue-500/20 text-blue-400';
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (compact) {
    return (
      <Link
        to={`/trading-ideas/${idea.id}`}
        className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
      >
        <span className={`px-2 py-1 rounded text-xs font-bold ${getTypeColor(idea.idea_type)}`}>
          {getTypeIcon(idea.idea_type)} {idea.symbol}
        </span>
        <span className="text-white text-sm flex-1 truncate">{idea.title}</span>
        <span className="text-gray-500 text-xs">{formatTimeAgo(idea.created_at)}</span>
      </Link>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:border-blue-500/50 transition-all">
      {/* Chart Image */}
      {idea.chart_image_url && (
        <Link to={`/trading-ideas/${idea.id}`}>
          <div className="relative h-48 bg-gray-900">
            <img
              src={idea.chart_image_url}
              alt={idea.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2 flex gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${getTypeColor(idea.idea_type)}`}>
                {getTypeIcon(idea.idea_type)} {idea.idea_type.toUpperCase()}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(idea.status)}`}>
                {idea.status.replace('_', ' ')}
              </span>
            </div>
            <div className="absolute top-2 right-2">
              <span className="bg-black/60 px-2 py-1 rounded text-white text-sm font-bold">
                {idea.symbol}
              </span>
            </div>
          </div>
        </Link>
      )}

      <div className="p-4">
        {/* Author */}
        <div className="flex items-center gap-2 mb-3">
          <Link to={`/trader/${idea.author?.id}`} className="flex items-center gap-2 hover:opacity-80">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              {idea.author?.avatar_url ? (
                <img src={idea.author.avatar_url} alt="" className="w-8 h-8 rounded-full" />
              ) : (
                <span className="text-white text-sm font-bold">
                  {idea.author?.display_name?.charAt(0) || 'T'}
                </span>
              )}
            </div>
            <div>
              <p className="text-white text-sm font-medium flex items-center gap-1">
                {idea.author?.display_name}
                {idea.author?.is_verified && (
                  <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </p>
              <p className="text-gray-500 text-xs">{formatTimeAgo(idea.created_at)}</p>
            </div>
          </Link>
        </div>

        {/* Title & Symbol */}
        {!idea.chart_image_url && (
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded text-xs font-bold ${getTypeColor(idea.idea_type)}`}>
              {getTypeIcon(idea.idea_type)} {idea.symbol}
            </span>
            <span className={`px-2 py-1 rounded text-xs ${getStatusColor(idea.status)}`}>
              {idea.status.replace('_', ' ')}
            </span>
          </div>
        )}

        <Link to={`/trading-ideas/${idea.id}`}>
          <h3 className="text-white font-semibold mb-2 hover:text-blue-400 transition-colors line-clamp-2">
            {idea.title}
          </h3>
        </Link>

        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{idea.description}</p>

        {/* Trade Levels */}
        {idea.entry_price && (
          <div className="flex flex-wrap gap-2 mb-3 text-xs">
            <span className="bg-gray-700 px-2 py-1 rounded">
              Entry: <span className="text-white">${idea.entry_price}</span>
            </span>
            {idea.stop_loss && (
              <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded">
                SL: ${idea.stop_loss}
              </span>
            )}
            {idea.take_profit_1 && (
              <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded">
                TP: ${idea.take_profit_1}
              </span>
            )}
            {idea.risk_reward_ratio && (
              <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                R:R {idea.risk_reward_ratio}
              </span>
            )}
          </div>
        )}

        {/* Tags */}
        {idea.tags && idea.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {idea.tags.slice(0, 4).map(tag => (
              <span key={tag} className="text-xs text-gray-500 bg-gray-700/50 px-2 py-0.5 rounded">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Engagement */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-700">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onLike?.(idea.id)}
              className={`flex items-center gap-1 text-sm transition-colors ${
                idea.is_liked ? 'text-red-400' : 'text-gray-400 hover:text-red-400'
              }`}
            >
              <svg className="w-5 h-5" fill={idea.is_liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {idea.like_count}
            </button>
            <Link
              to={`/trading-ideas/${idea.id}`}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-blue-400 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {idea.comment_count}
            </Link>
            <span className="flex items-center gap-1 text-sm text-gray-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {idea.view_count}
            </span>
          </div>
          <button
            onClick={() => onBookmark?.(idea.id)}
            className={`p-1 rounded transition-colors ${
              idea.is_bookmarked ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'
            }`}
          >
            <svg className="w-5 h-5" fill={idea.is_bookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default IdeaCard;
