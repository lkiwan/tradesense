import React, { useState, useEffect } from 'react';
import {
  Users, Copy, TrendingUp, BarChart3, Search, ChevronLeft, ChevronRight,
  UserCheck, UserPlus, User, Mail, Phone, MapPin, Edit2, Camera, Shield,
  Award, Lightbulb, Plus, Newspaper, Bookmark, Hash, Flame, Sparkles
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { TraderCard, CopySettingsModal, CopyPerformance } from '../../components/copy';
import { IdeaCard, CreateIdeaModal } from '../../components/ideas';

const CopyTradingPage = () => {
  // Main tab state
  const [activeMainTab, setActiveMainTab] = useState('copy');

  // Copy Trading states
  const [activeCopyTab, setActiveCopyTab] = useState('discover');
  const [traders, setTraders] = useState([]);
  const [myCopies, setMyCopies] = useState([]);
  const [myCopiers, setMyCopiers] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [performanceByMaster, setPerformanceByMaster] = useState([]);
  const [copyLoading, setCopyLoading] = useState(true);
  const [selectedTrader, setSelectedTrader] = useState(null);
  const [sortBy, setSortBy] = useState('win_rate');
  const [copyPage, setCopyPage] = useState(1);
  const [copyPagination, setCopyPagination] = useState(null);

  // Profile states
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  // Ideas states
  const [activeIdeasTab, setActiveIdeasTab] = useState('discover');
  const [ideas, setIdeas] = useState([]);
  const [trendingIdeas, setTrendingIdeas] = useState([]);
  const [ideasLoading, setIdeasLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [ideasFilters, setIdeasFilters] = useState({
    symbol: '',
    type: '',
    timeframe: '',
    tag: '',
    sort: 'recent'
  });
  const [ideasPage, setIdeasPage] = useState(1);
  const [ideasPagination, setIdeasPagination] = useState(null);
  const [popularTags, setPopularTags] = useState([]);

  // Main tabs
  const mainTabs = [
    { id: 'copy', label: 'Copy Trading', icon: Copy },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'followers', label: 'Followers', icon: Users },
    { id: 'ideas', label: 'Trading Ideas', icon: Lightbulb }
  ];

  // Copy sub-tabs
  const copyTabs = [
    { id: 'discover', label: 'Discover Traders', icon: Search },
    { id: 'my-copies', label: 'My Copies', icon: Copy },
    { id: 'performance', label: 'Performance', icon: BarChart3 }
  ];

  // Ideas sub-tabs
  const ideasTabs = [
    { id: 'discover', label: 'Discover', icon: Search },
    { id: 'feed', label: 'My Feed', icon: Newspaper },
    { id: 'my-ideas', label: 'My Ideas', icon: Lightbulb },
    { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark }
  ];

  // Copy Trading effects
  useEffect(() => {
    if (activeMainTab === 'copy') {
      if (activeCopyTab === 'discover') {
        fetchTraders();
      } else if (activeCopyTab === 'my-copies') {
        fetchMyCopies();
      } else if (activeCopyTab === 'performance') {
        fetchPerformance();
      }
    }
  }, [activeMainTab, activeCopyTab, sortBy, copyPage]);

  // Followers effect
  useEffect(() => {
    if (activeMainTab === 'followers') {
      fetchMyCopiers();
    }
  }, [activeMainTab]);

  // Ideas effects
  useEffect(() => {
    if (activeMainTab === 'ideas') {
      fetchIdeas();
      fetchTrending();
      fetchPopularTags();
    }
  }, [activeMainTab, activeIdeasTab, ideasFilters, ideasPage]);

  // Copy Trading functions
  const fetchTraders = async () => {
    setCopyLoading(true);
    try {
      const response = await api.get('/copy-trading/traders', {
        params: { sort: sortBy, page: copyPage, per_page: 12 }
      });
      if (response.data.success) {
        setTraders(response.data.traders);
        setCopyPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching traders:', error);
    } finally {
      setCopyLoading(false);
    }
  };

  const fetchMyCopies = async () => {
    setCopyLoading(true);
    try {
      const response = await api.get('/copy-trading/my-copies');
      if (response.data.success) {
        setMyCopies(response.data.copies);
      }
    } catch (error) {
      console.error('Error fetching copies:', error);
    } finally {
      setCopyLoading(false);
    }
  };

  const fetchMyCopiers = async () => {
    setCopyLoading(true);
    try {
      const response = await api.get('/copy-trading/my-copiers');
      if (response.data.success) {
        setMyCopiers(response.data.copiers);
      }
    } catch (error) {
      console.error('Error fetching copiers:', error);
    } finally {
      setCopyLoading(false);
    }
  };

  const fetchPerformance = async () => {
    setCopyLoading(true);
    try {
      const response = await api.get('/copy-trading/performance');
      if (response.data.success) {
        setPerformance(response.data.performance);
        setPerformanceByMaster(response.data.by_master);
      }
    } catch (error) {
      console.error('Error fetching performance:', error);
    } finally {
      setCopyLoading(false);
    }
  };

  const handleStartCopy = (trader) => {
    setSelectedTrader(trader);
  };

  const handleConfirmCopy = async (settings) => {
    try {
      const response = await api.post(`/copy-trading/start/${selectedTrader.profile.user_id}`, settings);
      if (response.data.success) {
        setSelectedTrader(null);
        fetchTraders();
      }
    } catch (error) {
      console.error('Error starting copy:', error);
      alert(error.response?.data?.error || 'Failed to start copying');
    }
  };

  const handleStopCopy = async (masterId) => {
    if (!window.confirm('Are you sure you want to stop copying this trader?')) return;

    try {
      const response = await api.post(`/copy-trading/stop/${masterId}`);
      if (response.data.success) {
        fetchTraders();
        fetchMyCopies();
      }
    } catch (error) {
      console.error('Error stopping copy:', error);
    }
  };

  const handlePauseCopy = async (masterId) => {
    try {
      const response = await api.post(`/copy-trading/pause/${masterId}`);
      if (response.data.success) {
        fetchMyCopies();
      }
    } catch (error) {
      console.error('Error pausing copy:', error);
    }
  };

  const handleResumeCopy = async (masterId) => {
    try {
      const response = await api.post(`/copy-trading/resume/${masterId}`);
      if (response.data.success) {
        fetchMyCopies();
      }
    } catch (error) {
      console.error('Error resuming copy:', error);
    }
  };

  // Ideas functions
  const fetchIdeas = async () => {
    setIdeasLoading(true);
    try {
      let endpoint = '/ideas';
      if (activeIdeasTab === 'feed') endpoint = '/ideas/feed';
      else if (activeIdeasTab === 'my-ideas') endpoint = '/ideas/my-ideas';
      else if (activeIdeasTab === 'bookmarks') endpoint = '/ideas/bookmarks';

      const response = await api.get(endpoint, {
        params: {
          page: ideasPage,
          per_page: 12,
          ...ideasFilters
        }
      });
      if (response.data.success) {
        setIdeas(response.data.ideas);
        setIdeasPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching ideas:', error);
    } finally {
      setIdeasLoading(false);
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

  // Render Copy Trading Tab
  const renderCopyTab = () => (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="flex gap-2 bg-dark-200/50 backdrop-blur-xl rounded-xl p-1.5 border border-white/5 overflow-x-auto">
        {copyTabs.map(tab => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveCopyTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap transition-all duration-300 ${
                activeCopyTab === tab.id
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'text-gray-400 hover:text-white hover:bg-dark-300/50'
              }`}
            >
              <IconComponent size={16} />
              <span className="font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Discover Tab */}
      {activeCopyTab === 'discover' && (
        <div className="space-y-6">
          {/* Sort Options */}
          <div className="flex items-center gap-4 bg-dark-100/80 backdrop-blur-xl rounded-xl p-4 border border-white/5">
            <span className="text-gray-400 text-sm">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-dark-200/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500/50 transition-colors"
            >
              <option value="win_rate">Win Rate</option>
              <option value="profit">Profit</option>
              <option value="copiers">Most Copied</option>
            </select>
          </div>

          {copyLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-6 border border-white/5 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-dark-200/50 rounded-full" />
                    <div>
                      <div className="h-4 bg-dark-200/50 rounded w-24 mb-2" />
                      <div className="h-3 bg-dark-200/50 rounded w-16" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[1, 2, 3].map(j => (
                      <div key={j} className="h-16 bg-dark-200/50 rounded-lg" />
                    ))}
                  </div>
                  <div className="h-10 bg-dark-200/50 rounded-lg" />
                </div>
              ))}
            </div>
          ) : traders.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {traders.map(trader => (
                  <TraderCard
                    key={trader.profile.user_id}
                    trader={trader}
                    onStartCopy={handleStartCopy}
                    onStopCopy={handleStopCopy}
                  />
                ))}
              </div>

              {/* Pagination */}
              {copyPagination && copyPagination.pages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-8">
                  <button
                    onClick={() => setCopyPage(p => Math.max(1, p - 1))}
                    disabled={copyPage === 1}
                    className="p-2.5 bg-dark-100/80 backdrop-blur-xl text-white rounded-xl border border-white/5 hover:border-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="px-4 py-2 text-gray-400 text-sm">
                    Page <span className="text-white font-medium">{copyPage}</span> of <span className="text-white font-medium">{copyPagination.pages}</span>
                  </span>
                  <button
                    onClick={() => setCopyPage(p => Math.min(copyPagination.pages, p + 1))}
                    disabled={copyPage === copyPagination.pages}
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
                <Users className="text-gray-500" size={32} />
              </div>
              <p className="text-gray-400 text-lg font-medium">No traders available for copying</p>
              <p className="text-gray-500 text-sm mt-2">Check back later or adjust filters</p>
            </div>
          )}
        </div>
      )}

      {/* My Copies Tab */}
      {activeCopyTab === 'my-copies' && (
        <div>
          {copyLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-6 border border-white/5 animate-pulse">
                  <div className="h-20 bg-dark-200/50 rounded" />
                </div>
              ))}
            </div>
          ) : myCopies.length > 0 ? (
            <div className="space-y-4">
              {myCopies.map(copy => (
                <div
                  key={copy.relationship.id}
                  className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-6 border border-white/5 hover:border-primary-500/30 transition-all duration-300"
                >
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                        <span className="text-white font-bold">
                          {copy.master_profile?.display_name?.charAt(0) || 'T'}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">
                          {copy.master_profile?.display_name || 'Unknown'}
                        </h3>
                        <div className="flex items-center gap-3 text-sm mt-1">
                          <span className={`px-2.5 py-0.5 rounded-lg text-xs font-medium ${
                            copy.relationship.status === 'active'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : copy.relationship.status === 'paused'
                              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                              : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                          }`}>
                            {copy.relationship.status}
                          </span>
                          <span className="text-gray-400">
                            {copy.relationship.total_copied_trades} trades
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className={`font-bold text-lg ${
                          (copy.relationship.total_profit - copy.relationship.total_loss) >= 0
                            ? 'text-green-400'
                            : 'text-red-400'
                        }`}>
                          ${((copy.relationship.total_profit || 0) - (copy.relationship.total_loss || 0)).toFixed(2)}
                        </p>
                        <p className="text-gray-500 text-sm">Net P/L</p>
                      </div>

                      <div className="flex gap-2">
                        {copy.relationship.status === 'active' && (
                          <button
                            onClick={() => handlePauseCopy(copy.relationship.master_id)}
                            className="p-2.5 bg-yellow-500/10 text-yellow-400 rounded-xl border border-yellow-500/30 hover:bg-yellow-500/20 transition-all duration-300"
                            title="Pause"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                        {copy.relationship.status === 'paused' && (
                          <button
                            onClick={() => handleResumeCopy(copy.relationship.master_id)}
                            className="p-2.5 bg-green-500/10 text-green-400 rounded-xl border border-green-500/30 hover:bg-green-500/20 transition-all duration-300"
                            title="Resume"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleStopCopy(copy.relationship.master_id)}
                          className="p-2.5 bg-red-500/10 text-red-400 rounded-xl border border-red-500/30 hover:bg-red-500/20 transition-all duration-300"
                          title="Stop"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-12 text-center border border-white/5">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-dark-200/50 border border-white/5 flex items-center justify-center">
                <Copy className="text-gray-500" size={32} />
              </div>
              <p className="text-gray-400 text-lg font-medium">You're not copying anyone yet</p>
              <p className="text-gray-500 text-sm mt-2">Discover traders and start copying their trades</p>
              <button
                onClick={() => setActiveCopyTab('discover')}
                className="mt-4 bg-primary-500 hover:bg-primary-600 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-primary-500/25 hover:scale-105 transition-all duration-300"
              >
                Find Traders
              </button>
            </div>
          )}
        </div>
      )}

      {/* Performance Tab */}
      {activeCopyTab === 'performance' && (
        <CopyPerformance performance={performance} byMaster={performanceByMaster} />
      )}
    </div>
  );

  // Render Profile Tab
  const renderProfileTab = () => (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Profile Card */}
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-4 md:p-6 text-center relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary-500/20 rounded-full blur-[60px]" />

          <div className="relative">
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25 ring-4 ring-dark-100">
                <span className="text-white font-bold text-3xl">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-dark-200 hover:bg-primary-500 rounded-full border border-white/10 text-gray-400 hover:text-white transition-all duration-300">
                <Camera size={14} />
              </button>
            </div>
            <h3 className="text-xl font-bold text-white">{user?.username || 'Utilisateur'}</h3>
            <p className="text-gray-400 text-sm">{user?.email}</p>
            <div className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 bg-green-500/10 rounded-full border border-green-500/30">
              <Shield size={14} className="text-green-400" />
              <span className="text-sm text-green-400 font-medium">Compte verifie</span>
            </div>
            <div className="mt-6 pt-6 border-t border-white/5">
              <div className="flex items-center justify-center gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">12</p>
                  <p className="text-xs text-gray-400">Trades</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">78%</p>
                  <p className="text-xs text-gray-400">Win Rate</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary-400">1</p>
                  <p className="text-xs text-gray-400">Challenges</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Form */}
        <div className="lg:col-span-2 bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6">
            <h3 className="font-semibold text-white">Informations Personnelles</h3>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-300 min-h-[44px] w-full sm:w-auto ${
                isEditing
                  ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30'
                  : 'bg-dark-200 hover:bg-dark-300 text-gray-400 hover:text-white'
              }`}
            >
              <Edit2 size={16} />
              {isEditing ? 'Annuler' : 'Modifier'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Nom d'utilisateur</label>
              <div className="relative group">
                <User className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-400 transition-colors" size={18} />
                <input
                  type="text"
                  value={user?.username || ''}
                  disabled={!isEditing}
                  className="w-full bg-dark-200/50 border border-white/5 rounded-xl px-10 md:px-12 py-3 md:py-3.5 text-white text-sm md:text-base disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-300 min-h-[48px]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Email</label>
              <div className="relative group">
                <Mail className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-400 transition-colors" size={18} />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled={!isEditing}
                  className="w-full bg-dark-200/50 border border-white/5 rounded-xl px-10 md:px-12 py-3 md:py-3.5 text-white text-sm md:text-base disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-300 min-h-[48px]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Telephone</label>
              <div className="relative group">
                <Phone className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-400 transition-colors" size={18} />
                <input
                  type="tel"
                  placeholder="+33 6 12 34 56 78"
                  disabled={!isEditing}
                  className="w-full bg-dark-200/50 border border-white/5 rounded-xl px-10 md:px-12 py-3 md:py-3.5 text-white text-sm md:text-base placeholder-gray-500 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-300 min-h-[48px]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Pays</label>
              <div className="relative group">
                <MapPin className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-400 transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="France"
                  disabled={!isEditing}
                  className="w-full bg-dark-200/50 border border-white/5 rounded-xl px-10 md:px-12 py-3 md:py-3.5 text-white text-sm md:text-base placeholder-gray-500 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-300 min-h-[48px]"
                />
              </div>
            </div>
          </div>

          {isEditing && (
            <button className="mt-4 md:mt-6 px-6 py-3 md:py-3.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-all duration-300 shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 hover:scale-[1.02] min-h-[48px] w-full sm:w-auto">
              Sauvegarder
            </button>
          )}
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-4 md:p-6">
        <h3 className="font-semibold text-white mb-3 md:mb-4 flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-yellow-500/10">
            <Award size={18} className="text-yellow-400" />
          </div>
          Accomplissements
        </h3>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 md:gap-3">
          {['Premier Trade', 'Profit Positif', '10 Trades', 'Phase 1 Reussie'].map((badge, i) => (
            <div key={i} className="flex items-center justify-center sm:justify-start gap-2 px-3 md:px-4 py-2.5 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl border border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-300 group cursor-pointer min-h-[44px]">
              <Award size={16} className="text-yellow-400 group-hover:scale-110 transition-transform flex-shrink-0" />
              <span className="text-xs sm:text-sm text-white font-medium truncate">{badge}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Render Followers Tab
  const renderFollowersTab = () => (
    <div>
      {copyLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-6 border border-white/5 animate-pulse">
              <div className="h-16 bg-dark-200/50 rounded" />
            </div>
          ))}
        </div>
      ) : myCopiers.length > 0 ? (
        <div className="space-y-4">
          {myCopiers.map(copier => (
            <div
              key={copier.relationship.id}
              className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-6 border border-white/5 hover:border-green-500/30 transition-all duration-300"
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/25">
                    <span className="text-white font-bold">
                      {copier.copier_profile?.display_name?.charAt(0) || 'C'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">
                      {copier.copier_profile?.display_name || 'Anonymous'}
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">
                      Copying since {new Date(copier.relationship.started_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-white font-bold text-lg">
                    {copier.relationship.total_copied_trades} trades
                  </p>
                  <p className="text-gray-400 text-sm">
                    Mode: <span className="text-primary-400">{copier.relationship.copy_mode}</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-12 text-center border border-white/5">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-dark-200/50 border border-white/5 flex items-center justify-center">
            <UserPlus className="text-gray-500" size={32} />
          </div>
          <p className="text-gray-400 text-lg font-medium">No one is copying you yet</p>
          <p className="text-gray-500 text-sm mt-2">Improve your trading performance to attract copiers</p>
        </div>
      )}
    </div>
  );

  // Render Ideas Tab
  const renderIdeasTab = () => (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div />
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
          {/* Sub-tabs */}
          <div className="flex gap-2 bg-dark-200/50 backdrop-blur-xl rounded-xl p-1.5 border border-white/5 overflow-x-auto">
            {ideasTabs.map(tab => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveIdeasTab(tab.id); setIdeasPage(1); }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap transition-all duration-300 ${
                    activeIdeasTab === tab.id
                      ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                      : 'text-gray-400 hover:text-white hover:bg-dark-300/50'
                  }`}
                >
                  <IconComponent size={16} />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Filters */}
          {activeIdeasTab === 'discover' && (
            <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-4 border border-white/5">
              <div className="flex flex-wrap gap-3">
                <input
                  type="text"
                  placeholder="Symbol (e.g., EURUSD)"
                  value={ideasFilters.symbol}
                  onChange={(e) => setIdeasFilters(f => ({ ...f, symbol: e.target.value }))}
                  className="bg-dark-200/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500/50 transition-colors w-36"
                />
                <select
                  value={ideasFilters.type}
                  onChange={(e) => setIdeasFilters(f => ({ ...f, type: e.target.value }))}
                  className="bg-dark-200/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500/50 transition-colors"
                >
                  <option value="">All Directions</option>
                  <option value="long">Long</option>
                  <option value="short">Short</option>
                  <option value="neutral">Neutral</option>
                </select>
                <select
                  value={ideasFilters.timeframe}
                  onChange={(e) => setIdeasFilters(f => ({ ...f, timeframe: e.target.value }))}
                  className="bg-dark-200/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500/50 transition-colors"
                >
                  <option value="">All Timeframes</option>
                  <option value="scalp">Scalp</option>
                  <option value="intraday">Intraday</option>
                  <option value="swing">Swing</option>
                  <option value="position">Position</option>
                </select>
                <select
                  value={ideasFilters.sort}
                  onChange={(e) => setIdeasFilters(f => ({ ...f, sort: e.target.value }))}
                  className="bg-dark-200/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500/50 transition-colors"
                >
                  <option value="recent">Most Recent</option>
                  <option value="popular">Most Liked</option>
                  <option value="trending">Trending</option>
                  <option value="most_commented">Most Discussed</option>
                </select>
                {(ideasFilters.symbol || ideasFilters.type || ideasFilters.timeframe) && (
                  <button
                    onClick={() => setIdeasFilters({ symbol: '', type: '', timeframe: '', tag: '', sort: 'recent' })}
                    className="text-gray-400 hover:text-white text-sm px-3 py-2 bg-dark-200/30 rounded-lg border border-white/5 hover:border-red-500/30 transition-all"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Ideas Grid */}
          {ideasLoading ? (
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
              {ideasPagination && ideasPagination.pages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-8">
                  <button
                    onClick={() => setIdeasPage(p => Math.max(1, p - 1))}
                    disabled={ideasPage === 1}
                    className="p-2.5 bg-dark-100/80 backdrop-blur-xl text-white rounded-xl border border-white/5 hover:border-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="px-4 py-2 text-gray-400 text-sm">
                    Page <span className="text-white font-medium">{ideasPage}</span> of <span className="text-white font-medium">{ideasPagination.pages}</span>
                  </span>
                  <button
                    onClick={() => setIdeasPage(p => Math.min(ideasPagination.pages, p + 1))}
                    disabled={ideasPage === ideasPagination.pages}
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
                {activeIdeasTab === 'my-ideas'
                  ? "You haven't shared any ideas yet"
                  : activeIdeasTab === 'bookmarks'
                  ? "No bookmarked ideas"
                  : activeIdeasTab === 'feed'
                  ? "Follow traders to see their ideas here"
                  : "No ideas found"}
              </p>
              {activeIdeasTab === 'my-ideas' && (
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
                  onClick={() => setIdeasFilters(f => ({ ...f, tag: f.tag === tag ? '' : tag }))}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-300 ${
                    ideasFilters.tag === tag
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                      : 'bg-dark-200/50 text-gray-300 hover:bg-dark-200 border border-white/5 hover:border-primary-500/30'
                  }`}
                >
                  #{tag}
                </button>
              ))}
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30">
            <Copy className="text-blue-400" size={24} />
          </div>
          Copy Trading
        </h1>
        <p className="text-gray-400 mt-1">
          Copy successful traders automatically and earn while you learn
        </p>
      </div>

      {/* Main Tabs */}
      <div className="flex gap-2 bg-dark-100/80 backdrop-blur-xl rounded-xl p-1.5 border border-white/5 overflow-x-auto">
        {mainTabs.map(tab => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveMainTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap transition-all duration-300 ${
                activeMainTab === tab.id
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

      {/* Tab Content */}
      {activeMainTab === 'copy' && renderCopyTab()}
      {activeMainTab === 'profile' && renderProfileTab()}
      {activeMainTab === 'followers' && renderFollowersTab()}
      {activeMainTab === 'ideas' && renderIdeasTab()}

      {/* Copy Settings Modal */}
      {selectedTrader && (
        <CopySettingsModal
          trader={selectedTrader}
          onClose={() => setSelectedTrader(null)}
          onConfirm={handleConfirmCopy}
        />
      )}
    </div>
  );
};

export default CopyTradingPage;
