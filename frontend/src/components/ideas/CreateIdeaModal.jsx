import React, { useState } from 'react';

const IDEA_TAGS = [
  'breakout', 'breakdown', 'support', 'resistance', 'trendline',
  'fibonacci', 'divergence', 'momentum', 'reversal', 'continuation',
  'double-top', 'double-bottom', 'triangle', 'wedge', 'flag',
  'earnings', 'news', 'fundamental', 'scalp', 'swing'
];

const CreateIdeaModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    symbol: '',
    idea_type: 'long',
    timeframe: 'swing',
    description: '',
    technical_analysis: '',
    entry_price: '',
    stop_loss: '',
    take_profit_1: '',
    take_profit_2: '',
    take_profit_3: '',
    confidence_level: 50,
    chart_image_url: '',
    tags: [],
    is_public: true
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag].slice(0, 5)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.symbol || !formData.description) {
      alert('Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        entry_price: formData.entry_price ? parseFloat(formData.entry_price) : null,
        stop_loss: formData.stop_loss ? parseFloat(formData.stop_loss) : null,
        take_profit_1: formData.take_profit_1 ? parseFloat(formData.take_profit_1) : null,
        take_profit_2: formData.take_profit_2 ? parseFloat(formData.take_profit_2) : null,
        take_profit_3: formData.take_profit_3 ? parseFloat(formData.take_profit_3) : null
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Share Trading Idea</h2>
            <p className="text-gray-400 text-sm">Step {step} of 3</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="e.g., EURUSD Breakout Setup - Targeting 1.1200"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  maxLength={200}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Symbol <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.symbol}
                    onChange={(e) => handleChange('symbol', e.target.value.toUpperCase())}
                    placeholder="e.g., EURUSD"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    maxLength={20}
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Direction</label>
                  <div className="flex gap-2">
                    {['long', 'short', 'neutral'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleChange('idea_type', type)}
                        className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                          formData.idea_type === type
                            ? type === 'long' ? 'bg-green-500 text-white'
                              : type === 'short' ? 'bg-red-500 text-white'
                              : 'bg-gray-500 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {type === 'long' ? '↑ Long' : type === 'short' ? '↓ Short' : '↔ Neutral'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Timeframe</label>
                <select
                  value={formData.timeframe}
                  onChange={(e) => handleChange('timeframe', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="scalp">Scalp (Minutes - Hours)</option>
                  <option value="intraday">Intraday (Same Day)</option>
                  <option value="swing">Swing (Days - Weeks)</option>
                  <option value="position">Position (Weeks - Months)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Describe your trade idea, reasoning, and what you're looking for..."
                  rows={4}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Technical Analysis
                </label>
                <textarea
                  value={formData.technical_analysis}
                  onChange={(e) => handleChange('technical_analysis', e.target.value)}
                  placeholder="Indicators, patterns, key levels..."
                  rows={3}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 2: Trade Levels */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Entry Price</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.entry_price}
                    onChange={(e) => handleChange('entry_price', e.target.value)}
                    placeholder="1.0850"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Stop Loss</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.stop_loss}
                    onChange={(e) => handleChange('stop_loss', e.target.value)}
                    placeholder="1.0800"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Take Profit 1</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.take_profit_1}
                    onChange={(e) => handleChange('take_profit_1', e.target.value)}
                    placeholder="1.0950"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Take Profit 2</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.take_profit_2}
                    onChange={(e) => handleChange('take_profit_2', e.target.value)}
                    placeholder="1.1000"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Take Profit 3</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.take_profit_3}
                    onChange={(e) => handleChange('take_profit_3', e.target.value)}
                    placeholder="1.1050"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Confidence Level: {formData.confidence_level}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.confidence_level}
                  onChange={(e) => handleChange('confidence_level', parseInt(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Chart Image URL (optional)
                </label>
                <input
                  type="url"
                  value={formData.chart_image_url}
                  onChange={(e) => handleChange('chart_image_url', e.target.value)}
                  placeholder="https://example.com/chart.png"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
                <p className="text-gray-500 text-xs mt-1">
                  Paste a link to your chart screenshot (TradingView, etc.)
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Tags & Publish */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Tags (select up to 5)
                </label>
                <div className="flex flex-wrap gap-2">
                  {IDEA_TAGS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        formData.tags.includes(tag)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_public}
                    onChange={(e) => handleChange('is_public', e.target.checked)}
                    className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-white font-medium">Public Idea</p>
                    <p className="text-gray-400 text-sm">Share with the community</p>
                  </div>
                </label>
              </div>

              {/* Preview */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h4 className="text-gray-300 text-sm font-medium mb-2">Preview</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      formData.idea_type === 'long' ? 'bg-green-500/20 text-green-400'
                        : formData.idea_type === 'short' ? 'bg-red-500/20 text-red-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {formData.idea_type === 'long' ? '↑' : formData.idea_type === 'short' ? '↓' : '↔'} {formData.symbol || 'SYMBOL'}
                    </span>
                    <span className="text-gray-500 text-sm">{formData.timeframe}</span>
                  </div>
                  <h3 className="text-white font-semibold">{formData.title || 'Your Title'}</h3>
                  <p className="text-gray-400 text-sm line-clamp-2">{formData.description || 'Your description...'}</p>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {formData.tags.map(tag => (
                        <span key={tag} className="text-xs text-gray-500">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={() => step > 1 ? setStep(step - 1) : onClose()}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              {step > 1 ? 'Back' : 'Cancel'}
            </button>
            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all disabled:opacity-50"
              >
                {loading ? 'Publishing...' : 'Publish Idea'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateIdeaModal;
