import { useState } from 'react'
import {
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  ArrowUp, ArrowDown, Search, Filter, Download, RefreshCw, Check
} from 'lucide-react'

const DataTable = ({
  data = [],
  columns = [],
  loading = false,
  pagination = null,
  onPageChange,
  onSort,
  sortColumn,
  sortDirection,
  selectable = false,
  selectedRows = [],
  onSelectRow,
  onSelectAll,
  searchable = false,
  searchPlaceholder = 'Search...',
  onSearch,
  actions,
  emptyMessage = 'No data available',
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (value) => {
    setSearchQuery(value)
    if (onSearch) {
      onSearch(value)
    }
  }

  const handleSort = (columnKey) => {
    if (onSort) {
      const newDirection = sortColumn === columnKey && sortDirection === 'asc' ? 'desc' : 'asc'
      onSort(columnKey, newDirection)
    }
  }

  const isAllSelected = data.length > 0 && selectedRows.length === data.length

  const TableHeader = () => (
    <thead className="bg-dark-200/50">
      <tr className="border-b border-dark-200">
        {selectable && (
          <th className="px-3 sm:px-4 py-3 text-left w-12">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={(e) => onSelectAll && onSelectAll(e.target.checked)}
              className="w-4 h-4 rounded border-dark-200 text-primary focus:ring-primary focus:ring-offset-dark-100"
            />
          </th>
        )}
        {columns.map((column) => (
          <th
            key={column.key}
            className={`px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap ${
              column.sortable ? 'cursor-pointer hover:text-white' : ''
            } ${column.className || ''}`}
            onClick={() => column.sortable && handleSort(column.key)}
          >
            <div className="flex items-center gap-2">
              <span>{column.label}</span>
              {column.sortable && sortColumn === column.key && (
                sortDirection === 'asc' ? (
                  <ArrowUp size={14} className="text-primary" />
                ) : (
                  <ArrowDown size={14} className="text-primary" />
                )
              )}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  )

  const TableBody = () => (
    <tbody className="divide-y divide-dark-200">
      {data.map((row, rowIndex) => (
        <tr
          key={row.id || rowIndex}
          className={`hover:bg-dark-200/30 transition-colors ${
            selectable && selectedRows.includes(row.id) ? 'bg-primary/5' : ''
          }`}
        >
          {selectable && (
            <td className="px-3 sm:px-4 py-3 w-12">
              <input
                type="checkbox"
                checked={selectedRows.includes(row.id)}
                onChange={() => onSelectRow && onSelectRow(row.id)}
                className="w-4 h-4 rounded border-dark-200 text-primary focus:ring-primary focus:ring-offset-dark-100"
              />
            </td>
          )}
          {columns.map((column) => (
            <td key={column.key} className={`px-3 sm:px-4 py-3 whitespace-nowrap ${column.cellClassName || ''}`}>
              {column.render ? column.render(row[column.key], row) : row[column.key]}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  )

  const LoadingSkeleton = () => (
    <tbody>
      {[...Array(5)].map((_, index) => (
        <tr key={index} className="border-b border-dark-200">
          {selectable && (
            <td className="px-3 sm:px-4 py-3">
              <div className="w-4 h-4 bg-dark-200 rounded animate-pulse"></div>
            </td>
          )}
          {columns.map((column) => (
            <td key={column.key} className="px-3 sm:px-4 py-3">
              <div className="h-4 bg-dark-200 rounded animate-pulse w-3/4"></div>
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  )

  const EmptyState = () => (
    <tbody>
      <tr>
        <td
          colSpan={columns.length + (selectable ? 1 : 0)}
          className="px-4 py-12 text-center text-gray-500"
        >
          {emptyMessage}
        </td>
      </tr>
    </tbody>
  )

  const Pagination = () => {
    if (!pagination) return null

    const { page, totalPages, total, perPage } = pagination
    const start = (page - 1) * perPage + 1
    const end = Math.min(page * perPage, total)

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 sm:px-4 py-3 border-t border-dark-200">
        <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
          Showing <span className="font-medium text-white">{start}</span> to{' '}
          <span className="font-medium text-white">{end}</span> of{' '}
          <span className="font-medium text-white">{total}</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => onPageChange(1)}
            disabled={page === 1}
            className="p-1.5 sm:p-2 rounded hover:bg-dark-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-400 hover:text-white min-h-[36px] min-w-[36px] flex items-center justify-center touch-manipulation"
          >
            <ChevronsLeft size={16} />
          </button>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="p-1.5 sm:p-2 rounded hover:bg-dark-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-400 hover:text-white min-h-[36px] min-w-[36px] flex items-center justify-center touch-manipulation"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-white whitespace-nowrap">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="p-1.5 sm:p-2 rounded hover:bg-dark-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-400 hover:text-white min-h-[36px] min-w-[36px] flex items-center justify-center touch-manipulation"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={page === totalPages}
            className="p-1.5 sm:p-2 rounded hover:bg-dark-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-400 hover:text-white min-h-[36px] min-w-[36px] flex items-center justify-center touch-manipulation"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-dark-100 rounded-xl border border-dark-200 overflow-hidden ${className}`}>
      {/* Toolbar */}
      {(searchable || actions) && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 border-b border-dark-200">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {searchable && (
              <div className="flex items-center gap-2 px-3 py-2 bg-dark-200 rounded-lg flex-1 sm:flex-none">
                <Search size={16} className="text-gray-500 flex-shrink-0" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-full sm:w-48"
                />
              </div>
            )}
            {selectable && selectedRows.length > 0 && (
              <span className="text-sm text-gray-400 whitespace-nowrap">
                {selectedRows.length} selected
              </span>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Table with horizontal scroll */}
      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full min-w-[600px]">
          <TableHeader />
          {loading ? <LoadingSkeleton /> : data.length === 0 ? <EmptyState /> : <TableBody />}
        </table>
      </div>

      {/* Pagination */}
      <Pagination />
    </div>
  )
}

// Status badge component
export const StatusBadge = ({ status, type = 'default' }) => {
  const statusStyles = {
    // User statuses
    active: 'bg-green-500/10 text-green-500 border-green-500/20',
    banned: 'bg-red-500/10 text-red-500 border-red-500/20',
    frozen: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',

    // Challenge statuses
    passed: 'bg-green-500/10 text-green-500 border-green-500/20',
    failed: 'bg-red-500/10 text-red-500 border-red-500/20',
    funded: 'bg-purple-500/10 text-purple-500 border-purple-500/20',

    // Payment statuses
    completed: 'bg-green-500/10 text-green-500 border-green-500/20',
    processing: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    refunded: 'bg-orange-500/10 text-orange-500 border-orange-500/20',

    // Ticket statuses
    open: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    in_progress: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    resolved: 'bg-green-500/10 text-green-500 border-green-500/20',
    closed: 'bg-gray-500/10 text-gray-500 border-gray-500/20',

    // Default
    default: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  }

  const style = statusStyles[status?.toLowerCase()] || statusStyles.default

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${style}`}>
      {status}
    </span>
  )
}

// Action button component
export const ActionButton = ({ icon: Icon, label, onClick, variant = 'default', size = 'sm' }) => {
  const variants = {
    default: 'text-gray-400 hover:text-white hover:bg-dark-200',
    primary: 'text-primary hover:text-primary-dark hover:bg-primary/10',
    danger: 'text-red-500 hover:text-red-400 hover:bg-red-500/10',
    success: 'text-green-500 hover:text-green-400 hover:bg-green-500/10',
  }

  const sizes = {
    sm: 'p-1.5 min-h-[36px] min-w-[36px]',
    md: 'p-2 min-h-[40px] min-w-[40px]',
  }

  return (
    <button
      onClick={onClick}
      className={`rounded-lg transition-colors flex items-center justify-center touch-manipulation ${variants[variant]} ${sizes[size]}`}
      title={label}
    >
      <Icon size={size === 'sm' ? 16 : 18} />
    </button>
  )
}

export default DataTable
