/**
 * Export Utilities for Admin Dashboard
 * CSV and Excel export functionality
 */

// ==================== CSV EXPORT ====================

/**
 * Convert array of objects to CSV string
 * @param {Array} data - Array of objects to convert
 * @param {Array} columns - Array of column definitions { key, label }
 * @returns {string} CSV formatted string
 */
export const arrayToCSV = (data, columns) => {
  if (!data || data.length === 0) return ''

  // Header row
  const headers = columns.map(col => `"${col.label || col.key}"`)

  // Data rows
  const rows = data.map(item => {
    return columns.map(col => {
      let value = item[col.key]

      // Handle nested properties
      if (col.key.includes('.')) {
        value = col.key.split('.').reduce((obj, key) => obj?.[key], item)
      }

      // Apply formatter if provided
      if (col.formatter) {
        value = col.formatter(value, item)
      }

      // Handle null/undefined
      if (value === null || value === undefined) {
        value = ''
      }

      // Handle dates
      if (value instanceof Date) {
        value = value.toISOString()
      }

      // Escape quotes and wrap in quotes
      return `"${String(value).replace(/"/g, '""')}"`
    }).join(',')
  })

  return [headers.join(','), ...rows].join('\n')
}

/**
 * Download data as CSV file
 * @param {Array} data - Array of objects to export
 * @param {Array} columns - Column definitions
 * @param {string} filename - Name of the file (without extension)
 */
