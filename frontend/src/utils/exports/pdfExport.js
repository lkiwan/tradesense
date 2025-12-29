import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  PDF_COLORS,
  PDF_FONTS,
  PDF_MARGINS,
  PDF_LAYOUT,
  getTableStyles,
  getRetentionPdfColor,
  getRetentionBgColor
} from './templates/pdfStyles'

// Generate filename with timestamp
export const generateFileName = (reportType, dateRange = null) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15)
  const dateStr = dateRange ? `_${dateRange}` : ''
  return `${reportType}${dateStr}_${timestamp}.pdf`
}

// Add header to PDF
export const addHeader = (doc, title, subtitle = null) => {
  const pageWidth = doc.internal.pageSize.getWidth()

  // Logo placeholder (rectangle with text)
  doc.setFillColor(...PDF_COLORS.primary)
  doc.roundedRect(PDF_MARGINS.left, 15, 35, 35, 3, 3, 'F')
  doc.setTextColor(...PDF_COLORS.textWhite)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('TS', PDF_MARGINS.left + 17.5, 37, { align: 'center' })

  // Title
  doc.setTextColor(...PDF_COLORS.textDark)
  doc.setFontSize(PDF_FONTS.title.size)
  doc.setFont('helvetica', PDF_FONTS.title.style)
  doc.text(title, PDF_MARGINS.left + 45, 30)

  // Subtitle
  if (subtitle) {
    doc.setTextColor(...PDF_COLORS.textGray)
    doc.setFontSize(PDF_FONTS.subtitle.size)
    doc.setFont('helvetica', PDF_FONTS.subtitle.style)
    doc.text(subtitle, PDF_MARGINS.left + 45, 42)
  }

  // Date on the right
  doc.setTextColor(...PDF_COLORS.textGray)
  doc.setFontSize(PDF_FONTS.small.size)
  doc.setFont('helvetica', 'normal')
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  doc.text(`Generated: ${date}`, pageWidth - PDF_MARGINS.right, 25, { align: 'right' })

  // Divider line
  doc.setDrawColor(...PDF_COLORS.primary)
  doc.setLineWidth(0.5)
  doc.line(PDF_MARGINS.left, 55, pageWidth - PDF_MARGINS.right, 55)

  return 65 // Return Y position after header
}

// Add footer to PDF
export const addFooter = (doc, pageNum, totalPages) => {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const y = pageHeight - 20

  // Divider line
  doc.setDrawColor(...PDF_COLORS.tableBorder)
  doc.setLineWidth(0.3)
  doc.line(PDF_MARGINS.left, y - 5, pageWidth - PDF_MARGINS.right, y - 5)

  // Footer text
  doc.setTextColor(...PDF_COLORS.textGray)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')

  doc.text('TradeSense - Confidential', PDF_MARGINS.left, y)
  doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - PDF_MARGINS.right, y, { align: 'right' })
}

// Add section title
export const addSectionTitle = (doc, title, y, icon = null) => {
  doc.setTextColor(...PDF_COLORS.primary)
  doc.setFontSize(PDF_FONTS.sectionTitle.size)
  doc.setFont('helvetica', PDF_FONTS.sectionTitle.style)
  doc.text(title, PDF_MARGINS.left, y)

  // Underline
  const titleWidth = doc.getTextWidth(title)
  doc.setDrawColor(...PDF_COLORS.primary)
  doc.setLineWidth(0.5)
  doc.line(PDF_MARGINS.left, y + 2, PDF_MARGINS.left + titleWidth, y + 2)

  return y + 15
}

// Add stats cards row
export const addStatsCards = (doc, stats, y) => {
  const cardWidth = (PDF_LAYOUT.contentWidth - 30) / 4
  const cardHeight = 45

  stats.forEach((stat, index) => {
    const x = PDF_MARGINS.left + (index * (cardWidth + 10))

    // Card background
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'F')

    // Card border
    doc.setDrawColor(...PDF_COLORS.tableBorder)
    doc.setLineWidth(0.3)
    doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'S')

    // Label
    doc.setTextColor(...PDF_COLORS.textGray)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(stat.label, x + 8, y + 15)

    // Value
    doc.setTextColor(...PDF_COLORS.textDark)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(String(stat.value), x + 8, y + 32)

    // Trend (if available)
    if (stat.trend !== undefined) {
      const trendColor = stat.trend >= 0 ? PDF_COLORS.success : PDF_COLORS.danger
      doc.setTextColor(...trendColor)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      const trendText = `${stat.trend >= 0 ? '+' : ''}${stat.trend}%`
      doc.text(trendText, x + cardWidth - 10, y + 32, { align: 'right' })
    }
  })

  return y + cardHeight + 15
}

// Add a simple table
export const addTable = (doc, headers, data, y, options = {}) => {
  const tableStyles = getTableStyles(options.variant || 'default')

  autoTable(doc, {
    startY: y,
    head: [headers],
    body: data,
    margin: { left: PDF_MARGINS.left, right: PDF_MARGINS.right },
    ...tableStyles,
    ...options,
  })

  return doc.lastAutoTable.finalY + 15
}

// Add cohort retention matrix with color coding
export const addRetentionMatrix = (doc, cohortData, y) => {
  const headers = ['Cohort', 'Users', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'Revenue']

  const body = cohortData.map(cohort => [
    cohort.period,
    cohort.users.toLocaleString(),
    cohort.month1 !== null ? `${cohort.month1}%` : '-',
    cohort.month2 !== null ? `${cohort.month2}%` : '-',
    cohort.month3 !== null ? `${cohort.month3}%` : '-',
    cohort.month4 !== null ? `${cohort.month4}%` : '-',
    cohort.month5 !== null ? `${cohort.month5}%` : '-',
    cohort.month6 !== null ? `${cohort.month6}%` : '-',
    `$${cohort.revenue.toLocaleString()}`,
  ])

  autoTable(doc, {
    startY: y,
    head: [headers],
    body: body,
    margin: { left: PDF_MARGINS.left, right: PDF_MARGINS.right },
    headStyles: {
      fillColor: PDF_COLORS.primary,
      textColor: PDF_COLORS.textWhite,
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 3,
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold' },
      1: { halign: 'center' },
      8: { halign: 'right', textColor: PDF_COLORS.success },
    },
    didParseCell: (data) => {
      // Color code retention cells
      if (data.section === 'body' && data.column.index >= 2 && data.column.index <= 7) {
        const cellText = data.cell.raw
        if (cellText && cellText !== '-') {
          const value = parseInt(cellText)
          data.cell.styles.fillColor = getRetentionBgColor(value)
          data.cell.styles.textColor = getRetentionPdfColor(value)
          data.cell.styles.fontStyle = 'bold'
        }
      }
    },
  })

  return doc.lastAutoTable.finalY + 10
}

// Add retention curve (simplified bar representation)
export const addRetentionCurve = (doc, retentionData, y) => {
  const chartWidth = PDF_LAYOUT.contentWidth
  const chartHeight = 100
  const barWidth = 60
  const maxBarHeight = 80
  const startX = PDF_MARGINS.left + 40
  const baseY = y + chartHeight - 10

  // Background
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(PDF_MARGINS.left, y, chartWidth, chartHeight, 3, 3, 'F')

  // Y-axis labels
  doc.setTextColor(...PDF_COLORS.textGray)
  doc.setFontSize(7)
  doc.text('100%', PDF_MARGINS.left + 5, y + 15)
  doc.text('50%', PDF_MARGINS.left + 5, y + 50)
  doc.text('0%', PDF_MARGINS.left + 5, y + 85)

  // Draw bars
  const days = [
    { label: 'Day 1', value: retentionData.day1 },
    { label: 'Day 7', value: retentionData.day7 },
    { label: 'Day 14', value: retentionData.day14 },
    { label: 'Day 30', value: retentionData.day30 },
    { label: 'Day 60', value: retentionData.day60 },
    { label: 'Day 90', value: retentionData.day90 },
  ]

  days.forEach((day, index) => {
    const x = startX + (index * (barWidth + 15))
    const barHeight = (day.value / 100) * maxBarHeight
    const barY = baseY - barHeight

    // Bar gradient effect (solid color for PDF)
    doc.setFillColor(...PDF_COLORS.primary)
    doc.roundedRect(x, barY, barWidth - 20, barHeight, 2, 2, 'F')

    // Value label
    doc.setTextColor(...PDF_COLORS.textDark)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(`${day.value}%`, x + (barWidth - 20) / 2, barY - 5, { align: 'center' })

    // X-axis label
    doc.setTextColor(...PDF_COLORS.textGray)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(day.label, x + (barWidth - 20) / 2, baseY + 10, { align: 'center' })
  })

  return y + chartHeight + 20
}

// Add channel retention table
export const addChannelRetention = (doc, channelData, y) => {
  const headers = ['Channel', 'Users', 'Day 1', 'Day 7', 'Day 30']

  const body = channelData.map(channel => [
    channel.channel,
    channel.users.toLocaleString(),
    `${channel.day1}%`,
    `${channel.day7}%`,
    `${channel.day30}%`,
  ])

  autoTable(doc, {
    startY: y,
    head: [headers],
    body: body,
    margin: { left: PDF_MARGINS.left, right: PDF_MARGINS.right },
    ...getTableStyles('default'),
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'center' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index >= 2) {
        const value = parseInt(data.cell.raw)
        data.cell.styles.fillColor = getRetentionBgColor(value)
        data.cell.styles.textColor = getRetentionPdfColor(value)
        data.cell.styles.fontStyle = 'bold'
      }
    },
  })

  return doc.lastAutoTable.finalY + 15
}

