import React, { useState, useEffect } from 'react';
import {
  Crown, Check, Star, ArrowRight, CreditCard, Calendar,
  Zap, Users, BookOpen, TrendingUp, Shield, Clock,
  AlertCircle, RefreshCw, ExternalLink, Receipt
} from 'lucide-react';
import api from '../../services/api';

const SubscriptionsPage = () => {
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterval, setSelectedInterval] = useState('monthly');
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('plans');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansRes, subRes, invoicesRes] = await Promise.all([
        api.get('/premium/plans'),
        api.get('/premium/my-subscription'),
        api.get('/premium/invoices')
      ]);
      setPlans(plansRes.data.plans || []);
      setCurrentSubscription(subRes.data.subscription);
      setInvoices(invoicesRes.data.invoices || invoicesRes.data.stripe_invoices || []);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planSlug) => {
    try {
      setProcessing(true);
      const response = await api.post('/premium/subscribe', {
        plan_slug: planSlug,
        interval: selectedInterval
      });

      if (response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      alert(error.response?.data?.error || 'Failed to start subscription');
    } finally {
      setProcessing(false);
    }
  };

  const handleChangePlan = async (planSlug) => {
    if (!window.confirm('Are you sure you want to change your plan? You will be charged the difference.')) {
      return;
    }

    try {
      setProcessing(true);
      await api.post('/premium/change-plan', {
        plan_slug: planSlug,
        interval: selectedInterval
      });
      await fetchData();
      alert('Plan changed successfully!');
    } catch (error) {
      console.error('Error changing plan:', error);
      alert(error.response?.data?.error || 'Failed to change plan');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    const reason = window.prompt('Please tell us why you\'re canceling (optional):');

    if (!window.confirm('Are you sure you want to cancel? You will keep access until the end of your billing period.')) {
      return;
    }

    try {
      setProcessing(true);
      await api.post('/premium/cancel', { reason });
      await fetchData();
      alert('Subscription will cancel at the end of your billing period.');
    } catch (error) {
      console.error('Error canceling:', error);
      alert(error.response?.data?.error || 'Failed to cancel subscription');
    } finally {
      setProcessing(false);
    }
  };

  const handleResumeSubscription = async () => {
    try {
      setProcessing(true);
      await api.post('/premium/resume');
      await fetchData();
      alert('Subscription resumed!');
    } catch (error) {
      console.error('Error resuming:', error);
      alert(error.response?.data?.error || 'Failed to resume subscription');
    } finally {
      setProcessing(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      setProcessing(true);
      const response = await api.post('/premium/billing-portal');
      if (response.data.url) {
        window.open(response.data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening billing portal:', error);
      alert(error.response?.data?.error || 'Failed to open billing portal');
    } finally {
      setProcessing(false);
    }
  };

  const getFeatureIcon = (feature) => {
    if (feature.toLowerCase().includes('signal')) return <TrendingUp className="w-4 h-4" />;
    if (feature.toLowerCase().includes('room') || feature.toLowerCase().includes('community')) return <Users className="w-4 h-4" />;
    if (feature.toLowerCase().includes('mentor') || feature.toLowerCase().includes('session')) return <BookOpen className="w-4 h-4" />;
    if (feature.toLowerCase().includes('priority') || feature.toLowerCase().includes('support')) return <Shield className="w-4 h-4" />;
    if (feature.toLowerCase().includes('indicator')) return <Zap className="w-4 h-4" />;
    return <Check className="w-4 h-4" />;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getIntervalLabel = (interval) => {
    switch (interval) {
      case 'monthly': return '/month';
      case 'quarterly': return '/quarter';
      case 'yearly': return '/year';
      default: return '';
    }
  };

  const getSavingsPercent = (plan) => {
    if (selectedInterval === 'quarterly' && plan.pricing.quarterly) {
      const monthlyTotal = plan.pricing.monthly * 3;
      const savings = ((monthlyTotal - plan.pricing.quarterly) / monthlyTotal) * 100;
      return Math.round(savings);
    }
    if (selectedInterval === 'yearly' && plan.pricing.yearly) {
      const monthlyTotal = plan.pricing.monthly * 12;
      const savings = ((monthlyTotal - plan.pricing.yearly) / monthlyTotal) * 100;
      return Math.round(savings);
    }
    return 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Crown className="w-7 h-7 text-yellow-500" />
            Premium Subscriptions
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Unlock advanced trading features and signals
          </p>
        </div>
        {currentSubscription && (
          <button
            onClick={handleManageBilling}
            disabled={processing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <CreditCard className="w-4 h-4" />
            Manage Billing
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {['plans', 'subscription', 'invoices'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              {tab === 'subscription' ? 'My Subscription' : tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Current Subscription Banner */}
      {currentSubscription && activeTab === 'plans' && (
        <div className={`p-4 rounded-xl ${
          currentSubscription.is_active
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                currentSubscription.is_active
                  ? 'bg-green-100 dark:bg-green-800'
                  : 'bg-yellow-100 dark:bg-yellow-800'
              }`}>
                <Crown className={`w-5 h-5 ${
                  currentSubscription.is_active
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-yellow-600 dark:text-yellow-400'
                }`} />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {currentSubscription.plan?.name || 'Premium'} - {currentSubscription.billing_interval}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentSubscription.is_trialing
                    ? `Trial ends in ${currentSubscription.trial_days_remaining} days`
                    : currentSubscription.cancel_at_period_end
                      ? 'Cancels at period end'
                      : `Renews on ${new Date(currentSubscription.current_period_end).toLocaleDateString()}`
                  }
                </p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              currentSubscription.is_active
                ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-300'
                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-300'
            }`}>
              {currentSubscription.status}
            </span>
          </div>
        </div>
      )}

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <>
          {/* Billing Interval Toggle */}
          <div className="flex justify-center">
            <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl inline-flex">
              {['monthly', 'quarterly', 'yearly'].map((interval) => (
                <button
                  key={interval}
                  onClick={() => setSelectedInterval(interval)}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedInterval === interval
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {interval.charAt(0).toUpperCase() + interval.slice(1)}
                  {interval === 'yearly' && (
                    <span className="ml-2 text-xs text-green-600 dark:text-green-400">Save up to 25%</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => {
              const price = plan.pricing[selectedInterval] || plan.pricing.monthly;
              const savings = getSavingsPercent(plan);
              const isCurrentPlan = currentSubscription?.plan?.slug === plan.slug;

              return (
                <div
                  key={plan.id}
                  className={`relative bg-white dark:bg-gray-800 rounded-2xl border-2 transition-all hover:shadow-xl ${
                    plan.is_featured
                      ? 'border-blue-500 shadow-lg scale-[1.02]'
                      : isCurrentPlan
                        ? 'border-green-500'
                        : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {/* Featured Badge */}
                  {plan.is_featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-blue-500 text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3" /> MOST POPULAR
                      </span>
                    </div>
                  )}

                  {/* Current Plan Badge */}
                  {isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-green-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                        CURRENT PLAN
                      </span>
                    </div>
                  )}

                  <div className="p-6">
                    {/* Plan Header */}
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {plan.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {plan.description}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="text-center mb-6">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">
                          {formatPrice(price)}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {getIntervalLabel(selectedInterval)}
                        </span>
                      </div>
                      {savings > 0 && (
                        <span className="text-sm text-green-600 dark:text-green-400">
                          Save {savings}%
                        </span>
                      )}
                      {plan.trial_days > 0 && !currentSubscription && (
                        <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                          {plan.trial_days}-day free trial
                        </p>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <span className="text-green-500">
                            {getFeatureIcon(feature)}
                          </span>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <button
                      onClick={() => isCurrentPlan ? null : currentSubscription?.is_active ? handleChangePlan(plan.slug) : handleSubscribe(plan.slug)}
                      disabled={processing || isCurrentPlan}
                      className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                        isCurrentPlan
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                          : plan.is_featured
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white'
                      }`}
                    >
                      {processing ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : isCurrentPlan ? (
                        'Current Plan'
                      ) : currentSubscription?.is_active ? (
                        <>Switch Plan <ArrowRight className="w-4 h-4" /></>
                      ) : (
                        <>Get Started <ArrowRight className="w-4 h-4" /></>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* My Subscription Tab */}
      {activeTab === 'subscription' && (
        <div className="max-w-2xl mx-auto">
          {currentSubscription ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Subscription Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl">
                      <Crown className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {currentSubscription.plan?.name || 'Premium Subscription'}
                      </h2>
                      <p className="text-gray-500 dark:text-gray-400">
                        Billed {currentSubscription.billing_interval}
                      </p>
                    </div>
                  </div>
                  <span className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                    currentSubscription.status === 'active' || currentSubscription.status === 'trialing'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : currentSubscription.status === 'past_due'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {currentSubscription.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Subscription Details */}
              <div className="p-6 space-y-4">
                {currentSubscription.is_trialing && (
                  <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Trial Period</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {currentSubscription.trial_days_remaining} days remaining
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Current Period</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {currentSubscription.current_period_start
                        ? new Date(currentSubscription.current_period_start).toLocaleDateString()
                        : 'N/A'
                      } - {currentSubscription.current_period_end
                        ? new Date(currentSubscription.current_period_end).toLocaleDateString()
                        : 'N/A'
                      }
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {currentSubscription.cancel_at_period_end ? 'Access Until' : 'Next Billing'}
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {currentSubscription.current_period_end
                        ? new Date(currentSubscription.current_period_end).toLocaleDateString()
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>

                {currentSubscription.cancel_at_period_end && (
                  <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">Subscription Canceling</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Your subscription will end on {new Date(currentSubscription.current_period_end).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={handleResumeSubscription}
                      disabled={processing}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      Resume
                    </button>
                  </div>
                )}

                {/* Plan Features */}
                {currentSubscription.plan && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Included Features</p>
                    <div className="grid grid-cols-2 gap-2">
                      {currentSubscription.plan.feature_gates && Object.entries(currentSubscription.plan.feature_gates)
                        .filter(([key, value]) => value === true)
                        .map(([key]) => (
                          <div key={key} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <Check className="w-4 h-4 text-green-500" />
                            {key.replace('has_', '').replace(/_/g, ' ')}
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleManageBilling}
                    disabled={processing}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <CreditCard className="w-4 h-4" />
                    Manage Billing
                  </button>
                  {!currentSubscription.cancel_at_period_end && (
                    <button
                      onClick={handleCancelSubscription}
                      disabled={processing}
                      className="px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                    >
                      Cancel Subscription
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Active Subscription
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Subscribe to unlock premium features and trading signals
              </p>
              <button
                onClick={() => setActiveTab('plans')}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                View Plans
              </button>
            </div>
          )}
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Billing History
            </h3>
          </div>

          {invoices.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${
                      invoice.status === 'paid'
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : invoice.status === 'failed'
                          ? 'bg-red-100 dark:bg-red-900/30'
                          : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      <Receipt className={`w-4 h-4 ${
                        invoice.status === 'paid'
                          ? 'text-green-600 dark:text-green-400'
                          : invoice.status === 'failed'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-gray-600 dark:text-gray-400'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {invoice.number || `Invoice #${invoice.id}`}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {invoice.created_at ? new Date(invoice.created_at).toLocaleDateString() : invoice.created}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatPrice(invoice.amount || invoice.amount_due || 0)}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        invoice.status === 'paid'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : invoice.status === 'failed'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {invoice.status}
                      </span>
                    </div>
                    {(invoice.invoice_pdf_url || invoice.invoice_pdf) && (
                      <a
                        href={invoice.invoice_pdf_url || invoice.invoice_pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Receipt className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No invoices yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SubscriptionsPage;
