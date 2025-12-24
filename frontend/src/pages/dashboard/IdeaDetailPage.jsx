import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { CommentSection } from '../../components/ideas';

const IdeaDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [idea, setIdea] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentsPage, setCommentsPage] = useState(1);

  useEffect(() => {
    fetchIdea();
    fetchComments();
  }, [id]);

  const fetchIdea = async () => {
    try {
      const response = await api.get(`/ideas/${id}`);
      if (response.data.success) {
        setIdea(response.data.idea);
      }
    } catch (error) {
      console.error('Error fetching idea:', error);
      if (error.response?.status === 404) {
        navigate('/trading-ideas');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await api.get(`/ideas/${id}/comments`, {
        params: { page: commentsPage, per_page: 20 }
      });
      if (response.data.success) {
        setComments(response.data.comments);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleLike = async () => {
    try {
      const response = await api.post(`/ideas/${id}/like`);
      if (response.data.success) {
        setIdea({
          ...idea,
          is_liked: response.data.action === 'liked',
          like_count: response.data.like_count
        });
      }
    } catch (error) {
      console.error('Error liking:', error);
    }
  };

  const handleBookmark = async () => {
    try {
      const response = await api.post(`/ideas/${id}/bookmark`);
      if (response.data.success) {
        setIdea({
          ...idea,
          is_bookmarked: response.data.action === 'bookmarked',
          bookmark_count: response.data.bookmark_count
        });
      }
    } catch (error) {
      console.error('Error bookmarking:', error);
    }
  };

  const handleAddComment = async (data) => {
    try {
      const response = await api.post(`/ideas/${id}/comments`, data);
      if (response.data.success) {
        fetchComments();
        setIdea({ ...idea, comment_count: idea.comment_count + 1 });
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      await api.post(`/ideas/comments/${commentId}/like`);
      fetchComments();
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'long': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'short': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'reached_target': return 'bg-green-500 text-white';
      case 'stopped_out': return 'bg-red-500 text-white';
      case 'cancelled': return 'bg-gray-500 text-white';
      case 'expired': return 'bg-yellow-500 text-black';
      default: return 'bg-blue-500 text-white';
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-400">Idea not found</p>
        <Link to="/trading-ideas" className="text-blue-400 hover:underline mt-2 inline-block">
          Back to Ideas
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate('/trading-ideas')}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Ideas
      </button>

      {/* Main Card */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        {/* Chart Image */}
        {idea.chart_image_url && (
          <div className="relative">
            <img
              src={idea.chart_image_url}
              alt={idea.title}
              className="w-full max-h-96 object-contain bg-gray-900"
            />
          </div>
        )}

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-3 py-1 rounded-full text-sm font-bold border ${getTypeColor(idea.idea_type)}`}>
                  {idea.idea_type === 'long' ? '↑ LONG' : idea.idea_type === 'short' ? '↓ SHORT' : '↔ NEUTRAL'}
                </span>
                <span className="bg-gray-700 px-3 py-1 rounded-full text-white font-bold text-sm">
                  {idea.symbol}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(idea.status)}`}>
                  {idea.status.replace('_', ' ')}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white">{idea.title}</h1>
            </div>
          </div>

          {/* Author */}
          <Link
            to={`/trader/${idea.author?.id}`}
            className="flex items-center gap-3 mb-6 hover:opacity-80 transition-opacity"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              {idea.author?.avatar_url ? (
                <img src={idea.author.avatar_url} alt="" className="w-12 h-12 rounded-full" />
              ) : (
                <span className="text-white text-lg font-bold">
                  {idea.author?.display_name?.charAt(0) || 'T'}
                </span>
              )}
            </div>
            <div>
              <p className="text-white font-medium flex items-center gap-1">
                {idea.author?.display_name}
                {idea.author?.is_verified && (
                  <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </p>
              <p className="text-gray-500 text-sm">
                {new Date(idea.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </Link>

          {/* Trade Levels */}
          {idea.entry_price && (
            <div className="bg-gray-700/50 rounded-xl p-4 mb-6">
              <h3 className="text-gray-300 text-sm font-medium mb-3">Trade Setup</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-gray-500 text-xs mb-1">Entry</p>
                  <p className="text-white font-bold">${idea.entry_price}</p>
                </div>
                {idea.stop_loss && (
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Stop Loss</p>
                    <p className="text-red-400 font-bold">${idea.stop_loss}</p>
                  </div>
                )}
                {idea.take_profit_1 && (
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Take Profit 1</p>
                    <p className="text-green-400 font-bold">${idea.take_profit_1}</p>
                  </div>
                )}
                {idea.risk_reward_ratio && (
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Risk:Reward</p>
                    <p className="text-blue-400 font-bold">1:{idea.risk_reward_ratio}</p>
                  </div>
                )}
              </div>
              {(idea.take_profit_2 || idea.take_profit_3) && (
                <div className="flex gap-4 mt-3 pt-3 border-t border-gray-600">
                  {idea.take_profit_2 && (
                    <div>
                      <p className="text-gray-500 text-xs mb-1">TP2</p>
                      <p className="text-green-400 font-medium">${idea.take_profit_2}</p>
                    </div>
                  )}
                  {idea.take_profit_3 && (
                    <div>
                      <p className="text-gray-500 text-xs mb-1">TP3</p>
                      <p className="text-green-400 font-medium">${idea.take_profit_3}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-gray-300 text-sm font-medium mb-2">Analysis</h3>
            <p className="text-gray-300 whitespace-pre-wrap">{idea.description}</p>
          </div>

          {/* Technical Analysis */}
          {idea.technical_analysis && (
            <div className="mb-6">
              <h3 className="text-gray-300 text-sm font-medium mb-2">Technical Analysis</h3>
              <p className="text-gray-400 whitespace-pre-wrap">{idea.technical_analysis}</p>
            </div>
          )}

          {/* Tags */}
          {idea.tags && idea.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {idea.tags.map(tag => (
                <span key={tag} className="text-sm text-gray-400 bg-gray-700 px-3 py-1 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Confidence & Timeframe */}
          <div className="flex items-center gap-4 mb-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Timeframe:</span>
              <span className="text-white capitalize">{idea.timeframe}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Confidence:</span>
              <div className="flex items-center gap-1">
                <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      idea.confidence_level >= 70 ? 'bg-green-500'
                        : idea.confidence_level >= 40 ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${idea.confidence_level}%` }}
                  />
                </div>
                <span className="text-white">{idea.confidence_level}%</span>
              </div>
            </div>
          </div>

          {/* Engagement */}
          <div className="flex items-center justify-between py-4 border-t border-gray-700">
            <div className="flex items-center gap-6">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 transition-colors ${
                  idea.is_liked ? 'text-red-400' : 'text-gray-400 hover:text-red-400'
                }`}
              >
                <svg className="w-6 h-6" fill={idea.is_liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>{idea.like_count} Likes</span>
              </button>
              <span className="flex items-center gap-2 text-gray-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>{idea.comment_count} Comments</span>
              </span>
              <span className="flex items-center gap-2 text-gray-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>{idea.view_count} Views</span>
              </span>
            </div>
            <button
              onClick={handleBookmark}
              className={`flex items-center gap-2 transition-colors ${
                idea.is_bookmarked ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'
              }`}
            >
              <svg className="w-6 h-6" fill={idea.is_bookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <span>Save</span>
            </button>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 mt-6 p-6">
        <h3 className="text-white font-semibold mb-4">
          Comments ({idea.comment_count})
        </h3>
        <CommentSection
          comments={comments}
          onAddComment={handleAddComment}
          onLikeComment={handleLikeComment}
        />
      </div>
    </div>
  );
};

export default IdeaDetailPage;
