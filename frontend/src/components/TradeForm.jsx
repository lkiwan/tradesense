import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { tradesAPI, marketAPI } from '../services/api'
import { useSocket } from '../context/SocketContext'
import { showErrorToast, showSuccessToast } from '../utils/errorHandler'
import { TrendingUp, TrendingDown, Loader2, Wifi, WifiOff, Search } from 'lucide-react'

// All Moroccan stocks for search
const ALL_MOROCCAN = {
  'IAM': 'Maroc Telecom', 'ATW': 'Attijariwafa Bank', 'BCP': 'Banque Centrale Populaire',
  'CIH': 'CIH Bank', 'BOA': 'Bank of Africa', 'HPS': 'HPS', 'MNG': 'Managem',
  'LBV': 'Label Vie', 'TQM': 'Taqa Morocco', 'MSA': 'Marsa Maroc', 'CDM': 'Crédit du Maroc',
  'CMA': 'Ciments du Maroc', 'CSR': 'Cosumar', 'LHM': 'Lesieur Cristal', 'WAA': 'Wafa Assurance',
  'SAH': 'Saham Assurance', 'SID': 'Sonasid', 'SMI': 'SMI', 'GAZ': 'Afriquia Gaz',
  'TMA': 'Total Maroc', 'ADH': 'Addoha', 'RDS': 'Résidences Dar Saada', 'ALM': 'Alliances',
  'CFG': 'CFG Bank', 'BCI': 'BMCI', 'OUL': 'Oulmès', 'CTM': 'CTM', 'DYT': 'Delta Holding',
  'NEJ': 'Nexans', 'M2M': 'M2M Group', 'ARD': 'Aradei Capital', 'IMO': 'Immorente',
  'FBR': 'Fenie Brossette', 'STR': 'Stroc Industrie', 'PRO': 'Promopharm', 'EQD': 'Eqdom',
  'MAB': 'Maroc Leasing', 'SLF': 'Salafin', 'RIS': 'Risma', 'ATH': 'Auto Hall'
}

// Format price based on asset type
const formatPrice = (price, symbol) => {
  if (price === null || price === undefined) return '-'

  if (symbol.endsWith('-USD')) {
    // Crypto - use appropriate precision
    if (price < 0.01) return price.toFixed(8)
    if (price < 1) return price.toFixed(6)
    if (price < 100) return price.toFixed(4)
    return price.toFixed(2)
  }
  // Stocks - 2 decimals
  return price.toFixed(2)
}

