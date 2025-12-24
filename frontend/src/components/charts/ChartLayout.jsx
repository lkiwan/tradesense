import { useState, useRef, useCallback } from 'react'
import {
  LayoutGrid, Square, Columns, Grid3X3, Maximize2, Minimize2,
  Save, FolderOpen, Plus, X, Settings, Download, Camera
} from 'lucide-react'
import AdvancedChart from './AdvancedChart'

const layouts = [
  { id: '1x1', icon: Square, label: 'Single', grid: { cols: 1, rows: 1 } },
  { id: '1x2', icon: Columns, label: '1x2', grid: { cols: 2, rows: 1 } },
  { id: '2x1', icon: Columns, label: '2x1', grid: { cols: 1, rows: 2 } },
  { id: '2x2', icon: LayoutGrid, label: '2x2', grid: { cols: 2, rows: 2 } },
  { id: '1x3', icon: Grid3X3, label: '1x3', grid: { cols: 3, rows: 1 } },
  { id: '3x1', icon: Grid3X3, label: '3x1', grid: { cols: 1, rows: 3 } },
]

const defaultSymbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'BTCUSD', 'ETHUSD']

const ChartLayout = ({
  marketData = {},
  onSaveLayout,
  onLoadLayout,
  savedLayouts = []
}) => {
  const [currentLayout, setCurrentLayout] = useState(layouts[0])
  const [charts, setCharts] = useState([{ id: 1, symbol: 'EURUSD', timeframe: '60' }])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeChartId, setActiveChartId] = useState(1)
  const [showLayoutMenu, setShowLayoutMenu] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [layoutName, setLayoutName] = useState('')

  const chartRefs = useRef({})
  const containerRef = useRef(null)

  // Generate chart data for a symbol (mock data for demo)
  const generateChartData = useCallback((symbol, timeframe) => {
    const data = []
    const now = Math.floor(Date.now() / 1000)
    const interval = timeframe === '1D' ? 86400 : timeframe === '1W' ? 604800 : parseInt(timeframe) * 60
    let price = symbol.includes('JPY') ? 150 : symbol.includes('XAU') ? 2000 : symbol.includes('BTC') ? 45000 : 1.1

    for (let i = 200; i >= 0; i--) {
      const time = now - (i * interval)
      const change = (Math.random() - 0.5) * (price * 0.002)
      const open = price
      const close = price + change
      const high = Math.max(open, close) + Math.random() * (price * 0.001)
      const low = Math.min(open, close) - Math.random() * (price * 0.001)
      const volume = Math.floor(Math.random() * 1000000)

      data.push({ time, open, high, low, close, volume })
      price = close
    }

    return data
  }, [])

  // Change layout
  const handleLayoutChange = (layout) => {
    setCurrentLayout(layout)
    const totalCharts = layout.grid.cols * layout.grid.rows

    // Adjust charts array
    if (charts.length < totalCharts) {
      const newCharts = [...charts]
      for (let i = charts.length; i < totalCharts; i++) {
        newCharts.push({
          id: i + 1,
          symbol: defaultSymbols[i % defaultSymbols.length],
          timeframe: '60'
        })
      }
      setCharts(newCharts)
    } else if (charts.length > totalCharts) {
      setCharts(charts.slice(0, totalCharts))
    }

    setShowLayoutMenu(false)
  }

  // Update chart symbol
  const handleSymbolChange = (chartId, symbol) => {
    setCharts(prev => prev.map(c =>
      c.id === chartId ? { ...c, symbol } : c
    ))
  }

  // Update chart timeframe
  const handleTimeframeChange = (chartId, timeframe) => {
    setCharts(prev => prev.map(c =>
      c.id === chartId ? { ...c, timeframe } : c
    ))
  }

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Save layout
  const handleSaveLayout = () => {
    if (!layoutName.trim()) return

    const layoutData = {
      name: layoutName,
      layout: currentLayout.id,
      charts: charts.map(c => ({
        symbol: c.symbol,
        timeframe: c.timeframe
      })),
      createdAt: new Date().toISOString()
    }

    onSaveLayout?.(layoutData)
    setShowSaveModal(false)
    setLayoutName('')
  }

  // Load layout
  const handleLoadLayout = (savedLayout) => {
    const layout = layouts.find(l => l.id === savedLayout.layout) || layouts[0]
    setCurrentLayout(layout)
    setCharts(savedLayout.charts.map((c, i) => ({
      id: i + 1,
      ...c
    })))
    setShowLayoutMenu(false)
  }

  // Take screenshot of all charts
  const takeScreenshot = async () => {
    // Implementation would capture all chart canvases
    console.log('Taking screenshot...')
  }

  // Calculate grid style
  const getGridStyle = () => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${currentLayout.grid.cols}, 1fr)`,
    gridTemplateRows: `repeat(${currentLayout.grid.rows}, 1fr)`,
    gap: '2px',
    height: '100%'
  })

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-slate-950">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-700">
        <div className="flex items-center gap-4">
          {/* Layout selector */}
          <div className="relative">
            <button
              onClick={() => setShowLayoutMenu(!showLayoutMenu)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-white transition-colors"
            >
              <currentLayout.icon className="w-4 h-4" />
              <span>{currentLayout.label}</span>
            </button>

            {showLayoutMenu && (
              <div className="absolute top-full left-0 mt-1 bg-slate-800 rounded-lg shadow-xl border border-slate-700 z-50 min-w-[200px]">
                <div className="p-2 border-b border-slate-700">
                  <span className="text-xs text-slate-400 font-medium">LAYOUTS</span>
                </div>
                <div className="p-2 grid grid-cols-3 gap-1">
                  {layouts.map((layout) => (
                    <button
                      key={layout.id}
                      onClick={() => handleLayoutChange(layout)}
                      className={`flex flex-col items-center gap-1 p-2 rounded transition-colors ${
                        currentLayout.id === layout.id
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : 'hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      <layout.icon className="w-5 h-5" />
                      <span className="text-xs">{layout.label}</span>
                    </button>
                  ))}
                </div>

                {/* Saved layouts */}
                {savedLayouts.length > 0 && (
                  <>
                    <div className="p-2 border-t border-slate-700">
                      <span className="text-xs text-slate-400 font-medium">SAVED LAYOUTS</span>
                    </div>
                    <div className="p-2 space-y-1 max-h-40 overflow-y-auto">
                      {savedLayouts.map((saved, i) => (
                        <button
                          key={i}
                          onClick={() => handleLoadLayout(saved)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-700 text-sm text-slate-300"
                        >
                          <FolderOpen className="w-4 h-4 text-cyan-400" />
                          <span>{saved.name}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Quick symbol buttons */}
          <div className="flex gap-1">
            {['EURUSD', 'GBPUSD', 'XAUUSD', 'BTCUSD'].map((sym) => (
              <button
                key={sym}
                onClick={() => handleSymbolChange(activeChartId, sym)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  charts.find(c => c.id === activeChartId)?.symbol === sym
                    ? 'bg-cyan-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {sym}
              </button>
            ))}
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSaveModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>

          <button
            onClick={takeScreenshot}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
            title="Screenshot"
          >
            <Camera className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="flex-1 p-1" style={getGridStyle()}>
        {charts.map((chart) => (
          <div
            key={chart.id}
            onClick={() => setActiveChartId(chart.id)}
            className={`relative overflow-hidden rounded ${
              activeChartId === chart.id && charts.length > 1
                ? 'ring-1 ring-cyan-500'
                : ''
            }`}
          >
            <AdvancedChart
              ref={(el) => chartRefs.current[chart.id] = el}
              symbol={chart.symbol}
              data={generateChartData(chart.symbol, chart.timeframe)}
              onSymbolChange={(sym) => handleSymbolChange(chart.id, sym)}
              onTimeframeChange={(tf) => handleTimeframeChange(chart.id, tf)}
              height={currentLayout.grid.rows === 1 ? 500 : currentLayout.grid.rows === 2 ? 300 : 200}
              showToolbar={true}
              showLegend={true}
              compact={currentLayout.grid.cols * currentLayout.grid.rows > 2}
            />
          </div>
        ))}
      </div>

      {/* Save Layout Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Save Layout</h3>
              <button
                onClick={() => setShowSaveModal(false)}
                className="p-1 hover:bg-slate-700 rounded"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Layout Name</label>
                <input
                  type="text"
                  value={layoutName}
                  onChange={(e) => setLayoutName(e.target.value)}
                  placeholder="My Trading Layout"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="text-sm text-slate-400">
                <p>This will save:</p>
                <ul className="list-disc list-inside mt-1">
                  <li>Layout: {currentLayout.label}</li>
                  <li>Charts: {charts.map(c => c.symbol).join(', ')}</li>
                  <li>Timeframes: {charts.map(c => c.timeframe).join(', ')}</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveLayout}
                  disabled={!layoutName.trim()}
                  className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
                >
                  Save Layout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChartLayout
