import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { IdeaCard, CreateIdeaModal } from '../../components/ideas';

const TradingIdeasPage = () => {
  const [activeTab, setActiveTab] = useState('discover');
  const [ideas, setIdeas] = useState([]);
  const [trendingIdeas, setTrendingIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    symbol: '',
    type: '',
    timeframe: '',
    tag: '',
    sort: 'recent'
  });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [popularTags, setPopularTags] = useState([]);

  useEffect(() => {
    fetchIdeas();
    fetchTrending();
    fetchPopularTags();
  }, [activeTab, filters, page]);

  const fetchIdeas = async () => {
    setLoading(true);
    try {
      let endpoint = '/ideas';
      if (activeTab === 'feed') endpoint = '/ideas/feed';
      else if (activeTab === 'my-ideas') endpoint = '/ideas/my-ideas';
      else if (activeTab === 'bookmarks') endpoint = '/ideas/bookmarks';

      const response = await api.get(endpoint, {
        params: {
          page,
          per_page: 12,
          ...filters
        }
      });
      if (response.data.success) {
        setIdeas(response.data.ideas);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching ideas:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrending = async () => {
    try {
      const response = await api.get('/ideas/trending', { params: { limit: 5 } });
      if (response.data.success) {
        setTrendingIdeas(response.data.ideas);
      }
    } catch (error) {
      console.error('Error fetching trending:', error);
    }
  };

  const fetchPopularTags = async () => {
    try {
      const response = await api.get('/ideas/tags/popular');
      if (response.data.success) {
        setPopularTags(response.data.tags);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleCreateIdea = async (data) => {
    try {
      const response = await api.post('/ideas', data);
      if (response.data.success) {
        setShowCreateModal(false);
        fetchIdeas();
      }
    } catch (error) {
      console.error('Error creating idea:', error);
      alert(error.response?.data?.error || 'Failed to create idea');
    }
  };

  const handleLike = async (ideaId) => {
    try {
      const response = await api.post(`/ideas/${ideaId}/like`);
      if (response.data.success) {
        setIdeas(ideas.map(idea =>
          idea.id === ideaId
            ? {
                ...idea,
                is_liked: response.data.action === 'liked',
                like_count: response.data.like_count
              }
            : idea
        ));
      }
    } catch (error) {
      console.error('Error liking idea:', error);
    }
  };

  const handleBookmark = async (ideaId) => {
    try {
      const response = await api.post(`/ideas/${ideaId}/bookmark`);
      if (response.data.success) {
        setIdeas(ideas.map(idea =>
          idea.id === ideaId
            ? {
                ...idea,
                is_bookmarked: response.data.action === 'bookmarked',
                bookmark_count: response.data.bookmark_count
              }
            : idea
        ));
      }
    } catch (error) {
      console.error('Error bookmarking idea:', error);
    }
  };

  const tabs = [
    { id: 'discover', label: 'Discover', icon: '🔍' },
    { id: 'feed', label: 'My Feed', icon: '📰' },
    { id: 'my-ideas', label: 'My Ideas', icon: '💡' },
    { id: 'bookmarks', label: 'Bookmarks', icon: '🔖' }
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Trading Ideas</h1>
          <p className="text-gray-400">
            Discover and share trading setups with the community
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Share Idea
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setPage(1); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Filters */}
          {activeTab === 'discover' && (
            <div className="bg-gray-800 rounded-xl p-4 mb-6">
              <div className="flex flex-wrap gap-3">
                <input
                  type="text"
                  placeholder="Symbol (e.g., EURUSD)"
                  value={filters.symbol}
                  onChange={(e) => setFilters(f => ({ ...f, symbol: e.target.value }))}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 w-32"
                />
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(f => ({ ...f, type: e.target.value }))}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Directions</option>
                  <option value="long">Long</option>
                  <option value="short">Short</option>
                  <option value="neutral">Neutral</option>
                </select>
                <select
                  value={filters.timeframe}
                  onChange={(e) => setFilters(f => ({ ...f, timeframe: e.target.value }))}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Timeframes</option>
                  <option value="scalp">Scalp</option>
                  <option value="intraday">Intraday</option>
                  <option value="swing">Swing</option>
                  <option value="position">Position</option>
                </select>
                <select
                  value={filters.sort}
                  onChange={(e) => setFilters(f => ({ ...f, sort: e.target.value }))}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="recent">Most Recent</option>
                  <option value="popular">Most Liked</option>
                  <option value="trending">Trending</option>
                  <option value="most_commented">Most Discussed</option>
                </select>
                {(filters.symbol || filters.type || filters.timeframe) && (
                  <button
                    onClick={() => setFilters({ symbol: '', type: '', timeframe: '', tag: '', sort: 'recent' })}
                    className="text-gray-400 hover:text-white text-sm"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Ideas Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-gray-800 rounded-xl p-6 animate-pulse">
                  <div className="h-40 bg-gray-700 rounded-lg mb-4" />
                  <div className="h-4 bg-gray-700 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-700 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : ideas.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ideas.map(idea => (
                  <IdeaCard
                    key={idea.id}
                    idea={idea}
                    onLike={handleLike}
                    onBookmark={handleBookmark}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-gray-400">
                    Page {page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                    disabled={page === pagination.pages}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-gray-800 rounded-xl p-12 text-center">
              <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <p className="text-gray-400 text-lg">
                {activeTab === 'my-ideas'
                  ? "You haven't shared any ideas yet"
                  : activeTab === 'bookmarks'
                  ? "No bookmarked ideas"
                  : activeTab === 'feed'
                  ? "Follow traders to see their ideas here"
                  : "No ideas found"}
              </p>
              {activeTab === 'my-ideas' && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
                >
                  Share Your First Idea
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Trending Ideas */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <span>🔥</span> Trending Now
            </h3>
            <div className="space-y-3">
              {trendingIdeas.map(idea => (
                <IdeaCard key={idea.id} idea={idea} compact />
              ))}
              {trendingIdeas.length === 0 && (
                <p className="text-gray-500 text-sm">No trending ideas yet</p>
              )}
            </div>
          </div>

          {/* Popular Tags */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <span>#</span> Popular Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {popularTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setFilters(f => ({ ...f, tag: f.tag === tag ? '' : tag }))}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    filters.tag === tag
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <h3 className="text-white font-semibold mb-4">Community Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Ideas Today</span>
                <span className="text-white font-medium">{ideas.length}+</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Active Traders</span>
                <span className="text-white font-medium">50+</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Ideas</span>
                <span className="text-white font-medium">{pagination?.total || 0}</span>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-4 border border-blue-500/20">
            <h3 className="text-white font-semibold mb-2">💡 Pro Tip</h3>
            <p className="text-gray-400 text-sm">
              Include clear entry, stop loss, and take profit levels in your ideas to help others understand your trade setup.
            </p>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateIdeaModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateIdea}
        />
      )}
    </div>
  );
};

export default TradingIdeasPage;