// Add user segments
export const addUserSegments = (doc, segments, y) => {
  const headers = ['Segment', 'Users', 'Avg Trades', 'Retention', 'LTV', 'Growth']

  const body = segments.map(segment => [
    segment.name,
    segment.users.toLocaleString(),
    segment.avgTrades,
    `${segment.retention}%`,
    `$${segment.ltv.toLocaleString()}`,
    `${segment.growth >= 0 ? '+' : ''}${segment.growth}%`,
  ])

  autoTable(doc, {
    startY: y,
    head: [headers],
    body: body,
    margin: { left: PDF_MARGINS.left, right: PDF_MARGINS.right },
    ...getTableStyles('default'),
    columnStyles: {
      0: { fontStyle: 'bold' },
      5: { halign: 'center' },
    },
    didParseCell: (data) => {
      // Color code retention
      if (data.section === 'body' && data.column.index === 3) {
        const value = parseInt(data.cell.raw)
        data.cell.styles.fillColor = getRetentionBgColor(value)
        data.cell.styles.textColor = getRetentionPdfColor(value)
        data.cell.styles.fontStyle = 'bold'
      }
      // Color code growth
      if (data.section === 'body' && data.column.index === 5) {
        const value = parseFloat(data.cell.raw)
        data.cell.styles.textColor = value >= 0 ? PDF_COLORS.success : PDF_COLORS.danger
        data.cell.styles.fontStyle = 'bold'
      }
    },
  })

  return doc.lastAutoTable.finalY + 15
}

// Add legend
export const addLegend = (doc, y) => {
  const legendItems = [
    { label: '60%+', color: PDF_COLORS.success, bgColor: [220, 252, 231] },
    { label: '40-59%', color: PDF_COLORS.info, bgColor: [219, 234, 254] },
    { label: '25-39%', color: PDF_COLORS.warning, bgColor: [254, 243, 199] },
    { label: '<25%', color: PDF_COLORS.danger, bgColor: [254, 226, 226] },
  ]

  doc.setFontSize(8)
  doc.setTextColor(...PDF_COLORS.textGray)
  doc.text('Retention Legend:', PDF_MARGINS.left, y)

  let x = PDF_MARGINS.left + 60
  legendItems.forEach((item) => {
    // Color box
    doc.setFillColor(...item.bgColor)
    doc.rect(x, y - 6, 12, 8, 'F')
    doc.setDrawColor(...item.color)
    doc.rect(x, y - 6, 12, 8, 'S')

    // Label
    doc.setTextColor(...item.color)
    doc.text(item.label, x + 15, y)
    x += 55
  })

  return y + 15
}

// Add financial stats cards (2 rows)
export const addFinancialStats = (doc, stats, y) => {
  const cardWidth = (PDF_LAYOUT.contentWidth - 20) / 2
  const cardHeight = 50

  const statsRow1 = [
    { label: 'Total Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, trend: stats.revenueGrowth, color: PDF_COLORS.success },
    { label: 'Monthly Revenue', value: `$${stats.monthlyRevenue.toLocaleString()}`, color: PDF_COLORS.info }
  ]

  const statsRow2 = [
    { label: 'Pending Payouts', value: `$${stats.pendingPayouts.toLocaleString()}`, color: PDF_COLORS.warning },
    { label: 'Completed Payouts', value: `$${stats.completedPayouts.toLocaleString()}`, trend: stats.payoutsGrowth, color: PDF_COLORS.purple }
  ]

  const drawRow = (rowStats, rowY) => {
    rowStats.forEach((stat, index) => {
      const x = PDF_MARGINS.left + (index * (cardWidth + 20))

      // Card background
      doc.setFillColor(248, 250, 252)
      doc.roundedRect(x, rowY, cardWidth, cardHeight, 3, 3, 'F')

      // Color indicator
      doc.setFillColor(...stat.color)
      doc.rect(x, rowY, 4, cardHeight, 'F')

      // Label
      doc.setTextColor(...PDF_COLORS.textGray)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text(stat.label, x + 12, rowY + 18)

      // Value
      doc.setTextColor(...PDF_COLORS.textDark)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text(stat.value, x + 12, rowY + 38)

      // Trend
      if (stat.trend !== undefined) {
        const trendColor = stat.trend >= 0 ? PDF_COLORS.success : PDF_COLORS.danger
        doc.setTextColor(...trendColor)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        const trendText = `${stat.trend >= 0 ? '+' : ''}${stat.trend}%`
        doc.text(trendText, x + cardWidth - 15, rowY + 20, { align: 'right' })
      }
    })
  }

  drawRow(statsRow1, y)
  drawRow(statsRow2, y + cardHeight + 10)

  return y + (cardHeight * 2) + 25
}

// Add revenue trend table
export const addRevenueTrendTable = (doc, revenueData, y) => {
  const headers = ['Date', 'Revenue', 'Payouts', 'Net']

  const body = revenueData.map(row => [
    row.date,
    `$${row.revenue.toLocaleString()}`,
    `$${row.payouts.toLocaleString()}`,
    `$${(row.revenue - row.payouts).toLocaleString()}`
  ])

  // Add totals row
  const totalRevenue = revenueData.reduce((sum, r) => sum + r.revenue, 0)
  const totalPayouts = revenueData.reduce((sum, r) => sum + r.payouts, 0)
  body.push(['TOTAL', `$${totalRevenue.toLocaleString()}`, `$${totalPayouts.toLocaleString()}`, `$${(totalRevenue - totalPayouts).toLocaleString()}`])

  autoTable(doc, {
    startY: y,
    head: [headers],
    body: body,
    margin: { left: PDF_MARGINS.left, right: PDF_MARGINS.right },
    headStyles: {
      fillColor: PDF_COLORS.primary,
      textColor: PDF_COLORS.textWhite,
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
      cellPadding: 5,
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 4,
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'left' },
      1: { textColor: PDF_COLORS.success },
      2: { textColor: PDF_COLORS.danger },
      3: { fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      // Style totals row
      if (data.section === 'body' && data.row.index === revenueData.length) {
        data.cell.styles.fillColor = [240, 240, 240]
        data.cell.styles.fontStyle = 'bold'
      }
    },
  })

  return doc.lastAutoTable.finalY + 15
}

// Add revenue by source table
export const addRevenueBySourceTable = (doc, sourceData, y) => {
  const headers = ['Source', 'Amount', 'Percentage', 'Share']

  const total = sourceData.reduce((sum, s) => sum + s.amount, 0)
  const body = sourceData.map(row => [
    row.source,
    `$${row.amount.toLocaleString()}`,
    `${row.percentage}%`,
    ''
  ])

  autoTable(doc, {
    startY: y,
    head: [headers],
    body: body,
    margin: { left: PDF_MARGINS.left, right: PDF_MARGINS.right },
    headStyles: {
      fillColor: PDF_COLORS.primary,
      textColor: PDF_COLORS.textWhite,
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
      cellPadding: 5,
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 4,
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold' },
      1: { halign: 'right', textColor: PDF_COLORS.success },
      2: { halign: 'center' },
      3: { cellWidth: 100 },
    },
    didDrawCell: (data) => {
      // Draw progress bar in Share column
      if (data.section === 'body' && data.column.index === 3) {
        const percentage = sourceData[data.row.index]?.percentage || 0
        const barWidth = (percentage / 100) * 90
        const colors = [PDF_COLORS.success, PDF_COLORS.info, PDF_COLORS.purple, PDF_COLORS.warning]
        const color = colors[data.row.index % colors.length]

        doc.setFillColor(230, 230, 230)
        doc.roundedRect(data.cell.x + 5, data.cell.y + 8, 90, 8, 2, 2, 'F')

        doc.setFillColor(...color)
        doc.roundedRect(data.cell.x + 5, data.cell.y + 8, barWidth, 8, 2, 2, 'F')
      }
    },
  })

  return doc.lastAutoTable.finalY + 15
}

// Add recent transactions table
export const addTransactionsTable = (doc, transactions, y) => {
  const headers = ['User', 'Type', 'Amount', 'Status', 'Date']

  const body = transactions.map(tx => [
    tx.user,
    tx.type.charAt(0).toUpperCase() + tx.type.slice(1),
    `${tx.type === 'payment' ? '+' : '-'}$${tx.amount.toLocaleString()}`,
    tx.status.charAt(0).toUpperCase() + tx.status.slice(1),
    new Date(tx.date).toLocaleDateString()
  ])

  autoTable(doc, {
    startY: y,
    head: [headers],
    body: body,
    margin: { left: PDF_MARGINS.left, right: PDF_MARGINS.right },
    headStyles: {
      fillColor: PDF_COLORS.primary,
      textColor: PDF_COLORS.textWhite,
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
      cellPadding: 5,
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 4,
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold' },
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'center' },
      4: { halign: 'center' },
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        // Color amount
        if (data.column.index === 2) {
          const tx = transactions[data.row.index]
          data.cell.styles.textColor = tx.type === 'payment' ? PDF_COLORS.success : PDF_COLORS.info
          data.cell.styles.fontStyle = 'bold'
        }
        // Color status
        if (data.column.index === 3) {
          const tx = transactions[data.row.index]
          if (tx.status === 'completed') {
            data.cell.styles.textColor = PDF_COLORS.success
          } else if (tx.status === 'pending') {
            data.cell.styles.textColor = PDF_COLORS.warning
          } else {
            data.cell.styles.textColor = PDF_COLORS.danger
          }
        }
      }
    },
  })

  return doc.lastAutoTable.finalY + 15
}

// ============================================
// ADVANCED ANALYTICS EXPORT FUNCTIONS
// ============================================

