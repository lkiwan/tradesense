import { useState, useEffect } from 'react'
import { marketAPI } from '../services/api'
import { Circle } from 'lucide-react'

const MarketStatus = () => {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  const fetchStatus = async () => {
    try {
      const response = await marketAPI.getMarketStatus()
      setStatus(response.data)
    } catch (error) {
      console.log('Failed to fetch market status')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (marketStatus) => {
    switch (marketStatus) {
      case 'open':
        return 'text-green-500'
      case 'pre-market':
      case 'after-hours':
        return 'text-yellow-500'
      case 'closed':
        return 'text-red-500'
      default:
        return 'text-gray-400'
    }
  }

  const getStatusBg = (marketStatus) => {
    switch (marketStatus) {
      case 'open':
        return 'bg-green-500'
      case 'pre-market':
      case 'after-hours':
        return 'bg-yellow-500'
      case 'closed':
        return 'bg-red-500'
      default:
        return 'bg-gray-400'
    }
  }

  const formatStatus = (marketStatus) => {
    switch (marketStatus) {
      case 'open':
        return 'Open'
      case 'pre-market':
        return 'Pre-Market'
      case 'after-hours':
        return 'After Hours'
      case 'closed':
        return 'Closed'
      default:
        return 'Unknown'
    }
  }

  if (loading || !status) {
    return null
  }

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-gray-100 dark:bg-dark-200 rounded-lg text-sm">
      {/* US Market */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${getStatusBg(status.us.status)} animate-pulse`} />
        <span className="text-gray-500 dark:text-gray-400">US:</span>
        <span className={`font-medium ${getStatusColor(status.us.status)}`}>
          {formatStatus(status.us.status)}
        </span>
      </div>

      {/* Crypto */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${getStatusBg(status.crypto.status)}`} />
        <span className="text-gray-500 dark:text-gray-400">Crypto:</span>
        <span className={`font-medium ${getStatusColor(status.crypto.status)}`}>
          {formatStatus(status.crypto.status)}
        </span>
      </div>

      {/* Morocco */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${getStatusBg(status.morocco.status)}`} />
        <span className="text-gray-500 dark:text-gray-400">Morocco:</span>
        <span className={`font-medium ${getStatusColor(status.morocco.status)}`}>
          {formatStatus(status.morocco.status)}
        </span>
      </div>
    </div>
  )
}

export default MarketStatus
