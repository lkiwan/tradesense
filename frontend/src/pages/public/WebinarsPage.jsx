import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Video,
  Calendar,
  Clock,
  Users,
  Play,
  Filter,
  Search,
  ChevronRight,
  User,
  Bell,
  CheckCircle,
  Radio,
  PlayCircle
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = {
  trading_basics: 'Trading Basics',
  technical_analysis: 'Technical Analysis',
  fundamental_analysis: 'Fundamental Analysis',
  risk_management: 'Risk Management',
  psychology: 'Trading Psychology',
  platform_tutorial: 'Platform Tutorial',
  market_analysis: 'Market Analysis',
  qa_session: 'Q&A Session',
  special_event: 'Special Event'
};

const WebinarsPage = () => {
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [webinars, setWebinars] = useState([]);
  const [liveWebinars, setLiveWebinars] = useState([]);
  const [upcomingWebinars, setUpcomingWebinars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  const currentStatus = searchParams.get('status') || 'upcoming';
  const currentCategory = searchParams.get('category');
  const currentPage = parseInt(searchParams.get('page') || '1');

  useEffect(() => {
    loadWebinars();
    loadLiveAndUpcoming();
  }, [currentStatus, currentCategory, currentPage]);

  const loadWebinars = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        per_page: 9,
        status: currentStatus
      };
      if (currentCategory) params.category = currentCategory;
      if (searchTerm) params.search = searchTerm;

      const response = await api.get('/api/webinars', { params });
      setWebinars(response.data.webinars || []);
      setPagination(response.data.pagination || {});
    } catch (error) {
      console.error('Failed to load webinars:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLiveAndUpcoming = async () => {
    try {
      const [liveRes, upcomingRes] = await Promise.all([
        api.get('/api/webinars/live'),
        api.get('/api/webinars/upcoming', { params: { limit: 3 } })
      ]);
      setLiveWebinars(liveRes.data.webinars || []);
      setUpcomingWebinars(upcomingRes.data.webinars || []);
    } catch (error) {
      console.error('Failed to load featured webinars:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadWebinars();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTimeUntil = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date - now;

    if (diff < 0) return 'Started';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `In ${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `In ${hours} hour${hours > 1 ? 's' : ''}`;
    return 'Starting soon';
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">
            Live Trading Webinars
          </h1>
          <p className="text-xl text-gray-300 text-center max-w-2xl mx-auto mb-8">
            Join our expert traders for live market analysis, trading strategies, and Q&A sessions
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search webinars..."
                className="w-full px-6 py-4 pl-14 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm font-medium"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Live Now Banner */}
      {liveWebinars.length > 0 && (
        <div className="bg-red-600 py-4">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 animate-pulse">
                  <Radio className="h-5 w-5 text-white" />
                  <span className="font-bold text-white">LIVE NOW</span>
                </div>
                <span className="text-white">{liveWebinars[0].title}</span>
              </div>
              <Link
                to={`/webinars/${liveWebinars[0].slug}`}
                className="px-4 py-2 bg-white text-red-600 rounded-lg font-medium hover:bg-gray-100"
              >
                Join Now
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex gap-1 bg-gray-800/50 p-1 rounded-lg">
            {[
              { key: 'upcoming', label: 'Upcoming' },
              { key: 'recordings', label: 'Recordings' },
              { key: 'all', label: 'All' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setSearchParams({ status: tab.key })}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentStatus === tab.key
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <select
            value={currentCategory || ''}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) {
                params.set('category', e.target.value);
              } else {
                params.delete('category');
              }
              setSearchParams(params);
            }}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
          >
            <option value="">All Categories</option>
            {Object.entries(CATEGORIES).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* Upcoming Featured */}
        {currentStatus === 'upcoming' && upcomingWebinars.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Calendar className="h-6 w-6 text-purple-400" />
              Coming Soon
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {upcomingWebinars.map(webinar => (
                <FeaturedWebinarCard key={webinar.id} webinar={webinar} />
              ))}
            </div>
          </div>
        )}

        {/* Webinars Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            {currentStatus === 'recordings' ? 'Webinar Recordings' : 'All Webinars'}
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
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
          ) : webinars.length === 0 ? (
            <div className="text-center py-16">
              <Video className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl text-gray-400">No webinars found</h3>
              <p className="text-gray-500 mt-2">Check back soon for new sessions</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {webinars.map(webinar => (
                <WebinarCard key={webinar.id} webinar={webinar} />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center gap-2">
            {pagination.has_prev && (
              <button
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.set('page', currentPage - 1);
                  setSearchParams(params);
                }}
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
                  onClick={() => {
                    const params = new URLSearchParams(searchParams);
                    params.set('page', page);
                    setSearchParams(params);
                  }}
                  className={`px-4 py-2 rounded-lg ${
                    currentPage === page
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            {pagination.has_next && (
              <button
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.set('page', currentPage + 1);
                  setSearchParams(params);
                }}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300"
              >
                Next
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Featured Webinar Card (larger, for upcoming section)
const FeaturedWebinarCard = ({ webinar }) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Link
      to={`/webinars/${webinar.slug}`}
      className="bg-gradient-to-br from-purple-900/50 to-indigo-900/50 rounded-xl overflow-hidden border border-purple-500/30 group hover:border-purple-500/60 transition-all"
    >
      <div className="relative h-40 overflow-hidden">
        {webinar.thumbnail ? (
          <img
            src={webinar.thumbnail}
            alt={webinar.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
            <Video className="h-12 w-12 text-white/50" />
          </div>
        )}
        <div className="absolute top-3 left-3 px-2 py-1 bg-purple-600 rounded text-white text-xs font-medium">
          {CATEGORIES[webinar.category] || webinar.category}
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 mb-2 line-clamp-2">
          {webinar.title}
        </h3>
        <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
          <User className="h-4 w-4" />
          <span>{webinar.host?.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <div className="text-purple-400 font-medium">{formatDate(webinar.scheduled_at)}</div>
            <div className="text-gray-500">{formatTime(webinar.scheduled_at)}</div>
          </div>
          <div className="flex items-center gap-1 text-gray-500 text-sm">
            <Users className="h-4 w-4" />
            {webinar.registration_count}
          </div>
        </div>
      </div>
    </Link>
  );
};

// Regular Webinar Card
const WebinarCard = ({ webinar }) => {
  const isLive = webinar.status === 'live';
  const isPast = webinar.is_past;
  const hasRecording = webinar.has_recording;

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
      to={`/webinars/${webinar.slug}`}
      className="bg-gray-800/50 rounded-xl overflow-hidden group hover:bg-gray-800 transition-colors"
    >
      <div className="relative h-48 overflow-hidden">
        {webinar.thumbnail ? (
          <img
            src={webinar.thumbnail}
            alt={webinar.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
            <Video className="h-12 w-12 text-gray-600" />
          </div>
        )}

        {/* Status Badge */}
        {isLive && (
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-red-600 rounded text-white text-xs font-medium animate-pulse">
            <Radio className="h-3 w-3" />
            LIVE
          </div>
        )}
        {hasRecording && !isLive && (
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-green-600 rounded text-white text-xs font-medium">
            <PlayCircle className="h-3 w-3" />
            Recording
          </div>
        )}

        {/* Registered Badge */}
        {webinar.is_registered && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-purple-600 rounded text-white text-xs font-medium">
            <CheckCircle className="h-3 w-3" />
            Registered
          </div>
        )}

        {/* Play Overlay for recordings */}
        {hasRecording && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="h-12 w-12 text-white" />
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-purple-400 bg-purple-400/10 px-2 py-1 rounded">
            {CATEGORIES[webinar.category] || webinar.category}
          </span>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {webinar.duration_minutes} min
          </span>
        </div>

        <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 mb-2 line-clamp-2">
          {webinar.title}
        </h3>

        {webinar.short_description && (
          <p className="text-gray-400 text-sm line-clamp-2 mb-3">
            {webinar.short_description}
          </p>
        )}

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <User className="h-4 w-4" />
            <span>{webinar.host?.name}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <Calendar className="h-4 w-4" />
            {formatDate(webinar.scheduled_at)}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-700 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {webinar.registration_count} registered
          </span>
          {hasRecording && (
            <span className="flex items-center gap-1">
              <Play className="h-3 w-3" />
              {webinar.replay_count} views
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default WebinarsPage;
