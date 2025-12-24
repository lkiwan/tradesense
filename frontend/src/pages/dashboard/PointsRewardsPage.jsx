import React, { useState, useEffect } from 'react';
import {
  Gift, Star, Clock, RefreshCw, Crown, DollarSign, Shirt, Coffee,
  Headphones, Video, Percent, Check, X, AlertCircle, Package,
  ChevronRight, Search, Filter, Loader2, ShoppingBag, Award
} from 'lucide-react';
import api from '../../services/api';

const CATEGORY_INFO = {
  discount: { name: 'Discounts', icon: Percent, color: 'text-green-400', bg: 'bg-green-500/20' },
  free_extension: { name: 'Extensions', icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  free_reset: { name: 'Resets', icon: RefreshCw, color: 'text-purple-400', bg: 'bg-purple-500/20' },
  subscription: { name: 'Subscriptions', icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  cash_bonus: { name: 'Cash Bonus', icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  merchandise: { name: 'Merchandise', icon: ShoppingBag, color: 'text-pink-400', bg: 'bg-pink-500/20' },
  exclusive: { name: 'Exclusive', icon: Award, color: 'text-orange-400', bg: 'bg-orange-500/20' }
};

const LEVEL_COLORS = {
  Bronze: 'text-amber-600',
  Silver: 'text-gray-400',
  Gold: 'text-yellow-400',
  Platinum: 'text-cyan-400',
  Diamond: 'text-purple-400'
};

const PointsRewardsPage = () => {
  const [rewards, setRewards] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [userPoints, setUserPoints] = useState(0);
  const [userLevel, setUserLevel] = useState('Bronze');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('catalog');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [redeeming, setRedeeming] = useState(false);
  const [shippingForm, setShippingForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    phone: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rewardsRes, redemptionsRes, balanceRes] = await Promise.all([
        api.get('/points/rewards'),
        api.get('/points/redemptions'),
        api.get('/points/balance')
      ]);

      setRewards(rewardsRes.data.rewards || []);
      setRedemptions(redemptionsRes.data.redemptions || []);
      setUserPoints(balanceRes.data.total_points || 0);
      setUserLevel(balanceRes.data.level || 'Bronze');
    } catch (error) {
      console.error('Error fetching rewards data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (!selectedReward) return;

    try {
      setRedeeming(true);
      const payload = {
        reward_id: selectedReward.id
      };

      if (selectedReward.requires_shipping) {
        payload.shipping_address = shippingForm;
      }

      await api.post('/points/redeem', payload);

      setShowRedeemModal(false);
      setSelectedReward(null);
      setShippingForm({
        name: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        country: '',
        phone: ''
      });

      fetchData();
    } catch (error) {
      console.error('Error redeeming reward:', error);
      alert(error.response?.data?.error || 'Failed to redeem reward');
    } finally {
      setRedeeming(false);
    }
  };

  const openRedeemModal = (reward) => {
    setSelectedReward(reward);
    setShowRedeemModal(true);
  };

  const filteredRewards = rewards.filter(reward => {
    const matchesCategory = selectedCategory === 'all' || reward.category === selectedCategory;
    const matchesSearch = reward.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         reward.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredRewards = rewards.filter(r => r.featured && r.can_redeem);

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      processing: 'bg-blue-500/20 text-blue-400',
      completed: 'bg-green-500/20 text-green-400',
      cancelled: 'bg-red-500/20 text-red-400',
      failed: 'bg-red-500/20 text-red-400'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Points Rewards</h1>
          <p className="text-gray-400">Redeem your points for exclusive rewards</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-[#1a1a2e] rounded-xl px-6 py-3 border border-gray-800">
            <div className="text-sm text-gray-400">Your Points</div>
            <div className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
              <Star className="w-5 h-5" />
              {userPoints.toLocaleString()}
            </div>
          </div>
          <div className="bg-[#1a1a2e] rounded-xl px-6 py-3 border border-gray-800">
            <div className="text-sm text-gray-400">Your Level</div>
            <div className={`text-2xl font-bold ${LEVEL_COLORS[userLevel]}`}>
              {userLevel}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'catalog'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Gift className="w-4 h-4 inline-block mr-2" />
          Rewards Catalog
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'history'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4 inline-block mr-2" />
          Redemption History
        </button>
      </div>

      {activeTab === 'catalog' ? (
        <>
          {/* Featured Rewards */}
          {featuredRewards.length > 0 && (
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/20">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400" />
                Featured Rewards
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {featuredRewards.slice(0, 4).map(reward => {
                  const categoryInfo = CATEGORY_INFO[reward.category] || CATEGORY_INFO.exclusive;
                  const IconComponent = categoryInfo.icon;

                  return (
                    <div
                      key={reward.id}
                      className="bg-[#1a1a2e] rounded-xl p-4 border border-gray-800 hover:border-blue-500/50 transition-all cursor-pointer"
                      onClick={() => openRedeemModal(reward)}
                    >
                      <div className={`w-12 h-12 rounded-lg ${categoryInfo.bg} flex items-center justify-center mb-3`}>
                        <IconComponent className={`w-6 h-6 ${categoryInfo.color}`} />
                      </div>
                      <h3 className="font-medium text-white mb-1">{reward.name}</h3>
                      <p className="text-sm text-gray-400 mb-3 line-clamp-2">{reward.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-yellow-400 font-bold flex items-center gap-1">
                          <Star className="w-4 h-4" />
                          {reward.points_cost.toLocaleString()}
                        </span>
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search rewards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#1a1a2e] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-[#1a1a2e] text-gray-400 hover:text-white'
                }`}
              >
                All
              </button>
              {Object.entries(CATEGORY_INFO).map(([key, info]) => {
                const IconComponent = info.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                      selectedCategory === key
                        ? 'bg-blue-500 text-white'
                        : 'bg-[#1a1a2e] text-gray-400 hover:text-white'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    {info.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rewards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRewards.map(reward => {
              const categoryInfo = CATEGORY_INFO[reward.category] || CATEGORY_INFO.exclusive;
              const IconComponent = categoryInfo.icon;
              const canAfford = userPoints >= reward.points_cost;
              const meetsLevel = reward.can_redeem;

              return (
                <div
                  key={reward.id}
                  className={`bg-[#1a1a2e] rounded-xl p-5 border transition-all ${
                    canAfford && meetsLevel
                      ? 'border-gray-800 hover:border-blue-500/50 cursor-pointer'
                      : 'border-gray-800 opacity-60'
                  }`}
                  onClick={() => canAfford && meetsLevel && openRedeemModal(reward)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg ${categoryInfo.bg} flex items-center justify-center`}>
                      <IconComponent className={`w-6 h-6 ${categoryInfo.color}`} />
                    </div>
                    {reward.stock !== null && (
                      <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                        {reward.remaining_stock} left
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-white mb-2">{reward.name}</h3>
                  <p className="text-sm text-gray-400 mb-4">{reward.description}</p>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`text-lg font-bold flex items-center gap-1 ${canAfford ? 'text-yellow-400' : 'text-gray-500'}`}>
                        <Star className="w-4 h-4" />
                        {reward.points_cost.toLocaleString()}
                      </span>
                      <span className={`text-xs block ${LEVEL_COLORS[reward.level_required]}`}>
                        {reward.level_required} required
                      </span>
                    </div>

                    {!meetsLevel ? (
                      <span className="text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        Level locked
                      </span>
                    ) : !canAfford ? (
                      <span className="text-xs text-gray-500">
                        Need {(reward.points_cost - userPoints).toLocaleString()} more
                      </span>
                    ) : (
                      <button className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors">
                        Redeem
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredRewards.length === 0 && (
            <div className="text-center py-12">
              <Gift className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No rewards found matching your criteria</p>
            </div>
          )}
        </>
      ) : (
        /* Redemption History */
        <div className="bg-[#1a1a2e] rounded-xl border border-gray-800">
          {redemptions.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No redemptions yet</p>
              <p className="text-sm text-gray-500">Start redeeming rewards to see them here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left text-sm font-medium text-gray-400 px-6 py-4">Reward</th>
                    <th className="text-left text-sm font-medium text-gray-400 px-6 py-4">Points</th>
                    <th className="text-left text-sm font-medium text-gray-400 px-6 py-4">Status</th>
                    <th className="text-left text-sm font-medium text-gray-400 px-6 py-4">Code</th>
                    <th className="text-left text-sm font-medium text-gray-400 px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {redemptions.map(redemption => (
                    <tr key={redemption.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-white">{redemption.reward_name}</p>
                          <p className="text-sm text-gray-500">{redemption.reward_category}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-yellow-400 font-medium flex items-center gap-1">
                          <Star className="w-4 h-4" />
                          {redemption.points_spent.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(redemption.status)}
                      </td>
                      <td className="px-6 py-4">
                        {redemption.redemption_code && !redemption.code_used ? (
                          <code className="bg-gray-800 px-2 py-1 rounded text-sm text-green-400">
                            {redemption.redemption_code}
                          </code>
                        ) : redemption.redemption_code && redemption.code_used ? (
                          <span className="text-gray-500 text-sm">Used</span>
                        ) : (
                          <span className="text-gray-500 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm">
                        {new Date(redemption.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Redeem Modal */}
      {showRedeemModal && selectedReward && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a2e] rounded-xl border border-gray-800 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Redeem Reward</h2>
                <button
                  onClick={() => setShowRedeemModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-start gap-4">
                <div className={`w-16 h-16 rounded-lg ${CATEGORY_INFO[selectedReward.category]?.bg || 'bg-gray-800'} flex items-center justify-center flex-shrink-0`}>
                  {(() => {
                    const IconComponent = CATEGORY_INFO[selectedReward.category]?.icon || Gift;
                    return <IconComponent className={`w-8 h-8 ${CATEGORY_INFO[selectedReward.category]?.color || 'text-gray-400'}`} />;
                  })()}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedReward.name}</h3>
                  <p className="text-gray-400">{selectedReward.description}</p>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Points Required</span>
                  <span className="text-yellow-400 font-bold flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    {selectedReward.points_cost.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-gray-400">Your Balance</span>
                  <span className="text-white font-medium">{userPoints.toLocaleString()}</span>
                </div>
                <div className="border-t border-gray-700 mt-3 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">After Redemption</span>
                    <span className="text-green-400 font-medium">
                      {(userPoints - selectedReward.points_cost).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {selectedReward.requires_shipping && (
                <div className="space-y-4">
                  <h4 className="font-medium text-white">Shipping Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm text-gray-400 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={shippingForm.name}
                        onChange={(e) => setShippingForm({...shippingForm, name: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm text-gray-400 mb-1">Address</label>
                      <input
                        type="text"
                        value={shippingForm.address}
                        onChange={(e) => setShippingForm({...shippingForm, address: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">City</label>
                      <input
                        type="text"
                        value={shippingForm.city}
                        onChange={(e) => setShippingForm({...shippingForm, city: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">State/Province</label>
                      <input
                        type="text"
                        value={shippingForm.state}
                        onChange={(e) => setShippingForm({...shippingForm, state: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">ZIP/Postal Code</label>
                      <input
                        type="text"
                        value={shippingForm.zip}
                        onChange={(e) => setShippingForm({...shippingForm, zip: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Country</label>
                      <input
                        type="text"
                        value={shippingForm.country}
                        onChange={(e) => setShippingForm({...shippingForm, country: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm text-gray-400 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={shippingForm.phone}
                        onChange={(e) => setShippingForm({...shippingForm, phone: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-800 flex gap-3">
              <button
                onClick={() => setShowRedeemModal(false)}
                className="flex-1 px-4 py-3 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRedeem}
                disabled={redeeming}
                className="flex-1 px-4 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {redeeming ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Confirm Redemption
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PointsRewardsPage;
