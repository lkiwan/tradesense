import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  ChevronLeft,
  Tag,
  User,
  Send,
  ThumbsUp,
  MoreVertical,
  Twitter,
  Facebook,
  Linkedin,
  Copy,
  Check,
  ArrowUp
} from 'lucide-react';
import api from '../../services/api';

const BlogPostPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    loadPost();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [slug]);

  const handleScroll = () => {
    setShowScrollTop(window.scrollY > 500);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadPost = async () => {
    setLoading(true);
    try {
      const [postRes, commentsRes] = await Promise.all([
        api.get(`/api/blog/posts/${slug}`),
        api.get(`/api/blog/posts/${slug}/comments`)
      ]);

      setPost(postRes.data.post);
      setLiked(postRes.data.post.user_liked || false);
      setLikeCount(postRes.data.post.likes || 0);
      setComments(commentsRes.data.comments || []);
      setRelatedPosts(postRes.data.related_posts || []);
    } catch (error) {
      console.error('Failed to load post:', error);
      if (error.response?.status === 404) {
        navigate('/blog');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      const response = await api.post(`/api/blog/posts/${slug}/like`);
      setLiked(response.data.liked);
      setLikeCount(response.data.likes);
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmitting(true);
    try {
      const payload = { content: commentText };
      if (replyTo) {
        payload.parent_id = replyTo.id;
      }

      await api.post(`/api/blog/posts/${slug}/comments`, payload);
      setCommentText('');
      setReplyTo(null);

      // Reload comments
      const commentsRes = await api.get(`/api/blog/posts/${slug}/comments`);
      setComments(commentsRes.data.comments || []);
    } catch (error) {
      console.error('Failed to post comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const title = post?.title || '';

    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
    setShowShareMenu(false);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
    setShowShareMenu(false);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCommentDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/4"></div>
            <div className="h-96 bg-gray-700 rounded-xl"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-700 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl text-white mb-4">Post not found</h2>
          <Link to="/blog" className="text-indigo-400 hover:text-indigo-300">
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Back Navigation */}
      <div className="bg-gray-800/50 border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            Back to Blog
          </Link>
        </div>
      </div>

      {/* Article Header */}
      <article className="max-w-4xl mx-auto px-4 py-8">
        {/* Categories */}
        {post.categories?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.categories.map(cat => (
              <Link
                key={cat.id}
                to={`/blog?category=${cat.slug}`}
                className="text-sm text-indigo-400 bg-indigo-400/10 px-3 py-1 rounded-full hover:bg-indigo-400/20"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
          {post.title}
        </h1>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-4 text-gray-400 mb-8">
          {post.author && (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-white font-medium">{post.author.name}</span>
                {post.author.bio && (
                  <p className="text-xs text-gray-500">{post.author.bio}</p>
                )}
              </div>
            </div>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {formatDate(post.published_at)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {post.reading_time} min read
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            {post.views} views
          </span>
        </div>

        {/* Featured Image */}
        {post.featured_image && (
          <div className="relative rounded-xl overflow-hidden mb-8">
            <img
              src={post.featured_image}
              alt={post.featured_image_alt || post.title}
              className="w-full h-auto max-h-[500px] object-cover"
            />
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center justify-between py-4 border-y border-gray-700 mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                liked
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-gray-800 text-gray-400 hover:text-red-400'
              }`}
            >
              <Heart className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
              <span>{likeCount}</span>
            </button>
            <a
              href="#comments"
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
              <span>{comments.length}</span>
            </a>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <Share2 className="h-5 w-5" />
              Share
            </button>

            {showShareMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-2 z-10">
                <button
                  onClick={() => handleShare('twitter')}
                  className="w-full flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-700"
                >
                  <Twitter className="h-4 w-4" />
                  Twitter
                </button>
                <button
                  onClick={() => handleShare('facebook')}
                  className="w-full flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-700"
                >
                  <Facebook className="h-4 w-4" />
                  Facebook
                </button>
                <button
                  onClick={() => handleShare('linkedin')}
                  className="w-full flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-700"
                >
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                </button>
                <hr className="my-2 border-gray-700" />
                <button
                  onClick={copyLink}
                  className="w-full flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-700"
                >
                  {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Article Content */}
        <div
          className="prose prose-lg prose-invert max-w-none mb-12"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 py-6 border-t border-gray-700">
            <Tag className="h-5 w-5 text-gray-400" />
            {post.tags.map(tag => (
              <Link
                key={tag.id}
                to={`/blog?tag=${tag.slug}`}
                className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm hover:bg-gray-700"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        )}

        {/* Author Box */}
        {post.author && (
          <div className="bg-gray-800/50 rounded-xl p-6 mb-12">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  {post.author.name}
                </h3>
                {post.author.bio && (
                  <p className="text-gray-400 text-sm mb-3">{post.author.bio}</p>
                )}
                <p className="text-gray-500 text-sm">
                  Trading expert and educator with years of experience in the financial markets.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Comments Section */}
        <section id="comments" className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-indigo-400" />
            Comments ({comments.length})
          </h2>

          {/* Comment Form */}
          <form onSubmit={handleComment} className="mb-8">
            {replyTo && (
              <div className="flex items-center gap-2 mb-2 text-sm text-gray-400">
                <span>Replying to {replyTo.author?.username || 'Anonymous'}</span>
                <button
                  type="button"
                  onClick={() => setReplyTo(null)}
                  className="text-red-400 hover:text-red-300"
                >
                  Cancel
                </button>
              </div>
            )}
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <div className="flex-1">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={!commentText.trim() || submitting}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
                  >
                    <Send className="h-4 w-4" />
                    {submitting ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-6">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No comments yet. Be the first to share your thoughts!
              </div>
            ) : (
              comments.map(comment => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  onReply={() => setReplyTo(comment)}
                  formatDate={formatCommentDate}
                />
              ))
            )}
          </div>
        </section>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-white mb-6">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map(relPost => (
                <Link
                  key={relPost.id}
                  to={`/blog/${relPost.slug}`}
                  className="bg-gray-800/50 rounded-xl overflow-hidden group hover:bg-gray-800 transition-colors"
                >
                  {relPost.featured_image && (
                    <img
                      src={relPost.featured_image}
                      alt={relPost.title}
                      className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="text-white font-medium group-hover:text-indigo-400 line-clamp-2 mb-2">
                      {relPost.title}
                    </h3>
                    <span className="text-gray-500 text-sm">
                      {formatDate(relPost.published_at)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-3 bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-lg text-white transition-all z-50"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

// Comment Card Component
const CommentCard = ({ comment, onReply, formatDate, depth = 0 }) => {
  const [showReplies, setShowReplies] = useState(true);

  return (
    <div className={`${depth > 0 ? 'ml-12 border-l-2 border-gray-700 pl-4' : ''}`}>
      <div className="flex gap-3">
        <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="h-5 w-5 text-gray-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-white">
              {comment.author?.username || 'Anonymous'}
            </span>
            <span className="text-gray-500 text-sm">
              {formatDate(comment.created_at)}
            </span>
          </div>
          <p className="text-gray-300 mb-2">{comment.content}</p>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1 text-gray-500 hover:text-indigo-400 text-sm">
              <ThumbsUp className="h-4 w-4" />
              <span>{comment.likes || 0}</span>
            </button>
            {depth < 2 && (
              <button
                onClick={onReply}
                className="text-gray-500 hover:text-indigo-400 text-sm"
              >
                Reply
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Nested Replies */}
      {comment.replies?.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map(reply => (
            <CommentCard
              key={reply.id}
              comment={reply}
              onReply={onReply}
              formatDate={formatDate}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BlogPostPage;