const TradeForm = ({ challenge, onTradeComplete }) => {
  const { t } = useTranslation()
  const { prices, subscribeToPrices, isConnected } = useSocket()
  const [symbol, setSymbol] = useState('AAPL')
  const [quantity, setQuantity] = useState('')
  const [tradeType, setTradeType] = useState('buy')
  const [loading, setLoading] = useState(false)
  const [manualPrice, setManualPrice] = useState(null)
  const [fetchingPrice, setFetchingPrice] = useState(false)

  // Get price from WebSocket or manual fetch
  const socketPrice = prices[symbol]?.price
  const currentPrice = socketPrice || manualPrice

  // Subscribe to symbol prices when connected
  useEffect(() => {
    if (isConnected) {
      subscribeToPrices([symbol])
    }
  }, [symbol, isConnected, subscribeToPrices])

  // Fetch price manually if WebSocket not available
  useEffect(() => {
    if (!socketPrice && symbol) {
      fetchPrice(symbol)
    }
  }, [symbol, socketPrice])

  const symbolGroups = {
    'US Stocks': [
      { value: 'AAPL', label: 'Apple (AAPL)' },
      { value: 'TSLA', label: 'Tesla (TSLA)' },
      { value: 'GOOGL', label: 'Google (GOOGL)' },
      { value: 'MSFT', label: 'Microsoft (MSFT)' },
      { value: 'AMZN', label: 'Amazon (AMZN)' },
      { value: 'META', label: 'Meta (META)' },
      { value: 'NVDA', label: 'NVIDIA (NVDA)' },
      { value: 'NFLX', label: 'Netflix (NFLX)' },
      { value: 'AMD', label: 'AMD (AMD)' },
      { value: 'JPM', label: 'JPMorgan (JPM)' },
      { value: 'V', label: 'Visa (V)' },
      { value: 'DIS', label: 'Disney (DIS)' }
    ],
    'Crypto': [
      { value: 'BTC-USD', label: 'Bitcoin (BTC)' },
      { value: 'ETH-USD', label: 'Ethereum (ETH)' },
      { value: 'XRP-USD', label: 'Ripple (XRP)' },
      { value: 'SOL-USD', label: 'Solana (SOL)' },
      { value: 'ADA-USD', label: 'Cardano (ADA)' },
      { value: 'DOGE-USD', label: 'Dogecoin (DOGE)' },
      { value: 'DOT-USD', label: 'Polkadot (DOT)' },
      { value: 'LINK-USD', label: 'Chainlink (LINK)' },
      { value: 'AVAX-USD', label: 'Avalanche (AVAX)' },
      { value: 'LTC-USD', label: 'Litecoin (LTC)' }
    ],
    'Morocco 🇲🇦': [
      { value: 'IAM', label: 'Maroc Telecom (IAM)' },
      { value: 'ATW', label: 'Attijariwafa Bank (ATW)' },
      { value: 'BCP', label: 'Banque Centrale Pop (BCP)' },
      { value: 'CIH', label: 'CIH Bank (CIH)' },
      { value: 'BOA', label: 'Bank of Africa (BOA)' },
      { value: 'MNG', label: 'Managem (MNG)' },
      { value: 'LBV', label: 'Label Vie (LBV)' },
      { value: 'HPS', label: 'HPS (HPS)' }
    ]
  }

  // State for Moroccan search
  const [moroccanSearch, setMoroccanSearch] = useState('')
  const [showMoroccanDropdown, setShowMoroccanDropdown] = useState(false)

  // Filter Moroccan stocks based on search
  const filteredMoroccan = Object.entries(ALL_MOROCCAN).filter(([sym, name]) => {
    if (!moroccanSearch) return false
    const search = moroccanSearch.toLowerCase()
    return sym.toLowerCase().includes(search) || name.toLowerCase().includes(search)
  }).slice(0, 6)

  const fetchPrice = async (sym) => {
    try {
      setFetchingPrice(true)
      const response = await marketAPI.getPrice(sym)
      setManualPrice(response.data.price)
    } catch (error) {
      console.error('Error fetching price:', error)
      // Mock prices for demo (fallback)
      const mockPrices = {
        // US Stocks
        'AAPL': 178.50, 'TSLA': 245.20, 'GOOGL': 142.80, 'MSFT': 378.90,
        'AMZN': 185.50, 'META': 505.30, 'NVDA': 495.80, 'NFLX': 485.20,
        'AMD': 145.60, 'JPM': 195.40, 'V': 275.80, 'DIS': 92.40,
        // Crypto
        'BTC-USD': 45230.00, 'ETH-USD': 2480.00, 'XRP-USD': 0.52,
        'SOL-USD': 98.50, 'ADA-USD': 0.45, 'DOGE-USD': 0.085,
        'DOT-USD': 7.25, 'LINK-USD': 14.50, 'AVAX-USD': 35.80, 'LTC-USD': 72.50,
        // Morocco (in MAD) - Real prices from Casablanca Bourse
        'IAM': 107.90, 'ATW': 718.00, 'BCP': 277.00, 'CIH': 415.00,
        'BOA': 212.00, 'MNG': 6350.00, 'LBV': 4450.00, 'HPS': 550.00,
        'TQM': 1250.00, 'MSA': 380.00, 'CDM': 650.00, 'CSR': 205.00
      }
      setManualPrice(mockPrices[sym] || 100)
    } finally {
      setFetchingPrice(false)
    }
  }

  const handleSymbolChange = (e) => {
    const newSymbol = e.target.value
    setSymbol(newSymbol)
    setManualPrice(null) // Reset manual price, will use WebSocket or fetch new
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!quantity || parseFloat(quantity) <= 0) {
      showErrorToast(null, 'Please enter a valid quantity')
      return
    }

    const tradeValue = parseFloat(quantity) * (currentPrice || 0)
    if (tradeValue > parseFloat(challenge.current_balance)) {
      showErrorToast(null, `Insufficient balance. You need $${tradeValue.toFixed(2)} but have $${parseFloat(challenge.current_balance).toFixed(2)}`)
      return
    }

    try {
      setLoading(true)
      const response = await tradesAPI.open({
        symbol,
        trade_type: tradeType,
        quantity: parseFloat(quantity)
      })

      showSuccessToast(`Trade opened: ${tradeType.toUpperCase()} ${quantity} ${symbol} at $${currentPrice?.toFixed(2)}`)
      setQuantity('')
      if (onTradeComplete) {
        onTradeComplete(response.data)
      }
    } catch (error) {
      showErrorToast(error)
    } finally {
      setLoading(false)
    }
  }

  const tradeValue = quantity && currentPrice ? (parseFloat(quantity) * currentPrice).toFixed(2) : '0.00'

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-dark-100 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        {t('dashboard.openTrade')}
      </h3>

      {/* Trade Type Toggle */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        <button
          type="button"
          onClick={() => setTradeType('buy')}
          className={`flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all
            ${tradeType === 'buy'
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 dark:bg-dark-200 text-gray-600 dark:text-gray-400'
            }`}
        >
          <TrendingUp size={20} />
          {t('dashboard.buy')}
        </button>
        <button
          type="button"
          onClick={() => setTradeType('sell')}
          className={`flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all
            ${tradeType === 'sell'
              ? 'bg-red-500 text-white'
              : 'bg-gray-100 dark:bg-dark-200 text-gray-600 dark:text-gray-400'
            }`}
        >
          <TrendingDown size={20} />
          {t('dashboard.sell')}
        </button>
      </div>

      {/* Symbol Select */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('dashboard.symbol')}
        </label>
        <select
          value={symbol}
          onChange={handleSymbolChange}
          className="input"
        >
          {Object.entries(symbolGroups).map(([groupName, symbols]) => (
            <optgroup key={groupName} label={groupName}>
              {symbols.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        {/* Search for more Moroccan stocks */}
        <div className="relative mt-2">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-dark-200 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700 focus-within:border-green-500">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={moroccanSearch}
              onChange={(e) => {
                setMoroccanSearch(e.target.value)
                setShowMoroccanDropdown(e.target.value.length > 0)
              }}
              onFocus={() => moroccanSearch && setShowMoroccanDropdown(true)}
              onBlur={() => setTimeout(() => setShowMoroccanDropdown(false), 200)}
              placeholder="🇲🇦 Rechercher action marocaine..."
              className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 text-sm outline-none"
            />
          </div>

          {/* Dropdown Results */}
          {showMoroccanDropdown && filteredMoroccan.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-dark-100 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
              {filteredMoroccan.map(([sym, name]) => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => {
                    setSymbol(sym)
                    setMoroccanSearch('')
                    setShowMoroccanDropdown(false)
                    setManualPrice(null)
                  }}
                  className="w-full px-4 py-2.5 text-left hover:bg-green-50 dark:hover:bg-green-500/10 flex items-center gap-2 transition-colors"
                >
                  <span className="font-medium text-green-600 dark:text-green-400">{sym}</span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">{name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Current Price */}
      <div className="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-dark-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Current Price</span>
            {socketPrice ? (
              <span className="flex items-center gap-1 text-xs text-green-500">
                <Wifi size={12} />
                LIVE
              </span>
            ) : isConnected ? (
              <span className="text-xs text-yellow-500">Syncing...</span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <WifiOff size={12} />
              </span>
            )}
          </div>
          {fetchingPrice && !socketPrice ? (
            <Loader2 size={16} className="animate-spin text-gray-400" />
          ) : (
            <span className={`font-semibold text-gray-900 dark:text-white ${socketPrice ? 'text-green-600 dark:text-green-400' : ''}`}>
              ${formatPrice(currentPrice, symbol)}
            </span>
          )}
        </div>
        {/* Price change indicator */}
        {prices[symbol]?.changePercent !== undefined && (
          <div className={`text-xs mt-1 ${prices[symbol].changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {prices[symbol].changePercent >= 0 ? '+' : ''}{prices[symbol].changePercent.toFixed(2)}% today
          </div>
        )}
      </div>

      {/* Quantity Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('dashboard.quantity')}
        </label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="0.00"
          step="0.01"
          min="0"
          className="input"
        />
      </div>

      {/* Trade Value */}
      <div className="mb-6 p-3 rounded-lg bg-gray-50 dark:bg-dark-200">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Trade Value</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            ${tradeValue}
          </span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm text-gray-500">Available Balance</span>
          <span className={`font-semibold ${parseFloat(tradeValue) > parseFloat(challenge?.current_balance || 0) ? 'text-red-500' : 'text-green-500'}`}>
            ${parseFloat(challenge?.current_balance || 0).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !quantity || parseFloat(tradeValue) > parseFloat(challenge?.current_balance || 0)}
        className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2
          ${tradeType === 'buy'
            ? 'bg-green-500 hover:bg-green-600 text-white'
            : 'bg-red-500 hover:bg-red-600 text-white'
          }
          disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {loading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Processing...
          </>
        ) : (
          <>
            {tradeType === 'buy' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            {tradeType === 'buy' ? t('dashboard.buy') : t('dashboard.sell')} {symbol}
          </>
        )}
      </button>
    </form>
  )
}

export default TradeForm
