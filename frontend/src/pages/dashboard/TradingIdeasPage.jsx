import React, { useState, useEffect } from 'react';
import { Lightbulb, Plus, Search, Newspaper, Bookmark, TrendingUp, Hash, Users, ChevronLeft, ChevronRight, Flame, Sparkles } from 'lucide-react';
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
    { id: 'discover', label: 'Discover', icon: Search },
    { id: 'feed', label: 'My Feed', icon: Newspaper },
    { id: 'my-ideas', label: 'My Ideas', icon: Lightbulb },
    { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30">
              <Lightbulb className="text-purple-400" size={24} />
            </div>
            Trading Ideas
          </h1>
          <p className="text-gray-400 mt-1">
            Discover and share trading setups with the community
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-primary-500 to-purple-600 hover:from-primary-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg shadow-primary-500/25 hover:scale-105"
        >
          <Plus size={20} />
          Share Idea
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Tabs */}
          <div className="flex gap-2 bg-dark-100/80 backdrop-blur-xl rounded-xl p-1.5 border border-white/5 overflow-x-auto">
            {tabs.map(tab => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setPage(1); }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                      : 'text-gray-400 hover:text-white hover:bg-dark-200/50'
                  }`}
                >
                  <IconComponent size={16} />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Filters */}
          {activeTab === 'discover' && (
            <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-4 border border-white/5">
              <div className="flex flex-wrap gap-3">
                <input
                  type="text"
                  placeholder="Symbol (e.g., EURUSD)"
                  value={filters.symbol}
                  onChange={(e) => setFilters(f => ({ ...f, symbol: e.target.value }))}
                  className="bg-dark-200/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500/50 transition-colors w-36"
                />
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(f => ({ ...f, type: e.target.value }))}
                  className="bg-dark-200/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500/50 transition-colors"
                >
                  <option value="">All Directions</option>
                  <option value="long">Long</option>
                  <option value="short">Short</option>
                  <option value="neutral">Neutral</option>
                </select>
                <select
                  value={filters.timeframe}
                  onChange={(e) => setFilters(f => ({ ...f, timeframe: e.target.value }))}
                  className="bg-dark-200/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500/50 transition-colors"
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
                  className="bg-dark-200/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500/50 transition-colors"
                >
                  <option value="recent">Most Recent</option>
                  <option value="popular">Most Liked</option>
                  <option value="trending">Trending</option>
                  <option value="most_commented">Most Discussed</option>
                </select>
                {(filters.symbol || filters.type || filters.timeframe) && (
                  <button
                    onClick={() => setFilters({ symbol: '', type: '', timeframe: '', tag: '', sort: 'recent' })}
                    className="text-gray-400 hover:text-white text-sm px-3 py-2 bg-dark-200/30 rounded-lg border border-white/5 hover:border-red-500/30 transition-all"
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
                <div key={i} className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-6 border border-white/5 animate-pulse">
                  <div className="h-40 bg-dark-200/50 rounded-lg mb-4" />
                  <div className="h-4 bg-dark-200/50 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-dark-200/50 rounded w-1/2" />
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
                <div className="flex justify-center items-center gap-3 mt-8">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2.5 bg-dark-100/80 backdrop-blur-xl text-white rounded-xl border border-white/5 hover:border-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="px-4 py-2 text-gray-400 text-sm">
                    Page <span className="text-white font-medium">{page}</span> of <span className="text-white font-medium">{pagination.pages}</span>
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                    disabled={page === pagination.pages}
                    className="p-2.5 bg-dark-100/80 backdrop-blur-xl text-white rounded-xl border border-white/5 hover:border-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-12 text-center border border-white/5">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-dark-200/50 border border-white/5 flex items-center justify-center">
                <Lightbulb className="text-gray-500" size={32} />
              </div>
              <p className="text-gray-400 text-lg font-medium">
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
                  className="mt-4 bg-primary-500 hover:bg-primary-600 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-primary-500/25 hover:scale-105 transition-all duration-300"
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
          <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-4 border border-white/5">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-orange-500/10">
                <Flame size={16} className="text-orange-400" />
              </div>
              Trending Now
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
          <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-4 border border-white/5">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/10">
                <Hash size={16} className="text-blue-400" />
              </div>
              Popular Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {popularTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setFilters(f => ({ ...f, tag: f.tag === tag ? '' : tag }))}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-300 ${
                    filters.tag === tag
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                      : 'bg-dark-200/50 text-gray-300 hover:bg-dark-200 border border-white/5 hover:border-primary-500/30'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-4 border border-white/5">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-green-500/10">
                <Users size={16} className="text-green-400" />
              </div>
              Community Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2.5 bg-dark-200/30 rounded-lg">
                <span className="text-gray-400 text-sm">Ideas Today</span>
                <span className="text-white font-bold">{ideas.length}+</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-dark-200/30 rounded-lg">
                <span className="text-gray-400 text-sm">Active Traders</span>
                <span className="text-white font-bold">50+</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-dark-200/30 rounded-lg">
                <span className="text-gray-400 text-sm">Total Ideas</span>
                <span className="text-white font-bold">{pagination?.total || 0}</span>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-primary-500/10 backdrop-blur-xl rounded-xl p-4 border border-primary-500/30">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-primary-500/20">
                <Sparkles className="text-primary-400" size={16} />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Pro Tip</h3>
                <p className="text-gray-400 text-sm">
                  Include clear entry, stop loss, and take profit levels in your ideas to help others understand your trade setup.
                </p>
              </div>
            </div>
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
