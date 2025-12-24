import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { X, ChevronRight, Gift, Zap, Sparkles } from 'lucide-react'
import api from '../../services/api'
import CountdownTimer from './CountdownTimer'

const EventBanner = ({ position = 'top', onClose }) => {
  const [banners, setBanners] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dismissed, setDismissed] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBanners()
  }, [])

  // Rotate banners if multiple
  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length)
      }, 8000)
      return () => clearInterval(interval)
    }
  }, [banners.length])

  const fetchBanners = async () => {
    try {
      const response = await api.get('/api/events/banners')
      const activeBanners = response.data.banners.filter(
        b => b.banner_position === position && !dismissed.includes(b.id)
      )
      setBanners(activeBanners)
    } catch (error) {
      console.error('Failed to fetch event banners:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = (bannerId) => {
    setDismissed([...dismissed, bannerId])
    setBanners(banners.filter(b => b.id !== bannerId))
    if (onClose) onClose(bannerId)
  }

  const trackClick = async (slug) => {
    try {
      await api.post(`/api/events/${slug}/click`)
    } catch (error) {
      console.error('Failed to track click:', error)
    }
  }

  if (loading || banners.length === 0) {
    return null
  }

  const banner = banners[currentIndex]

  // Get icon based on event type
  const getIcon = () => {
    const name = banner.name.toLowerCase()
    if (name.includes('flash') || name.includes('sale')) return <Zap className="animate-pulse" />
    if (name.includes('holiday') || name.includes('christmas')) return <Gift />
    return <Sparkles />
  }

  return (
    <div
      className="relative overflow-hidden"
      style={{
        backgroundColor: banner.background_color,
        color: banner.text_color
      }}
    >
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, ${banner.accent_color} 0%, transparent 50%),
                           radial-gradient(circle at 80% 50%, ${banner.accent_color} 0%, transparent 50%)`
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Content */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Icon */}
            <div
              className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full"
              style={{ backgroundColor: `${banner.accent_color}30` }}
            >
              <span style={{ color: banner.accent_color }}>{getIcon()}</span>
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{banner.name}</p>
              {banner.short_description && (
                <p className="text-sm opacity-80 truncate hidden sm:block">
                  {banner.short_description}
                </p>
              )}
            </div>

            {/* Countdown */}
            {banner.show_countdown && banner.time_remaining_seconds > 0 && (
              <div className="hidden md:block">
                <CountdownTimer
                  endDate={banner.end_date}
                  size="small"
                  variant="banner"
                  showLabels={false}
                />
              </div>
            )}

            {/* CTA Button */}
            {banner.has_landing_page && (
              <Link
                to={`/promo/${banner.slug}`}
                onClick={() => trackClick(banner.slug)}
                className="flex items-center gap-1 px-4 py-2 rounded-lg font-medium transition-all hover:scale-105 whitespace-nowrap"
                style={{
                  backgroundColor: banner.accent_color,
                  color: banner.text_color
                }}
              >
                View Offer
                <ChevronRight size={16} />
              </Link>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={() => handleDismiss(banner.id)}
            className="p-1 rounded-full hover:bg-white/10 transition-colors flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Multiple banners indicator */}
        {banners.length > 1 && (
          <div className="flex justify-center gap-1 mt-2">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentIndex ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default EventBanner