// Add revenue stats for advanced analytics
export const addRevenueAnalyticsStats = (doc, revenueData, y) => {
  const cardWidth = (PDF_LAYOUT.contentWidth - 30) / 4
  const cardHeight = 50

  const stats = [
    { label: 'Total Revenue', value: `$${revenueData.total.toLocaleString()}`, trend: revenueData.growth },
    { label: 'Avg. Order Value', value: `$${Math.round(revenueData.total / 1850).toLocaleString()}` },
    { label: 'Revenue per User', value: `$${Math.round(revenueData.total / 1000).toLocaleString()}` },
    { label: 'MRR', value: '$95,000' }
  ]

  stats.forEach((stat, index) => {
    const x = PDF_MARGINS.left + (index * (cardWidth + 10))

    doc.setFillColor(248, 250, 252)
    doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'F')

    doc.setTextColor(...PDF_COLORS.textGray)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(stat.label, x + 8, y + 15)

    doc.setTextColor(...PDF_COLORS.textDark)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(stat.value, x + 8, y + 35)

    if (stat.trend !== undefined) {
      const trendColor = stat.trend >= 0 ? PDF_COLORS.success : PDF_COLORS.danger
      doc.setTextColor(...trendColor)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text(`${stat.trend >= 0 ? '+' : ''}${stat.trend}%`, x + cardWidth - 10, y + 35, { align: 'right' })
    }
  })

  return y + cardHeight + 15
}

// Add revenue by source table
export const addRevenueBySourceAnalytics = (doc, bySource, y) => {
  const headers = ['Source', 'Amount', 'Percentage', 'Share']

  const body = bySource.map(row => [
    row.source,
    `$${row.amount.toLocaleString()}`,
    `${row.percentage}%`,
    ''
  ])

  autoTable(doc, {
    startY: y,
    head: [headers],
    body: body,
    margin: { left: PDF_MARGINS.left, right: PDF_MARGINS.right },
    headStyles: {
      fillColor: PDF_COLORS.primary,
      textColor: PDF_COLORS.textWhite,
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
      cellPadding: 5,
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 4,
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold' },
      1: { halign: 'right', textColor: PDF_COLORS.success },
      2: { halign: 'center' },
      3: { cellWidth: 80 },
    },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        const percentage = bySource[data.row.index]?.percentage || 0
        const barWidth = (percentage / 100) * 70

        doc.setFillColor(230, 230, 230)
        doc.roundedRect(data.cell.x + 5, data.cell.y + 8, 70, 8, 2, 2, 'F')

        doc.setFillColor(...PDF_COLORS.primary)
        doc.roundedRect(data.cell.x + 5, data.cell.y + 8, barWidth, 8, 2, 2, 'F')
      }
    },
  })

  return doc.lastAutoTable.finalY + 15
}

// Add top products table
export const addTopProductsTable = (doc, products, y) => {
  const headers = ['#', 'Product', 'Revenue', 'Sales', 'Avg. Price']

  const body = products.map((product, index) => [
    `${index + 1}`,
    product.name,
    `$${product.revenue.toLocaleString()}`,
    product.count.toLocaleString(),
    `$${Math.round(product.revenue / product.count).toLocaleString()}`
  ])

  autoTable(doc, {
    startY: y,
    head: [headers],
    body: body,
    margin: { left: PDF_MARGINS.left, right: PDF_MARGINS.right },
    headStyles: {
      fillColor: PDF_COLORS.primary,
      textColor: PDF_COLORS.textWhite,
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
      cellPadding: 5,
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 4,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 25 },
      1: { halign: 'left', fontStyle: 'bold' },
      2: { halign: 'right', textColor: PDF_COLORS.success },
      3: { halign: 'center' },
      4: { halign: 'right' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 0) {
        const index = data.row.index
        if (index === 0) data.cell.styles.textColor = [234, 179, 8] // Gold
        else if (index === 1) data.cell.styles.textColor = [156, 163, 175] // Silver
        else if (index === 2) data.cell.styles.textColor = [249, 115, 22] // Bronze
      }
    },
  })

  return doc.lastAutoTable.finalY + 15
}

// Add conversion funnel table
export const addConversionFunnelTable = (doc, funnel, y) => {
  const headers = ['Stage', 'Count', 'Rate', 'Drop-off']

  const body = funnel.map((stage, index) => {
    const prevCount = index > 0 ? funnel[index - 1].count : stage.count
    const dropoff = index > 0 ? ((prevCount - stage.count) / prevCount * 100).toFixed(1) : '-'
    return [
      stage.stage,
      stage.count.toLocaleString(),
      `${stage.rate}%`,
      index > 0 ? `${dropoff}%` : '-'
    ]
  })

  autoTable(doc, {
    startY: y,
    head: [headers],
    body: body,
    margin: { left: PDF_MARGINS.left, right: PDF_MARGINS.right },
    headStyles: {
      fillColor: PDF_COLORS.primary,
      textColor: PDF_COLORS.textWhite,
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
      cellPadding: 5,
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 4,
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold' },
      1: { halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'center' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3 && data.cell.raw !== '-') {
        data.cell.styles.textColor = PDF_COLORS.danger
      }
      if (data.section === 'body' && data.column.index === 2) {
        const value = parseFloat(data.cell.raw)
        if (value >= 50) data.cell.styles.textColor = PDF_COLORS.success
        else if (value >= 30) data.cell.styles.textColor = PDF_COLORS.info
        else data.cell.styles.textColor = PDF_COLORS.warning
      }
    },
  })

  return doc.lastAutoTable.finalY + 15
}

// Add conversion rates summary
export const addConversionRatesSummary = (doc, rates, y) => {
  const cardWidth = (PDF_LAYOUT.contentWidth - 30) / 4
  const cardHeight = 45

  const rateCards = [
    { label: 'Visitor → Sign-up', value: `${rates.visitorToSignup}%` },
    { label: 'Sign-up → Trial', value: `${rates.signupToTrial}%` },
    { label: 'Trial → Purchase', value: `${rates.trialToPurchase}%` },
    { label: 'Purchase → Funded', value: `${rates.purchaseToFunded}%` }
  ]

  rateCards.forEach((card, index) => {
    const x = PDF_MARGINS.left + (index * (cardWidth + 10))

    doc.setFillColor(248, 250, 252)
    doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'F')

    doc.setTextColor(...PDF_COLORS.textGray)
    doc.setFontSize(8)
    doc.text(card.label, x + 8, y + 15)

    doc.setTextColor(...PDF_COLORS.primary)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(card.value, x + 8, y + 32)
  })

  return y + cardHeight + 15
}

// Add LTV analysis stats
export const addLTVAnalyticsStats = (doc, ltvData, y) => {
  const cardWidth = (PDF_LAYOUT.contentWidth - 30) / 4
  const cardHeight = 50

  const stats = [
    { label: 'Average LTV', value: `$${ltvData.averageLTV.toLocaleString()}`, color: PDF_COLORS.success },
    { label: 'CAC', value: `$${ltvData.cac.toLocaleString()}`, color: PDF_COLORS.warning },
    { label: 'LTV:CAC Ratio', value: `${ltvData.ltvToCac}:1`, color: PDF_COLORS.primary },
    { label: 'Payback Period', value: `${ltvData.paybackPeriod} days`, color: PDF_COLORS.info }
  ]

  stats.forEach((stat, index) => {
    const x = PDF_MARGINS.left + (index * (cardWidth + 10))

    doc.setFillColor(248, 250, 252)
    doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'F')

    doc.setFillColor(...stat.color)
    doc.rect(x, y, 4, cardHeight, 'F')

    doc.setTextColor(...PDF_COLORS.textGray)
    doc.setFontSize(8)
    doc.text(stat.label, x + 12, y + 18)

    doc.setTextColor(...PDF_COLORS.textDark)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(stat.value, x + 12, y + 35)
  })

  return y + cardHeight + 15
}

// Add LTV segments table
export const addLTVSegmentsTable = (doc, segments, y) => {
  const headers = ['Segment', 'Avg. LTV', 'Customers', '% of Total', 'Total Value']

  const body = segments.map(seg => [
    seg.segment,
    `$${seg.ltv.toLocaleString()}`,
    seg.count.toLocaleString(),
    `${seg.percentage}%`,
    `$${(seg.ltv * seg.count).toLocaleString()}`
  ])

  autoTable(doc, {
    startY: y,
    head: [headers],
    body: body,
    margin: { left: PDF_MARGINS.left, right: PDF_MARGINS.right },
    headStyles: {
      fillColor: PDF_COLORS.primary,
      textColor: PDF_COLORS.textWhite,
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
      cellPadding: 5,
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 4,
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold' },
      1: { halign: 'right' },
      2: { halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'right', textColor: PDF_COLORS.success },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 0) {
        const segment = segments[data.row.index].segment
        if (segment === 'High Value') data.cell.styles.textColor = PDF_COLORS.success
        else if (segment === 'Medium Value') data.cell.styles.textColor = PDF_COLORS.info
        else data.cell.styles.textColor = PDF_COLORS.textGray
      }
    },
  })

  return doc.lastAutoTable.finalY + 15
}

// Add AI predictions summary
export const addPredictionsSummary = (doc, predictionData, y) => {
  const cardWidth = (PDF_LAYOUT.contentWidth - 20) / 3
  const cardHeight = 50

  const cards = [
    { label: 'Predicted Next Month Revenue', value: `$${predictionData.nextMonthRevenue.toLocaleString()}`, color: PDF_COLORS.success },
    { label: 'Prediction Confidence', value: `${predictionData.confidence}%`, color: PDF_COLORS.primary },
    { label: 'High-Risk Churn Users', value: predictionData.churnRisk.high.toString(), color: PDF_COLORS.danger }
  ]

  cards.forEach((card, index) => {
    const x = PDF_MARGINS.left + (index * (cardWidth + 10))

    doc.setFillColor(248, 250, 252)
    doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'F')

    doc.setFillColor(...card.color)
    doc.rect(x, y, 4, cardHeight, 'F')

    doc.setTextColor(...PDF_COLORS.textGray)
    doc.setFontSize(8)
    doc.text(card.label, x + 12, y + 18)

    doc.setTextColor(...PDF_COLORS.textDark)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(card.value, x + 12, y + 38)
  })

  return y + cardHeight + 15
}

