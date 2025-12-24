import { useState } from 'react'
import {
  Minus, TrendingUp, Circle, Square, Triangle, Type,
  Maximize2, Hash, GitBranch, ArrowRight, Crosshair,
  MousePointer, Trash2, Eye, EyeOff, Palette, Lock, Unlock
} from 'lucide-react'

const drawingTools = [
  { id: 'pointer', icon: MousePointer, label: 'Pointer', category: 'basic' },
  { id: 'crosshair', icon: Crosshair, label: 'Crosshair', category: 'basic' },
  { id: 'trendline', icon: TrendingUp, label: 'Trend Line', category: 'lines' },
  { id: 'horizontal', icon: Minus, label: 'Horizontal Line', category: 'lines' },
  { id: 'vertical', icon: Minus, label: 'Vertical Line', category: 'lines', rotate: 90 },
  { id: 'ray', icon: ArrowRight, label: 'Ray', category: 'lines' },
  { id: 'channel', icon: GitBranch, label: 'Channel', category: 'lines' },
  { id: 'fibonacci', icon: Hash, label: 'Fibonacci Retracement', category: 'fib' },
  { id: 'fibExtension', icon: Hash, label: 'Fibonacci Extension', category: 'fib' },
  { id: 'rectangle', icon: Square, label: 'Rectangle', category: 'shapes' },
  { id: 'ellipse', icon: Circle, label: 'Ellipse', category: 'shapes' },
  { id: 'triangle', icon: Triangle, label: 'Triangle', category: 'shapes' },
  { id: 'text', icon: Type, label: 'Text', category: 'annotation' },
  { id: 'priceRange', icon: Maximize2, label: 'Price Range', category: 'measure' },
]

const categories = [
  { id: 'basic', label: 'Basic' },
  { id: 'lines', label: 'Lines' },
  { id: 'fib', label: 'Fibonacci' },
  { id: 'shapes', label: 'Shapes' },
  { id: 'annotation', label: 'Annotation' },
  { id: 'measure', label: 'Measure' },
]

const defaultColors = [
  '#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#ffffff', '#94a3b8'
]

