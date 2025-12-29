import { useState, useRef, useEffect } from 'react'
import { Download, FileText, FileSpreadsheet, ChevronDown, Loader2 } from 'lucide-react'

const ExportDropdown = ({
  onExportPDF,
  onExportExcel,
  onExportCSV,
  loading = false,
  disabled = false,
  label = 'Export',
  showPDF = true,
  showExcel = true,
  showCSV = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleExport = async (type) => {
    setIsOpen(false)

    switch (type) {
      case 'pdf':
        if (onExportPDF) await onExportPDF()
        break
      case 'excel':
        if (onExportExcel) await onExportExcel()
        break
      case 'csv':
        if (onExportCSV) await onExportCSV()
        break
    }
  }

  const exportOptions = [
    {
      type: 'pdf',
      label: 'Export as PDF',
      icon: FileText,
      show: showPDF && onExportPDF,
      color: 'text-red-400'
    },
    {
      type: 'excel',
      label: 'Export as Excel',
      icon: FileSpreadsheet,
      show: showExcel && onExportExcel,
      color: 'text-green-400'
    },
    {
      type: 'csv',
      label: 'Export as CSV',
      icon: FileText,
      show: showCSV && onExportCSV,
      color: 'text-blue-400'
    }
  ].filter(opt => opt.show)

  // If only one export option, show as single button
  if (exportOptions.length === 1) {
    const option = exportOptions[0]
    return (
      <button
        onClick={() => handleExport(option.type)}
        disabled={disabled || loading}
        className={`flex items-center gap-2 px-3 py-2 bg-dark-200 text-gray-400 rounded-lg hover:text-white hover:bg-dark-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px] touch-manipulation text-sm ${className}`}
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <option.icon size={16} className={option.color} />
        )}
        <span className="hidden sm:inline">{loading ? 'Exporting...' : option.label}</span>
      </button>
    )
  }

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || loading}
        className="flex items-center gap-2 px-3 py-2 bg-dark-200 text-gray-400 rounded-lg hover:text-white hover:bg-dark-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px] touch-manipulation text-sm"
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Download size={16} />
        )}
        <span className="hidden sm:inline">{loading ? 'Exporting...' : label}</span>
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-dark-100 border border-dark-200 rounded-xl shadow-2xl py-2 z-50 animate-fadeIn">
          {exportOptions.map((option) => (
            <button
              key={option.type}
              onClick={() => handleExport(option.type)}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-dark-200 transition-colors min-h-[44px] touch-manipulation"
            >
              <option.icon size={18} className={option.color} />
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ExportDropdown