// Add churn risk table
export const addChurnRiskTable = (doc, churnRisk, y) => {
  const total = churnRisk.high + churnRisk.medium + churnRisk.low
  const headers = ['Risk Level', 'Users', 'Percentage', 'Impact']

  const body = [
    ['High Risk', churnRisk.high.toString(), `${((churnRisk.high / total) * 100).toFixed(1)}%`, 'Immediate action required'],
    ['Medium Risk', churnRisk.medium.toString(), `${((churnRisk.medium / total) * 100).toFixed(1)}%`, 'Monitor closely'],
    ['Low Risk', churnRisk.low.toString(), `${((churnRisk.low / total) * 100).toFixed(1)}%`, 'Healthy engagement']
  ]

  autoTable(doc, {
    startY: y,
    head: [headers],
    body: body,
    margin: { left: PDF_MARGINS.left, right: PDF_MARGINS.right },
    headStyles: {
      fillColor: PDF_COLORS.primary,
      textColor: PDF_COLORS.textWhite,
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
      cellPadding: 5,
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 4,
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold' },
      1: { halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'left' },
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const riskLevel = data.row.index
        if (riskLevel === 0) {
          data.cell.styles.fillColor = [254, 226, 226]
          if (data.column.index === 0) data.cell.styles.textColor = PDF_COLORS.danger
        } else if (riskLevel === 1) {
          data.cell.styles.fillColor = [254, 243, 199]
          if (data.column.index === 0) data.cell.styles.textColor = PDF_COLORS.warning
        } else {
          data.cell.styles.fillColor = [220, 252, 231]
          if (data.column.index === 0) data.cell.styles.textColor = PDF_COLORS.success
        }
      }
    },
  })

  return doc.lastAutoTable.finalY + 15
}

// Add AI recommendations
export const addRecommendationsTable = (doc, recommendations, y) => {
  const headers = ['Type', 'Recommendation', 'Impact']

  const body = recommendations.map(rec => [
    rec.type.charAt(0).toUpperCase() + rec.type.slice(1),
    rec.text,
    rec.impact
  ])

  autoTable(doc, {
    startY: y,
    head: [headers],
    body: body,
    margin: { left: PDF_MARGINS.left, right: PDF_MARGINS.right },
    headStyles: {
      fillColor: PDF_COLORS.primary,
      textColor: PDF_COLORS.textWhite,
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
      cellPadding: 5,
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 4,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 60 },
      1: { halign: 'left' },
      2: { halign: 'left', cellWidth: 100 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 0) {
        const type = recommendations[data.row.index].type
        if (type === 'action') {
          data.cell.styles.fillColor = [219, 234, 254]
          data.cell.styles.textColor = PDF_COLORS.info
        } else if (type === 'warning') {
          data.cell.styles.fillColor = [254, 226, 226]
          data.cell.styles.textColor = PDF_COLORS.danger
        } else {
          data.cell.styles.fillColor = [220, 252, 231]
          data.cell.styles.textColor = PDF_COLORS.success
        }
        data.cell.styles.fontStyle = 'bold'
      }
    },
  })

  return doc.lastAutoTable.finalY + 15
}

// ============================================
// ANALYTICS DASHBOARD EXPORT FUNCTIONS
// ============================================

// Add dashboard overview stats
export const addDashboardOverviewStats = (doc, overview, y) => {
  const cardWidth = (PDF_LAYOUT.contentWidth - 30) / 4
  const cardHeight = 55

  const stats = [
    { label: 'Total Users', value: overview?.users?.total?.toLocaleString() || '0', sub: `+${overview?.users?.new || 0} new this month`, color: PDF_COLORS.info },
    { label: 'Active Challenges', value: (overview?.challenges?.active || 0).toString(), sub: `${overview?.challenges?.pass_rate?.toFixed(1) || 0}% pass rate`, color: PDF_COLORS.purple },
    { label: 'Revenue (30 days)', value: `$${overview?.revenue?.total?.toLocaleString() || '0'}`, sub: `${overview?.revenue?.transactions || 0} transactions`, color: PDF_COLORS.success },
    { label: 'Active Users', value: (overview?.users?.active_15m || 0).toString(), sub: `${overview?.users?.active_60m || 0} in last hour`, color: PDF_COLORS.primary }
  ]

  stats.forEach((stat, index) => {
    const x = PDF_MARGINS.left + (index * (cardWidth + 10))

    doc.setFillColor(248, 250, 252)
    doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'F')

    doc.setFillColor(...stat.color)
    doc.rect(x, y, 4, cardHeight, 'F')

    doc.setTextColor(...PDF_COLORS.textGray)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(stat.label, x + 10, y + 15)

    doc.setTextColor(...PDF_COLORS.textDark)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(stat.value, x + 10, y + 32)

    doc.setTextColor(...PDF_COLORS.textGray)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(stat.sub, x + 10, y + 45)
  })

  return y + cardHeight + 15
}

// Add system health table
export const addSystemHealthTable = (doc, system, y) => {
  const headers = ['Metric', 'Value', 'Status']

  const getStatus = (value) => {
    if (value < 50) return { text: 'Good', color: PDF_COLORS.success }
    if (value < 75) return { text: 'Warning', color: PDF_COLORS.warning }
    return { text: 'Critical', color: PDF_COLORS.danger }
  }

  const cpuStatus = getStatus(system.cpu_percent || 0)
  const memStatus = getStatus(system.memory_percent || 0)
  const diskStatus = getStatus(system.disk_percent || 0)

  const body = [
    ['CPU Usage', `${(system.cpu_percent || 0).toFixed(1)}%`, cpuStatus.text],
    ['Memory Usage', `${(system.memory_percent || 0).toFixed(1)}%`, memStatus.text],
    ['Disk Usage', `${(system.disk_percent || 0).toFixed(1)}%`, diskStatus.text],
    ['Memory Used', `${((system.memory_used_mb || 0) / 1024).toFixed(2)} GB`, '-'],
    ['Disk Used', `${(system.disk_used_gb || 0).toFixed(1)} GB`, '-'],
    ['Process Memory', `${(system.process_memory_mb || 0).toFixed(1)} MB`, '-'],
    ['Threads', (system.threads || 0).toString(), '-']
  ]

  autoTable(doc, {
    startY: y,
    head: [headers],
    body: body,
    margin: { left: PDF_MARGINS.left, right: PDF_MARGINS.right },
    headStyles: {
      fillColor: PDF_COLORS.primary,
      textColor: PDF_COLORS.textWhite,
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
      cellPadding: 5,
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 4,
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold' },
      1: { halign: 'center' },
      2: { halign: 'center' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 2) {
        const status = data.cell.raw
        if (status === 'Good') {
          data.cell.styles.fillColor = [220, 252, 231]
          data.cell.styles.textColor = PDF_COLORS.success
        } else if (status === 'Warning') {
          data.cell.styles.fillColor = [254, 243, 199]
          data.cell.styles.textColor = PDF_COLORS.warning
        } else if (status === 'Critical') {
          data.cell.styles.fillColor = [254, 226, 226]
          data.cell.styles.textColor = PDF_COLORS.danger
        }
        data.cell.styles.fontStyle = 'bold'
      }
    },
  })

  return doc.lastAutoTable.finalY + 15
}

// Add request performance stats
export const addRequestPerformanceStats = (doc, performance, y) => {
  const cardWidth = (PDF_LAYOUT.contentWidth - 30) / 4
  const cardHeight = 50

  const stats = [
    { label: 'Requests/min', value: (performance.requests_per_minute || 0).toFixed(1), color: PDF_COLORS.info },
    { label: 'Avg Response', value: `${(performance.avg_response_time || 0).toFixed(0)}ms`, color: PDF_COLORS.success },
    { label: 'Error Rate', value: `${(performance.error_rate || 0).toFixed(1)}%`, color: PDF_COLORS.danger },
    { label: 'Total (5min)', value: (performance.total_requests || 0).toString(), color: PDF_COLORS.purple }
  ]

  stats.forEach((stat, index) => {
    const x = PDF_MARGINS.left + (index * (cardWidth + 10))

    doc.setFillColor(248, 250, 252)
    doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'F')

    doc.setTextColor(...stat.color)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(stat.value, x + cardWidth / 2, y + 25, { align: 'center' })

    doc.setTextColor(...PDF_COLORS.textGray)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(stat.label, x + cardWidth / 2, y + 40, { align: 'center' })
  })

  return y + cardHeight + 15
}