export const downloadCSV = (data, columns, filename = 'export') => {
  const csv = arrayToCSV(data, columns)
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ==================== EXCEL EXPORT ====================

/**
 * Convert array of objects to Excel-compatible XML
 * @param {Array} data - Array of objects to convert
 * @param {Array} columns - Column definitions
 * @param {string} sheetName - Name of the worksheet
 * @returns {string} Excel XML string
 */
export const arrayToExcelXML = (data, columns, sheetName = 'Sheet1') => {
  const escapeXML = (str) => {
    if (str === null || str === undefined) return ''
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Header">
      <Font ss:Bold="1"/>
      <Interior ss:Color="#4F46E5" ss:Pattern="Solid"/>
      <Font ss:Color="#FFFFFF"/>
    </Style>
    <Style ss:ID="Date">
      <NumberFormat ss:Format="yyyy-mm-dd"/>
    </Style>
    <Style ss:ID="Currency">
      <NumberFormat ss:Format="#,##0.00"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="${escapeXML(sheetName)}">
    <Table>`

  // Header row
  xml += '\n      <Row ss:StyleID="Header">'
  columns.forEach(col => {
    xml += `\n        <Cell><Data ss:Type="String">${escapeXML(col.label || col.key)}</Data></Cell>`
  })
  xml += '\n      </Row>'

  // Data rows
  data.forEach(item => {
    xml += '\n      <Row>'
    columns.forEach(col => {
      let value = item[col.key]

      // Handle nested properties
      if (col.key.includes('.')) {
        value = col.key.split('.').reduce((obj, key) => obj?.[key], item)
      }

      // Apply formatter if provided
      if (col.formatter) {
        value = col.formatter(value, item)
      }

      // Determine data type
      let type = 'String'
      let style = ''

      if (typeof value === 'number') {
        type = 'Number'
        if (col.type === 'currency') {
          style = ' ss:StyleID="Currency"'
        }
      } else if (value instanceof Date) {
        type = 'DateTime'
        value = value.toISOString()
        style = ' ss:StyleID="Date"'
      }

      if (value === null || value === undefined) {
        value = ''
        type = 'String'
      }

      xml += `\n        <Cell${style}><Data ss:Type="${type}">${escapeXML(value)}</Data></Cell>`
    })
    xml += '\n      </Row>'
  })

  xml += `
    </Table>
  </Worksheet>
</Workbook>`

  return xml
}

/**
 * Download data as Excel file
 * @param {Array} data - Array of objects to export
 * @param {Array} columns - Column definitions
 * @param {string} filename - Name of the file (without extension)
 * @param {string} sheetName - Name of the worksheet
 */
export const downloadExcel = (data, columns, filename = 'export', sheetName = 'Data') => {
  const xml = arrayToExcelXML(data, columns, sheetName)
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.xls`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ==================== JSON EXPORT ====================

/**
 * Download data as JSON file
 * @param {Array|Object} data - Data to export
 * @param {string} filename - Name of the file (without extension)
 */
export const downloadJSON = (data, filename = 'export') => {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ==================== PDF EXPORT (Basic) ====================

/**
 * Generate printable HTML for PDF export
 * Opens in new window for print dialog
 * @param {Array} data - Array of objects to export
 * @param {Array} columns - Column definitions
 * @param {string} title - Report title
 */
export const printToPDF = (data, columns, title = 'Report') => {
  const styles = `
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; }
      h1 { color: #1f2937; margin-bottom: 20px; }
      .meta { color: #6b7280; font-size: 12px; margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; }
      th { background: #4F46E5; color: white; padding: 12px 8px; text-align: left; font-size: 12px; }
      td { padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
      tr:nth-child(even) { background: #f9fafb; }
      @media print {
        body { margin: 0; }
        table { page-break-inside: auto; }
        tr { page-break-inside: avoid; }
      }
    </style>
  `

  let tableHTML = `
    <table>
      <thead>
        <tr>
          ${columns.map(col => `<th>${col.label || col.key}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
  `

  data.forEach(item => {
    tableHTML += '<tr>'
    columns.forEach(col => {
      let value = item[col.key]
      if (col.key.includes('.')) {
        value = col.key.split('.').reduce((obj, key) => obj?.[key], item)
      }
      if (col.formatter) {
        value = col.formatter(value, item)
      }
      tableHTML += `<td>${value ?? ''}</td>`
    })
    tableHTML += '</tr>'
  })

  tableHTML += '</tbody></table>'

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        ${styles}
      </head>
      <body>
        <h1>${title}</h1>
        <div class="meta">
          Generated on: ${new Date().toLocaleString()}<br>
          Total records: ${data.length}
        </div>
        ${tableHTML}
      </body>
    </html>
  `

  const printWindow = window.open('', '_blank')
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => {
    printWindow.print()
  }, 250)
}

// ==================== EXPORT BUTTON COMPONENT ====================

import { useState } from 'react'
import { Download, FileSpreadsheet, FileText, Printer, ChevronDown } from 'lucide-react'

/**
 * Export Button Component with dropdown
 */
export const ExportButton = ({ data, columns, filename = 'export', title = 'Export' }) => {
  const [isOpen, setIsOpen] = useState(false)

  const handleExport = (type) => {
    switch (type) {
      case 'csv':
        downloadCSV(data, columns, filename)
        break
      case 'excel':
        downloadExcel(data, columns, filename)
        break
      case 'json':
        downloadJSON(data, filename)
        break
      case 'pdf':
        printToPDF(data, columns, title)
        break
    }
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-dark-200 text-gray-400 rounded-lg hover:text-white hover:bg-dark-300 transition-colors"
      >
        <Download size={18} />
        Export
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-dark-100 rounded-lg border border-dark-200 shadow-xl z-20 py-2">
            <button
              onClick={() => handleExport('csv')}
              className="w-full flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white hover:bg-dark-200 transition-colors"
            >
              <FileText size={16} />
              Export as CSV
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="w-full flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white hover:bg-dark-200 transition-colors"
            >
              <FileSpreadsheet size={16} />
              Export as Excel
            </button>
            <button
              onClick={() => handleExport('json')}
              className="w-full flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white hover:bg-dark-200 transition-colors"
            >
              <FileText size={16} />
              Export as JSON
            </button>
            <hr className="my-2 border-dark-300" />
            <button
              onClick={() => handleExport('pdf')}
              className="w-full flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white hover:bg-dark-200 transition-colors"
            >
              <Printer size={16} />
              Print / PDF
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ==================== PREDEFINED COLUMN DEFINITIONS ====================

export const userColumns = [
  { key: 'id', label: 'ID' },
  { key: 'username', label: 'Username' },
  { key: 'email', label: 'Email' },
  { key: 'status', label: 'Status' },
  { key: 'role', label: 'Role' },
  { key: 'created_at', label: 'Created At', formatter: (val) => val ? new Date(val).toLocaleDateString() : '' }
]

export const challengeColumns = [
  { key: 'id', label: 'ID' },
  { key: 'user.username', label: 'User' },
  { key: 'type', label: 'Type' },
  { key: 'status', label: 'Status' },
  { key: 'balance', label: 'Balance', type: 'currency' },
  { key: 'profit', label: 'Profit', type: 'currency' },
  { key: 'created_at', label: 'Start Date', formatter: (val) => val ? new Date(val).toLocaleDateString() : '' }
]

export const paymentColumns = [
  { key: 'id', label: 'ID' },
  { key: 'user.username', label: 'User' },
  { key: 'amount', label: 'Amount', type: 'currency' },
  { key: 'currency', label: 'Currency' },
  { key: 'status', label: 'Status' },
  { key: 'payment_method', label: 'Method' },
  { key: 'created_at', label: 'Date', formatter: (val) => val ? new Date(val).toLocaleDateString() : '' }
]

export const ticketColumns = [
  { key: 'id', label: 'ID' },
  { key: 'subject', label: 'Subject' },
  { key: 'user.username', label: 'User' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
  { key: 'created_at', label: 'Created', formatter: (val) => val ? new Date(val).toLocaleDateString() : '' }
]

export default {
  arrayToCSV,
  downloadCSV,
  arrayToExcelXML,
  downloadExcel,
  downloadJSON,
  printToPDF,
  ExportButton,
  userColumns,
  challengeColumns,
  paymentColumns,
  ticketColumns
}
