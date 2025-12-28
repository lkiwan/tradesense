import { useState, useEffect, useCallback, useMemo } from 'react'
import { useChallenge } from '../../context/ChallengeContext'
import { tradesAPI, challengesAPI, marketAPI } from '../../services/api'
import { showErrorToast, showSuccessToast } from '../../utils/errorHandler'
import SignalsPanel from '../../components/SignalsPanel'
import {
  TrendingUp, TrendingDown, Target, Shield, DollarSign,
  Calculator, Play, X, RefreshCw, Settings, ChevronDown,
  AlertTriangle, Check, Percent, BarChart3, Clock, Zap,
  Crosshair, Layers, Activity, Eye, EyeOff
} from 'lucide-react'

// Symbol categories - symbol is for backend, tvSymbol is for TradingView chart
const SYMBOL_CATEGORIES = {
  forex: [
    { symbol: 'EURUSD', tvSymbol: 'FX:EURUSD', name: 'EUR/USD', pip: 0.0001 },
    { symbol: 'GBPUSD', tvSymbol: 'FX:GBPUSD', name: 'GBP/USD', pip: 0.0001 },
    { symbol: 'USDJPY', tvSymbol: 'FX:USDJPY', name: 'USD/JPY', pip: 0.01 },
    { symbol: 'USDCHF', tvSymbol: 'FX:USDCHF', name: 'USD/CHF', pip: 0.0001 },
    { symbol: 'AUDUSD', tvSymbol: 'FX:AUDUSD', name: 'AUD/USD', pip: 0.0001 },
    { symbol: 'USDCAD', tvSymbol: 'FX:USDCAD', name: 'USD/CAD', pip: 0.0001 },
    { symbol: 'NZDUSD', tvSymbol: 'FX:NZDUSD', name: 'NZD/USD', pip: 0.0001 },
    { symbol: 'EURGBP', tvSymbol: 'FX:EURGBP', name: 'EUR/GBP', pip: 0.0001 },
    { symbol: 'USDMAD', tvSymbol: 'FX_IDC:USDMAD', name: 'USD/MAD', pip: 0.0001 },
    { symbol: 'EURMAD', tvSymbol: 'FX_IDC:EURMAD', name: 'EUR/MAD', pip: 0.0001 }
  ],
  morocco: [
    { symbol: 'MASI', tvSymbol: 'CSEMA:MASI', name: 'MASI Index', pip: 0.01 },
    { symbol: 'IAM', tvSymbol: 'CSEMA:IAM', name: 'Maroc Telecom', pip: 0.01 },
    { symbol: 'ATW', tvSymbol: 'CSEMA:ATW', name: 'Attijariwafa Bank', pip: 0.01 },
    { symbol: 'BCP', tvSymbol: 'CSEMA:BCP', name: 'Banque Populaire', pip: 0.01 },
    { symbol: 'BOA', tvSymbol: 'CSEMA:BOA', name: 'Bank of Africa', pip: 0.01 },
    { symbol: 'CIH', tvSymbol: 'CSEMA:CIH', name: 'CIH Bank', pip: 0.01 },
    { symbol: 'CDM', tvSymbol: 'CSEMA:CDM', name: 'Crédit du Maroc', pip: 0.01 },
    { symbol: 'LBV', tvSymbol: 'CSEMA:LBV', name: 'Label Vie', pip: 0.01 },
    { symbol: 'CMA', tvSymbol: 'CSEMA:CMA', name: 'Ciments du Maroc', pip: 0.01 },
    { symbol: 'MNG', tvSymbol: 'CSEMA:MNG', name: 'Managem', pip: 0.01 },
    { symbol: 'TQM', tvSymbol: 'CSEMA:TQM', name: 'Taqa Morocco', pip: 0.01 },
    { symbol: 'CSR', tvSymbol: 'CSEMA:CSR', name: 'Cosumar', pip: 0.01 },
    { symbol: 'HPS', tvSymbol: 'CSEMA:HPS', name: 'HPS', pip: 0.01 },
    { symbol: 'LHM', tvSymbol: 'CSEMA:LHM', name: 'Lesieur Cristal', pip: 0.01 },
    { symbol: 'MSA', tvSymbol: 'CSEMA:MSA', name: 'Marsa Maroc', pip: 0.01 },
    { symbol: 'WAA', tvSymbol: 'CSEMA:WAA', name: 'Wafa Assurance', pip: 0.01 }
  ],
  indices: [
    { symbol: 'US30', tvSymbol: 'DJ:DJI', name: 'Dow Jones', pip: 1 },
    { symbol: 'US500', tvSymbol: 'SP:SPX', name: 'S&P 500', pip: 0.1 },
    { symbol: 'NAS100', tvSymbol: 'NASDAQ:NDX', name: 'Nasdaq 100', pip: 0.1 },
    { symbol: 'GER40', tvSymbol: 'XETR:DAX', name: 'DAX 40', pip: 0.1 },
    { symbol: 'UK100', tvSymbol: 'FTSE:UKX', name: 'FTSE 100', pip: 0.1 }
  ],
  commodities: [
    { symbol: 'XAUUSD', tvSymbol: 'OANDA:XAUUSD', name: 'Gold', pip: 0.01 },
    { symbol: 'XAGUSD', tvSymbol: 'OANDA:XAGUSD', name: 'Silver', pip: 0.001 },
    { symbol: 'USOIL', tvSymbol: 'TVC:USOIL', name: 'Crude Oil', pip: 0.01 },
    { symbol: 'UKOIL', tvSymbol: 'TVC:UKOIL', name: 'Brent Oil', pip: 0.01 }
  ],
  crypto: [
    { symbol: 'BTCUSD', tvSymbol: 'BINANCE:BTCUSDT', name: 'Bitcoin', pip: 0.01 },
    { symbol: 'ETHUSD', tvSymbol: 'BINANCE:ETHUSDT', name: 'Ethereum', pip: 0.01 },
    { symbol: 'XRPUSD', tvSymbol: 'BINANCE:XRPUSDT', name: 'Ripple', pip: 0.0001 },
    { symbol: 'SOLUSD', tvSymbol: 'BINANCE:SOLUSDT', name: 'Solana', pip: 0.01 },
    { symbol: 'BNBUSD', tvSymbol: 'BINANCE:BNBUSDT', name: 'BNB', pip: 0.01 }
  ]
}