// Add user growth table
export const addUserGrowthTable = (doc, growthData, y) => {
  if (!growthData || growthData.length === 0) return y

  const headers = ['Date', 'New Users', 'Cumulative']
  let cumulative = 0

  const body = growthData.slice(-14).map(row => {
    cumulative += row.new_users || 0
    return [
      row.date,
      (row.new_users || 0).toString(),
      cumulative.toString()
    ]
  })

  autoTable(doc, {
    startY: y,
    head: [headers],
    body: body,
    margin: { left: PDF_MARGINS.left, right: PDF_MARGINS.right },
    headStyles: {
      fillColor: PDF_COLORS.info,
      textColor: PDF_COLORS.textWhite,
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
      cellPadding: 5,
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 4,
    },
    columnStyles: {
      0: { halign: 'left' },
      1: { halign: 'center' },
      2: { halign: 'center' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
  })

  return doc.lastAutoTable.finalY + 15
}

// Add revenue table
export const addDashboardRevenueTable = (doc, revenueData, y) => {
  if (!revenueData || revenueData.length === 0) return y

  const headers = ['Date', 'Revenue', 'Cumulative']
  let cumulative = 0
  const total = revenueData.reduce((sum, d) => sum + (d.revenue || 0), 0)

  const body = revenueData.slice(-14).map(row => {
    cumulative += row.revenue || 0
    return [
      row.date,
      `$${(row.revenue || 0).toFixed(2)}`,
      `$${cumulative.toFixed(2)}`
    ]
  })

  // Add total row
  body.push(['TOTAL (30 days)', `$${total.toFixed(2)}`, '-'])

  autoTable(doc, {
    startY: y,
    head: [headers],
    body: body,
    margin: { left: PDF_MARGINS.left, right: PDF_MARGINS.right },
    headStyles: {
      fillColor: PDF_COLORS.success,
      textColor: PDF_COLORS.textWhite,
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
      cellPadding: 5,
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 4,
    },
    columnStyles: {
      0: { halign: 'left' },
      1: { halign: 'right', textColor: PDF_COLORS.success },
      2: { halign: 'right' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.row.index === body.length - 1) {
        data.cell.styles.fillColor = [220, 252, 231]
        data.cell.styles.fontStyle = 'bold'
      }
    },
  })

  return doc.lastAutoTable.finalY + 15
}

// Add challenge distribution table
export const addChallengeDistributionTable = (doc, distribution, y) => {
  const headers = ['Status', 'Count', 'Percentage']
  const total = Object.values(distribution).reduce((sum, val) => sum + val, 0)

  const statusColors = {
    active: PDF_COLORS.info,
    evaluation: PDF_COLORS.warning,
    passed: PDF_COLORS.success,
    failed: PDF_COLORS.danger,
    funded: PDF_COLORS.purple,
    pending: PDF_COLORS.textGray
  }

  const body = Object.entries(distribution).map(([status, count]) => [
    status.charAt(0).toUpperCase() + status.slice(1),
    count.toString(),
    `${total > 0 ? ((count / total) * 100).toFixed(1) : 0}%`
  ])

  autoTable(doc, {
    startY: y,
    head: [headers],
    body: body,
    margin: { left: PDF_MARGINS.left, right: PDF_MARGINS.right },
    headStyles: {
      fillColor: PDF_COLORS.purple,
      textColor: PDF_COLORS.textWhite,
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
      cellPadding: 5,
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 4,
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold' },
      1: { halign: 'center' },
      2: { halign: 'center' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 0) {
        const status = data.cell.raw.toLowerCase()
        const color = statusColors[status]
        if (color) {
          data.cell.styles.textColor = color
        }
      }
    },
  })

  return doc.lastAutoTable.finalY + 15
}

// Add popular endpoints table
export const addPopularEndpointsTable = (doc, endpoints, y) => {
  if (!endpoints || endpoints.length === 0) return y

  const headers = ['Endpoint', 'Requests', 'Avg Time', 'Error %']

  const body = endpoints.slice(0, 10).map(ep => [
    ep.endpoint,
    (ep.requests || 0).toString(),
    `${(ep.avg_time_ms || 0).toFixed(0)}ms`,
    `${(ep.error_rate || 0).toFixed(1)}%`
  ])

  autoTable(doc, {
    startY: y,
    head: [headers],
    body: body,
    margin: { left: PDF_MARGINS.left, right: PDF_MARGINS.right },
    headStyles: {
      fillColor: PDF_COLORS.primary,
      textColor: PDF_COLORS.textWhite,
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
      cellPadding: 5,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 4,
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 180 },
      1: { halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'center' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        const errorRate = parseFloat(data.cell.raw)
        if (errorRate > 5) {
          data.cell.styles.textColor = PDF_COLORS.danger
          data.cell.styles.fontStyle = 'bold'
        }
      }
    },
  })

  return doc.lastAutoTable.finalY + 15
}

// Add uptime info
export const addUptimeInfo = (doc, uptime, y) => {
  const cardWidth = PDF_LAYOUT.contentWidth / 2
  const cardHeight = 45

  // Uptime card
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(PDF_MARGINS.left, y, cardWidth - 10, cardHeight, 3, 3, 'F')

  doc.setFillColor(...PDF_COLORS.success)
  doc.rect(PDF_MARGINS.left, y, 4, cardHeight, 'F')

  doc.setTextColor(...PDF_COLORS.textGray)
  doc.setFontSize(9)
  doc.text('System Uptime', PDF_MARGINS.left + 12, y + 15)

  doc.setTextColor(...PDF_COLORS.success)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(uptime.uptime_formatted || '0:00:00', PDF_MARGINS.left + 12, y + 32)

  // Start time card
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(PDF_MARGINS.left + cardWidth, y, cardWidth - 10, cardHeight, 3, 3, 'F')

  doc.setFillColor(...PDF_COLORS.info)
  doc.rect(PDF_MARGINS.left + cardWidth, y, 4, cardHeight, 'F')

  doc.setTextColor(...PDF_COLORS.textGray)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Started', PDF_MARGINS.left + cardWidth + 12, y + 15)

  doc.setTextColor(...PDF_COLORS.textDark)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  const startTime = uptime.start_time ? new Date(uptime.start_time).toLocaleString() : 'N/A'
  doc.text(startTime, PDF_MARGINS.left + cardWidth + 12, y + 32)

  return y + cardHeight + 15
}

// =====================================================
// ADMIN DASHBOARD EXPORT FUNCTIONS
// =====================================================

// Add Admin Dashboard KPI Stats
export const addAdminDashboardKPIs = (doc, stats, y) => {
  const pageWidth = doc.internal.pageSize.getWidth()
  const cardWidth = (pageWidth - PDF_MARGINS.left - PDF_MARGINS.right - 30) / 4
  const cardHeight = 70

  const kpis = [
    {
      label: 'Total Users',
      value: stats?.users?.total?.toLocaleString() || '0',
      subtext: `+${stats?.users?.new_this_month || 0} this month`,
      color: [59, 130, 246] // blue
    },
    {
      label: 'Total Revenue',
      value: `${(stats?.revenue?.total || 0).toLocaleString()} MAD`,
      subtext: `${(stats?.revenue?.monthly || 0).toLocaleString()} MAD this month`,
      color: [16, 185, 129] // green
    },
    {
      label: 'Active Challenges',
      value: stats?.challenges?.active?.toString() || '0',
      subtext: `${stats?.challenges?.success_rate?.toFixed(1) || 0}% success rate`,
      color: [139, 92, 246] // purple
    },
    {
      label: 'Total Trades',
      value: stats?.trades?.total?.toLocaleString() || '0',
      subtext: `${(stats?.trades?.total_volume || 0).toLocaleString()} MAD volume`,
      color: [249, 115, 22] // orange
    }
  ]

  kpis.forEach((kpi, index) => {
    const x = PDF_MARGINS.left + (cardWidth + 10) * index

    // Card background
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(x, y, cardWidth, cardHeight, 4, 4, 'F')

    // Color accent bar
    doc.setFillColor(...kpi.color)
    doc.roundedRect(x, y, 4, cardHeight, 2, 2, 'F')

    // Label
    doc.setTextColor(107, 114, 128)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(kpi.label, x + 12, y + 18)

    // Value
    doc.setTextColor(...kpi.color)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(kpi.value, x + 12, y + 40)

    // Subtext
    doc.setTextColor(107, 114, 128)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(kpi.subtext, x + 12, y + 55)
  })

  return y + cardHeight + 20
}

// Add Admin User Growth Table
export const addAdminUserGrowthTable = (doc, growthData, y) => {
  // Take last 14 days for the report
  const recentData = (growthData || []).slice(-14)

  if (recentData.length === 0) {
    doc.setTextColor(107, 114, 128)
    doc.setFontSize(10)
    doc.text('No user growth data available', PDF_MARGINS.left, y + 20)
    return y + 40
  }

  const tableData = recentData.map(item => {
    const date = item.x ? new Date(item.x).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'
    return [date, item.y?.toLocaleString() || '0']
  })

  autoTable(doc, {
    startY: y,
    head: [['Date', 'Total Users']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 9,
      halign: 'center',
      textColor: [55, 65, 81]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 80, fontStyle: 'bold' }
    },
    margin: { left: PDF_MARGINS.left }
  })

  return doc.lastAutoTable.finalY + 20
}

// Add Admin Revenue Table
export const addAdminRevenueTable = (doc, revenueData, y) => {
  // Take last 14 days for the report
  const recentData = (revenueData || []).slice(-14)

  if (recentData.length === 0) {
    doc.setTextColor(107, 114, 128)
    doc.setFontSize(10)
    doc.text('No revenue data available', PDF_MARGINS.left, y + 20)
    return y + 40
  }

  const tableData = recentData.map(item => {
    const date = item.x ? new Date(item.x).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'
    return [date, `${(item.y || 0).toLocaleString()} MAD`]
  })

  // Calculate total
  const totalRevenue = recentData.reduce((sum, item) => sum + (item.y || 0), 0)
  tableData.push(['Total (14 days)', `${totalRevenue.toLocaleString()} MAD`])

  autoTable(doc, {
    startY: y,
    head: [['Date', 'Cumulative Revenue']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 9,
      halign: 'center',
      textColor: [55, 65, 81]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 120, fontStyle: 'bold' }
    },
    margin: { left: PDF_MARGINS.left },
    didParseCell: (data) => {
      // Highlight total row
      if (data.row.index === tableData.length - 1) {
        data.cell.styles.fillColor = [16, 185, 129]
        data.cell.styles.textColor = [255, 255, 255]
        data.cell.styles.fontStyle = 'bold'
      }
    }
  })

  return doc.lastAutoTable.finalY + 20
}

