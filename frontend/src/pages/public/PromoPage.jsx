import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Loader2, Gift, Zap, Clock, Tag, ChevronRight, Check,
  Sparkles, Calendar, Users, AlertCircle, ArrowRight
} from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import CountdownTimer from '../../components/events/CountdownTimer'
import toast from 'react-hot-toast'

const PromoPage = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [promoCode, setPromoCode] = useState('')
  const [validatingCode, setValidatingCode] = useState(false)
  const [codeResult, setCodeResult] = useState(null)

  useEffect(() => {
    fetchEvent()
  }, [slug])

  const fetchEvent = async () => {
    try {
      const response = await api.get(`/api/events/${slug}`)
      setEvent(response.data.event)
    } catch (err) {
      setError(err.response?.data?.error || 'Event not found')
    } finally {
      setLoading(false)
    }
  }

  const validatePromoCode = async () => {
    if (!promoCode.trim()) {
      toast.error('Please enter a promo code')
      return
    }

    setValidatingCode(true)
    try {
      const response = await api.post('/api/events/validate-code', {
        code: promoCode,
        amount: 299 // Example amount
      })

      setCodeResult(response.data)
      toast.success('Promo code is valid!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid promo code')
      setCodeResult(null)
    } finally {
      setValidatingCode(false)
    }
  }

  const handleGetOffer = (offerId) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/promo/${slug}` } })
      return
    }
    // Navigate to plans page with offer applied
    navigate('/plans', { state: { offerId, eventSlug: slug } })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-200">
        <Loader2 className="animate-spin text-primary-500" size={40} />
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-dark-200 p-4">
        <AlertCircle className="text-red-400 mb-4" size={48} />
        <h1 className="text-2xl font-bold text-white mb-2">Event Not Found</h1>
        <p className="text-gray-400 mb-6">{error || 'This promotion may have ended or does not exist.'}</p>
        <Link
          to="/plans"
          className="px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition"
        >
          View Our Plans
        </Link>
      </div>
    )
  }

  const isActive = event.is_active
  const isUpcoming = event.is_upcoming
  const isEnded = event.is_ended

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: event.background_color,
        color: event.text_color
      }}
    >
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background effects */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 30% 20%, ${event.accent_color} 0%, transparent 40%),
                             radial-gradient(circle at 70% 80%, ${event.accent_color} 0%, transparent 40%)`
          }}
        />

        {/* Content */}
        <div className="relative max-w-5xl mx-auto px-4 py-16 sm:py-24 text-center">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{ backgroundColor: `${event.accent_color}30` }}
          >
            {event.event_type === 'flash_sale' ? (
              <Zap size={18} style={{ color: event.accent_color }} />
            ) : (
              <Gift size={18} style={{ color: event.accent_color }} />
            )}
            <span className="font-medium capitalize">{event.event_type.replace('_', ' ')}</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            {event.name}
          </h1>

          {/* Description */}
          {event.description && (
            <p className="text-lg sm:text-xl opacity-90 max-w-2xl mx-auto mb-8">
              {event.description}
            </p>
          )}

          {/* Countdown or Status */}
          {isActive && event.show_countdown && (
            <div className="mb-8">
              <p className="text-sm opacity-70 mb-3">Offer ends in:</p>
              <div className="flex justify-center">
                <CountdownTimer
                  endDate={event.end_date}
                  size="large"
                  variant="banner"
                />
              </div>
            </div>
          )}

          {isUpcoming && (
            <div className="mb-8">
              <p className="text-sm opacity-70 mb-3">Starts in:</p>
              <div className="flex justify-center">
                <CountdownTimer
                  endDate={event.start_date}
                  size="large"
                  variant="banner"
                />
              </div>
            </div>
          )}

          {isEnded && (
            <div className="mb-8 px-6 py-4 bg-red-500/20 rounded-lg inline-block">
              <p className="text-red-300 font-medium">This promotion has ended</p>
            </div>
          )}

          {/* CTA */}
          {isActive && (
            <button
              onClick={() => handleGetOffer(event.offers[0]?.id)}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105"
              style={{
                backgroundColor: event.accent_color,
                color: event.text_color
              }}
            >
              Claim Your Discount
              <ArrowRight size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Offers Section */}
      {event.offers && event.offers.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-center mb-10">Available Offers</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {event.offers.map((offer) => (
              <div
                key={offer.id}
                className="rounded-2xl p-6 border border-white/10"
                style={{ backgroundColor: `${event.accent_color}10` }}
              >
                {/* Discount badge */}
                <div
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold mb-4"
                  style={{
                    backgroundColor: event.accent_color,
                    color: event.text_color
                  }}
                >
                  <Tag size={14} />
                  {offer.discount_type === 'percentage'
                    ? `${offer.discount_value}% OFF`
                    : `$${offer.discount_value} OFF`
                  }
                </div>

                <h3 className="text-xl font-bold mb-2">{offer.name}</h3>
                {offer.description && (
                  <p className="opacity-70 mb-4">{offer.description}</p>
                )}

                {/* Offer details */}
                <div className="space-y-2 mb-6">
                  {offer.applies_to !== 'all' && (
                    <p className="text-sm opacity-70">
                      Applies to: <span className="capitalize">{offer.applies_to}</span>
                    </p>
                  )}
                  {offer.min_purchase_amount && (
                    <p className="text-sm opacity-70">
                      Min. purchase: ${offer.min_purchase_amount}
                    </p>
                  )}
                  {offer.bonus_points && (
                    <p className="text-sm flex items-center gap-1">
                      <Sparkles size={14} style={{ color: event.accent_color }} />
                      +{offer.bonus_points} bonus points
                    </p>
                  )}
                  {offer.bonus_days && (
                    <p className="text-sm flex items-center gap-1">
                      <Calendar size={14} style={{ color: event.accent_color }} />
                      +{offer.bonus_days} extra days
                    </p>
                  )}
                </div>

                {/* Promo code or action */}
                {offer.requires_code && offer.promo_code ? (
                  <div className="space-y-2">
                    <p className="text-xs opacity-70">Use code at checkout:</p>
                    <div
                      className="px-4 py-2 rounded-lg font-mono font-bold text-center border-2 border-dashed"
                      style={{ borderColor: event.accent_color }}
                    >
                      {offer.promo_code}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleGetOffer(offer.id)}
                    disabled={!isActive}
                    className="w-full py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                    style={{
                      backgroundColor: isActive ? event.accent_color : 'rgba(255,255,255,0.1)',
                      color: event.text_color
                    }}
                  >
                    {isActive ? 'Get This Offer' : 'Offer Unavailable'}
                  </button>
                )}

                {/* Remaining */}
                {offer.max_redemptions && (
                  <p className="text-xs opacity-50 text-center mt-3">
                    <Users size={12} className="inline mr-1" />
                    {offer.max_redemptions - offer.current_redemptions} remaining
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Promo Code Validator */}
      {isActive && (
        <div className="max-w-xl mx-auto px-4 pb-16">
          <div
            className="rounded-2xl p-6 border border-white/10"
            style={{ backgroundColor: `${event.accent_color}05` }}
          >
            <h3 className="text-lg font-bold mb-4 text-center">Have a Promo Code?</h3>

            <div className="flex gap-3">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Enter promo code"
                className="flex-1 px-4 py-3 rounded-lg bg-black/20 border border-white/10 text-center font-mono uppercase placeholder:normal-case"
              />
              <button
                onClick={validatePromoCode}
                disabled={validatingCode}
                className="px-6 py-3 rounded-lg font-medium"
                style={{ backgroundColor: event.accent_color }}
              >
                {validatingCode ? <Loader2 className="animate-spin" size={20} /> : 'Apply'}
              </button>
            </div>

            {codeResult && codeResult.valid && (
              <div className="mt-4 p-4 rounded-lg bg-green-500/20 border border-green-500/30">
                <div className="flex items-center gap-2 text-green-400 font-medium">
                  <Check size={18} />
                  Code valid! You save ${codeResult.savings?.toFixed(2)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Landing page content */}
      {event.has_landing_page && event.landing_page_content && (
        <div className="max-w-4xl mx-auto px-4 pb-16">
          <div
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: event.landing_page_content }}
          />
        </div>
      )}

      {/* Stats */}
      <div
        className="py-12"
        style={{ backgroundColor: `${event.accent_color}10` }}
      >
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold" style={{ color: event.accent_color }}>
                {event.current_redemptions || 0}+
              </div>
              <div className="text-sm opacity-70">Traders Joined</div>
            </div>
            <div>
              <div className="text-3xl font-bold" style={{ color: event.accent_color }}>
                {event.offers?.reduce((sum, o) => sum + (o.discount_value || 0), 0) || 0}%
              </div>
              <div className="text-sm opacity-70">Max Savings</div>
            </div>
            <div>
              <div className="text-3xl font-bold" style={{ color: event.accent_color }}>
                {event.offers?.length || 0}
              </div>
              <div className="text-sm opacity-70">Offers Available</div>
            </div>
            <div>
              <div className="text-3xl font-bold" style={{ color: event.accent_color }}>
                24/7
              </div>
              <div className="text-sm opacity-70">Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      {isActive && (
        <div className="py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Don't Miss Out!</h2>
          <p className="opacity-70 mb-8 max-w-xl mx-auto">
            Start your trading journey with exclusive savings. Limited time offer.
          </p>
          <Link
            to="/plans"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105"
            style={{
              backgroundColor: event.accent_color,
              color: event.text_color
            }}
          >
            View All Plans
            <ChevronRight size={20} />
          </Link>
        </div>
      )}
    </div>
  )
}

export default PromoPage