const TradingPage = () => {
  const { challenge, refetch, updateBalance } = useChallenge()

  // Symbol & Category state
  const [selectedCategory, setSelectedCategory] = useState('forex')
  const [selectedSymbol, setSelectedSymbol] = useState(SYMBOL_CATEGORIES.forex[0])
  const [currentPrice, setCurrentPrice] = useState({ bid: 0, ask: 0 })
  const [priceLoading, setPriceLoading] = useState(true)

  // Trade planning state
  const [tradeType, setTradeType] = useState('buy')
  const [lotSize, setLotSize] = useState(0.01)
  const [stopLoss, setStopLoss] = useState('')
  const [takeProfit, setTakeProfit] = useState('')
  const [slPips, setSlPips] = useState(20)
  const [tpPips, setTpPips] = useState(40)
  const [usePrice, setUsePrice] = useState(false) // false = pips, true = price
  const [riskPercent, setRiskPercent] = useState(1)
  const [riskAmount, setRiskAmount] = useState(0)

  // Positions state
  const [openPositions, setOpenPositions] = useState([])
  const [openPnL, setOpenPnL] = useState(null)
  const [loading, setLoading] = useState(false)
  const [executing, setExecuting] = useState(false)

  // UI state
  const [showRiskCalculator, setShowRiskCalculator] = useState(true)
  const [chartInterval, setChartInterval] = useState('15')

  // Fetch data
  useEffect(() => {
    if (challenge?.id) {
      fetchPositions()
      fetchPnL() // Fetch immediately
      // Update PnL every 3 seconds for real-time feel
      const interval = setInterval(fetchPnL, 3000)
      return () => clearInterval(interval)
    }
  }, [challenge?.id])

  // Fetch real price when symbol changes
  const fetchCurrentPrice = async (showLoading = false) => {
    if (showLoading) setPriceLoading(true)
    try {
      const response = await marketAPI.getPrice(selectedSymbol.symbol)
      if (response.data?.price) {
        const price = response.data.price
        const spread = selectedSymbol.pip * 2
        setCurrentPrice({
          bid: price,
          ask: price + spread
        })
      }
    } catch (error) {
      console.error('Failed to fetch price:', error)
    } finally {
      setPriceLoading(false)
    }
  }

  // Fetch price when symbol changes and periodically update
  useEffect(() => {
    fetchCurrentPrice(true) // Fetch immediately with loading
    const priceInterval = setInterval(() => fetchCurrentPrice(false), 5000) // Update every 5 seconds
    return () => clearInterval(priceInterval)
  }, [selectedSymbol])

  // Calculate SL/TP prices when pips change
  useEffect(() => {
    if (!usePrice) {
      const price = tradeType === 'buy' ? currentPrice.ask : currentPrice.bid
      const pipValue = selectedSymbol.pip

      if (tradeType === 'buy') {
        setStopLoss((price - slPips * pipValue).toFixed(5))
        setTakeProfit((price + tpPips * pipValue).toFixed(5))
      } else {
        setStopLoss((price + slPips * pipValue).toFixed(5))
        setTakeProfit((price - tpPips * pipValue).toFixed(5))
      }
    }
  }, [slPips, tpPips, tradeType, currentPrice, usePrice, selectedSymbol])

  // Calculate risk
  useEffect(() => {
    if (challenge) {
      const balance = challenge.current_balance || challenge.initial_balance || 10000
      const risk = (balance * riskPercent) / 100
      setRiskAmount(risk)

      // Calculate lot size based on risk
      if (slPips > 0) {
        const pipValuePerLot = 10 // Approximate for forex
        const calculatedLot = risk / (slPips * pipValuePerLot)
        // Don't auto-set lot size, let user decide
      }
    }
  }, [riskPercent, slPips, challenge])

  const fetchPositions = async () => {
    try {
      const response = await tradesAPI.getAll(challenge.id)
      const open = (response.data.trades || []).filter(t => t.status === 'open')
      setOpenPositions(open)
    } catch (error) {
      console.error('Failed to fetch positions:', error)
    }
  }

  const fetchPnL = async () => {
    try {
      const response = await tradesAPI.getOpenPnL()
      setOpenPnL(response.data)
    } catch (error) {
      console.error('Failed to fetch PnL:', error)
    }
  }

  const executeTrade = async () => {
    if (!challenge?.id) {
      showErrorToast('No active challenge')
      return
    }

    setExecuting(true)
    try {
      const tradeData = {
        challenge_id: challenge.id,
        symbol: selectedSymbol.symbol,
        trade_type: tradeType,
        quantity: lotSize,
        stop_loss: stopLoss ? parseFloat(stopLoss) : null,
        take_profit: takeProfit ? parseFloat(takeProfit) : null
      }

      const response = await tradesAPI.open(tradeData)
      showSuccessToast(`${tradeType.toUpperCase()} ${lotSize} ${selectedSymbol.symbol} @ ${response.data.trade.entry_price}`)
      fetchPositions()
      fetchPnL()
    } catch (error) {
      showErrorToast(error)
    } finally {
      setExecuting(false)
    }
  }

  const closeTrade = async (tradeId) => {
    try {
      const response = await tradesAPI.close(tradeId)
      const pnl = response.data.pnl
      const newBalance = response.data.new_balance

      showSuccessToast(`Trade closed! PnL: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`)

      // Update balance immediately for instant feedback
      if (newBalance) {
        updateBalance(newBalance)
      }

      // Refresh all data
      await Promise.all([
        fetchPositions(),
        fetchPnL()
      ])

      // Also refetch challenge to ensure all data is in sync
      refetch()
    } catch (error) {
      showErrorToast(error)
    }
  }

  const closeAllPositions = async () => {
    try {
      let lastBalance = null
      for (const pos of openPositions) {
        const response = await tradesAPI.close(pos.id)
        lastBalance = response.data.new_balance
      }
      showSuccessToast(`Closed ${openPositions.length} positions`)

      // Update balance with final value
      if (lastBalance) {
        updateBalance(lastBalance)
      }

      // Refresh all data
      await Promise.all([
        fetchPositions(),
        fetchPnL()
      ])

      // Refetch challenge for sync
      refetch()
    } catch (error) {
      showErrorToast(error)
    }
  }

  // Risk/Reward calculation
  const riskReward = useMemo(() => {
    if (slPips > 0 && tpPips > 0) {
      return (tpPips / slPips).toFixed(2)
    }
    return '0.00'
  }, [slPips, tpPips])

  const potentialProfit = useMemo(() => {
    if (slPips > 0 && tpPips > 0 && riskAmount > 0) {
      return (riskAmount * (tpPips / slPips)).toFixed(2)
    }
    return '0.00'
  }, [slPips, tpPips, riskAmount])

  const balance = challenge?.current_balance || challenge?.initial_balance || 10000
  const equity = balance + (openPnL?.total_unrealized_pnl || 0)

  return (
    <div className="flex flex-col gap-3 sm:gap-4 pb-8 px-2 sm:px-0">
      {/* Top Bar - Symbol Selection & Account Info */}
      <div className="flex flex-col gap-3 bg-dark-100 rounded-xl p-3 sm:p-4 border border-dark-200">
        {/* Row 1: Category tabs + Symbol selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
          {/* Category Tabs - Scrollable on mobile */}
          <div className="flex gap-1 bg-dark-200 p-1 rounded-lg overflow-x-auto w-full sm:w-auto">
            {Object.keys(SYMBOL_CATEGORIES).map(cat => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat)
                  setSelectedSymbol(SYMBOL_CATEGORIES[cat][0])
                }}
                className={`px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-medium rounded-md transition-all capitalize whitespace-nowrap min-w-fit ${
                  selectedCategory === cat
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <select
            value={selectedSymbol.symbol}
            onChange={(e) => {
              const sym = SYMBOL_CATEGORIES[selectedCategory].find(s => s.symbol === e.target.value)
              if (sym) setSelectedSymbol(sym)
            }}
            className="bg-dark-200 border border-dark-300 text-white rounded-lg px-3 sm:px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 w-full sm:w-auto min-h-[44px]"
          >
            {SYMBOL_CATEGORIES[selectedCategory].map(sym => (
              <option key={sym.symbol} value={sym.symbol}>{sym.name}</option>
            ))}
          </select>
        </div>

        {/* Row 2: Price display + Account Info */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Current Price */}
          <div className="flex items-center gap-2 sm:gap-3">
            {priceLoading ? (
              <div className="flex items-center gap-2 text-gray-400">
                <RefreshCw size={14} className="animate-spin" />
                <span className="text-xs sm:text-sm">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase">Bid</p>
                  <p className="text-sm sm:text-lg font-bold text-red-400">
                    {currentPrice.bid >= 100 ? currentPrice.bid.toFixed(2) : currentPrice.bid.toFixed(5)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase">Ask</p>
                  <p className="text-sm sm:text-lg font-bold text-green-400">
                    {currentPrice.ask >= 100 ? currentPrice.ask.toFixed(2) : currentPrice.ask.toFixed(5)}
                  </p>
                </div>
                <div className="text-center hidden sm:block">
                  <p className="text-[10px] text-gray-500 uppercase">Spread</p>
                  <p className="text-sm font-medium text-gray-400">
                    {((currentPrice.ask - currentPrice.bid) / selectedSymbol.pip).toFixed(1)}p
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Account Info */}
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="text-right">
              <p className="text-[9px] sm:text-xs text-gray-500">Balance</p>
              <p className="text-sm sm:text-lg font-bold text-white">${balance.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] sm:text-xs text-gray-500">Equity</p>
              <p className={`text-sm sm:text-lg font-bold ${equity >= balance ? 'text-green-400' : 'text-red-400'}`}>
                ${equity.toLocaleString()}
              </p>
            </div>
            {openPnL && (
              <div className="text-right hidden sm:block">
                <p className="text-xs text-gray-500">P&L</p>
                <p className={`text-lg font-bold ${openPnL.total_unrealized_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {openPnL.total_unrealized_pnl >= 0 ? '+' : ''}${openPnL.total_unrealized_pnl.toFixed(0)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Chart & Positions Area */}
        <div className="lg:col-span-3 flex flex-col gap-3 sm:gap-4">
          {/* Chart */}
          <div className="bg-dark-100 rounded-xl border border-dark-200 overflow-hidden">
            {/* Chart Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 border-b border-dark-200 gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white text-sm sm:text-base">{selectedSymbol.name}</span>
                <span className="text-[10px] sm:text-xs text-gray-500">({selectedSymbol.symbol})</span>
              </div>
              <div className="flex gap-0.5 sm:gap-1 bg-dark-200 p-0.5 rounded-lg overflow-x-auto">
                {['1', '5', '15', '30', '60', '240', 'D'].map(tf => (
                  <button
                    key={tf}
                    onClick={() => setChartInterval(tf)}
                    className={`px-1.5 sm:px-2 py-1 text-[10px] sm:text-xs font-medium rounded transition-all whitespace-nowrap ${
                      chartInterval === tf
                        ? 'bg-primary-500 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {tf === 'D' ? '1D' : tf + 'm'}
                  </button>
                ))}
              </div>
            </div>

            {/* TradingView Chart - Responsive height */}
            <div className="h-[300px] sm:h-[400px] lg:h-[500px]">
              <iframe
                src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=${selectedSymbol.tvSymbol}&interval=${chartInterval}&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=1a1a2e&studies=[]&theme=dark&style=1&timezone=exchange&withdateranges=1&showpopupbutton=1&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&showactive=1&locale=en`}
                style={{ width: '100%', height: '100%' }}
                frameBorder="0"
                allowTransparency="true"
                scrolling="no"
                allowFullScreen
              />
            </div>
          </div>

          {/* Open Positions Panel - Under Chart */}
          <div className="bg-dark-100 rounded-xl border border-dark-200 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b border-dark-200 gap-2">
              <h3 className="font-semibold text-white flex items-center gap-2 text-sm sm:text-base">
                <Activity size={14} className="text-primary-400" />
                Positions
                {openPositions.length > 0 && (
                  <span className="px-1.5 sm:px-2 py-0.5 bg-primary-500/20 text-primary-400 text-[10px] sm:text-xs rounded-full">
                    {openPositions.length}
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2 sm:gap-4">
                {openPnL && (
                  <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                    <span className="text-gray-400 hidden sm:inline">P&L:</span>
                    <span className={`font-bold ${openPnL.total_unrealized_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {openPnL.total_unrealized_pnl >= 0 ? '+' : ''}${openPnL.total_unrealized_pnl.toFixed(0)}
                    </span>
                  </div>
                )}
                {openPositions.length > 0 && (
                  <button
                    onClick={closeAllPositions}
                    className="px-2 sm:px-3 py-1.5 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white text-[10px] sm:text-xs font-medium rounded-lg transition-all flex items-center gap-1 min-h-[32px]"
                  >
                    <X size={10} />
                    <span className="hidden sm:inline">Close All</span>
                    <span className="sm:hidden">All</span>
                  </button>
                )}
              </div>
            </div>

            {openPositions.length > 0 ? (
              <div className="overflow-x-auto">
                {/* Price Error Warning */}
                {openPnL?.price_errors && openPnL.price_errors.length > 0 && (
                  <div className="mx-3 my-2 px-2 sm:px-3 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-2">
                    <AlertTriangle size={12} className="text-yellow-500 flex-shrink-0" />
                    <span className="text-yellow-500 text-[10px] sm:text-xs truncate">
                      Price unavailable: {openPnL.price_errors.join(', ')}
                    </span>
                  </div>
                )}

                <table className="w-full min-w-[500px]">
                  <thead className="bg-dark-200/30">
                    <tr className="text-[9px] sm:text-xs text-gray-400 uppercase tracking-wider">
                      <th className="px-2 sm:px-4 py-2 text-left">Symbol</th>
                      <th className="px-2 sm:px-4 py-2 text-center">Type</th>
                      <th className="px-2 sm:px-4 py-2 text-center">Size</th>
                      <th className="px-2 sm:px-4 py-2 text-right">Entry</th>
                      <th className="px-2 sm:px-4 py-2 text-right">Current</th>
                      <th className="px-2 sm:px-4 py-2 text-right">P&L</th>
                      <th className="px-2 sm:px-4 py-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-200/30">
                    {openPositions.map(pos => {
                      const pnlInfo = openPnL?.trades?.find(t => t.trade_id === pos.id)
                      const pnl = pnlInfo?.unrealized_pnl || 0
                      const currentPriceVal = pnlInfo?.current_price || pos.entry_price
                      const entryPrice = parseFloat(pos.entry_price)
                      const priceAvailable = pnlInfo?.price_available !== false
                      const formatPrice = (p) => p >= 100 ? p.toFixed(2) : p.toFixed(4)

                      return (
                        <tr key={pos.id} className="hover:bg-dark-200/20 transition-colors">
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            <div className="flex items-center gap-1.5">
                              <div className={`w-0.5 sm:w-1 h-4 sm:h-5 rounded-full flex-shrink-0 ${pos.trade_type === 'buy' ? 'bg-green-500' : 'bg-red-500'}`} />
                              <span className="font-medium text-white text-[11px] sm:text-sm">{pos.symbol}</span>
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                            <span className={`px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-xs font-bold ${
                              pos.trade_type === 'buy'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {pos.trade_type === 'buy' ? 'BUY' : 'SELL'}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-white text-[11px] sm:text-sm">{pos.quantity}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-gray-300 text-[11px] sm:text-sm">{formatPrice(entryPrice)}</td>
                          <td className={`px-2 sm:px-4 py-2 sm:py-3 text-right font-medium text-[11px] sm:text-sm ${priceAvailable ? 'text-white' : 'text-yellow-500'}`}>
                            {formatPrice(currentPriceVal)}
                          </td>
                          <td className={`px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold text-[11px] sm:text-sm ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {pnl >= 0 ? '+' : ''}${pnl.toFixed(0)}
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                            <button
                              onClick={() => closeTrade(pos.id)}
                              className="px-2 sm:px-3 py-1 sm:py-1.5 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white text-[10px] sm:text-xs font-medium rounded transition-all min-w-[40px] min-h-[28px]"
                            >
                              Close
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 sm:p-6 text-center">
                <Activity size={24} className="mx-auto text-gray-600 mb-2" />
                <p className="text-gray-500 text-xs sm:text-sm">No open positions</p>
                <p className="text-gray-600 text-[10px] sm:text-xs mt-1">Your trades will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Trading Panel & Signals */}
        <div className="space-y-3 sm:space-y-4 lg:overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {/* Trade Type Selector */}
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-3 sm:p-4">
            <div className="grid grid-cols-2 gap-2 mb-3 sm:mb-4">
              <button
                onClick={() => setTradeType('buy')}
                className={`py-2.5 sm:py-3 rounded-lg font-bold text-xs sm:text-sm transition-all min-h-[44px] ${
                  tradeType === 'buy'
                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/25'
                    : 'bg-dark-200 text-gray-400 hover:bg-green-500/20 hover:text-green-400'
                }`}
              >
                <TrendingUp size={14} className="inline mr-1 sm:mr-2" />
                BUY
              </button>
              <button
                onClick={() => setTradeType('sell')}
                className={`py-2.5 sm:py-3 rounded-lg font-bold text-xs sm:text-sm transition-all min-h-[44px] ${
                  tradeType === 'sell'
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                    : 'bg-dark-200 text-gray-400 hover:bg-red-500/20 hover:text-red-400'
                }`}
              >
                <TrendingDown size={14} className="inline mr-1 sm:mr-2" />
                SELL
              </button>
            </div>

            {/* Lot Size */}
            <div className="mb-3 sm:mb-4">
              <label className="text-[10px] sm:text-xs text-gray-400 mb-1 sm:mb-1.5 block">Lot Size</label>
              <div className="flex gap-1.5 sm:gap-2">
                <input
                  type="number"
                  value={lotSize}
                  onChange={(e) => setLotSize(parseFloat(e.target.value) || 0.01)}
                  step="0.01"
                  min="0.01"
                  className="flex-1 bg-dark-200 border border-dark-300 rounded-lg px-2 sm:px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[40px]"
                />
                <div className="flex gap-0.5 sm:gap-1">
                  {[0.01, 0.1, 0.5].map(lot => (
                    <button
                      key={lot}
                      onClick={() => setLotSize(lot)}
                      className={`px-1.5 sm:px-2 py-1 text-[10px] sm:text-xs rounded min-w-[32px] ${
                        lotSize === lot ? 'bg-primary-500 text-white' : 'bg-dark-200 text-gray-400'
                      }`}
                    >
                      {lot}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* SL/TP Mode Toggle */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400">Stop Loss / Take Profit</span>
              <button
                onClick={() => setUsePrice(!usePrice)}
                className="text-xs text-primary-400 hover:text-primary-300"
              >
                {usePrice ? 'Use Pips' : 'Use Price'}
              </button>
            </div>

            {/* Stop Loss */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="text-[10px] text-red-400 mb-1 flex items-center gap-1">
                  <Shield size={10} />
                  Stop Loss {usePrice ? '(Price)' : '(Pips)'}
                </label>
                <input
                  type="number"
                  value={usePrice ? stopLoss : slPips}
                  onChange={(e) => usePrice ? setStopLoss(e.target.value) : setSlPips(parseFloat(e.target.value) || 0)}
                  className="w-full bg-dark-200 border border-red-500/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-green-400 mb-1 flex items-center gap-1">
                  <Target size={10} />
                  Take Profit {usePrice ? '(Price)' : '(Pips)'}
                </label>
                <input
                  type="number"
                  value={usePrice ? takeProfit : tpPips}
                  onChange={(e) => usePrice ? setTakeProfit(e.target.value) : setTpPips(parseFloat(e.target.value) || 0)}
                  className="w-full bg-dark-200 border border-green-500/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Quick SL/TP Buttons */}
            <div className="flex gap-1 mb-4">
              {[10, 20, 30, 50, 100].map(pips => (
                <button
                  key={pips}
                  onClick={() => { setSlPips(pips); setTpPips(pips * 2); setUsePrice(false); }}
                  className="flex-1 px-1 py-1 text-[10px] bg-dark-200 text-gray-400 rounded hover:bg-dark-300"
                >
                  {pips}p
                </button>
              ))}
            </div>

            {/* Risk Calculator */}
            <div
              className={`bg-dark-200/50 rounded-lg p-3 mb-4 border border-dark-300 ${showRiskCalculator ? '' : 'hidden'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Calculator size={12} />
                  Risk Calculator
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="text-[10px] text-gray-500">Risk %</label>
                  <input
                    type="number"
                    value={riskPercent}
                    onChange={(e) => setRiskPercent(parseFloat(e.target.value) || 0)}
                    step="0.5"
                    min="0.1"
                    max="10"
                    className="w-full bg-dark-300 border border-dark-200 rounded px-2 py-1 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500">Risk $</label>
                  <p className="bg-dark-300 border border-dark-200 rounded px-2 py-1 text-yellow-400 text-xs font-medium">
                    ${riskAmount.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-dark-300 rounded p-2">
                  <p className="text-[10px] text-gray-500">R:R Ratio</p>
                  <p className={`text-sm font-bold ${parseFloat(riskReward) >= 2 ? 'text-green-400' : parseFloat(riskReward) >= 1 ? 'text-yellow-400' : 'text-red-400'}`}>
                    1:{riskReward}
                  </p>
                </div>
                <div className="bg-dark-300 rounded p-2">
                  <p className="text-[10px] text-gray-500">Potential</p>
                  <p className="text-sm font-bold text-green-400">+${potentialProfit}</p>
                </div>
              </div>
            </div>

            {/* Execute Button */}
            <button
              onClick={executeTrade}
              disabled={executing || !challenge || priceLoading || currentPrice.bid === 0}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                tradeType === 'buy'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg shadow-green-500/25'
                  : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/25'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {executing ? (
                <>
                  <RefreshCw size={20} className="animate-spin" />
                  Executing...
                </>
              ) : priceLoading || currentPrice.bid === 0 ? (
                <>
                  <RefreshCw size={20} className="animate-spin" />
                  Loading Price...
                </>
              ) : (
                <>
                  <Play size={20} />
                  {tradeType === 'buy' ? 'BUY' : 'SELL'} {selectedSymbol.symbol}
                </>
              )}
            </button>

            {/* Price Info */}
            <p className="text-center text-xs text-gray-500 mt-2">
              {priceLoading || currentPrice.bid === 0 ? (
                'Fetching price...'
              ) : (
                `@ ${(() => {
                  const price = tradeType === 'buy' ? currentPrice.ask : currentPrice.bid
                  return price >= 100 ? price.toFixed(2) : price.toFixed(5)
                })()}`
              )}
            </p>
          </div>

          {/* AI Signals Panel */}
          <SignalsPanel
            symbols={SYMBOL_CATEGORIES[selectedCategory].slice(0, 5).map(s => s.symbol)}
          />
        </div>
      </div>
    </div>
  )
}

export default TradingPage