// Add Challenge Status Summary
export const addChallengeStatusSummary = (doc, challenges, y) => {
  const pageWidth = doc.internal.pageSize.getWidth()

  const statuses = [
    { label: 'Total Challenges', value: challenges?.total || 0, color: [107, 114, 128] },
    { label: 'Active', value: challenges?.active || 0, color: [59, 130, 246] },
    { label: 'Passed', value: challenges?.passed || 0, color: [16, 185, 129] },
    { label: 'Failed', value: challenges?.failed || 0, color: [239, 68, 68] },
    { label: 'Success Rate', value: `${(challenges?.success_rate || 0).toFixed(1)}%`, color: [139, 92, 246] }
  ]

  const tableData = statuses.map(s => [s.label, s.value.toString()])

  autoTable(doc, {
    startY: y,
    head: [['Status', 'Count']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [139, 92, 246],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 10,
      textColor: [55, 65, 81]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 120, halign: 'left', fontStyle: 'bold' },
      1: { cellWidth: 80, halign: 'center', fontStyle: 'bold' }
    },
    margin: { left: PDF_MARGINS.left },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 1) {
        const status = statuses[data.row.index]
        if (status) {
          data.cell.styles.textColor = status.color
        }
      }
    }
  })

  return doc.lastAutoTable.finalY + 20
}

// Add Trade Statistics
export const addTradeStatsSummary = (doc, trades, y) => {
  const stats = [
    ['Total Trades', (trades?.total || 0).toLocaleString()],
    ['Total Volume', `${(trades?.total_volume || 0).toLocaleString()} MAD`]
  ]

  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Value']],
    body: stats,
    theme: 'grid',
    headStyles: {
      fillColor: [249, 115, 22],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 10,
      textColor: [55, 65, 81]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 120, halign: 'left', fontStyle: 'bold' },
      1: { cellWidth: 120, halign: 'center', fontStyle: 'bold', textColor: [249, 115, 22] }
    },
    margin: { left: PDF_MARGINS.left }
  })

  return doc.lastAutoTable.finalY + 20
}

// =====================================================
// USERS LIST EXPORT FUNCTIONS
// =====================================================

// Add Users Summary Stats
export const addUsersSummaryStats = (doc, stats, y) => {
  const pageWidth = doc.internal.pageSize.getWidth()
  const cardWidth = (pageWidth - PDF_MARGINS.left - PDF_MARGINS.right - 30) / 4
  const cardHeight = 60

  const summaryStats = [
    { label: 'Total Users', value: stats.total?.toString() || '0', color: [59, 130, 246] },
    { label: 'Active', value: stats.active?.toString() || '0', color: [16, 185, 129] },
    { label: 'Banned', value: stats.banned?.toString() || '0', color: [239, 68, 68] },
    { label: 'With Challenges', value: stats.withChallenges?.toString() || '0', color: [139, 92, 246] }
  ]

  summaryStats.forEach((stat, index) => {
    const x = PDF_MARGINS.left + (cardWidth + 10) * index

    doc.setFillColor(248, 250, 252)
    doc.roundedRect(x, y, cardWidth, cardHeight, 4, 4, 'F')

    doc.setFillColor(...stat.color)
    doc.roundedRect(x, y, 4, cardHeight, 2, 2, 'F')

    doc.setTextColor(107, 114, 128)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(stat.label, x + 12, y + 20)

    doc.setTextColor(...stat.color)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(stat.value, x + 12, y + 45)
  })

  return y + cardHeight + 20
}

// Add Users Table
export const addUsersTable = (doc, users, y) => {
  if (!users || users.length === 0) {
    doc.setTextColor(107, 114, 128)
    doc.setFontSize(10)
    doc.text('No users to display', PDF_MARGINS.left, y + 20)
    return y + 40
  }

  const tableData = users.map(user => {
    const status = user.status?.is_banned ? 'Banned' : user.status?.is_frozen ? 'Frozen' : 'Active'
    const joinDate = user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'
    return [
      user.username || 'N/A',
      user.email || 'N/A',
      user.role || 'user',
      status,
      user.email_verified ? 'Yes' : 'No',
      (user.challenges_count || 0).toString(),
      joinDate
    ]
  })

  autoTable(doc, {
    startY: y,
    head: [['Username', 'Email', 'Role', 'Status', 'Verified', 'Challenges', 'Joined']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [55, 65, 81]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 120 },
      2: { cellWidth: 55, halign: 'center' },
      3: { cellWidth: 50, halign: 'center' },
      4: { cellWidth: 45, halign: 'center' },
      5: { cellWidth: 50, halign: 'center' },
      6: { cellWidth: 70, halign: 'center' }
    },
    margin: { left: PDF_MARGINS.left, right: PDF_MARGINS.right },
    didParseCell: (data) => {
      if (data.section === 'body') {
        // Status column coloring
        if (data.column.index === 3) {
          const status = data.cell.raw
          if (status === 'Active') {
            data.cell.styles.textColor = [16, 185, 129]
            data.cell.styles.fontStyle = 'bold'
          } else if (status === 'Banned') {
            data.cell.styles.textColor = [239, 68, 68]
            data.cell.styles.fontStyle = 'bold'
          } else if (status === 'Frozen') {
            data.cell.styles.textColor = [245, 158, 11]
            data.cell.styles.fontStyle = 'bold'
          }
        }
        // Role column coloring
        if (data.column.index === 2) {
          const role = data.cell.raw
          if (role === 'superadmin') {
            data.cell.styles.textColor = [139, 92, 246]
            data.cell.styles.fontStyle = 'bold'
          } else if (role === 'admin') {
            data.cell.styles.textColor = [59, 130, 246]
            data.cell.styles.fontStyle = 'bold'
          }
        }
        // Verified column
        if (data.column.index === 4) {
          if (data.cell.raw === 'Yes') {
            data.cell.styles.textColor = [16, 185, 129]
          } else {
            data.cell.styles.textColor = [156, 163, 175]
          }
        }
      }
    }
  })

  return doc.lastAutoTable.finalY + 20
}

// Add Role Distribution
export const addRoleDistribution = (doc, users, y) => {
  const roleCount = {
    user: users.filter(u => u.role === 'user').length,
    admin: users.filter(u => u.role === 'admin').length,
    superadmin: users.filter(u => u.role === 'superadmin').length
  }

  const total = users.length
  const tableData = [
    ['User', roleCount.user, total > 0 ? ((roleCount.user / total) * 100).toFixed(1) + '%' : '0%'],
    ['Admin', roleCount.admin, total > 0 ? ((roleCount.admin / total) * 100).toFixed(1) + '%' : '0%'],
    ['SuperAdmin', roleCount.superadmin, total > 0 ? ((roleCount.superadmin / total) * 100).toFixed(1) + '%' : '0%']
  ]

  autoTable(doc, {
    startY: y,
    head: [['Role', 'Count', 'Percentage']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [139, 92, 246],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [55, 65, 81],
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 100, halign: 'left', fontStyle: 'bold' },
      1: { cellWidth: 80 },
      2: { cellWidth: 80 }
    },
    margin: { left: PDF_MARGINS.left },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 0) {
        const role = data.cell.raw
        if (role === 'SuperAdmin') data.cell.styles.textColor = [139, 92, 246]
        else if (role === 'Admin') data.cell.styles.textColor = [59, 130, 246]
        else data.cell.styles.textColor = [107, 114, 128]
      }
    }
  })

  return doc.lastAutoTable.finalY + 20
}

// =====================================================
// CHALLENGES LIST EXPORT FUNCTIONS
// =====================================================

// Add Challenges Summary Stats
export const addChallengesSummaryStats = (doc, stats, y) => {
  const pageWidth = doc.internal.pageSize.getWidth()
  const cardWidth = (pageWidth - PDF_MARGINS.left - PDF_MARGINS.right - 40) / 5
  const cardHeight = 60

  const summaryStats = [
    { label: 'Total', value: stats.total?.toString() || '0', color: [107, 114, 128] },
    { label: 'Active', value: stats.active?.toString() || '0', color: [59, 130, 246] },
    { label: 'Passed', value: stats.passed?.toString() || '0', color: [16, 185, 129] },
    { label: 'Failed', value: stats.failed?.toString() || '0', color: [239, 68, 68] },
    { label: 'Funded', value: stats.funded?.toString() || '0', color: [139, 92, 246] }
  ]

  summaryStats.forEach((stat, index) => {
    const x = PDF_MARGINS.left + (cardWidth + 10) * index

    doc.setFillColor(248, 250, 252)
    doc.roundedRect(x, y, cardWidth, cardHeight, 4, 4, 'F')

    doc.setFillColor(...stat.color)
    doc.roundedRect(x, y, 4, cardHeight, 2, 2, 'F')

    doc.setTextColor(107, 114, 128)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(stat.label, x + 10, y + 18)

    doc.setTextColor(...stat.color)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(stat.value, x + 10, y + 42)
  })

  return y + cardHeight + 20
}

