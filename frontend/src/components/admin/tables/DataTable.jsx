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
    <thead>
      <tr className="border-b border-dark-200">
        {selectable && (
          <th className="px-4 py-3 text-left">
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
            className={`px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider ${
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
            <td className="px-4 py-3">
              <input
                type="checkbox"
                checked={selectedRows.includes(row.id)}
                onChange={() => onSelectRow && onSelectRow(row.id)}
                className="w-4 h-4 rounded border-dark-200 text-primary focus:ring-primary focus:ring-offset-dark-100"
              />
            </td>
          )}
          {columns.map((column) => (
            <td key={column.key} className={`px-4 py-3 ${column.cellClassName || ''}`}>
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
            <td className="px-4 py-3">
              <div className="w-4 h-4 bg-dark-200 rounded animate-pulse"></div>
            </td>
          )}
          {columns.map((column) => (
            <td key={column.key} className="px-4 py-3">
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
      <div className="flex items-center justify-between px-4 py-3 border-t border-dark-200">
        <div className="text-sm text-gray-500">
          Showing <span className="font-medium text-white">{start}</span> to{' '}
          <span className="font-medium text-white">{end}</span> of{' '}
          <span className="font-medium text-white">{total}</span> results
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(1)}
            disabled={page === 1}
            className="p-1.5 rounded hover:bg-dark-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-400 hover:text-white"
          >
            <ChevronsLeft size={18} />
          </button>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="p-1.5 rounded hover:bg-dark-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-400 hover:text-white"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="px-3 py-1 text-sm text-white">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="p-1.5 rounded hover:bg-dark-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-400 hover:text-white"
          >
            <ChevronRight size={18} />
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={page === totalPages}
            className="p-1.5 rounded hover:bg-dark-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-400 hover:text-white"
          >
            <ChevronsRight size={18} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-dark-100 rounded-xl border border-dark-200 overflow-hidden ${className}`}>
      {/* Toolbar */}
      {(searchable || actions) && (
        <div className="flex items-center justify-between p-4 border-b border-dark-200">
          <div className="flex items-center gap-3">
            {searchable && (
              <div className="flex items-center gap-2 px-3 py-2 bg-dark-200 rounded-lg">
                <Search size={16} className="text-gray-500" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-48"
                />
              </div>
            )}
            {selectable && selectedRows.length > 0 && (
              <span className="text-sm text-gray-400">
                {selectedRows.length} selected
              </span>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
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
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
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
    sm: 'p-1.5',
    md: 'p-2',
  }

  return (
    <button
      onClick={onClick}
      className={`rounded-lg transition-colors ${variants[variant]} ${sizes[size]}`}
      title={label}
    >
      <Icon size={size === 'sm' ? 16 : 18} />
    </button>
  )
}

export default DataTable