const DrawingTools = ({
  onToolSelect,
  onDrawingAdd,
  onDrawingRemove,
  onDrawingUpdate,
  drawings = [],
  selectedTool = null,
  isVertical = true
}) => {
  const [activeCategory, setActiveCategory] = useState('basic')
  const [selectedColor, setSelectedColor] = useState('#22c55e')
  const [lineWidth, setLineWidth] = useState(1)
  const [showDrawingsList, setShowDrawingsList] = useState(false)

  const handleToolClick = (tool) => {
    onToolSelect?.(tool.id === selectedTool ? null : tool.id)
  }

  const toggleDrawingVisibility = (drawingId) => {
    const drawing = drawings.find(d => d.id === drawingId)
    if (drawing) {
      onDrawingUpdate?.(drawingId, { visible: !drawing.visible })
    }
  }

  const toggleDrawingLock = (drawingId) => {
    const drawing = drawings.find(d => d.id === drawingId)
    if (drawing) {
      onDrawingUpdate?.(drawingId, { locked: !drawing.locked })
    }
  }

  const deleteDrawing = (drawingId) => {
    onDrawingRemove?.(drawingId)
  }

  const clearAllDrawings = () => {
    if (window.confirm('Are you sure you want to delete all drawings?')) {
      drawings.forEach(d => onDrawingRemove?.(d.id))
    }
  }

  if (isVertical) {
    return (
      <div className="flex flex-col bg-slate-900 border-r border-slate-700 w-12">
        {/* Tools */}
        <div className="flex-1 py-2 space-y-1">
          {drawingTools.filter(t => t.category === 'basic' || t.category === 'lines').slice(0, 8).map((tool) => (
            <button
              key={tool.id}
              onClick={() => handleToolClick(tool)}
              className={`w-full flex items-center justify-center p-2 transition-colors ${
                selectedTool === tool.id
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={tool.label}
            >
              <tool.icon
                className="w-4 h-4"
                style={tool.rotate ? { transform: `rotate(${tool.rotate}deg)` } : {}}
              />
            </button>
          ))}

          {/* Separator */}
          <div className="border-t border-slate-700 my-2" />

          {/* Fibonacci */}
          {drawingTools.filter(t => t.category === 'fib').map((tool) => (
            <button
              key={tool.id}
              onClick={() => handleToolClick(tool)}
              className={`w-full flex items-center justify-center p-2 transition-colors ${
                selectedTool === tool.id
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={tool.label}
            >
              <tool.icon className="w-4 h-4" />
            </button>
          ))}

          {/* Separator */}
          <div className="border-t border-slate-700 my-2" />

          {/* Shapes */}
          {drawingTools.filter(t => t.category === 'shapes').map((tool) => (
            <button
              key={tool.id}
              onClick={() => handleToolClick(tool)}
              className={`w-full flex items-center justify-center p-2 transition-colors ${
                selectedTool === tool.id
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={tool.label}
            >
              <tool.icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        {/* Bottom actions */}
        <div className="py-2 border-t border-slate-700 space-y-1">
          {/* Color picker */}
          <div className="relative group">
            <button
              className="w-full flex items-center justify-center p-2 text-slate-400 hover:text-white hover:bg-slate-800"
              title="Color"
            >
              <div
                className="w-4 h-4 rounded-full border border-slate-600"
                style={{ backgroundColor: selectedColor }}
              />
            </button>
            <div className="absolute left-full top-0 ml-2 hidden group-hover:flex bg-slate-800 rounded-lg p-2 gap-1 flex-wrap w-24 z-50">
              {defaultColors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-5 h-5 rounded-full border-2 ${
                    selectedColor === color ? 'border-white' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Delete all */}
          <button
            onClick={clearAllDrawings}
            className="w-full flex items-center justify-center p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800"
            title="Clear All Drawings"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  // Horizontal layout
  return (
    <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 border-b border-slate-700">
      {/* Categories */}
      <div className="flex gap-1 mr-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              activeCategory === cat.id
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="h-6 w-px bg-slate-700" />

      {/* Tools */}
      <div className="flex gap-1">
        {drawingTools.filter(t => t.category === activeCategory).map((tool) => (
          <button
            key={tool.id}
            onClick={() => handleToolClick(tool)}
            className={`p-1.5 rounded transition-colors ${
              selectedTool === tool.id
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={tool.label}
          >
            <tool.icon
              className="w-4 h-4"
              style={tool.rotate ? { transform: `rotate(${tool.rotate}deg)` } : {}}
            />
          </button>
        ))}
      </div>

      <div className="h-6 w-px bg-slate-700 ml-2" />

      {/* Color picker */}
      <div className="flex gap-1 ml-2">
        {defaultColors.slice(0, 5).map((color) => (
          <button
            key={color}
            onClick={() => setSelectedColor(color)}
            className={`w-5 h-5 rounded-full border-2 ${
              selectedColor === color ? 'border-white' : 'border-slate-600'
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      {/* Line width */}
      <div className="flex items-center gap-1 ml-2">
        <span className="text-xs text-slate-400">Width:</span>
        <select
          value={lineWidth}
          onChange={(e) => setLineWidth(Number(e.target.value))}
          className="bg-slate-800 text-white text-xs rounded px-1 py-0.5 border border-slate-600"
        >
          <option value={1}>1px</option>
          <option value={2}>2px</option>
          <option value={3}>3px</option>
          <option value={4}>4px</option>
        </select>
      </div>

      <div className="flex-1" />

      {/* Drawings list toggle */}
      {drawings.length > 0 && (
        <button
          onClick={() => setShowDrawingsList(!showDrawingsList)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-white bg-slate-800 rounded"
        >
          <span>{drawings.length} drawings</span>
        </button>
      )}

      {/* Clear all */}
      <button
        onClick={clearAllDrawings}
        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded"
        title="Clear All"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}

export default DrawingTools