// Add Challenges Table
export const addChallengesTable = (doc, challenges, y) => {
  if (!challenges || challenges.length === 0) {
    doc.setTextColor(107, 114, 128)
    doc.setFontSize(10)
    doc.text('No challenges to display', PDF_MARGINS.left, y + 20)
    return y + 40
  }

  const tableData = challenges.map(ch => {
    const startDate = ch.start_date ? new Date(ch.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'
    return [
      `#${ch.id}`,
      ch.user?.username || 'N/A',
      ch.model?.name || 'N/A',
      ch.status || 'pending',
      ch.phase === 'funded' ? 'Funded' : `Phase ${ch.phase}`,
      `$${(ch.profit || 0).toLocaleString()}`,
      `${(ch.profit_percent || 0).toFixed(1)}%`,
      `${(ch.max_drawdown || 0).toFixed(1)}%`,
      ch.trades_count || 0,
      startDate
    ]
  })

  autoTable(doc, {
    startY: y,
    head: [['ID', 'Trader', 'Challenge', 'Status', 'Phase', 'P&L', 'P&L %', 'Max DD', 'Trades', 'Started']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontSize: 7,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [55, 65, 81]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 35, halign: 'center' },
      1: { cellWidth: 60 },
      2: { cellWidth: 70 },
      3: { cellWidth: 45, halign: 'center' },
      4: { cellWidth: 45, halign: 'center' },
      5: { cellWidth: 55, halign: 'right' },
      6: { cellWidth: 40, halign: 'center' },
      7: { cellWidth: 40, halign: 'center' },
      8: { cellWidth: 40, halign: 'center' },
      9: { cellWidth: 50, halign: 'center' }
    },
    margin: { left: PDF_MARGINS.left, right: PDF_MARGINS.right },
    didParseCell: (data) => {
      if (data.section === 'body') {
        // Status column coloring
        if (data.column.index === 3) {
          const status = data.cell.raw?.toLowerCase()
          if (status === 'active') {
            data.cell.styles.textColor = [59, 130, 246]
            data.cell.styles.fontStyle = 'bold'
          } else if (status === 'passed') {
            data.cell.styles.textColor = [16, 185, 129]
            data.cell.styles.fontStyle = 'bold'
          } else if (status === 'failed') {
            data.cell.styles.textColor = [239, 68, 68]
            data.cell.styles.fontStyle = 'bold'
          } else if (status === 'funded') {
            data.cell.styles.textColor = [139, 92, 246]
            data.cell.styles.fontStyle = 'bold'
          }
        }
        // P&L column
        if (data.column.index === 5 || data.column.index === 6) {
          const value = parseFloat(data.cell.raw?.replace(/[$%,]/g, '') || 0)
          data.cell.styles.textColor = value >= 0 ? [16, 185, 129] : [239, 68, 68]
          data.cell.styles.fontStyle = 'bold'
        }
        // Max DD column
        if (data.column.index === 7) {
          const value = parseFloat(data.cell.raw?.replace('%', '') || 0)
          if (value > 5) data.cell.styles.textColor = [239, 68, 68]
          else if (value > 3) data.cell.styles.textColor = [245, 158, 11]
          else data.cell.styles.textColor = [16, 185, 129]
        }
      }
    }
  })

  return doc.lastAutoTable.finalY + 20
}

// Add Challenge Status Breakdown
export const addChallengeStatusBreakdown = (doc, stats, y) => {
  const total = stats.total || 1
  const tableData = [
    ['Active', stats.active || 0, ((stats.active / total) * 100).toFixed(1) + '%'],
    ['Passed', stats.passed || 0, ((stats.passed / total) * 100).toFixed(1) + '%'],
    ['Failed', stats.failed || 0, ((stats.failed / total) * 100).toFixed(1) + '%'],
    ['Funded', stats.funded || 0, ((stats.funded / total) * 100).toFixed(1) + '%']
  ]

  const colors = {
    'Active': [59, 130, 246],
    'Passed': [16, 185, 129],
    'Failed': [239, 68, 68],
    'Funded': [139, 92, 246]
  }

  autoTable(doc, {
    startY: y,
    head: [['Status', 'Count', 'Percentage']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [107, 114, 128],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [55, 65, 81],
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 80, halign: 'left', fontStyle: 'bold' },
      1: { cellWidth: 60 },
      2: { cellWidth: 60 }
    },
    margin: { left: PDF_MARGINS.left },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 0) {
        const status = data.cell.raw
        if (colors[status]) {
          data.cell.styles.textColor = colors[status]
        }
      }
    }
  })

  return doc.lastAutoTable.finalY + 20
}

// =====================================================
// PAYMENTS LIST EXPORT FUNCTIONS
// =====================================================

// Add Payments Summary Stats
export const addPaymentsSummaryStats = (doc, stats, y) => {
  const pageWidth = doc.internal.pageSize.getWidth()
  const cardWidth = (pageWidth - PDF_MARGINS.left - PDF_MARGINS.right - 30) / 4
  const cardHeight = 60

  const summaryStats = [
    { label: 'Total Payments', value: stats.total?.toString() || '0', color: [107, 114, 128] },
    { label: 'Completed', value: stats.completed?.toString() || '0', color: [16, 185, 129] },
    { label: 'Pending', value: stats.pending?.toString() || '0', color: [245, 158, 11] },
    { label: 'Failed', value: stats.failed?.toString() || '0', color: [239, 68, 68] }
  ]

  summaryStats.forEach((stat, index) => {
    const x = PDF_MARGINS.left + (cardWidth + 10) * index

    doc.setFillColor(248, 250, 252)
    doc.roundedRect(x, y, cardWidth, cardHeight, 4, 4, 'F')

    doc.setFillColor(...stat.color)
    doc.roundedRect(x, y, 4, cardHeight, 2, 2, 'F')

    doc.setTextColor(107, 114, 128)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(stat.label, x + 10, y + 18)

    doc.setTextColor(...stat.color)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(stat.value, x + 10, y + 42)
  })

  return y + cardHeight + 20
}

// Add Total Revenue Card
export const addTotalRevenueCard = (doc, totalAmount, y) => {
  const pageWidth = doc.internal.pageSize.getWidth()
  const cardWidth = 200
  const cardHeight = 50
  const x = PDF_MARGINS.left

  doc.setFillColor(16, 185, 129, 0.1)
  doc.roundedRect(x, y, cardWidth, cardHeight, 4, 4, 'F')

  doc.setTextColor(107, 114, 128)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Total Revenue', x + 12, y + 18)

  doc.setTextColor(16, 185, 129)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(`$${(totalAmount || 0).toLocaleString()}`, x + 12, y + 38)

  return y + cardHeight + 20
}

// Add Payments Table
export const addPaymentsTable = (doc, payments, y) => {
  if (!payments || payments.length === 0) {
    doc.setTextColor(107, 114, 128)
    doc.setFontSize(10)
    doc.text('No payments to display', PDF_MARGINS.left, y + 20)
    return y + 40
  }

  const tableData = payments.map(p => {
    const date = p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'
    return [
      p.id || 'N/A',
      p.user?.username || 'N/A',
      `$${(p.amount || 0).toLocaleString()}`,
      p.method || 'N/A',
      p.status || 'pending',
      p.description || 'N/A',
      date
    ]
  })

  autoTable(doc, {
    startY: y,
    head: [['Payment ID', 'Customer', 'Amount', 'Method', 'Status', 'Description', 'Date']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: [255, 255, 255],
      fontSize: 7,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [55, 65, 81]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 60 },
      2: { cellWidth: 50, halign: 'right', fontStyle: 'bold' },
      3: { cellWidth: 45, halign: 'center' },
      4: { cellWidth: 50, halign: 'center' },
      5: { cellWidth: 100 },
      6: { cellWidth: 70, halign: 'center' }
    },
    margin: { left: PDF_MARGINS.left, right: PDF_MARGINS.right },
    didParseCell: (data) => {
      if (data.section === 'body') {
        // Status column coloring
        if (data.column.index === 4) {
          const status = data.cell.raw?.toLowerCase()
          if (status === 'completed') {
            data.cell.styles.textColor = [16, 185, 129]
            data.cell.styles.fontStyle = 'bold'
          } else if (status === 'pending') {
            data.cell.styles.textColor = [245, 158, 11]
            data.cell.styles.fontStyle = 'bold'
          } else if (status === 'failed') {
            data.cell.styles.textColor = [239, 68, 68]
            data.cell.styles.fontStyle = 'bold'
          } else if (status === 'refunded') {
            data.cell.styles.textColor = [59, 130, 246]
            data.cell.styles.fontStyle = 'bold'
          }
        }
        // Amount column
        if (data.column.index === 2) {
          data.cell.styles.textColor = [16, 185, 129]
        }
      }
    }
  })

  return doc.lastAutoTable.finalY + 20
}

// Add Payment Method Breakdown
export const addPaymentMethodBreakdown = (doc, payments, y) => {
  const methodCount = {
    card: payments.filter(p => p.method === 'card').length,
    crypto: payments.filter(p => p.method === 'crypto').length,
    paypal: payments.filter(p => p.method === 'paypal').length,
    bank: payments.filter(p => p.method === 'bank').length
  }

  const total = payments.length || 1
  const tableData = [
    ['Card', methodCount.card, ((methodCount.card / total) * 100).toFixed(1) + '%'],
    ['Crypto', methodCount.crypto, ((methodCount.crypto / total) * 100).toFixed(1) + '%'],
    ['PayPal', methodCount.paypal, ((methodCount.paypal / total) * 100).toFixed(1) + '%'],
    ['Bank Transfer', methodCount.bank, ((methodCount.bank / total) * 100).toFixed(1) + '%']
  ]

  autoTable(doc, {
    startY: y,
    head: [['Method', 'Count', 'Percentage']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [55, 65, 81],
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 100, halign: 'left', fontStyle: 'bold' },
      1: { cellWidth: 60 },
      2: { cellWidth: 60 }
    },
    margin: { left: PDF_MARGINS.left }
  })

  return doc.lastAutoTable.finalY + 20
}

// ==========================================
// PAYOUTS MANAGEMENT PAGE EXPORTS
// ==========================================

