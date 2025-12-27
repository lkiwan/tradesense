import React, { useState, useEffect } from 'react';
import { Users, Copy, TrendingUp, BarChart3, Search, ChevronLeft, ChevronRight, UserCheck, UserPlus } from 'lucide-react';
import api from '../../services/api';
import { TraderCard, CopySettingsModal, CopyPerformance } from '../../components/copy';

const CopyTradingPage = () => {
  const [activeTab, setActiveTab] = useState('discover');
  const [traders, setTraders] = useState([]);
  const [myCopies, setMyCopies] = useState([]);
  const [myCopiers, setMyCopiers] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [performanceByMaster, setPerformanceByMaster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrader, setSelectedTrader] = useState(null);
  const [sortBy, setSortBy] = useState('win_rate');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    if (activeTab === 'discover') {
      fetchTraders();
    } else if (activeTab === 'my-copies') {
      fetchMyCopies();
    } else if (activeTab === 'my-copiers') {
      fetchMyCopiers();
    } else if (activeTab === 'performance') {
      fetchPerformance();
    }
  }, [activeTab, sortBy, page]);

  const fetchTraders = async () => {
    setLoading(true);
    try {
      const response = await api.get('/copy-trading/traders', {
        params: { sort: sortBy, page, per_page: 12 }
      });
      if (response.data.success) {
        setTraders(response.data.traders);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching traders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyCopies = async () => {
    setLoading(true);
    try {
      const response = await api.get('/copy-trading/my-copies');
      if (response.data.success) {
        setMyCopies(response.data.copies);
      }
    } catch (error) {
      console.error('Error fetching copies:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyCopiers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/copy-trading/my-copiers');
      if (response.data.success) {
        setMyCopiers(response.data.copiers);
      }
    } catch (error) {
      console.error('Error fetching copiers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformance = async () => {
    setLoading(true);
    try {
      const response = await api.get('/copy-trading/performance');
      if (response.data.success) {
        setPerformance(response.data.performance);
        setPerformanceByMaster(response.data.by_master);
      }
    } catch (error) {
      console.error('Error fetching performance:', error);
    } finally {
      setLoading(false);
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

  const tabs = [
    { id: 'discover', label: 'Discover Traders', icon: Search },
    { id: 'my-copies', label: 'My Copies', icon: Copy },
    { id: 'my-copiers', label: 'My Copiers', icon: Users },
    { id: 'performance', label: 'Performance', icon: BarChart3 }
  ];

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

      {/* Tabs */}
      <div className="flex gap-2 bg-dark-100/80 backdrop-blur-xl rounded-xl p-1.5 border border-white/5 overflow-x-auto">
        {tabs.map(tab => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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

      {/* Discover Tab */}
      {activeTab === 'discover' && (
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

          {loading ? (
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
                <Users className="text-gray-500" size={32} />
              </div>
              <p className="text-gray-400 text-lg font-medium">No traders available for copying</p>
              <p className="text-gray-500 text-sm mt-2">Check back later or adjust filters</p>
            </div>
          )}
        </div>
      )}

      {/* My Copies Tab */}
      {activeTab === 'my-copies' && (
        <div>
          {loading ? (
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
                  <div className="flex items-center justify-between">
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
                onClick={() => setActiveTab('discover')}
                className="mt-4 bg-primary-500 hover:bg-primary-600 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-primary-500/25 hover:scale-105 transition-all duration-300"
              >
                Find Traders
              </button>
            </div>
          )}
        </div>
      )}

      {/* My Copiers Tab */}
      {activeTab === 'my-copiers' && (
        <div>
          {loading ? (
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
                  <div className="flex items-center justify-between">
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
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <CopyPerformance performance={performance} byMaster={performanceByMaster} />
      )}

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
