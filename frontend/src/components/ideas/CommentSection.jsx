import React, { useState } from 'react';

const CommentSection = ({ comments, onAddComment, onLikeComment, onDeleteComment }) => {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      await onAddComment({ content: newComment });
      setNewComment('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId) => {
    if (!replyContent.trim()) return;

    setSubmitting(true);
    try {
      await onAddComment({ content: replyContent, parent_id: parentId });
      setReplyContent('');
      setReplyingTo(null);
    } finally {
      setSubmitting(false);
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

  const Comment = ({ comment, isReply = false }) => (
    <div className={`${isReply ? 'ml-12' : ''}`}>
      <div className="flex gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
          {comment.author?.avatar_url ? (
            <img src={comment.author.avatar_url} alt="" className="w-8 h-8 rounded-full" />
          ) : (
            <span className="text-white text-sm font-bold">
              {comment.author?.display_name?.charAt(0) || 'U'}
            </span>
          )}
        </div>
        <div className="flex-1">
          <div className="bg-gray-700/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white text-sm font-medium">
                {comment.author?.display_name || 'Anonymous'}
              </span>
              <span className="text-gray-500 text-xs">
                {formatTimeAgo(comment.created_at)}
              </span>
              {comment.is_edited && (
                <span className="text-gray-500 text-xs">(edited)</span>
              )}
            </div>
            <p className="text-gray-300 text-sm">{comment.content}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-2 text-sm">
            <button
              onClick={() => onLikeComment?.(comment.id)}
              className={`flex items-center gap-1 transition-colors ${
                comment.is_liked ? 'text-red-400' : 'text-gray-500 hover:text-red-400'
              }`}
            >
              <svg className="w-4 h-4" fill={comment.is_liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {comment.like_count > 0 && comment.like_count}
            </button>
            {!isReply && (
              <button
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="text-gray-500 hover:text-blue-400 transition-colors"
              >
                Reply
              </button>
            )}
            {onDeleteComment && (
              <button
                onClick={() => onDeleteComment(comment.id)}
                className="text-gray-500 hover:text-red-400 transition-colors"
              >
                Delete
              </button>
            )}
          </div>

          {/* Reply Input */}
          {replyingTo === comment.id && (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitReply(comment.id)}
              />
              <button
                onClick={() => handleSubmitReply(comment.id)}
                disabled={submitting || !replyContent.trim()}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg disabled:opacity-50 transition-colors"
              >
                Reply
              </button>
            </div>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-3">
              {comment.replies.map(reply => (
                <Comment key={reply.id} comment={reply} isReply />
              ))}
              {comment.reply_count > comment.replies.length && (
                <button className="text-blue-400 text-sm hover:underline ml-11">
                  View {comment.reply_count - comment.replies.length} more replies
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Add Comment */}
      <form onSubmit={handleSubmitComment} className="flex gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold">Y</span>
        </div>
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50 transition-colors"
          >
            {submitting ? '...' : 'Post'}
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {comments && comments.length > 0 ? (
          comments.map(comment => (
            <Comment key={comment.id} comment={comment} />
          ))
        ) : (
          <p className="text-gray-500 text-center py-8">
            No comments yet. Be the first to share your thoughts!
          </p>
        )}
      </div>
    </div>
  );
};

export default CommentSection;
