import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Calendar,
  Clock,
  Eye,
  Heart,
  MessageCircle,
  Tag,
  ChevronRight,
  TrendingUp,
  Bookmark,
  Filter,
  X
} from 'lucide-react';
import api from '../../services/api';

const BlogPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [featuredPosts, setFeaturedPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [popularTags, setPopularTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  const currentCategory = searchParams.get('category');
  const currentTag = searchParams.get('tag');
  const currentSearch = searchParams.get('search');
  const currentPage = parseInt(searchParams.get('page') || '1');

  useEffect(() => {
    loadPosts();
    loadSidebar();
  }, [currentCategory, currentTag, currentSearch, currentPage]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const params = { page: currentPage, per_page: 9 };
      if (currentCategory) params.category = currentCategory;
      if (currentTag) params.tag = currentTag;
      if (currentSearch) params.search = currentSearch;

      const response = await api.get('/api/blog/posts', { params });
      setPosts(response.data.posts || []);
      setPagination(response.data.pagination || {});
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSidebar = async () => {
    try {
      const [featuredRes, categoriesRes, tagsRes] = await Promise.all([
        api.get('/api/blog/posts/featured', { params: { limit: 3 } }),
        api.get('/api/blog/categories'),
        api.get('/api/blog/tags', { params: { limit: 15 } })
      ]);

      setFeaturedPosts(featuredRes.data.posts || []);
      setCategories(categoriesRes.data.categories || []);
      setPopularTags(tagsRes.data.tags || []);
    } catch (error) {
      console.error('Failed to load sidebar data:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setSearchParams({ search: searchTerm.trim() });
    }
  };

  const clearFilters = () => {
    setSearchParams({});
    setSearchTerm('');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const hasActiveFilters = currentCategory || currentTag || currentSearch;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-900 to-purple-900 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">
            Trading Insights & Education
          </h1>
          <p className="text-xl text-gray-300 text-center max-w-2xl mx-auto mb-8">
            Expert analysis, trading strategies, and market insights to help you become a better trader
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search articles..."
                className="w-full px-6 py-4 pl-14 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white text-sm font-medium"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gray-400 text-sm">Filters:</span>
            {currentCategory && (
              <span className="px-3 py-1 bg-indigo-600/20 text-indigo-400 rounded-full text-sm flex items-center gap-2">
                Category: {currentCategory}
                <button onClick={() => setSearchParams(prev => { prev.delete('category'); return prev; })}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {currentTag && (
              <span className="px-3 py-1 bg-purple-600/20 text-purple-400 rounded-full text-sm flex items-center gap-2">
                Tag: {currentTag}
                <button onClick={() => setSearchParams(prev => { prev.delete('tag'); return prev; })}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {currentSearch && (
              <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm flex items-center gap-2">
                Search: {currentSearch}
                <button onClick={() => setSearchParams(prev => { prev.delete('search'); return prev; })}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-gray-400 hover:text-white text-sm underline"
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Posts Grid */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-gray-800 rounded-xl animate-pulse">
                    <div className="h-48 bg-gray-700 rounded-t-xl"></div>
                    <div className="p-5 space-y-3">
                      <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                      <div className="h-6 bg-gray-700 rounded"></div>
                      <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16">
                <Bookmark className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl text-gray-400">No articles found</h3>
                <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {posts.map(post => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex justify-center gap-2 mt-10">
                    {pagination.has_prev && (
                      <button
                        onClick={() => setSearchParams(prev => { prev.set('page', currentPage - 1); return prev; })}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300"
                      >
                        Previous
                      </button>
                    )}
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setSearchParams(prev => { prev.set('page', page); return prev; })}
                          className={`px-4 py-2 rounded-lg ${
                            currentPage === page
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    {pagination.has_next && (
                      <button
                        onClick={() => setSearchParams(prev => { prev.set('page', currentPage + 1); return prev; })}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300"
                      >
                        Next
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Featured Posts */}
            {featuredPosts.length > 0 && (
              <div className="bg-gray-800/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-indigo-400" />
                  Featured Articles
                </h3>
                <div className="space-y-4">
                  {featuredPosts.map(post => (
                    <Link
                      key={post.id}
                      to={`/blog/${post.slug}`}
                      className="flex gap-3 group"
                    >
                      {post.thumbnail && (
                        <img
                          src={post.thumbnail}
                          alt={post.title}
                          className="w-20 h-16 object-cover rounded-lg flex-shrink-0"
                        />
                      )}
                      <div>
                        <h4 className="text-gray-200 group-hover:text-indigo-400 text-sm font-medium line-clamp-2">
                          {post.title}
                        </h4>
                        <span className="text-gray-500 text-xs">
                          {formatDate(post.published_at)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Categories */}
            {categories.length > 0 && (
              <div className="bg-gray-800/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                  <Filter className="h-5 w-5 text-indigo-400" />
                  Categories
                </h3>
                <div className="space-y-2">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setSearchParams({ category: category.slug })}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left ${
                        currentCategory === category.slug
                          ? 'bg-indigo-600/20 text-indigo-400'
                          : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                      }`}
                    >
                      <span>{category.name}</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Tags */}
            {popularTags.length > 0 && (
              <div className="bg-gray-800/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                  <Tag className="h-5 w-5 text-indigo-400" />
                  Popular Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => setSearchParams({ tag: tag.slug })}
                      className={`px-3 py-1.5 rounded-full text-sm ${
                        currentTag === tag.slug
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Newsletter */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Subscribe to Newsletter
              </h3>
              <p className="text-indigo-100 text-sm mb-4">
                Get weekly trading insights delivered to your inbox
              </p>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 mb-3 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <button className="w-full py-2 bg-white text-indigo-600 font-medium rounded-lg hover:bg-gray-100">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Post Card Component
const PostCard = ({ post }) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Link
      to={`/blog/${post.slug}`}
      className="bg-gray-800/50 rounded-xl overflow-hidden group hover:bg-gray-800 transition-colors"
    >
      {post.featured_image && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={post.featured_image}
            alt={post.featured_image_alt || post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {post.is_featured && (
            <span className="absolute top-3 left-3 px-2 py-1 bg-yellow-500 text-black text-xs font-medium rounded">
              Featured
            </span>
          )}
        </div>
      )}
      <div className="p-5">
        {/* Categories */}
        {post.categories?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {post.categories.slice(0, 2).map(cat => (
              <span
                key={cat.id}
                className="text-xs text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded"
              >
                {cat.name}
              </span>
            ))}
          </div>
        )}

        <h2 className="text-lg font-semibold text-white group-hover:text-indigo-400 line-clamp-2 mb-2">
          {post.title}
        </h2>

        {post.excerpt && (
          <p className="text-gray-400 text-sm line-clamp-2 mb-4">
            {post.excerpt}
          </p>
        )}

        <div className="flex items-center justify-between text-gray-500 text-sm">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(post.published_at)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {post.reading_time} min
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {post.views}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              {post.likes}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default BlogPage;
