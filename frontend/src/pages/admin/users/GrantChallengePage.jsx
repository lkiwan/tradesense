import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { AdminLayout } from '../../../components/admin'
import { ArrowLeft, Gift, User, Trophy, DollarSign, Settings, Check } from 'lucide-react'
import { adminUsersAPI, adminChallengesAPI } from '../../../services/adminApi'

const GrantChallengePage = () => {
  const { id: userId } = useParams()
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [selectedModel, setSelectedModel] = useState(null)
  const [selectedSize, setSelectedSize] = useState(null)
  const [skipTrial, setSkipTrial] = useState(false)
  const [startFunded, setStartFunded] = useState(false)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    loadData()
  }, [userId])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load user and challenge models in parallel
      const [userResponse, modelsResponse] = await Promise.all([
        adminUsersAPI.getUser(userId),
        adminChallengesAPI.getChallengeModels()
      ])

      const userData = userResponse.data.user || userResponse.data
      setUser(userData)
      setModels(modelsResponse.data.models || [])
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
      // Mock data for development
      setUser({
        id: parseInt(userId),
        username: 'TestUser',
        email: 'test@example.com'
      })
      setModels([
        {
          id: 1,
          name: 'stellar_1step',
          display_name: 'Stellar 1-Step',
          phases: 1,
          phase1_profit_target: 10,
          max_daily_loss: 5,
          max_overall_loss: 10,
          account_sizes: [
            { id: 1, balance: 5000, price: 59 },
            { id: 2, balance: 10000, price: 99 },
            { id: 3, balance: 25000, price: 199 },
            { id: 4, balance: 50000, price: 299 },
            { id: 5, balance: 100000, price: 499 },
          ]
        },
        {
          id: 2,
          name: 'stellar_2step',
          display_name: 'Stellar 2-Step',
          phases: 2,
          phase1_profit_target: 8,
          phase2_profit_target: 5,
          max_daily_loss: 5,
          max_overall_loss: 10,
          account_sizes: [
            { id: 6, balance: 10000, price: 79 },
            { id: 7, balance: 25000, price: 159 },
            { id: 8, balance: 50000, price: 249 },
            { id: 9, balance: 100000, price: 399 },
          ]
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!selectedModel || !selectedSize) {
      toast.error('Please select a challenge model and account size')
      return
    }

    setSubmitting(true)
    try {
      await adminChallengesAPI.grantChallenge({
        user_id: parseInt(userId),
        model_id: selectedModel.id,
        account_size_id: selectedSize.id,
        skip_trial: skipTrial,
        start_funded: startFunded,
        notes: notes || 'Granted by admin'
      })

      toast.success('Challenge granted successfully!')
      navigate(`/admin/users/${userId}`)
    } catch (error) {
      console.error('Error granting challenge:', error)
      toast.error(error.response?.data?.error || 'Failed to grant challenge')
    } finally {
      setSubmitting(false)
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value)
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <button
          onClick={() => navigate(`/admin/users/${userId}`)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
          <span>Back to User</span>
        </button>

        {/* Header */}
        <div className="bg-dark-100 rounded-xl p-6 border border-dark-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Gift className="text-primary" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Grant Challenge</h1>
              <p className="text-gray-400">
                Create a challenge for <span className="text-primary">{user?.username}</span> ({user?.email})
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Select Challenge Model */}
          <div className="bg-dark-100 rounded-xl p-6 border border-dark-200">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Trophy size={20} className="text-primary" />
              Step 1: Select Challenge Model
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {models.map(model => (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => {
                    setSelectedModel(model)
                    setSelectedSize(null)
                  }}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    selectedModel?.id === model.id
                      ? 'border-primary bg-primary/10'
                      : 'border-dark-200 hover:border-dark-100 hover:bg-dark-200/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-white">{model.display_name}</span>
                    {selectedModel?.id === model.id && (
                      <Check size={18} className="text-primary" />
                    )}
                  </div>
                  <div className="text-sm text-gray-400 space-y-1">
                    <p>{model.phases} Phase{model.phases > 1 ? 's' : ''}</p>
                    <p>Target: {model.phase1_profit_target}%</p>
                    <p>Max DD: {model.max_overall_loss}%</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Select Account Size */}
          {selectedModel && (
            <div className="bg-dark-100 rounded-xl p-6 border border-dark-200">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <DollarSign size={20} className="text-green-500" />
                Step 2: Select Account Size
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {selectedModel.account_sizes?.map(size => (
                  <button
                    key={size.id}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      selectedSize?.id === size.id
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-dark-200 hover:border-dark-100 hover:bg-dark-200/50'
                    }`}
                  >
                    <div className="text-xl font-bold text-white">
                      {formatCurrency(size.balance)}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      Normal price: {formatCurrency(size.price)}
                    </div>
                    {selectedSize?.id === size.id && (
                      <Check size={16} className="text-green-500 mx-auto mt-2" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Options */}
          {selectedSize && (
            <div className="bg-dark-100 rounded-xl p-6 border border-dark-200">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Settings size={20} className="text-orange-500" />
                Step 3: Options
              </h2>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={skipTrial}
                    onChange={(e) => setSkipTrial(e.target.checked)}
                    className="w-5 h-5 rounded border-dark-200 bg-dark-200 text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="text-white">Skip Trial Phase</span>
                    <p className="text-sm text-gray-400">Start directly in evaluation phase</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={startFunded}
                    onChange={(e) => {
                      setStartFunded(e.target.checked)
                      if (e.target.checked) setSkipTrial(true)
                    }}
                    className="w-5 h-5 rounded border-dark-200 bg-dark-200 text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="text-white">Start as Funded</span>
                    <p className="text-sm text-gray-400">Skip all phases and start with funded account (VIP only)</p>
                  </div>
                </label>

                <div>
                  <label className="block text-white mb-2">Notes (optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Reason for granting this challenge..."
                    rows={3}
                    className="w-full px-4 py-3 bg-dark-200 border border-dark-100 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Summary & Submit */}
          {selectedSize && (
            <div className="bg-dark-100 rounded-xl p-6 border border-dark-200">
              <h2 className="text-lg font-semibold text-white mb-4">Summary</h2>
              <div className="bg-dark-200 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">User:</span>
                    <span className="text-white ml-2">{user?.username}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Challenge:</span>
                    <span className="text-white ml-2">{selectedModel?.display_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Account Size:</span>
                    <span className="text-white ml-2">{formatCurrency(selectedSize?.balance)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Starting Phase:</span>
                    <span className="text-white ml-2">
                      {startFunded ? 'Funded' : skipTrial ? 'Evaluation' : 'Trial'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-3 bg-primary text-black font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                    Granting Challenge...
                  </>
                ) : (
                  <>
                    <Gift size={18} />
                    Grant Challenge
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </AdminLayout>
  )
}

export default GrantChallengePage
