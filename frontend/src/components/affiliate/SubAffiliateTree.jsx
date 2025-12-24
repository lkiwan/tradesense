import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Users, User, DollarSign, TrendingUp } from 'lucide-react';

const SubAffiliateTree = ({ subAffiliates = [], loading = false }) => {
  const [expandedNodes, setExpandedNodes] = useState({});

  const toggleNode = (id) => {
    setExpandedNodes(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (loading) {
    return (
      <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-dark-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-dark-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalSubReferrals = subAffiliates.reduce((sum, s) => sum + s.sub_referrals_count, 0);
  const totalTier2Revenue = subAffiliates.reduce((sum, s) => sum + s.tier2_revenue, 0);
  const totalTier2Commissions = subAffiliates.reduce((sum, s) => sum + s.tier2_commissions, 0);

  return (
    <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Sub-Affiliate Network</h3>
            <p className="text-sm text-gray-400">Your Tier 2 referral tree</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-lg font-bold text-white">{totalSubReferrals}</p>
            <p className="text-xs text-gray-400">Sub-Referrals</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-green-500">
              ${totalTier2Commissions.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-400">Tier 2 Earnings</p>
          </div>
        </div>
      </div>

      {subAffiliates.length === 0 ? (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No sub-affiliates yet</p>
          <p className="text-sm text-gray-500 mt-1">
            When your referrals refer others, you earn 5% Tier 2 commissions
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {subAffiliates.map((affiliate) => (
            <div
              key={affiliate.direct_referral.id}
              className="bg-dark-200/50 rounded-lg overflow-hidden"
            >
              {/* Direct Referral Header */}
              <button
                onClick={() => toggleNode(affiliate.direct_referral.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-dark-200/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {expandedNodes[affiliate.direct_referral.id] ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-white">
                      {affiliate.direct_referral.username}
                    </p>
                    <p className="text-xs text-gray-400">
                      Joined {affiliate.direct_referral.joined_at
                        ? new Date(affiliate.direct_referral.joined_at).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="font-semibold text-white">
                      {affiliate.sub_referrals_count}
                    </p>
                    <p className="text-xs text-gray-400">Sub-refs</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-500">
                      ${affiliate.tier2_commissions.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-400">Earned</p>
                  </div>
                </div>
              </button>

              {/* Sub-Referrals Expanded View */}
              {expandedNodes[affiliate.direct_referral.id] && affiliate.sub_referrals.length > 0 && (
                <div className="border-t border-dark-300 bg-dark-200/30">
                  <div className="px-4 py-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      Sub-Referrals ({affiliate.sub_referrals_count})
                    </p>
                  </div>
                  <div className="divide-y divide-dark-300">
                    {affiliate.sub_referrals.map((subRef) => (
                      <div
                        key={subRef.id}
                        className="flex items-center justify-between px-4 py-3 pl-14"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-purple-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">
                              {subRef.username}
                            </p>
                            <p className="text-xs text-gray-400">
                              {subRef.joined_at
                                ? new Date(subRef.joined_at).toLocaleDateString()
                                : 'N/A'}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          subRef.status === 'active'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {subRef.status}
                        </span>
                      </div>
                    ))}
                    {affiliate.sub_referrals_count > affiliate.sub_referrals.length && (
                      <div className="px-4 py-2 pl-14">
                        <p className="text-xs text-gray-500">
                          +{affiliate.sub_referrals_count - affiliate.sub_referrals.length} more sub-referrals
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* No sub-referrals message */}
              {expandedNodes[affiliate.direct_referral.id] && affiliate.sub_referrals.length === 0 && (
                <div className="border-t border-dark-300 bg-dark-200/30 p-4 pl-14">
                  <p className="text-sm text-gray-500">
                    This referral hasn't made any sub-referrals yet
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-purple-200 font-medium">How Tier 2 Works</p>
            <p className="text-xs text-purple-300/70 mt-1">
              When your direct referrals (Tier 1) refer new users who make purchases,
              you earn 5% of those sales as Tier 2 commissions. Build your network and
              earn passive income!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubAffiliateTree;