// Add Payouts Summary Stats
export const addPayoutsSummaryStats = (doc, stats, y) => {
  const statCards = [
    { label: 'Total Payouts', value: stats.total?.toLocaleString() || '0', color: [255, 255, 255] },
    { label: 'Pending', value: stats.pending?.toLocaleString() || '0', color: [234, 179, 8] },
    { label: 'Processing', value: stats.processing?.toLocaleString() || '0', color: [59, 130, 246] },
    { label: 'Completed', value: stats.completed?.toLocaleString() || '0', color: [34, 197, 94] },
    { label: 'Rejected', value: stats.rejected?.toLocaleString() || '0', color: [239, 68, 68] }
  ]

  const cardWidth = 100
  const cardHeight = 50
  const gap = 10
  let xPos = PDF_MARGINS.left

  statCards.forEach((stat, index) => {
    // Card background
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(xPos, y, cardWidth, cardHeight, 5, 5, 'F')

    // Label
    doc.setFontSize(8)
    doc.setTextColor(107, 114, 128)
    doc.text(stat.label, xPos + 10, y + 15)

    // Value
    doc.setFontSize(16)
    doc.setTextColor(stat.color[0], stat.color[1], stat.color[2])
    doc.text(stat.value, xPos + 10, y + 35)

    xPos += cardWidth + gap
  })

  return y + cardHeight + 20
}

// Add Pending Amount Card
export const addPendingAmountCard = (doc, pendingAmount, y) => {
  const cardWidth = PDF_WIDTH - PDF_MARGINS.left - PDF_MARGINS.right
  const cardHeight = 60

  // Gradient-like background (yellow tint)
  doc.setFillColor(254, 252, 232)
  doc.roundedRect(PDF_MARGINS.left, y, cardWidth, cardHeight, 8, 8, 'F')

  // Border
  doc.setDrawColor(234, 179, 8)
  doc.setLineWidth(1)
  doc.roundedRect(PDF_MARGINS.left, y, cardWidth, cardHeight, 8, 8, 'S')

  // Warning icon (triangle)
  doc.setFillColor(234, 179, 8)
  doc.triangle(
    PDF_MARGINS.left + 25, y + 20,
    PDF_MARGINS.left + 35, y + 40,
    PDF_MARGINS.left + 15, y + 40,
    'F'
  )

  // Label
  doc.setFontSize(10)
  doc.setTextColor(107, 114, 128)
  doc.text('Pending Payouts Amount', PDF_MARGINS.left + 50, y + 25)

  // Amount
  doc.setFontSize(22)
  doc.setTextColor(234, 179, 8)
  doc.setFont(undefined, 'bold')
  doc.text(`$${pendingAmount?.toLocaleString() || '0'}`, PDF_MARGINS.left + 50, y + 45)
  doc.setFont(undefined, 'normal')

  return y + cardHeight + 20
}

// Add Payouts Table
export const addPayoutsTable = (doc, payouts, y) => {
  const tableData = payouts.map(payout => [
    payout.id || 'N/A',
    payout.user?.username || 'Unknown',
    payout.challenge?.model || 'N/A',
    `$${payout.amount?.toLocaleString() || '0'}`,
    `${payout.profit_split || 0}%`,
    payout.method ? payout.method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A',
    payout.status?.charAt(0).toUpperCase() + payout.status?.slice(1) || 'Unknown',
    payout.created_at ? new Date(payout.created_at).toLocaleDateString() : 'N/A'
  ])

  autoTable(doc, {
    startY: y,
    head: [['ID', 'Trader', 'Challenge', 'Amount', 'Split', 'Method', 'Status', 'Requested']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [55, 65, 81]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' },
      1: { cellWidth: 70 },
      2: { cellWidth: 80 },
      3: { cellWidth: 55, halign: 'right' },
      4: { cellWidth: 35, halign: 'center' },
      5: { cellWidth: 65 },
      6: { cellWidth: 55, halign: 'center' },
      7: { cellWidth: 55, halign: 'center' }
    },
    margin: { left: PDF_MARGINS.left },
    didParseCell: (data) => {
      // Color status column based on value
      if (data.section === 'body' && data.column.index === 6) {
        const status = data.cell.text[0]?.toLowerCase()
        if (status === 'completed') {
          data.cell.styles.textColor = [34, 197, 94]
          data.cell.styles.fontStyle = 'bold'
        } else if (status === 'pending') {
          data.cell.styles.textColor = [234, 179, 8]
          data.cell.styles.fontStyle = 'bold'
        } else if (status === 'processing') {
          data.cell.styles.textColor = [59, 130, 246]
          data.cell.styles.fontStyle = 'bold'
        } else if (status === 'rejected') {
          data.cell.styles.textColor = [239, 68, 68]
          data.cell.styles.fontStyle = 'bold'
        }
      }
    }
  })

  return doc.lastAutoTable.finalY + 20
}

// Add Payout Method Breakdown
export const addPayoutMethodBreakdown = (doc, payouts, y) => {
  const methodCount = {
    bank_transfer: 0,
    crypto: 0,
    paypal: 0,
    wise: 0
  }

  payouts.forEach(payout => {
    const method = payout.method?.toLowerCase()
    if (methodCount.hasOwnProperty(method)) {
      methodCount[method]++
    }
  })

  const total = payouts.length || 1
  const tableData = [
    ['Bank Transfer', methodCount.bank_transfer, ((methodCount.bank_transfer / total) * 100).toFixed(1) + '%'],
    ['Cryptocurrency', methodCount.crypto, ((methodCount.crypto / total) * 100).toFixed(1) + '%'],
    ['PayPal', methodCount.paypal, ((methodCount.paypal / total) * 100).toFixed(1) + '%'],
    ['Wise', methodCount.wise, ((methodCount.wise / total) * 100).toFixed(1) + '%']
  ]

  autoTable(doc, {
    startY: y,
    head: [['Method', 'Count', 'Percentage']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [55, 65, 81],
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 100, halign: 'left', fontStyle: 'bold' },
      1: { cellWidth: 60 },
      2: { cellWidth: 60 }
    },
    margin: { left: PDF_MARGINS.left }
  })

  return doc.lastAutoTable.finalY + 20
}

// Add Payout Status Breakdown
export const addPayoutStatusBreakdown = (doc, stats, y) => {
  const total = stats.total || 1
  const tableData = [
    ['Pending', stats.pending || 0, ((stats.pending / total) * 100).toFixed(1) + '%'],
    ['Processing', stats.processing || 0, ((stats.processing / total) * 100).toFixed(1) + '%'],
    ['Completed', stats.completed || 0, ((stats.completed / total) * 100).toFixed(1) + '%'],
    ['Rejected', stats.rejected || 0, ((stats.rejected / total) * 100).toFixed(1) + '%']
  ]

  autoTable(doc, {
    startY: y,
    head: [['Status', 'Count', 'Percentage']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [55, 65, 81],
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 100, halign: 'left', fontStyle: 'bold' },
      1: { cellWidth: 60 },
      2: { cellWidth: 60 }
    },
    margin: { left: PDF_MARGINS.left },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 0) {
        const status = data.cell.text[0]?.toLowerCase()
        if (status === 'completed') {
          data.cell.styles.textColor = [34, 197, 94]
        } else if (status === 'pending') {
          data.cell.styles.textColor = [234, 179, 8]
        } else if (status === 'processing') {
          data.cell.styles.textColor = [59, 130, 246]
        } else if (status === 'rejected') {
          data.cell.styles.textColor = [239, 68, 68]
        }
      }
    }
  })

  return doc.lastAutoTable.finalY + 20
}

// Create new PDF document
export const createPDF = (orientation = 'portrait') => {
  return new jsPDF({
    orientation,
    unit: 'pt',
    format: 'a4',
  })
}

// Save PDF
export const savePDF = (doc, filename) => {
  doc.save(filename)
}

export default {
  createPDF,
  savePDF,
  generateFileName,
  addHeader,
  addFooter,
  addSectionTitle,
  addStatsCards,
  addTable,
  addRetentionMatrix,
  addRetentionCurve,
  addChannelRetention,
  addUserSegments,
  addLegend,
  addFinancialStats,
  addRevenueTrendTable,
  addRevenueBySourceTable,
  addTransactionsTable,
  // Advanced Analytics
  addRevenueAnalyticsStats,
  addRevenueBySourceAnalytics,
  addTopProductsTable,
  addConversionFunnelTable,
  addConversionRatesSummary,
  addLTVAnalyticsStats,
  addLTVSegmentsTable,
  addPredictionsSummary,
  addChurnRiskTable,
  addRecommendationsTable,
  // Analytics Dashboard
  addDashboardOverviewStats,
  addSystemHealthTable,
  addRequestPerformanceStats,
  addUserGrowthTable,
  addDashboardRevenueTable,
  addChallengeDistributionTable,
  addPopularEndpointsTable,
  addUptimeInfo,
  // Admin Dashboard
  addAdminDashboardKPIs,
  addAdminUserGrowthTable,
  addAdminRevenueTable,
  addChallengeStatusSummary,
  addTradeStatsSummary,
  // Users List
  addUsersSummaryStats,
  addUsersTable,
  addRoleDistribution,
  // Challenges List
  addChallengesSummaryStats,
  addChallengesTable,
  addChallengeStatusBreakdown,
  // Payments List
  addPaymentsSummaryStats,
  addTotalRevenueCard,
  addPaymentsTable,
  addPaymentMethodBreakdown,
  // Payouts Management
  addPayoutsSummaryStats,
  addPendingAmountCard,
  addPayoutsTable,
  addPayoutMethodBreakdown,
  addPayoutStatusBreakdown,
}
