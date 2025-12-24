import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Rocket, Check, Star, Zap, Shield, Clock, DollarSign, TrendingUp, ArrowRight } from 'lucide-react'
import { challengeModelsAPI } from '../../services/api'
import { useChallenge } from '../../context/ChallengeContext'

const PlansPage = () => {
  const { hasActiveChallenge, challenge } = useChallenge()
  const [models, setModels] = useState([])
  const [selectedModel, setSelectedModel] = useState(null)
  const [selectedSize, setSelectedSize] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchModels()
  }, [])

  const fetchModels = async () => {
    try {
      const response = await challengeModelsAPI.getAll()
      setModels(response.data.models || [])
      if (response.data.models?.length > 0) {
        setSelectedModel(response.data.models[0])
        if (response.data.models[0].sizes?.length > 0) {
          setSelectedSize(response.data.models[0].sizes[1] || response.data.models[0].sizes[0])
        }
      }
    } catch (error) {
      console.error('Error fetching models:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleModelSelect = (model) => {
    setSelectedModel(model)
    if (model.sizes?.length > 0) {
      setSelectedSize(model.sizes[1] || model.sizes[0])
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Choose Your Trading Challenge
        </h1>
        <p className="text-gray-400 text-lg">
          Select a challenge model and account size that matches your trading style.
          Pass the evaluation and become a funded trader.
        </p>
      </div>

      {/* Active Challenge Notice */}
      {hasActiveChallenge && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <TrendingUp className="text-white" size={20} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white">You have an active challenge</h3>
            <p className="text-sm text-gray-400">
              Currently in {challenge?.phase} phase with ${challenge?.current_balance?.toLocaleString()} balance
            </p>
          </div>
          <Link
            to="/accounts"
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      )}

      {/* Challenge Models */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {models.map(model => (
          <button
            key={model.id}
            onClick={() => handleModelSelect(model)}
            className={`relative p-6 rounded-xl border-2 transition-all text-left ${
              selectedModel?.id === model.id
                ? 'border-primary-500 bg-primary-500/10'
                : 'border-dark-200 bg-dark-100 hover:border-dark-100'
            }`}
          >
            {model.is_popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-yellow-500 text-yellow-900 text-xs font-bold rounded-full">
                MOST POPULAR
              </span>
            )}
            <div className={`w-12 h-12 rounded-lg mb-4 flex items-center justify-center`} style={{ backgroundColor: model.badge_color + '20' }}>
              <Zap size={24} style={{ color: model.badge_color }} />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">{model.display_name}</h3>
            <p className="text-sm text-gray-400 mb-4">{model.description || `${model.phases}-Phase Evaluation`}</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <Check size={16} className="text-green-500" />
                <span>Profit Target: {model.phase1_profit_target}%</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Check size={16} className="text-green-500" />
                <span>Max Daily Loss: {model.max_daily_loss}%</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Check size={16} className="text-green-500" />
                <span>Profit Split: {model.default_profit_split}%</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Account Sizes */}
      {selectedModel && (
        <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Select Account Size</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {selectedModel.sizes?.map(size => (
              <button
                key={size.id}
                onClick={() => setSelectedSize(size)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedSize?.id === size.id
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-dark-200 hover:border-dark-100'
                }`}
              >
                <p className="text-lg font-bold text-white">${size.balance.toLocaleString()}</p>
                <p className="text-sm text-gray-400 mt-1">
                  {size.is_on_sale ? (
                    <>
                      <span className="line-through">${size.price}</span>
                      <span className="text-green-500 ml-1">${size.sale_price}</span>
                    </>
                  ) : (
                    `$${size.price}`
                  )}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Summary & CTA */}
      {selectedModel && selectedSize && (
        <div className="bg-gradient-to-r from-primary-500/10 to-purple-500/10 rounded-xl border border-primary-500/30 p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">
                {selectedModel.display_name} - ${selectedSize.balance.toLocaleString()} Account
              </h3>
              <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <Shield size={14} className="text-primary-400" />
                  {selectedModel.phases}-Phase Evaluation
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp size={14} className="text-green-400" />
                  {selectedModel.default_profit_split}% Profit Split
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={14} className="text-blue-400" />
                  No Time Limit
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-400">Total Price</p>
                <p className="text-2xl font-bold text-white">
                  ${selectedSize.is_on_sale ? selectedSize.sale_price : selectedSize.price}
                </p>
              </div>
              <Link
                to={`/checkout/${selectedModel.name}?size=${selectedSize.id}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold transition-all"
              >
                <Rocket size={20} />
                Start Challenge
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Free Trial CTA */}
      {!hasActiveChallenge && (
        <div className="bg-dark-100 rounded-xl border border-dark-200 p-6 text-center">
          <h3 className="text-lg font-semibold text-white mb-2">Not ready to commit?</h3>
          <p className="text-gray-400 mb-4">Try our 7-day free trial with a $5,000 demo account</p>
          <Link
            to="/free-trial"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition-all"
          >
            <Star size={20} />
            Start Free Trial
          </Link>
        </div>
      )}
    </div>
  )
}

export default PlansPage
