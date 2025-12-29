import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

// Color palette
const COLORS = {
  primary: 'FF6366F1',
  primaryLight: 'FFEEF2FF',
  success: 'FF22C55E',
  successLight: 'FFDCFCE7',
  successDark: 'FF166534',
  warning: 'FFF59E0B',
  warningLight: 'FFFEF3C7',
  warningDark: 'FF92400E',
  danger: 'FFEF4444',
  dangerLight: 'FFFEE2E2',
  dangerDark: 'FF991B1B',
  info: 'FF3B82F6',
  infoLight: 'FFDBEAFE',
  infoDark: 'FF1E40AF',
  purple: 'FF8B5CF6',
  purpleLight: 'FFEDE9FE',
  white: 'FFFFFFFF',
  black: 'FF000000',
  gray100: 'FFF3F4F6',
  gray200: 'FFE5E7EB',
  gray300: 'FFD1D5DB',
  gray500: 'FF6B7280',
  gray700: 'FF374151',
  gray900: 'FF111827',
}

// Generate filename with timestamp
export const generateFileName = (reportType, dateRange = null) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const dateStr = dateRange ? `_${dateRange}` : ''
  return `${reportType}${dateStr}_${timestamp}.xlsx`
}

// Get retention color based on value
const getRetentionColors = (value) => {
  if (value === null || value === undefined) {
    return { bg: COLORS.gray100, text: COLORS.gray500 }
  }
  if (value >= 60) return { bg: COLORS.successLight, text: COLORS.successDark }
  if (value >= 40) return { bg: COLORS.infoLight, text: COLORS.infoDark }
  if (value >= 25) return { bg: COLORS.warningLight, text: COLORS.warningDark }
  return { bg: COLORS.dangerLight, text: COLORS.dangerDark }
}

// Get trend color
const getTrendColors = (value) => {
  if (value >= 0) return { bg: COLORS.successLight, text: COLORS.successDark }
  return { bg: COLORS.dangerLight, text: COLORS.dangerDark }
}

// Apply header style to a row
const applyHeaderStyle = (row, startCol = 1, endCol = null) => {
  const lastCol = endCol || row.cellCount
  for (let i = startCol; i <= lastCol; i++) {
    const cell = row.getCell(i)
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.primary }
    }
    cell.font = {
      bold: true,
      color: { argb: COLORS.white },
      size: 11
    }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = {
      top: { style: 'thin', color: { argb: COLORS.gray300 } },
      bottom: { style: 'thin', color: { argb: COLORS.gray300 } },
      left: { style: 'thin', color: { argb: COLORS.gray300 } },
      right: { style: 'thin', color: { argb: COLORS.gray300 } }
    }
  }
  row.height = 25
}

// Apply title style
const applyTitleStyle = (cell, fontSize = 18) => {
  cell.font = {
    bold: true,
    size: fontSize,
    color: { argb: COLORS.gray900 }
  }
  cell.alignment = { horizontal: 'left', vertical: 'middle' }
}

// Apply subtitle style
const applySubtitleStyle = (cell) => {
  cell.font = {
    size: 11,
    color: { argb: COLORS.gray500 },
    italic: true
  }
}

// Apply body cell style
const applyBodyStyle = (cell, options = {}) => {
  cell.font = {
    size: 10,
    color: { argb: options.textColor || COLORS.gray700 },
    bold: options.bold || false
  }
  cell.alignment = {
    horizontal: options.align || 'left',
    vertical: 'middle'
  }
  if (options.bgColor) {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: options.bgColor }
    }
  }
  cell.border = {
    top: { style: 'thin', color: { argb: COLORS.gray200 } },
    bottom: { style: 'thin', color: { argb: COLORS.gray200 } },
    left: { style: 'thin', color: { argb: COLORS.gray200 } },
    right: { style: 'thin', color: { argb: COLORS.gray200 } }
  }
}

// Format currency
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '-'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Create Retention Matrix Sheet
const createRetentionMatrixSheet = (workbook, cohortData, summary) => {
  const sheet = workbook.addWorksheet('Retention Matrix', {
    properties: { tabColor: { argb: COLORS.primary } }
  })

  // Set column widths
  sheet.columns = [
    { width: 15 }, { width: 12 }, { width: 12 }, { width: 12 },
    { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 15 }
  ]

  let rowNum = 1

  // Title
  sheet.mergeCells(`A${rowNum}:I${rowNum}`)
  const titleCell = sheet.getCell(`A${rowNum}`)
  titleCell.value = 'COHORT RETENTION ANALYSIS'
  applyTitleStyle(titleCell, 20)
  sheet.getRow(rowNum).height = 35
  rowNum++

  // Subtitle
  sheet.mergeCells(`A${rowNum}:I${rowNum}`)
  const subtitleCell = sheet.getCell(`A${rowNum}`)
  subtitleCell.value = `Generated on ${new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })}`
  applySubtitleStyle(subtitleCell)
  rowNum += 2

  // Summary Section Title
  sheet.mergeCells(`A${rowNum}:D${rowNum}`)
  const summaryTitle = sheet.getCell(`A${rowNum}`)
  summaryTitle.value = 'SUMMARY STATISTICS'
  summaryTitle.font = { bold: true, size: 12, color: { argb: COLORS.primary } }
  summaryTitle.border = { bottom: { style: 'medium', color: { argb: COLORS.primary } } }
  rowNum++

  // Summary Stats in a styled box
  const statsData = [
    ['Total Cohorts', summary.totalCohorts, 'Best Cohort', summary.bestCohort],
    ['Avg. Retention', `${summary.avgRetention}%`, 'Average LTV', formatCurrency(summary.avgLTV)]
  ]

  statsData.forEach(rowData => {
    const row = sheet.getRow(rowNum)
    row.getCell(1).value = rowData[0]
    row.getCell(2).value = rowData[1]
    row.getCell(3).value = rowData[2]
    row.getCell(4).value = rowData[3]

    applyBodyStyle(row.getCell(1), { bold: true, bgColor: COLORS.gray100 })
    applyBodyStyle(row.getCell(2), { align: 'center', bgColor: COLORS.white })
    applyBodyStyle(row.getCell(3), { bold: true, bgColor: COLORS.gray100 })
    applyBodyStyle(row.getCell(4), { align: 'center', bgColor: COLORS.white })
    row.height = 22
    rowNum++
  })
  rowNum += 2

  // Cohort Matrix Title
  sheet.mergeCells(`A${rowNum}:I${rowNum}`)
  const matrixTitle = sheet.getCell(`A${rowNum}`)
  matrixTitle.value = 'RETENTION MATRIX'
  matrixTitle.font = { bold: true, size: 12, color: { argb: COLORS.primary } }
  matrixTitle.border = { bottom: { style: 'medium', color: { argb: COLORS.primary } } }
  rowNum++

  // Headers
  const headerRow = sheet.getRow(rowNum)
  const headers = ['Cohort', 'Users', 'Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6', 'Revenue']
  headers.forEach((h, i) => {
    headerRow.getCell(i + 1).value = h
  })
  applyHeaderStyle(headerRow, 1, 9)
  rowNum++

  // Data rows
  cohortData.forEach((cohort, index) => {
    const row = sheet.getRow(rowNum)
    row.getCell(1).value = cohort.period
    row.getCell(2).value = cohort.users
    row.getCell(3).value = cohort.month1 !== null ? `${cohort.month1}%` : '-'
    row.getCell(4).value = cohort.month2 !== null ? `${cohort.month2}%` : '-'
    row.getCell(5).value = cohort.month3 !== null ? `${cohort.month3}%` : '-'
    row.getCell(6).value = cohort.month4 !== null ? `${cohort.month4}%` : '-'
    row.getCell(7).value = cohort.month5 !== null ? `${cohort.month5}%` : '-'
    row.getCell(8).value = cohort.month6 !== null ? `${cohort.month6}%` : '-'
    row.getCell(9).value = formatCurrency(cohort.revenue)

    // Style cells
    const isAltRow = index % 2 === 1
    const baseBg = isAltRow ? COLORS.gray100 : COLORS.white

    applyBodyStyle(row.getCell(1), { bold: true, bgColor: baseBg })
    applyBodyStyle(row.getCell(2), { align: 'center', bgColor: baseBg })

    // Color-coded retention cells
    const months = [cohort.month1, cohort.month2, cohort.month3, cohort.month4, cohort.month5, cohort.month6]
    months.forEach((val, i) => {
      const colors = getRetentionColors(val)
      applyBodyStyle(row.getCell(i + 3), {
        align: 'center',
        bgColor: colors.bg,
        textColor: colors.text,
        bold: true
      })
    })

    applyBodyStyle(row.getCell(9), { align: 'right', bgColor: baseBg, textColor: COLORS.successDark, bold: true })
    row.height = 22
    rowNum++
  })
  rowNum += 2

  // Legend
  sheet.mergeCells(`A${rowNum}:B${rowNum}`)
  sheet.getCell(`A${rowNum}`).value = 'LEGEND:'
  sheet.getCell(`A${rowNum}`).font = { bold: true, size: 10 }
  rowNum++

  const legendItems = [
    { label: '60%+ Excellent', colors: getRetentionColors(70) },
    { label: '40-59% Good', colors: getRetentionColors(50) },
    { label: '25-39% Fair', colors: getRetentionColors(30) },
    { label: '<25% Poor', colors: getRetentionColors(10) }
  ]

  legendItems.forEach((item, i) => {
    const cell = sheet.getCell(rowNum, i + 1)
    cell.value = item.label
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: item.colors.bg } }
    cell.font = { size: 9, color: { argb: item.colors.text }, bold: true }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = {
      top: { style: 'thin', color: { argb: COLORS.gray300 } },
      bottom: { style: 'thin', color: { argb: COLORS.gray300 } },
      left: { style: 'thin', color: { argb: COLORS.gray300 } },
      right: { style: 'thin', color: { argb: COLORS.gray300 } }
    }
  })
}

// Create Channel Retention Sheet
const createChannelRetentionSheet = (workbook, channelData) => {
  const sheet = workbook.addWorksheet('Channel Retention', {
    properties: { tabColor: { argb: COLORS.info } }
  })

  sheet.columns = [
    { width: 18 }, { width: 12 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 20 }
  ]

  let rowNum = 1

  // Title
  sheet.mergeCells(`A${rowNum}:F${rowNum}`)
  const titleCell = sheet.getCell(`A${rowNum}`)
  titleCell.value = 'RETENTION BY ACQUISITION CHANNEL'
  applyTitleStyle(titleCell, 18)
  sheet.getRow(rowNum).height = 30
  rowNum++

  // Subtitle
  sheet.mergeCells(`A${rowNum}:F${rowNum}`)
  applySubtitleStyle(sheet.getCell(`A${rowNum}`))
  sheet.getCell(`A${rowNum}`).value = 'Compare retention rates across different acquisition sources'
  rowNum += 2

  // Headers
  const headerRow = sheet.getRow(rowNum)
  const headers = ['Channel', 'Users', 'Day 1', 'Day 7', 'Day 30', 'Performance']
  headers.forEach((h, i) => {
    headerRow.getCell(i + 1).value = h
  })
  applyHeaderStyle(headerRow, 1, 6)
  rowNum++

  // Find best channel
  const bestChannel = channelData.reduce((best, curr) =>
    curr.day30 > best.day30 ? curr : best
  )

  // Data rows
  channelData.forEach((channel, index) => {
    const row = sheet.getRow(rowNum)
    const isAltRow = index % 2 === 1
    const baseBg = isAltRow ? COLORS.gray100 : COLORS.white
    const isBest = channel.channel === bestChannel.channel

    row.getCell(1).value = channel.channel
    row.getCell(2).value = channel.users.toLocaleString()
    row.getCell(3).value = `${channel.day1}%`
    row.getCell(4).value = `${channel.day7}%`
    row.getCell(5).value = `${channel.day30}%`
    row.getCell(6).value = isBest ? 'BEST PERFORMER' : ''

    applyBodyStyle(row.getCell(1), { bold: true, bgColor: baseBg })
    applyBodyStyle(row.getCell(2), { align: 'center', bgColor: baseBg })

    // Color-coded retention
    const d1Colors = getRetentionColors(channel.day1)
    const d7Colors = getRetentionColors(channel.day7)
    const d30Colors = getRetentionColors(channel.day30)

    applyBodyStyle(row.getCell(3), { align: 'center', bgColor: d1Colors.bg, textColor: d1Colors.text, bold: true })
    applyBodyStyle(row.getCell(4), { align: 'center', bgColor: d7Colors.bg, textColor: d7Colors.text, bold: true })
    applyBodyStyle(row.getCell(5), { align: 'center', bgColor: d30Colors.bg, textColor: d30Colors.text, bold: true })

    if (isBest) {
      applyBodyStyle(row.getCell(6), { align: 'center', bgColor: COLORS.successLight, textColor: COLORS.successDark, bold: true })
    } else {
      applyBodyStyle(row.getCell(6), { align: 'center', bgColor: baseBg })
    }

    row.height = 22
    rowNum++
  })

  rowNum += 2

  // Insights box
  sheet.mergeCells(`A${rowNum}:F${rowNum}`)
  const insightTitle = sheet.getCell(`A${rowNum}`)
  insightTitle.value = 'KEY INSIGHT'
  insightTitle.font = { bold: true, size: 11, color: { argb: COLORS.primary } }
  rowNum++

  sheet.mergeCells(`A${rowNum}:F${rowNum}`)
  const insight = sheet.getCell(`A${rowNum}`)
  insight.value = `${bestChannel.channel} has the highest Day 30 retention at ${bestChannel.day30}%, making it the most valuable acquisition channel.`
  insight.font = { size: 10, color: { argb: COLORS.gray700 } }
  insight.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.primaryLight } }
  insight.border = {
    top: { style: 'thin', color: { argb: COLORS.primary } },
    bottom: { style: 'thin', color: { argb: COLORS.primary } },
    left: { style: 'thin', color: { argb: COLORS.primary } },
    right: { style: 'thin', color: { argb: COLORS.primary } }
  }
  sheet.getRow(rowNum).height = 30
}

// Create User Segments Sheet
const createUserSegmentsSheet = (workbook, segments) => {
  const sheet = workbook.addWorksheet('User Segments', {
    properties: { tabColor: { argb: COLORS.purple } }
  })

  sheet.columns = [
    { width: 18 }, { width: 12 }, { width: 18 }, { width: 15 }, { width: 15 }, { width: 12 }
  ]

  let rowNum = 1

  // Title
  sheet.mergeCells(`A${rowNum}:F${rowNum}`)
  const titleCell = sheet.getCell(`A${rowNum}`)
  titleCell.value = 'USER SEGMENT ANALYSIS'
  applyTitleStyle(titleCell, 18)
  sheet.getRow(rowNum).height = 30
  rowNum++

  // Subtitle
  sheet.mergeCells(`A${rowNum}:F${rowNum}`)
  applySubtitleStyle(sheet.getCell(`A${rowNum}`))
  sheet.getCell(`A${rowNum}`).value = 'Breakdown of users by engagement level and value'
  rowNum += 2

  // Headers
  const headerRow = sheet.getRow(rowNum)
  const headers = ['Segment', 'Users', 'Avg Trades/Mo', 'Retention', 'Lifetime Value', 'Growth']
  headers.forEach((h, i) => {
    headerRow.getCell(i + 1).value = h
  })
  applyHeaderStyle(headerRow, 1, 6)
  rowNum++

  // Segment colors
  const segmentColors = {
    'Power Traders': COLORS.purple,
    'Regular Users': COLORS.info,
    'Casual Users': COLORS.warning,
    'Dormant': COLORS.gray500
  }

  // Data rows
  segments.forEach((segment, index) => {
    const row = sheet.getRow(rowNum)
    const isAltRow = index % 2 === 1
    const baseBg = isAltRow ? COLORS.gray100 : COLORS.white
    const retColors = getRetentionColors(segment.retention)
    const trendColors = getTrendColors(segment.growth)

    row.getCell(1).value = segment.name
    row.getCell(2).value = segment.users.toLocaleString()
    row.getCell(3).value = segment.avgTrades
    row.getCell(4).value = `${segment.retention}%`
    row.getCell(5).value = formatCurrency(segment.ltv)
    row.getCell(6).value = `${segment.growth >= 0 ? '+' : ''}${segment.growth}%`

    // Segment name with color indicator
    const segColor = segmentColors[segment.name] || COLORS.gray500
    applyBodyStyle(row.getCell(1), { bold: true, bgColor: baseBg, textColor: segColor })
    applyBodyStyle(row.getCell(2), { align: 'center', bgColor: baseBg })
    applyBodyStyle(row.getCell(3), { align: 'center', bgColor: baseBg })
    applyBodyStyle(row.getCell(4), { align: 'center', bgColor: retColors.bg, textColor: retColors.text, bold: true })
    applyBodyStyle(row.getCell(5), { align: 'right', bgColor: baseBg, bold: true })
    applyBodyStyle(row.getCell(6), { align: 'center', bgColor: trendColors.bg, textColor: trendColors.text, bold: true })

    row.height = 22
    rowNum++
  })

  // Totals row
  rowNum++
  const totalsRow = sheet.getRow(rowNum)
  const totalUsers = segments.reduce((sum, s) => sum + s.users, 0)
  const avgRetention = (segments.reduce((sum, s) => sum + s.retention, 0) / segments.length).toFixed(1)
  const avgLTV = segments.reduce((sum, s) => sum + s.ltv, 0) / segments.length

  totalsRow.getCell(1).value = 'TOTALS / AVERAGES'
  totalsRow.getCell(2).value = totalUsers.toLocaleString()
  totalsRow.getCell(3).value = '-'
  totalsRow.getCell(4).value = `${avgRetention}%`
  totalsRow.getCell(5).value = formatCurrency(avgLTV)
  totalsRow.getCell(6).value = '-'

  for (let i = 1; i <= 6; i++) {
    const cell = totalsRow.getCell(i)
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.gray200 } }
    cell.font = { bold: true, size: 10, color: { argb: COLORS.gray900 } }
    cell.alignment = { horizontal: i === 1 ? 'left' : (i === 5 ? 'right' : 'center'), vertical: 'middle' }
    cell.border = {
      top: { style: 'medium', color: { argb: COLORS.gray500 } },
      bottom: { style: 'medium', color: { argb: COLORS.gray500 } },
      left: { style: 'thin', color: { argb: COLORS.gray300 } },
      right: { style: 'thin', color: { argb: COLORS.gray300 } }
    }
  }
  totalsRow.height = 25
}

// Create Behavior Patterns Sheet
const createBehaviorPatternsSheet = (workbook, patterns) => {
  const sheet = workbook.addWorksheet('Behavior Patterns', {
    properties: { tabColor: { argb: COLORS.success } }
  })

  sheet.columns = [
    { width: 35 }, { width: 15 }, { width: 30 }
  ]

  let rowNum = 1

  // Title
  sheet.mergeCells(`A${rowNum}:C${rowNum}`)
  const titleCell = sheet.getCell(`A${rowNum}`)
  titleCell.value = 'BEHAVIOR PATTERNS DRIVING RETENTION'
  applyTitleStyle(titleCell, 18)
  sheet.getRow(rowNum).height = 30
  rowNum++

  // Subtitle
  sheet.mergeCells(`A${rowNum}:C${rowNum}`)
  applySubtitleStyle(sheet.getCell(`A${rowNum}`))
  sheet.getCell(`A${rowNum}`).value = 'Key user behaviors correlated with improved retention'
  rowNum += 2

  // Headers
  const headerRow = sheet.getRow(rowNum)
  headerRow.getCell(1).value = 'Behavior Pattern'
  headerRow.getCell(2).value = 'Users %'
  headerRow.getCell(3).value = 'Impact / Outcome'
  applyHeaderStyle(headerRow, 1, 3)
  rowNum++

  // Data rows
  patterns.forEach((pattern, index) => {
    const row = sheet.getRow(rowNum)
    const isAltRow = index % 2 === 1
    const baseBg = isAltRow ? COLORS.gray100 : COLORS.white

    row.getCell(1).value = pattern.pattern
    row.getCell(2).value = `${pattern.percentage}%`
    row.getCell(3).value = pattern.outcome

    applyBodyStyle(row.getCell(1), { bgColor: baseBg })
    applyBodyStyle(row.getCell(2), { align: 'center', bgColor: COLORS.primaryLight, textColor: COLORS.primary, bold: true })
    applyBodyStyle(row.getCell(3), { bgColor: COLORS.successLight, textColor: COLORS.successDark })

    row.height = 25
    rowNum++
  })

  rowNum += 2

  // Key Insights
  sheet.mergeCells(`A${rowNum}:C${rowNum}`)
  const insightTitle = sheet.getCell(`A${rowNum}`)
  insightTitle.value = 'KEY INSIGHTS'
  insightTitle.font = { bold: true, size: 12, color: { argb: COLORS.primary } }
  insightTitle.border = { bottom: { style: 'medium', color: { argb: COLORS.primary } } }
  rowNum++

  const insights = [
    'Users who complete their profile have 25% higher LTV',
    'Mobile app users show 30% better retention than web-only users',
    'Community engagement is the strongest retention driver',
    'First week activity is critical for long-term retention'
  ]

  insights.forEach((insight, i) => {
    const row = sheet.getRow(rowNum)
    sheet.mergeCells(`A${rowNum}:C${rowNum}`)
    row.getCell(1).value = `${i + 1}. ${insight}`
    row.getCell(1).font = { size: 10, color: { argb: COLORS.gray700 } }
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: i % 2 === 0 ? COLORS.gray100 : COLORS.white } }
    row.height = 22
    rowNum++
  })
}

// Create Retention Trends Sheet
const createRetentionTrendsSheet = (workbook, retentionData) => {
  const sheet = workbook.addWorksheet('Retention Trends', {
    properties: { tabColor: { argb: COLORS.warning } }
  })

  sheet.columns = [
    { width: 18 }, { width: 18 }, { width: 15 }
  ]

  let rowNum = 1

  // Title
  sheet.mergeCells(`A${rowNum}:C${rowNum}`)
  const titleCell = sheet.getCell(`A${rowNum}`)
  titleCell.value = 'RETENTION TRENDS & METRICS'
  applyTitleStyle(titleCell, 18)
  sheet.getRow(rowNum).height = 30
  rowNum++

  // Subtitle
  sheet.mergeCells(`A${rowNum}:C${rowNum}`)
  applySubtitleStyle(sheet.getCell(`A${rowNum}`))
  sheet.getCell(`A${rowNum}`).value = 'Overall retention curve and trend analysis'
  rowNum += 2

  // Retention Curve Section
  sheet.mergeCells(`A${rowNum}:C${rowNum}`)
  const curveTitle = sheet.getCell(`A${rowNum}`)
  curveTitle.value = 'OVERALL RETENTION CURVE'
  curveTitle.font = { bold: true, size: 12, color: { argb: COLORS.primary } }
  curveTitle.border = { bottom: { style: 'medium', color: { argb: COLORS.primary } } }
  rowNum++

  // Curve Headers
  const curveHeaderRow = sheet.getRow(rowNum)
  curveHeaderRow.getCell(1).value = 'Time Period'
  curveHeaderRow.getCell(2).value = 'Retention Rate'
  curveHeaderRow.getCell(3).value = 'Status'
  applyHeaderStyle(curveHeaderRow, 1, 3)
  rowNum++

  const curveData = [
    { period: 'Day 1', value: retentionData.overall.day1 },
    { period: 'Day 7', value: retentionData.overall.day7 },
    { period: 'Day 14', value: retentionData.overall.day14 },
    { period: 'Day 30', value: retentionData.overall.day30 },
    { period: 'Day 60', value: retentionData.overall.day60 },
    { period: 'Day 90', value: retentionData.overall.day90 }
  ]

  curveData.forEach((item, index) => {
    const row = sheet.getRow(rowNum)
    const colors = getRetentionColors(item.value)
    const isAltRow = index % 2 === 1
    const baseBg = isAltRow ? COLORS.gray100 : COLORS.white

    let status = 'Poor'
    if (item.value >= 60) status = 'Excellent'
    else if (item.value >= 40) status = 'Good'
    else if (item.value >= 25) status = 'Fair'

    row.getCell(1).value = item.period
    row.getCell(2).value = `${item.value}%`
    row.getCell(3).value = status

    applyBodyStyle(row.getCell(1), { bold: true, bgColor: baseBg })
    applyBodyStyle(row.getCell(2), { align: 'center', bgColor: colors.bg, textColor: colors.text, bold: true })
    applyBodyStyle(row.getCell(3), { align: 'center', bgColor: colors.bg, textColor: colors.text })

    row.height = 22
    rowNum++
  })

  rowNum += 2

  // Trends Section
  sheet.mergeCells(`A${rowNum}:C${rowNum}`)
  const trendsTitle = sheet.getCell(`A${rowNum}`)
  trendsTitle.value = 'RETENTION TRENDS'
  trendsTitle.font = { bold: true, size: 12, color: { argb: COLORS.primary } }
  trendsTitle.border = { bottom: { style: 'medium', color: { argb: COLORS.primary } } }
  rowNum++

  // Trends Headers
  const trendsHeaderRow = sheet.getRow(rowNum)
  trendsHeaderRow.getCell(1).value = 'Period'
  trendsHeaderRow.getCell(2).value = 'Retention'
  trendsHeaderRow.getCell(3).value = 'Change'
  applyHeaderStyle(trendsHeaderRow, 1, 3)
  rowNum++

  retentionData.trends.forEach((trend, index) => {
    const row = sheet.getRow(rowNum)
    const trendColors = getTrendColors(trend.change)
    const isAltRow = index % 2 === 1
    const baseBg = isAltRow ? COLORS.gray100 : COLORS.white

    row.getCell(1).value = trend.period
    row.getCell(2).value = `${trend.retention}%`
    row.getCell(3).value = `${trend.change >= 0 ? '+' : ''}${trend.change}%`

    applyBodyStyle(row.getCell(1), { bold: true, bgColor: baseBg })
    applyBodyStyle(row.getCell(2), { align: 'center', bgColor: baseBg, bold: true })
    applyBodyStyle(row.getCell(3), { align: 'center', bgColor: trendColors.bg, textColor: trendColors.text, bold: true })

    row.height = 22
    rowNum++
  })
}

// Export cohort analysis to Excel (complete)
export const exportCohortAnalysisToExcel = async (cohortData, retentionData, segmentData) => {
  const workbook = new ExcelJS.Workbook()

  // Set workbook properties
  workbook.creator = 'TradeSense'
  workbook.created = new Date()
  workbook.modified = new Date()

  // Create all sheets
  createRetentionMatrixSheet(workbook, cohortData.cohorts, cohortData.summary)
  createChannelRetentionSheet(workbook, retentionData.byChannel)
  createUserSegmentsSheet(workbook, segmentData.segments)
  createBehaviorPatternsSheet(workbook, segmentData.behaviorPatterns)
  createRetentionTrendsSheet(workbook, retentionData)

  // Generate and save file
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const filename = generateFileName('CohortAnalysis')
  saveAs(blob, filename)

  return filename
}

// ============================================
// FINANCIAL OVERVIEW EXPORT
// ============================================

// Create Financial Summary Sheet
const createFinancialSummarySheet = (workbook, stats, dateRange) => {
  const sheet = workbook.addWorksheet('Financial Summary', {
    properties: { tabColor: { argb: COLORS.success } }
  })

  sheet.columns = [
    { width: 25 }, { width: 20 }, { width: 20 }, { width: 15 }
  ]

  let rowNum = 1

  // Title
  sheet.mergeCells(`A${rowNum}:D${rowNum}`)
  const titleCell = sheet.getCell(`A${rowNum}`)
  titleCell.value = 'FINANCIAL OVERVIEW REPORT'
  applyTitleStyle(titleCell, 20)
  sheet.getRow(rowNum).height = 35
  rowNum++

  // Subtitle with date range
  sheet.mergeCells(`A${rowNum}:D${rowNum}`)
  const subtitleCell = sheet.getCell(`A${rowNum}`)
  subtitleCell.value = `Report Period: ${dateRange} | Generated on ${new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })}`
  applySubtitleStyle(subtitleCell)
  rowNum += 2

  // Key Metrics Section
  sheet.mergeCells(`A${rowNum}:D${rowNum}`)
  const metricsTitle = sheet.getCell(`A${rowNum}`)
  metricsTitle.value = 'KEY FINANCIAL METRICS'
  metricsTitle.font = { bold: true, size: 14, color: { argb: COLORS.primary } }
  metricsTitle.border = { bottom: { style: 'medium', color: { argb: COLORS.primary } } }
  rowNum++

  // Metrics table
  const metrics = [
    ['Total Revenue', formatCurrency(stats.totalRevenue), 'Growth', `${stats.revenueGrowth >= 0 ? '+' : ''}${stats.revenueGrowth}%`],
    ['Monthly Revenue', formatCurrency(stats.monthlyRevenue), '', ''],
    ['Pending Payouts', formatCurrency(stats.pendingPayouts), '', ''],
    ['Completed Payouts', formatCurrency(stats.completedPayouts), 'Growth', `${stats.payoutsGrowth >= 0 ? '+' : ''}${stats.payoutsGrowth}%`]
  ]

  metrics.forEach((rowData, index) => {
    const row = sheet.getRow(rowNum)
    row.getCell(1).value = rowData[0]
    row.getCell(2).value = rowData[1]
    row.getCell(3).value = rowData[2]
    row.getCell(4).value = rowData[3]

    applyBodyStyle(row.getCell(1), { bold: true, bgColor: COLORS.gray100 })
    applyBodyStyle(row.getCell(2), { align: 'right', bgColor: COLORS.white, bold: true, textColor: COLORS.success })

    if (rowData[3]) {
      const trendColors = rowData[3].startsWith('+')
        ? { bg: COLORS.successLight, text: COLORS.successDark }
        : { bg: COLORS.dangerLight, text: COLORS.dangerDark }
      applyBodyStyle(row.getCell(3), { align: 'right', bgColor: COLORS.gray100 })
      applyBodyStyle(row.getCell(4), { align: 'center', bgColor: trendColors.bg, textColor: trendColors.text, bold: true })
    } else {
      applyBodyStyle(row.getCell(3), { bgColor: COLORS.gray100 })
      applyBodyStyle(row.getCell(4), { bgColor: COLORS.white })
    }

    row.height = 25
    rowNum++
  })

  rowNum += 2

  // Net Profit Calculation
  const netProfit = stats.totalRevenue - stats.completedPayouts - stats.pendingPayouts
  sheet.mergeCells(`A${rowNum}:B${rowNum}`)
  const profitLabel = sheet.getCell(`A${rowNum}`)
  profitLabel.value = 'NET PROFIT'
  profitLabel.font = { bold: true, size: 12, color: { argb: COLORS.gray900 } }
  profitLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.successLight } }

  sheet.mergeCells(`C${rowNum}:D${rowNum}`)
  const profitValue = sheet.getCell(`C${rowNum}`)
  profitValue.value = formatCurrency(netProfit)
  profitValue.font = { bold: true, size: 14, color: { argb: COLORS.successDark } }
  profitValue.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.successLight } }
  profitValue.alignment = { horizontal: 'right', vertical: 'middle' }

  sheet.getRow(rowNum).height = 30
}

// Create Revenue Trend Sheet
const createRevenueTrendSheet = (workbook, revenueData) => {
  const sheet = workbook.addWorksheet('Revenue Trend', {
    properties: { tabColor: { argb: COLORS.info } }
  })

  sheet.columns = [
    { width: 15 }, { width: 18 }, { width: 18 }, { width: 18 }
  ]

  let rowNum = 1

  // Title
  sheet.mergeCells(`A${rowNum}:D${rowNum}`)
  const titleCell = sheet.getCell(`A${rowNum}`)
  titleCell.value = 'REVENUE VS PAYOUTS TREND'
  applyTitleStyle(titleCell, 18)
  sheet.getRow(rowNum).height = 30
  rowNum++

  sheet.mergeCells(`A${rowNum}:D${rowNum}`)
  applySubtitleStyle(sheet.getCell(`A${rowNum}`))
  sheet.getCell(`A${rowNum}`).value = 'Daily breakdown of revenue and payout activity'
  rowNum += 2

  // Headers
  const headerRow = sheet.getRow(rowNum)
  const headers = ['Date', 'Revenue', 'Payouts', 'Net']
  headers.forEach((h, i) => {
    headerRow.getCell(i + 1).value = h
  })
  applyHeaderStyle(headerRow, 1, 4)
  rowNum++

  // Data rows
  let totalRevenue = 0
  let totalPayouts = 0

  revenueData.forEach((data, index) => {
    const row = sheet.getRow(rowNum)
    const net = data.revenue - data.payouts
    const isAltRow = index % 2 === 1
    const baseBg = isAltRow ? COLORS.gray100 : COLORS.white

    row.getCell(1).value = data.date
    row.getCell(2).value = formatCurrency(data.revenue)
    row.getCell(3).value = formatCurrency(data.payouts)
    row.getCell(4).value = formatCurrency(net)

    applyBodyStyle(row.getCell(1), { bold: true, bgColor: baseBg })
    applyBodyStyle(row.getCell(2), { align: 'right', bgColor: baseBg, textColor: COLORS.successDark })
    applyBodyStyle(row.getCell(3), { align: 'right', bgColor: baseBg, textColor: COLORS.dangerDark })

    const netColors = net >= 0
      ? { bg: COLORS.successLight, text: COLORS.successDark }
      : { bg: COLORS.dangerLight, text: COLORS.dangerDark }
    applyBodyStyle(row.getCell(4), { align: 'right', bgColor: netColors.bg, textColor: netColors.text, bold: true })

    totalRevenue += data.revenue
    totalPayouts += data.payouts
    row.height = 22
    rowNum++
  })

  // Totals row
  rowNum++
  const totalsRow = sheet.getRow(rowNum)
  const totalNet = totalRevenue - totalPayouts

  totalsRow.getCell(1).value = 'TOTAL'
  totalsRow.getCell(2).value = formatCurrency(totalRevenue)
  totalsRow.getCell(3).value = formatCurrency(totalPayouts)
  totalsRow.getCell(4).value = formatCurrency(totalNet)

  for (let i = 1; i <= 4; i++) {
    const cell = totalsRow.getCell(i)
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.gray200 } }
    cell.font = { bold: true, size: 11, color: { argb: COLORS.gray900 } }
    cell.alignment = { horizontal: i === 1 ? 'left' : 'right', vertical: 'middle' }
    cell.border = {
      top: { style: 'medium', color: { argb: COLORS.gray500 } },
      bottom: { style: 'medium', color: { argb: COLORS.gray500 } },
      left: { style: 'thin', color: { argb: COLORS.gray300 } },
      right: { style: 'thin', color: { argb: COLORS.gray300 } }
    }
  }
  totalsRow.height = 28
}

// Create Revenue by Source Sheet
const createRevenueBySourceSheet = (workbook, sourceData) => {
  const sheet = workbook.addWorksheet('Revenue Sources', {
    properties: { tabColor: { argb: COLORS.purple } }
  })

  sheet.columns = [
    { width: 20 }, { width: 18 }, { width: 15 }, { width: 25 }
  ]

  let rowNum = 1

  // Title
  sheet.mergeCells(`A${rowNum}:D${rowNum}`)
  const titleCell = sheet.getCell(`A${rowNum}`)
  titleCell.value = 'REVENUE BY SOURCE'
  applyTitleStyle(titleCell, 18)
  sheet.getRow(rowNum).height = 30
  rowNum++

  sheet.mergeCells(`A${rowNum}:D${rowNum}`)
  applySubtitleStyle(sheet.getCell(`A${rowNum}`))
  sheet.getCell(`A${rowNum}`).value = 'Breakdown of revenue streams'
  rowNum += 2

  // Headers
  const headerRow = sheet.getRow(rowNum)
  const headers = ['Source', 'Amount', 'Percentage', 'Visual Share']
  headers.forEach((h, i) => {
    headerRow.getCell(i + 1).value = h
  })
  applyHeaderStyle(headerRow, 1, 4)
  rowNum++

  const sourceColors = [COLORS.success, COLORS.info, COLORS.purple, COLORS.warning]

  // Data rows
  sourceData.forEach((source, index) => {
    const row = sheet.getRow(rowNum)
    const isAltRow = index % 2 === 1
    const baseBg = isAltRow ? COLORS.gray100 : COLORS.white
    const sourceColor = sourceColors[index % sourceColors.length]

    row.getCell(1).value = source.source
    row.getCell(2).value = formatCurrency(source.amount)
    row.getCell(3).value = `${source.percentage}%`
    row.getCell(4).value = '█'.repeat(Math.round(source.percentage / 5)) + '░'.repeat(20 - Math.round(source.percentage / 5))

    applyBodyStyle(row.getCell(1), { bold: true, bgColor: baseBg, textColor: sourceColor })
    applyBodyStyle(row.getCell(2), { align: 'right', bgColor: baseBg, textColor: COLORS.successDark, bold: true })
    applyBodyStyle(row.getCell(3), { align: 'center', bgColor: baseBg })
    applyBodyStyle(row.getCell(4), { align: 'left', bgColor: baseBg, textColor: sourceColor })

    row.height = 22
    rowNum++
  })

  // Total
  rowNum++
  const totalAmount = sourceData.reduce((sum, s) => sum + s.amount, 0)
  const totalRow = sheet.getRow(rowNum)
  totalRow.getCell(1).value = 'TOTAL'
  totalRow.getCell(2).value = formatCurrency(totalAmount)
  totalRow.getCell(3).value = '100%'
  totalRow.getCell(4).value = ''

  for (let i = 1; i <= 4; i++) {
    const cell = totalRow.getCell(i)
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.gray200 } }
    cell.font = { bold: true, size: 10, color: { argb: COLORS.gray900 } }
    cell.alignment = { horizontal: i === 1 ? 'left' : (i === 4 ? 'left' : 'right'), vertical: 'middle' }
    if (i === 3) cell.alignment.horizontal = 'center'
  }
  totalRow.height = 25
}

// Create Transactions Sheet
const createTransactionsSheet = (workbook, transactions) => {
  const sheet = workbook.addWorksheet('Recent Transactions', {
    properties: { tabColor: { argb: COLORS.warning } }
  })

  sheet.columns = [
    { width: 8 }, { width: 18 }, { width: 12 }, { width: 15 }, { width: 12 }, { width: 18 }
  ]

  let rowNum = 1

  // Title
  sheet.mergeCells(`A${rowNum}:F${rowNum}`)
  const titleCell = sheet.getCell(`A${rowNum}`)
  titleCell.value = 'RECENT TRANSACTIONS'
  applyTitleStyle(titleCell, 18)
  sheet.getRow(rowNum).height = 30
  rowNum++

  sheet.mergeCells(`A${rowNum}:F${rowNum}`)
  applySubtitleStyle(sheet.getCell(`A${rowNum}`))
  sheet.getCell(`A${rowNum}`).value = 'Latest payment and payout activity'
  rowNum += 2

  // Headers
  const headerRow = sheet.getRow(rowNum)
  const headers = ['#', 'User', 'Type', 'Amount', 'Status', 'Date']
  headers.forEach((h, i) => {
    headerRow.getCell(i + 1).value = h
  })
  applyHeaderStyle(headerRow, 1, 6)
  rowNum++

  // Data rows
  transactions.forEach((tx, index) => {
    const row = sheet.getRow(rowNum)
    const isAltRow = index % 2 === 1
    const baseBg = isAltRow ? COLORS.gray100 : COLORS.white

    const typeColors = tx.type === 'payment'
      ? { bg: COLORS.successLight, text: COLORS.successDark }
      : { bg: COLORS.infoLight, text: COLORS.infoDark }

    let statusColors
    if (tx.status === 'completed') {
      statusColors = { bg: COLORS.successLight, text: COLORS.successDark }
    } else if (tx.status === 'pending') {
      statusColors = { bg: COLORS.warningLight, text: COLORS.warningDark }
    } else {
      statusColors = { bg: COLORS.dangerLight, text: COLORS.dangerDark }
    }

    row.getCell(1).value = tx.id
    row.getCell(2).value = tx.user
    row.getCell(3).value = tx.type.charAt(0).toUpperCase() + tx.type.slice(1)
    row.getCell(4).value = `${tx.type === 'payment' ? '+' : '-'}${formatCurrency(tx.amount)}`
    row.getCell(5).value = tx.status.charAt(0).toUpperCase() + tx.status.slice(1)
    row.getCell(6).value = new Date(tx.date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    })

    applyBodyStyle(row.getCell(1), { align: 'center', bgColor: baseBg })
    applyBodyStyle(row.getCell(2), { bold: true, bgColor: baseBg })
    applyBodyStyle(row.getCell(3), { align: 'center', bgColor: typeColors.bg, textColor: typeColors.text, bold: true })
    applyBodyStyle(row.getCell(4), { align: 'right', bgColor: baseBg, textColor: typeColors.text, bold: true })
    applyBodyStyle(row.getCell(5), { align: 'center', bgColor: statusColors.bg, textColor: statusColors.text, bold: true })
    applyBodyStyle(row.getCell(6), { align: 'center', bgColor: baseBg })

    row.height = 22
    rowNum++
  })
}

// Export Financial Overview to Excel
export const exportFinancialOverviewToExcel = async (stats, revenueData, revenueBySource, recentTransactions, dateRange) => {
  const workbook = new ExcelJS.Workbook()

  workbook.creator = 'TradeSense'
  workbook.created = new Date()
  workbook.modified = new Date()

  // Create all sheets
  createFinancialSummarySheet(workbook, stats, dateRange)
  createRevenueTrendSheet(workbook, revenueData)
  createRevenueBySourceSheet(workbook, revenueBySource)
  createTransactionsSheet(workbook, recentTransactions)

  // Generate and save file
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const filename = generateFileName('FinancialReport')
  saveAs(blob, filename)

  return filename
}

// ============================================
// ADVANCED ANALYTICS EXPORT
// ============================================

// Create Revenue Analytics Sheet
const createRevenueAnalyticsSheet = (workbook, revenueData) => {
  const sheet = workbook.addWorksheet('Revenue Analytics', {
    properties: { tabColor: { argb: COLORS.success } }
  })

  sheet.columns = [
    { width: 25 }, { width: 18 }, { width: 15 }, { width: 20 }
  ]

  let rowNum = 1

  // Title
  sheet.mergeCells(`A${rowNum}:D${rowNum}`)
  const titleCell = sheet.getCell(`A${rowNum}`)
  titleCell.value = 'REVENUE ANALYTICS'
  applyTitleStyle(titleCell, 20)
  sheet.getRow(rowNum).height = 35
  rowNum++

  sheet.mergeCells(`A${rowNum}:D${rowNum}`)
  applySubtitleStyle(sheet.getCell(`A${rowNum}`))
  sheet.getCell(`A${rowNum}`).value = `Generated on ${new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })}`
  rowNum += 2

  // Key Metrics
  sheet.mergeCells(`A${rowNum}:D${rowNum}`)
  const metricsTitle = sheet.getCell(`A${rowNum}`)
  metricsTitle.value = 'KEY METRICS'
  metricsTitle.font = { bold: true, size: 12, color: { argb: COLORS.primary } }
  metricsTitle.border = { bottom: { style: 'medium', color: { argb: COLORS.primary } } }
  rowNum++

  const metrics = [
    ['Total Revenue', formatCurrency(revenueData.total), 'Growth', `${revenueData.growth >= 0 ? '+' : ''}${revenueData.growth}%`],
    ['Avg. Order Value', formatCurrency(Math.round(revenueData.total / 1850)), 'MRR', '$95,000']
  ]

  metrics.forEach(rowData => {
    const row = sheet.getRow(rowNum)
    row.getCell(1).value = rowData[0]
    row.getCell(2).value = rowData[1]
    row.getCell(3).value = rowData[2]
    row.getCell(4).value = rowData[3]

    applyBodyStyle(row.getCell(1), { bold: true, bgColor: COLORS.gray100 })
    applyBodyStyle(row.getCell(2), { align: 'right', bgColor: COLORS.white, textColor: COLORS.successDark, bold: true })
    applyBodyStyle(row.getCell(3), { bold: true, bgColor: COLORS.gray100 })

    if (rowData[3].includes('+')) {
      applyBodyStyle(row.getCell(4), { align: 'center', bgColor: COLORS.successLight, textColor: COLORS.successDark, bold: true })
    } else if (rowData[3].includes('-')) {
      applyBodyStyle(row.getCell(4), { align: 'center', bgColor: COLORS.dangerLight, textColor: COLORS.dangerDark, bold: true })
    } else {
      applyBodyStyle(row.getCell(4), { align: 'right', bgColor: COLORS.white, textColor: COLORS.successDark, bold: true })
    }

    row.height = 25
    rowNum++
  })
  rowNum += 2

  // Revenue by Source
  sheet.mergeCells(`A${rowNum}:D${rowNum}`)
  const sourceTitle = sheet.getCell(`A${rowNum}`)
  sourceTitle.value = 'REVENUE BY SOURCE'
  sourceTitle.font = { bold: true, size: 12, color: { argb: COLORS.primary } }
  sourceTitle.border = { bottom: { style: 'medium', color: { argb: COLORS.primary } } }
  rowNum++

  const sourceHeaders = sheet.getRow(rowNum)
  const headers = ['Source', 'Amount', 'Percentage', 'Visual']
  headers.forEach((h, i) => {
    sourceHeaders.getCell(i + 1).value = h
  })
  applyHeaderStyle(sourceHeaders, 1, 4)
  rowNum++

  revenueData.bySource.forEach((source, index) => {
    const row = sheet.getRow(rowNum)
    const isAltRow = index % 2 === 1
    const baseBg = isAltRow ? COLORS.gray100 : COLORS.white

    row.getCell(1).value = source.source
    row.getCell(2).value = formatCurrency(source.amount)
    row.getCell(3).value = `${source.percentage}%`
    row.getCell(4).value = '█'.repeat(Math.round(source.percentage / 5)) + '░'.repeat(20 - Math.round(source.percentage / 5))

    applyBodyStyle(row.getCell(1), { bold: true, bgColor: baseBg })
    applyBodyStyle(row.getCell(2), { align: 'right', bgColor: baseBg, textColor: COLORS.successDark, bold: true })
    applyBodyStyle(row.getCell(3), { align: 'center', bgColor: baseBg })
    applyBodyStyle(row.getCell(4), { bgColor: baseBg, textColor: COLORS.primary })

    row.height = 22
    rowNum++
  })
  rowNum += 2

  // Top Products
  sheet.mergeCells(`A${rowNum}:D${rowNum}`)
  const productsTitle = sheet.getCell(`A${rowNum}`)
  productsTitle.value = 'TOP PRODUCTS'
  productsTitle.font = { bold: true, size: 12, color: { argb: COLORS.primary } }
  productsTitle.border = { bottom: { style: 'medium', color: { argb: COLORS.primary } } }
  rowNum++

  // Extend columns for products
  sheet.getColumn(5).width = 15

  const productHeaders = sheet.getRow(rowNum)
  const prodHeaders = ['#', 'Product', 'Revenue', 'Sales', 'Avg. Price']
  prodHeaders.forEach((h, i) => {
    productHeaders.getCell(i + 1).value = h
  })
  applyHeaderStyle(productHeaders, 1, 5)
  rowNum++

  revenueData.topProducts.forEach((product, index) => {
    const row = sheet.getRow(rowNum)
    const isAltRow = index % 2 === 1
    const baseBg = isAltRow ? COLORS.gray100 : COLORS.white

    row.getCell(1).value = index + 1
    row.getCell(2).value = product.name
    row.getCell(3).value = formatCurrency(product.revenue)
    row.getCell(4).value = product.count.toLocaleString()
    row.getCell(5).value = formatCurrency(Math.round(product.revenue / product.count))

    const rankColors = index === 0 ? COLORS.warning : index === 1 ? COLORS.gray500 : index === 2 ? 'FFEA580C' : COLORS.gray700
    applyBodyStyle(row.getCell(1), { align: 'center', bgColor: baseBg, textColor: rankColors, bold: true })
    applyBodyStyle(row.getCell(2), { bold: true, bgColor: baseBg })
    applyBodyStyle(row.getCell(3), { align: 'right', bgColor: baseBg, textColor: COLORS.successDark, bold: true })
    applyBodyStyle(row.getCell(4), { align: 'center', bgColor: baseBg })
    applyBodyStyle(row.getCell(5), { align: 'right', bgColor: baseBg })

    row.height = 22
    rowNum++
  })
}

// Create Conversion Funnel Sheet
const createConversionFunnelSheet = (workbook, conversionData) => {
  const sheet = workbook.addWorksheet('Conversion Funnel', {
    properties: { tabColor: { argb: COLORS.info } }
  })

  sheet.columns = [
    { width: 22 }, { width: 15 }, { width: 12 }, { width: 12 }, { width: 15 }
  ]

  let rowNum = 1

  // Title
  sheet.mergeCells(`A${rowNum}:E${rowNum}`)
  const titleCell = sheet.getCell(`A${rowNum}`)
  titleCell.value = 'CONVERSION FUNNEL ANALYSIS'
  applyTitleStyle(titleCell, 20)
  sheet.getRow(rowNum).height = 35
  rowNum++

  sheet.mergeCells(`A${rowNum}:E${rowNum}`)
  applySubtitleStyle(sheet.getCell(`A${rowNum}`))
  sheet.getCell(`A${rowNum}`).value = 'User journey from visitor to funded trader'
  rowNum += 2

  // Conversion Rate Summary
  sheet.mergeCells(`A${rowNum}:E${rowNum}`)
  const ratesTitle = sheet.getCell(`A${rowNum}`)
  ratesTitle.value = 'CONVERSION RATES OVERVIEW'
  ratesTitle.font = { bold: true, size: 12, color: { argb: COLORS.primary } }
  ratesTitle.border = { bottom: { style: 'medium', color: { argb: COLORS.primary } } }
  rowNum++

  const rates = conversionData.conversionRates
  const rateData = [
    ['Visitor → Sign-up', `${rates.visitorToSignup}%`],
    ['Sign-up → Trial', `${rates.signupToTrial}%`],
    ['Trial → Purchase', `${rates.trialToPurchase}%`],
    ['Purchase → Funded', `${rates.purchaseToFunded}%`]
  ]

  rateData.forEach((data, i) => {
    const row = sheet.getRow(rowNum)
    row.getCell(1).value = data[0]
    row.getCell(2).value = data[1]

    applyBodyStyle(row.getCell(1), { bold: true, bgColor: i % 2 === 0 ? COLORS.gray100 : COLORS.white })
    applyBodyStyle(row.getCell(2), { align: 'center', bgColor: COLORS.primaryLight, textColor: COLORS.primary, bold: true })

    row.height = 25
    rowNum++
  })
  rowNum += 2

  // Funnel Data
  sheet.mergeCells(`A${rowNum}:E${rowNum}`)
  const funnelTitle = sheet.getCell(`A${rowNum}`)
  funnelTitle.value = 'DETAILED FUNNEL'
  funnelTitle.font = { bold: true, size: 12, color: { argb: COLORS.primary } }
  funnelTitle.border = { bottom: { style: 'medium', color: { argb: COLORS.primary } } }
  rowNum++

  const funnelHeaders = sheet.getRow(rowNum)
  const headers = ['Stage', 'Count', 'Rate', 'Drop-off', 'Users Lost']
  headers.forEach((h, i) => {
    funnelHeaders.getCell(i + 1).value = h
  })
  applyHeaderStyle(funnelHeaders, 1, 5)
  rowNum++

  conversionData.funnel.forEach((stage, index) => {
    const row = sheet.getRow(rowNum)
    const isAltRow = index % 2 === 1
    const baseBg = isAltRow ? COLORS.gray100 : COLORS.white

    const prevCount = index > 0 ? conversionData.funnel[index - 1].count : stage.count
    const dropoff = index > 0 ? ((prevCount - stage.count) / prevCount * 100).toFixed(1) : '-'
    const usersLost = index > 0 ? (prevCount - stage.count).toLocaleString() : '-'

    row.getCell(1).value = stage.stage
    row.getCell(2).value = stage.count.toLocaleString()
    row.getCell(3).value = `${stage.rate}%`
    row.getCell(4).value = dropoff === '-' ? dropoff : `${dropoff}%`
    row.getCell(5).value = usersLost

    applyBodyStyle(row.getCell(1), { bold: true, bgColor: baseBg })
    applyBodyStyle(row.getCell(2), { align: 'center', bgColor: baseBg })

    // Color code rate
    const rateValue = stage.rate
    const rateColors = rateValue >= 50
      ? { bg: COLORS.successLight, text: COLORS.successDark }
      : rateValue >= 30
        ? { bg: COLORS.infoLight, text: COLORS.infoDark }
        : { bg: COLORS.warningLight, text: COLORS.warningDark }
    applyBodyStyle(row.getCell(3), { align: 'center', bgColor: rateColors.bg, textColor: rateColors.text, bold: true })

    if (dropoff !== '-') {
      applyBodyStyle(row.getCell(4), { align: 'center', bgColor: COLORS.dangerLight, textColor: COLORS.dangerDark })
      applyBodyStyle(row.getCell(5), { align: 'center', bgColor: baseBg, textColor: COLORS.dangerDark })
    } else {
      applyBodyStyle(row.getCell(4), { align: 'center', bgColor: baseBg })
      applyBodyStyle(row.getCell(5), { align: 'center', bgColor: baseBg })
    }

    row.height = 22
    rowNum++
  })
}

// Create LTV Analysis Sheet
const createLTVAnalysisSheet = (workbook, ltvData) => {
  const sheet = workbook.addWorksheet('LTV Analysis', {
    properties: { tabColor: { argb: COLORS.purple } }
  })

  sheet.columns = [
    { width: 20 }, { width: 18 }, { width: 15 }, { width: 15 }, { width: 20 }
  ]

  let rowNum = 1

  // Title
  sheet.mergeCells(`A${rowNum}:E${rowNum}`)
  const titleCell = sheet.getCell(`A${rowNum}`)
  titleCell.value = 'LTV ANALYSIS'
  applyTitleStyle(titleCell, 20)
  sheet.getRow(rowNum).height = 35
  rowNum++

  sheet.mergeCells(`A${rowNum}:E${rowNum}`)
  applySubtitleStyle(sheet.getCell(`A${rowNum}`))
  sheet.getCell(`A${rowNum}`).value = 'Customer Lifetime Value and Acquisition Metrics'
  rowNum += 2

  // Key Metrics
  sheet.mergeCells(`A${rowNum}:E${rowNum}`)
  const metricsTitle = sheet.getCell(`A${rowNum}`)
  metricsTitle.value = 'KEY LTV METRICS'
  metricsTitle.font = { bold: true, size: 12, color: { argb: COLORS.primary } }
  metricsTitle.border = { bottom: { style: 'medium', color: { argb: COLORS.primary } } }
  rowNum++

  const metrics = [
    ['Average LTV', formatCurrency(ltvData.averageLTV), COLORS.success],
    ['Customer Acquisition Cost (CAC)', formatCurrency(ltvData.cac), COLORS.warning],
    ['LTV:CAC Ratio', `${ltvData.ltvToCac}:1`, COLORS.primary],
    ['Payback Period', `${ltvData.paybackPeriod} days`, COLORS.info]
  ]

  metrics.forEach((data, i) => {
    const row = sheet.getRow(rowNum)
    row.getCell(1).value = data[0]
    row.getCell(2).value = data[1]

    applyBodyStyle(row.getCell(1), { bold: true, bgColor: i % 2 === 0 ? COLORS.gray100 : COLORS.white })
    applyBodyStyle(row.getCell(2), { align: 'right', bgColor: COLORS.white, textColor: data[2], bold: true })

    row.height = 28
    rowNum++
  })
  rowNum += 2

  // Customer Segments
  sheet.mergeCells(`A${rowNum}:E${rowNum}`)
  const segmentsTitle = sheet.getCell(`A${rowNum}`)
  segmentsTitle.value = 'CUSTOMER SEGMENTS BY LTV'
  segmentsTitle.font = { bold: true, size: 12, color: { argb: COLORS.primary } }
  segmentsTitle.border = { bottom: { style: 'medium', color: { argb: COLORS.primary } } }
  rowNum++

  const segmentHeaders = sheet.getRow(rowNum)
  const headers = ['Segment', 'Avg. LTV', 'Customers', '% of Total', 'Total Value']
  headers.forEach((h, i) => {
    segmentHeaders.getCell(i + 1).value = h
  })
  applyHeaderStyle(segmentHeaders, 1, 5)
  rowNum++

  const segmentColors = {
    'High Value': COLORS.success,
    'Medium Value': COLORS.info,
    'Low Value': COLORS.gray500
  }

  ltvData.bySegment.forEach((segment, index) => {
    const row = sheet.getRow(rowNum)
    const isAltRow = index % 2 === 1
    const baseBg = isAltRow ? COLORS.gray100 : COLORS.white
    const segColor = segmentColors[segment.segment] || COLORS.gray500

    row.getCell(1).value = segment.segment
    row.getCell(2).value = formatCurrency(segment.ltv)
    row.getCell(3).value = segment.count.toLocaleString()
    row.getCell(4).value = `${segment.percentage}%`
    row.getCell(5).value = formatCurrency(segment.ltv * segment.count)

    applyBodyStyle(row.getCell(1), { bold: true, bgColor: baseBg, textColor: segColor })
    applyBodyStyle(row.getCell(2), { align: 'right', bgColor: baseBg, bold: true })
    applyBodyStyle(row.getCell(3), { align: 'center', bgColor: baseBg })
    applyBodyStyle(row.getCell(4), { align: 'center', bgColor: baseBg })
    applyBodyStyle(row.getCell(5), { align: 'right', bgColor: baseBg, textColor: COLORS.successDark, bold: true })

    row.height = 22
    rowNum++
  })

  // Totals row
  rowNum++
  const totalLTV = ltvData.bySegment.reduce((sum, s) => sum + (s.ltv * s.count), 0)
  const totalCustomers = ltvData.bySegment.reduce((sum, s) => sum + s.count, 0)
  const totalsRow = sheet.getRow(rowNum)

  totalsRow.getCell(1).value = 'TOTAL'
  totalsRow.getCell(2).value = '-'
  totalsRow.getCell(3).value = totalCustomers.toLocaleString()
  totalsRow.getCell(4).value = '100%'
  totalsRow.getCell(5).value = formatCurrency(totalLTV)

  for (let i = 1; i <= 5; i++) {
    const cell = totalsRow.getCell(i)
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.gray200 } }
    cell.font = { bold: true, size: 10, color: { argb: COLORS.gray900 } }
    cell.alignment = { horizontal: i === 1 ? 'left' : (i === 5 || i === 2 ? 'right' : 'center'), vertical: 'middle' }
  }
  totalsRow.height = 25
}

// Create AI Predictions Sheet
const createAIPredictionsSheet = (workbook, predictionData) => {
  const sheet = workbook.addWorksheet('AI Predictions', {
    properties: { tabColor: { argb: COLORS.warning } }
  })

  sheet.columns = [
    { width: 25 }, { width: 18 }, { width: 15 }, { width: 25 }
  ]

  let rowNum = 1

  // Title
  sheet.mergeCells(`A${rowNum}:D${rowNum}`)
  const titleCell = sheet.getCell(`A${rowNum}`)
  titleCell.value = 'AI-POWERED PREDICTIONS'
  applyTitleStyle(titleCell, 20)
  sheet.getRow(rowNum).height = 35
  rowNum++

  sheet.mergeCells(`A${rowNum}:D${rowNum}`)
  applySubtitleStyle(sheet.getCell(`A${rowNum}`))
  sheet.getCell(`A${rowNum}`).value = 'Machine Learning insights and recommendations'
  rowNum += 2

  // Key Predictions
  sheet.mergeCells(`A${rowNum}:D${rowNum}`)
  const predTitle = sheet.getCell(`A${rowNum}`)
  predTitle.value = 'KEY PREDICTIONS'
  predTitle.font = { bold: true, size: 12, color: { argb: COLORS.primary } }
  predTitle.border = { bottom: { style: 'medium', color: { argb: COLORS.primary } } }
  rowNum++

  const predictions = [
    ['Next Month Revenue (Predicted)', formatCurrency(predictionData.nextMonthRevenue), COLORS.successLight, COLORS.successDark],
    ['Prediction Confidence', `${predictionData.confidence}%`, COLORS.primaryLight, COLORS.primary],
    ['High-Risk Churn Users', predictionData.churnRisk.high.toString(), COLORS.dangerLight, COLORS.dangerDark]
  ]

  predictions.forEach(data => {
    const row = sheet.getRow(rowNum)
    row.getCell(1).value = data[0]
    row.getCell(2).value = data[1]

    applyBodyStyle(row.getCell(1), { bold: true, bgColor: COLORS.gray100 })
    applyBodyStyle(row.getCell(2), { align: 'right', bgColor: data[2], textColor: data[3], bold: true })

    row.height = 28
    rowNum++
  })
  rowNum += 2

  // Churn Risk Distribution
  sheet.mergeCells(`A${rowNum}:D${rowNum}`)
  const churnTitle = sheet.getCell(`A${rowNum}`)
  churnTitle.value = 'CHURN RISK DISTRIBUTION'
  churnTitle.font = { bold: true, size: 12, color: { argb: COLORS.primary } }
  churnTitle.border = { bottom: { style: 'medium', color: { argb: COLORS.primary } } }
  rowNum++

  const churnHeaders = sheet.getRow(rowNum)
  const headers = ['Risk Level', 'Users', 'Percentage', 'Recommended Action']
  headers.forEach((h, i) => {
    churnHeaders.getCell(i + 1).value = h
  })
  applyHeaderStyle(churnHeaders, 1, 4)
  rowNum++

  const total = predictionData.churnRisk.high + predictionData.churnRisk.medium + predictionData.churnRisk.low
  const churnData = [
    { level: 'High Risk', users: predictionData.churnRisk.high, action: 'Immediate intervention required', colors: { bg: COLORS.dangerLight, text: COLORS.dangerDark } },
    { level: 'Medium Risk', users: predictionData.churnRisk.medium, action: 'Monitor closely, proactive outreach', colors: { bg: COLORS.warningLight, text: COLORS.warningDark } },
    { level: 'Low Risk', users: predictionData.churnRisk.low, action: 'Maintain engagement', colors: { bg: COLORS.successLight, text: COLORS.successDark } }
  ]

  churnData.forEach(data => {
    const row = sheet.getRow(rowNum)
    const percentage = ((data.users / total) * 100).toFixed(1)

    row.getCell(1).value = data.level
    row.getCell(2).value = data.users.toLocaleString()
    row.getCell(3).value = `${percentage}%`
    row.getCell(4).value = data.action

    applyBodyStyle(row.getCell(1), { bold: true, bgColor: data.colors.bg, textColor: data.colors.text })
    applyBodyStyle(row.getCell(2), { align: 'center', bgColor: data.colors.bg })
    applyBodyStyle(row.getCell(3), { align: 'center', bgColor: data.colors.bg })
    applyBodyStyle(row.getCell(4), { bgColor: data.colors.bg })

    row.height = 22
    rowNum++
  })
  rowNum += 2

  // AI Recommendations
  sheet.mergeCells(`A${rowNum}:D${rowNum}`)
  const recTitle = sheet.getCell(`A${rowNum}`)
  recTitle.value = 'AI RECOMMENDATIONS'
  recTitle.font = { bold: true, size: 12, color: { argb: COLORS.primary } }
  recTitle.border = { bottom: { style: 'medium', color: { argb: COLORS.primary } } }
  rowNum++

  const recHeaders = sheet.getRow(rowNum)
  const recHeaderLabels = ['Type', 'Recommendation', 'Expected Impact']
  recHeaderLabels.forEach((h, i) => {
    recHeaders.getCell(i + 1).value = h
  })
  sheet.mergeCells(`B${rowNum}:C${rowNum}`)
  applyHeaderStyle(recHeaders, 1, 4)
  rowNum++

  const typeColors = {
    action: { bg: COLORS.infoLight, text: COLORS.infoDark },
    warning: { bg: COLORS.dangerLight, text: COLORS.dangerDark },
    opportunity: { bg: COLORS.successLight, text: COLORS.successDark }
  }

  predictionData.recommendations.forEach(rec => {
    const row = sheet.getRow(rowNum)
    const colors = typeColors[rec.type] || typeColors.action

    row.getCell(1).value = rec.type.charAt(0).toUpperCase() + rec.type.slice(1)
    sheet.mergeCells(`B${rowNum}:C${rowNum}`)
    row.getCell(2).value = rec.text
    row.getCell(4).value = rec.impact

    applyBodyStyle(row.getCell(1), { align: 'center', bgColor: colors.bg, textColor: colors.text, bold: true })
    applyBodyStyle(row.getCell(2), { bgColor: COLORS.white })
    applyBodyStyle(row.getCell(4), { bgColor: colors.bg, textColor: colors.text })

    row.height = 28
    rowNum++
  })
}

// Export Advanced Analytics to Excel
export const exportAdvancedAnalyticsToExcel = async (revenueData, conversionData, ltvData, predictionData, dateRange) => {
  const workbook = new ExcelJS.Workbook()

  workbook.creator = 'TradeSense'
  workbook.created = new Date()
  workbook.modified = new Date()

  // Create all sheets
  createRevenueAnalyticsSheet(workbook, revenueData)
  createConversionFunnelSheet(workbook, conversionData)
  createLTVAnalysisSheet(workbook, ltvData)
  createAIPredictionsSheet(workbook, predictionData)

  // Generate and save file
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const filename = generateFileName('AdvancedAnalytics')
  saveAs(blob, filename)

  return filename
}

// ============================================
// ANALYTICS DASHBOARD EXPORT
// ============================================

// Create Overview Sheet
const createOverviewSheet = (workbook, overview, metrics) => {
  const sheet = workbook.addWorksheet('Overview', {
    properties: { tabColor: { argb: COLORS.primary } }
  })

  sheet.columns = [
    { width: 25 }, { width: 20 }, { width: 18 }, { width: 18 }
  ]

  let rowNum = 1

  // Title
  sheet.mergeCells(`A${rowNum}:D${rowNum}`)
  const titleCell = sheet.getCell(`A${rowNum}`)
  titleCell.value = 'ANALYTICS DASHBOARD'
  applyTitleStyle(titleCell, 20)
  sheet.getRow(rowNum).height = 35
  rowNum++

  sheet.mergeCells(`A${rowNum}:D${rowNum}`)
  applySubtitleStyle(sheet.getCell(`A${rowNum}`))
  sheet.getCell(`A${rowNum}`).value = `Generated on ${new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })}`
  rowNum += 2

  // Key Metrics
  sheet.mergeCells(`A${rowNum}:D${rowNum}`)
  const metricsTitle = sheet.getCell(`A${rowNum}`)
  metricsTitle.value = 'KEY METRICS'
  metricsTitle.font = { bold: true, size: 12, color: { argb: COLORS.primary } }
  metricsTitle.border = { bottom: { style: 'medium', color: { argb: COLORS.primary } } }
  rowNum++

  const metricsData = [
    ['Total Users', (overview?.users?.total || 0).toLocaleString(), 'New This Month', `+${overview?.users?.new || 0}`],
    ['Active Challenges', (overview?.challenges?.active || 0).toString(), 'Pass Rate', `${(overview?.challenges?.pass_rate || 0).toFixed(1)}%`],
    ['Revenue (30 days)', `$${(overview?.revenue?.total || 0).toLocaleString()}`, 'Transactions', (overview?.revenue?.transactions || 0).toString()],
    ['Active Users (15m)', (overview?.users?.active_15m || 0).toString(), 'Active Users (1h)', (overview?.users?.active_60m || 0).toString()]
  ]

  metricsData.forEach(rowData => {
    const row = sheet.getRow(rowNum)
    rowData.forEach((val, i) => {
      row.getCell(i + 1).value = val
      if (i % 2 === 0) {
        applyBodyStyle(row.getCell(i + 1), { bold: true, bgColor: COLORS.gray100 })
      } else {
        applyBodyStyle(row.getCell(i + 1), { align: 'right', bgColor: COLORS.white, textColor: COLORS.primary, bold: true })
      }
    })
    row.height = 25
    rowNum++
  })
  rowNum += 2

  // System Health
  if (metrics?.system) {
    sheet.mergeCells(`A${rowNum}:D${rowNum}`)
    const sysTitle = sheet.getCell(`A${rowNum}`)
    sysTitle.value = 'SYSTEM HEALTH'
    sysTitle.font = { bold: true, size: 12, color: { argb: COLORS.primary } }
    sysTitle.border = { bottom: { style: 'medium', color: { argb: COLORS.primary } } }
    rowNum++

    const sysHeaders = sheet.getRow(rowNum)
    const headers = ['Metric', 'Value', 'Status']
    headers.forEach((h, i) => {
      sysHeaders.getCell(i + 1).value = h
    })
    applyHeaderStyle(sysHeaders, 1, 3)
    rowNum++

    const getStatus = (value) => {
      if (value < 50) return { text: 'Good', bg: COLORS.successLight, color: COLORS.successDark }
      if (value < 75) return { text: 'Warning', bg: COLORS.warningLight, color: COLORS.warningDark }
      return { text: 'Critical', bg: COLORS.dangerLight, color: COLORS.dangerDark }
    }

    const system = metrics.system
    const sysData = [
      ['CPU Usage', `${(system.cpu_percent || 0).toFixed(1)}%`, getStatus(system.cpu_percent || 0)],
      ['Memory Usage', `${(system.memory_percent || 0).toFixed(1)}%`, getStatus(system.memory_percent || 0)],
      ['Disk Usage', `${(system.disk_percent || 0).toFixed(1)}%`, getStatus(system.disk_percent || 0)],
      ['Memory Used', `${((system.memory_used_mb || 0) / 1024).toFixed(2)} GB`, null],
      ['Threads', (system.threads || 0).toString(), null]
    ]

    sysData.forEach((data, index) => {
      const row = sheet.getRow(rowNum)
      const isAltRow = index % 2 === 1
      const baseBg = isAltRow ? COLORS.gray100 : COLORS.white

      row.getCell(1).value = data[0]
      row.getCell(2).value = data[1]
      row.getCell(3).value = data[2]?.text || '-'

      applyBodyStyle(row.getCell(1), { bold: true, bgColor: baseBg })
      applyBodyStyle(row.getCell(2), { align: 'center', bgColor: baseBg })

      if (data[2]) {
        applyBodyStyle(row.getCell(3), { align: 'center', bgColor: data[2].bg, textColor: data[2].color, bold: true })
      } else {
        applyBodyStyle(row.getCell(3), { align: 'center', bgColor: baseBg })
      }

      row.height = 22
      rowNum++
    })
  }
}

// Create User Growth Sheet
const createUserGrowthSheet = (workbook, growthData) => {
  const sheet = workbook.addWorksheet('User Growth', {
    properties: { tabColor: { argb: COLORS.info } }
  })

  sheet.columns = [
    { width: 15 }, { width: 15 }, { width: 15 }
  ]

  let rowNum = 1

  // Title
  sheet.mergeCells(`A${rowNum}:C${rowNum}`)
  const titleCell = sheet.getCell(`A${rowNum}`)
  titleCell.value = 'USER GROWTH (30 DAYS)'
  applyTitleStyle(titleCell, 18)
  sheet.getRow(rowNum).height = 30
  rowNum += 2

  const headers = sheet.getRow(rowNum)
  const headerLabels = ['Date', 'New Users', 'Cumulative']
  headerLabels.forEach((h, i) => {
    headers.getCell(i + 1).value = h
  })
  applyHeaderStyle(headers, 1, 3)
  rowNum++

  let cumulative = 0
  growthData.forEach((data, index) => {
    cumulative += data.new_users || 0
    const row = sheet.getRow(rowNum)
    const isAltRow = index % 2 === 1
    const baseBg = isAltRow ? COLORS.gray100 : COLORS.white

    row.getCell(1).value = data.date
    row.getCell(2).value = data.new_users || 0
    row.getCell(3).value = cumulative

    applyBodyStyle(row.getCell(1), { bgColor: baseBg })
    applyBodyStyle(row.getCell(2), { align: 'center', bgColor: baseBg, textColor: data.new_users > 0 ? COLORS.successDark : COLORS.gray500 })
    applyBodyStyle(row.getCell(3), { align: 'center', bgColor: baseBg })

    row.height = 20
    rowNum++
  })

  // Total row
  rowNum++
  const totalRow = sheet.getRow(rowNum)
  totalRow.getCell(1).value = 'TOTAL'
  totalRow.getCell(2).value = growthData.reduce((sum, d) => sum + (d.new_users || 0), 0)
  totalRow.getCell(3).value = cumulative

  for (let i = 1; i <= 3; i++) {
    const cell = totalRow.getCell(i)
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.primaryLight } }
    cell.font = { bold: true, size: 10, color: { argb: COLORS.primary } }
    cell.alignment = { horizontal: i === 1 ? 'left' : 'center', vertical: 'middle' }
  }
  totalRow.height = 25
}

// Create Revenue Sheet
const createDashboardRevenueSheet = (workbook, revenueData) => {
  const sheet = workbook.addWorksheet('Revenue', {
    properties: { tabColor: { argb: COLORS.success } }
  })

  sheet.columns = [
    { width: 15 }, { width: 18 }, { width: 18 }
  ]

  let rowNum = 1

  // Title
  sheet.mergeCells(`A${rowNum}:C${rowNum}`)
  const titleCell = sheet.getCell(`A${rowNum}`)
  titleCell.value = 'REVENUE (30 DAYS)'
  applyTitleStyle(titleCell, 18)
  sheet.getRow(rowNum).height = 30
  rowNum++

  // Total summary
  const total = revenueData.reduce((sum, d) => sum + (d.revenue || 0), 0)
  sheet.mergeCells(`A${rowNum}:C${rowNum}`)
  const summaryCell = sheet.getCell(`A${rowNum}`)
  summaryCell.value = `Total Revenue: ${formatCurrency(total)}`
  summaryCell.font = { bold: true, size: 14, color: { argb: COLORS.successDark } }
  summaryCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.successLight } }
  summaryCell.alignment = { horizontal: 'center', vertical: 'middle' }
  sheet.getRow(rowNum).height = 35
  rowNum += 2

  const headers = sheet.getRow(rowNum)
  const headerLabels = ['Date', 'Revenue', 'Cumulative']
  headerLabels.forEach((h, i) => {
    headers.getCell(i + 1).value = h
  })
  applyHeaderStyle(headers, 1, 3)
  rowNum++

  let cumulative = 0
  revenueData.forEach((data, index) => {
    cumulative += data.revenue || 0
    const row = sheet.getRow(rowNum)
    const isAltRow = index % 2 === 1
    const baseBg = isAltRow ? COLORS.gray100 : COLORS.white

    row.getCell(1).value = data.date
    row.getCell(2).value = formatCurrency(data.revenue || 0)
    row.getCell(3).value = formatCurrency(cumulative)

    applyBodyStyle(row.getCell(1), { bgColor: baseBg })
    applyBodyStyle(row.getCell(2), { align: 'right', bgColor: baseBg, textColor: COLORS.successDark, bold: data.revenue > 0 })
    applyBodyStyle(row.getCell(3), { align: 'right', bgColor: baseBg })

    row.height = 20
    rowNum++
  })
}

// Create Challenge Distribution Sheet
const createChallengeDistSheet = (workbook, distribution) => {
  const sheet = workbook.addWorksheet('Challenges', {
    properties: { tabColor: { argb: COLORS.purple } }
  })

  sheet.columns = [
    { width: 18 }, { width: 12 }, { width: 15 }, { width: 20 }
  ]

  let rowNum = 1

  // Title
  sheet.mergeCells(`A${rowNum}:D${rowNum}`)
  const titleCell = sheet.getCell(`A${rowNum}`)
  titleCell.value = 'CHALLENGE STATUS DISTRIBUTION'
  applyTitleStyle(titleCell, 18)
  sheet.getRow(rowNum).height = 30
  rowNum += 2

  const headers = sheet.getRow(rowNum)
  const headerLabels = ['Status', 'Count', 'Percentage', 'Visual']
  headerLabels.forEach((h, i) => {
    headers.getCell(i + 1).value = h
  })
  applyHeaderStyle(headers, 1, 4)
  rowNum++

  const total = Object.values(distribution).reduce((sum, val) => sum + val, 0)

  const statusColors = {
    active: { bg: COLORS.infoLight, text: COLORS.infoDark },
    evaluation: { bg: COLORS.warningLight, text: COLORS.warningDark },
    passed: { bg: COLORS.successLight, text: COLORS.successDark },
    failed: { bg: COLORS.dangerLight, text: COLORS.dangerDark },
    funded: { bg: COLORS.primaryLight, text: COLORS.purple },
    pending: { bg: COLORS.gray100, text: COLORS.gray700 }
  }

  Object.entries(distribution).forEach(([status, count], index) => {
    const row = sheet.getRow(rowNum)
    const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0
    const colors = statusColors[status] || statusColors.pending

    row.getCell(1).value = status.charAt(0).toUpperCase() + status.slice(1)
    row.getCell(2).value = count
    row.getCell(3).value = `${percentage}%`
    row.getCell(4).value = '█'.repeat(Math.round(percentage / 5)) + '░'.repeat(20 - Math.round(percentage / 5))

    applyBodyStyle(row.getCell(1), { bold: true, bgColor: colors.bg, textColor: colors.text })
    applyBodyStyle(row.getCell(2), { align: 'center', bgColor: colors.bg })
    applyBodyStyle(row.getCell(3), { align: 'center', bgColor: colors.bg })
    applyBodyStyle(row.getCell(4), { bgColor: colors.bg, textColor: colors.text })

    row.height = 22
    rowNum++
  })

  // Total row
  rowNum++
  const totalRow = sheet.getRow(rowNum)
  totalRow.getCell(1).value = 'TOTAL'
  totalRow.getCell(2).value = total
  totalRow.getCell(3).value = '100%'

  for (let i = 1; i <= 3; i++) {
    const cell = totalRow.getCell(i)
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.gray200 } }
    cell.font = { bold: true, size: 10, color: { argb: COLORS.gray900 } }
    cell.alignment = { horizontal: i === 1 ? 'left' : 'center', vertical: 'middle' }
  }
  totalRow.height = 25
}

// Create Endpoints Sheet
const createEndpointsSheet = (workbook, endpoints) => {
  const sheet = workbook.addWorksheet('Top Endpoints', {
    properties: { tabColor: { argb: COLORS.warning } }
  })

  sheet.columns = [
    { width: 40 }, { width: 12 }, { width: 12 }, { width: 12 }
  ]

  let rowNum = 1

  // Title
  sheet.mergeCells(`A${rowNum}:D${rowNum}`)
  const titleCell = sheet.getCell(`A${rowNum}`)
  titleCell.value = 'TOP API ENDPOINTS'
  applyTitleStyle(titleCell, 18)
  sheet.getRow(rowNum).height = 30
  rowNum += 2

  const headers = sheet.getRow(rowNum)
  const headerLabels = ['Endpoint', 'Requests', 'Avg Time', 'Error %']
  headerLabels.forEach((h, i) => {
    headers.getCell(i + 1).value = h
  })
  applyHeaderStyle(headers, 1, 4)
  rowNum++

  endpoints?.slice(0, 15).forEach((ep, index) => {
    const row = sheet.getRow(rowNum)
    const isAltRow = index % 2 === 1
    const baseBg = isAltRow ? COLORS.gray100 : COLORS.white
    const errorRate = ep.error_rate || 0

    row.getCell(1).value = ep.endpoint
    row.getCell(2).value = ep.requests || 0
    row.getCell(3).value = `${(ep.avg_time_ms || 0).toFixed(0)}ms`
    row.getCell(4).value = `${errorRate.toFixed(1)}%`

    applyBodyStyle(row.getCell(1), { bgColor: baseBg })
    applyBodyStyle(row.getCell(2), { align: 'center', bgColor: baseBg })
    applyBodyStyle(row.getCell(3), { align: 'center', bgColor: baseBg })

    if (errorRate > 5) {
      applyBodyStyle(row.getCell(4), { align: 'center', bgColor: COLORS.dangerLight, textColor: COLORS.dangerDark, bold: true })
    } else {
      applyBodyStyle(row.getCell(4), { align: 'center', bgColor: baseBg })
    }

    row.height = 20
    rowNum++
  })
}

// =====================================================
// ADMIN DASHBOARD EXPORT FUNCTIONS
// =====================================================

// Helper: Create Admin Overview Sheet
const createAdminOverviewSheet = (workbook, stats) => {
  const sheet = workbook.addWorksheet('Overview', {
    properties: { tabColor: { argb: '3B82F6' } }
  })

  sheet.columns = [
    { width: 25 },
    { width: 30 },
    { width: 25 },
    { width: 30 }
  ]

  // Title
  sheet.mergeCells('A1:D1')
  const titleCell = sheet.getCell('A1')
  titleCell.value = 'Admin Dashboard Overview'
  titleCell.font = { size: 16, bold: true, color: { argb: '1F2937' } }
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F3F4F6' } }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  sheet.getRow(1).height = 35

  // Generated date
  sheet.mergeCells('A2:D2')
  const dateCell = sheet.getCell('A2')
  dateCell.value = `Generated: ${new Date().toLocaleString()}`
  dateCell.font = { size: 10, italic: true, color: { argb: '6B7280' } }
  dateCell.alignment = { horizontal: 'center' }

  // KPI Section
  let rowNum = 4

  // Users Section
  sheet.mergeCells(`A${rowNum}:B${rowNum}`)
  const usersHeader = sheet.getCell(`A${rowNum}`)
  usersHeader.value = 'Users'
  usersHeader.font = { size: 12, bold: true, color: { argb: 'FFFFFF' } }
  usersHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '3B82F6' } }
  rowNum++

  const usersData = [
    ['Total Users', stats?.users?.total?.toLocaleString() || '0'],
    ['New This Month', `+${stats?.users?.new_this_month || 0}`]
  ]
  usersData.forEach(([label, value]) => {
    sheet.getCell(`A${rowNum}`).value = label
    sheet.getCell(`B${rowNum}`).value = value
    sheet.getCell(`A${rowNum}`).font = { color: { argb: '374151' } }
    sheet.getCell(`B${rowNum}`).font = { bold: true, color: { argb: '3B82F6' } }
    sheet.getCell(`B${rowNum}`).alignment = { horizontal: 'right' }
    rowNum++
  })

  rowNum++

  // Revenue Section
  sheet.mergeCells(`A${rowNum}:B${rowNum}`)
  const revenueHeader = sheet.getCell(`A${rowNum}`)
  revenueHeader.value = 'Revenue'
  revenueHeader.font = { size: 12, bold: true, color: { argb: 'FFFFFF' } }
  revenueHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '10B981' } }
  rowNum++

  const revenueItems = [
    ['Total Revenue', `${(stats?.revenue?.total || 0).toLocaleString()} MAD`],
    ['Monthly Revenue', `${(stats?.revenue?.monthly || 0).toLocaleString()} MAD`]
  ]
  revenueItems.forEach(([label, value]) => {
    sheet.getCell(`A${rowNum}`).value = label
    sheet.getCell(`B${rowNum}`).value = value
    sheet.getCell(`A${rowNum}`).font = { color: { argb: '374151' } }
    sheet.getCell(`B${rowNum}`).font = { bold: true, color: { argb: '10B981' } }
    sheet.getCell(`B${rowNum}`).alignment = { horizontal: 'right' }
    rowNum++
  })

  rowNum++

  // Challenges Section (right side)
  let rightRowNum = 4
  sheet.mergeCells(`C${rightRowNum}:D${rightRowNum}`)
  const challengesHeader = sheet.getCell(`C${rightRowNum}`)
  challengesHeader.value = 'Challenges'
  challengesHeader.font = { size: 12, bold: true, color: { argb: 'FFFFFF' } }
  challengesHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '8B5CF6' } }
  rightRowNum++

  const challengeItems = [
    ['Total Challenges', stats?.challenges?.total || 0, '374151'],
    ['Active', stats?.challenges?.active || 0, '3B82F6'],
    ['Passed', stats?.challenges?.passed || 0, '10B981'],
    ['Failed', stats?.challenges?.failed || 0, 'EF4444'],
    ['Success Rate', `${(stats?.challenges?.success_rate || 0).toFixed(1)}%`, '8B5CF6']
  ]
  challengeItems.forEach(([label, value, color]) => {
    sheet.getCell(`C${rightRowNum}`).value = label
    sheet.getCell(`D${rightRowNum}`).value = value
    sheet.getCell(`C${rightRowNum}`).font = { color: { argb: '374151' } }
    sheet.getCell(`D${rightRowNum}`).font = { bold: true, color: { argb: color } }
    sheet.getCell(`D${rightRowNum}`).alignment = { horizontal: 'right' }
    rightRowNum++
  })

  rightRowNum++

  // Trades Section (right side)
  sheet.mergeCells(`C${rightRowNum}:D${rightRowNum}`)
  const tradesHeader = sheet.getCell(`C${rightRowNum}`)
  tradesHeader.value = 'Trades'
  tradesHeader.font = { size: 12, bold: true, color: { argb: 'FFFFFF' } }
  tradesHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F97316' } }
  rightRowNum++

  const tradeItems = [
    ['Total Trades', (stats?.trades?.total || 0).toLocaleString()],
    ['Total Volume', `${(stats?.trades?.total_volume || 0).toLocaleString()} MAD`]
  ]
  tradeItems.forEach(([label, value]) => {
    sheet.getCell(`C${rightRowNum}`).value = label
    sheet.getCell(`D${rightRowNum}`).value = value
    sheet.getCell(`C${rightRowNum}`).font = { color: { argb: '374151' } }
    sheet.getCell(`D${rightRowNum}`).font = { bold: true, color: { argb: 'F97316' } }
    sheet.getCell(`D${rightRowNum}`).alignment = { horizontal: 'right' }
    rightRowNum++
  })
}

// Helper: Create Admin User Growth Sheet
const createAdminUserGrowthSheet = (workbook, growthData) => {
  const sheet = workbook.addWorksheet('User Growth', {
    properties: { tabColor: { argb: '3B82F6' } }
  })

  sheet.columns = [
    { width: 20 },
    { width: 20 }
  ]

  // Header
  const headerRow = sheet.getRow(1)
  headerRow.values = ['Date', 'Total Users']
  headerRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '3B82F6' } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = {
      bottom: { style: 'thin', color: { argb: '2563EB' } }
    }
  })
  headerRow.height = 25

  // Data rows
  growthData.forEach((item, index) => {
    const row = sheet.getRow(index + 2)
    const date = item.x ? new Date(item.x).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'
    row.values = [date, item.y || 0]

    const bgColor = index % 2 === 0 ? 'F8FAFC' : 'FFFFFF'
    row.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
      cell.alignment = { horizontal: 'center' }
    })
    row.getCell(2).font = { bold: true, color: { argb: '3B82F6' } }
  })
}

// Helper: Create Admin Revenue Sheet
const createAdminRevenueSheet = (workbook, revenueData) => {
  const sheet = workbook.addWorksheet('Revenue', {
    properties: { tabColor: { argb: '10B981' } }
  })

  sheet.columns = [
    { width: 20 },
    { width: 25 }
  ]

  // Header
  const headerRow = sheet.getRow(1)
  headerRow.values = ['Date', 'Cumulative Revenue']
  headerRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '10B981' } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
  })
  headerRow.height = 25

  // Data rows
  revenueData.forEach((item, index) => {
    const row = sheet.getRow(index + 2)
    const date = item.x ? new Date(item.x).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'
    row.values = [date, `${(item.y || 0).toLocaleString()} MAD`]

    const bgColor = index % 2 === 0 ? 'F0FDF4' : 'FFFFFF'
    row.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
      cell.alignment = { horizontal: 'center' }
    })
    row.getCell(2).font = { bold: true, color: { argb: '10B981' } }
  })

  // Total row
  if (revenueData.length > 0) {
    const totalRow = sheet.getRow(revenueData.length + 2)
    const totalRevenue = revenueData[revenueData.length - 1]?.y || 0
    totalRow.values = ['TOTAL', `${totalRevenue.toLocaleString()} MAD`]
    totalRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '10B981' } }
      cell.alignment = { horizontal: 'center' }
    })
  }
}

// Helper: Create Admin Challenges Sheet
const createAdminChallengesSheet = (workbook, challenges) => {
  const sheet = workbook.addWorksheet('Challenges', {
    properties: { tabColor: { argb: '8B5CF6' } }
  })

  sheet.columns = [
    { width: 25 },
    { width: 15 },
    { width: 15 }
  ]

  // Header
  const headerRow = sheet.getRow(1)
  headerRow.values = ['Status', 'Count', 'Percentage']
  headerRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '8B5CF6' } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
  })
  headerRow.height = 25

  const total = challenges?.total || 0
  const statuses = [
    { name: 'Active', value: challenges?.active || 0, color: '3B82F6' },
    { name: 'Passed', value: challenges?.passed || 0, color: '10B981' },
    { name: 'Failed', value: challenges?.failed || 0, color: 'EF4444' }
  ]

  statuses.forEach((status, index) => {
    const row = sheet.getRow(index + 2)
    const percentage = total > 0 ? ((status.value / total) * 100).toFixed(1) : '0.0'
    row.values = [status.name, status.value, `${percentage}%`]

    row.getCell(1).font = { bold: true, color: { argb: status.color } }
    row.getCell(2).font = { bold: true, color: { argb: status.color } }
    row.getCell(3).font = { bold: true, color: { argb: status.color } }
    row.eachCell(cell => {
      cell.alignment = { horizontal: 'center' }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: index % 2 === 0 ? 'F5F3FF' : 'FFFFFF' } }
    })
  })

  // Total row
  const totalRow = sheet.getRow(statuses.length + 2)
  totalRow.values = ['TOTAL', total, '100%']
  totalRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '8B5CF6' } }
    cell.alignment = { horizontal: 'center' }
  })

  // Success Rate
  const rateRow = sheet.getRow(statuses.length + 4)
  sheet.mergeCells(`A${statuses.length + 4}:B${statuses.length + 4}`)
  rateRow.getCell(1).value = 'Success Rate'
  rateRow.getCell(3).value = `${(challenges?.success_rate || 0).toFixed(1)}%`
  rateRow.getCell(1).font = { bold: true, color: { argb: '374151' } }
  rateRow.getCell(3).font = { bold: true, size: 14, color: { argb: '8B5CF6' } }
  rateRow.getCell(3).alignment = { horizontal: 'center' }
}

// Export Admin Dashboard to Excel
export const exportAdminDashboardToExcel = async (stats, userGrowthData, revenueData) => {
  const workbook = new ExcelJS.Workbook()

  workbook.creator = 'TradeSense'
  workbook.created = new Date()
  workbook.modified = new Date()

  // Create all sheets
  createAdminOverviewSheet(workbook, stats)
  createAdminUserGrowthSheet(workbook, userGrowthData || [])
  createAdminRevenueSheet(workbook, revenueData || [])
  createAdminChallengesSheet(workbook, stats?.challenges || {})

  // Generate and save file
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const filename = generateFileName('AdminDashboard')
  saveAs(blob, filename)

  return filename
}

// Export Analytics Dashboard to Excel
export const exportAnalyticsDashboardToExcel = async (overview, userGrowth, revenueData, challengeDistribution, metrics) => {
  const workbook = new ExcelJS.Workbook()

  workbook.creator = 'TradeSense'
  workbook.created = new Date()
  workbook.modified = new Date()

  // Create all sheets
  createOverviewSheet(workbook, overview, metrics)
  createUserGrowthSheet(workbook, userGrowth || [])
  createDashboardRevenueSheet(workbook, revenueData || [])
  createChallengeDistSheet(workbook, challengeDistribution || {})
  createEndpointsSheet(workbook, metrics?.endpoints || [])

  // Generate and save file
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const filename = generateFileName('AnalyticsDashboard')
  saveAs(blob, filename)

  return filename
}

// =====================================================
// USERS LIST EXPORT FUNCTIONS
// =====================================================

// Helper: Create Users Overview Sheet
const createUsersOverviewSheet = (workbook, users, stats) => {
  const sheet = workbook.addWorksheet('Overview', {
    properties: { tabColor: { argb: '3B82F6' } }
  })

  sheet.columns = [
    { width: 20 },
    { width: 15 },
    { width: 20 },
    { width: 15 }
  ]

  // Title
  sheet.mergeCells('A1:D1')
  const titleCell = sheet.getCell('A1')
  titleCell.value = 'Users List Report'
  titleCell.font = { size: 16, bold: true, color: { argb: '1F2937' } }
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F3F4F6' } }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  sheet.getRow(1).height = 35

  // Generated date
  sheet.mergeCells('A2:D2')
  const dateCell = sheet.getCell('A2')
  dateCell.value = `Generated: ${new Date().toLocaleString()}`
  dateCell.font = { size: 10, italic: true, color: { argb: '6B7280' } }
  dateCell.alignment = { horizontal: 'center' }

  // Summary Stats
  let rowNum = 4
  sheet.mergeCells(`A${rowNum}:D${rowNum}`)
  const summaryHeader = sheet.getCell(`A${rowNum}`)
  summaryHeader.value = 'Summary Statistics'
  summaryHeader.font = { size: 12, bold: true, color: { argb: 'FFFFFF' } }
  summaryHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '3B82F6' } }
  rowNum++

  const summaryData = [
    ['Total Users', stats.total, 'Active Users', stats.active],
    ['Banned Users', stats.banned, 'With Challenges', stats.withChallenges],
    ['Verified Email', stats.verified, 'Unverified', stats.unverified]
  ]

  summaryData.forEach(([label1, value1, label2, value2]) => {
    sheet.getCell(`A${rowNum}`).value = label1
    sheet.getCell(`B${rowNum}`).value = value1
    sheet.getCell(`C${rowNum}`).value = label2
    sheet.getCell(`D${rowNum}`).value = value2

    sheet.getCell(`A${rowNum}`).font = { color: { argb: '374151' } }
    sheet.getCell(`B${rowNum}`).font = { bold: true, color: { argb: '3B82F6' } }
    sheet.getCell(`C${rowNum}`).font = { color: { argb: '374151' } }
    sheet.getCell(`D${rowNum}`).font = { bold: true, color: { argb: '3B82F6' } }
    rowNum++
  })

  rowNum += 2

  // Role Distribution
  sheet.mergeCells(`A${rowNum}:D${rowNum}`)
  const roleHeader = sheet.getCell(`A${rowNum}`)
  roleHeader.value = 'Role Distribution'
  roleHeader.font = { size: 12, bold: true, color: { argb: 'FFFFFF' } }
  roleHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '8B5CF6' } }
  rowNum++

  const roleCount = {
    user: users.filter(u => u.role === 'user').length,
    admin: users.filter(u => u.role === 'admin').length,
    superadmin: users.filter(u => u.role === 'superadmin').length
  }

  const total = users.length
  const roleData = [
    ['User', roleCount.user, total > 0 ? ((roleCount.user / total) * 100).toFixed(1) + '%' : '0%', '6B7280'],
    ['Admin', roleCount.admin, total > 0 ? ((roleCount.admin / total) * 100).toFixed(1) + '%' : '0%', '3B82F6'],
    ['SuperAdmin', roleCount.superadmin, total > 0 ? ((roleCount.superadmin / total) * 100).toFixed(1) + '%' : '0%', '8B5CF6']
  ]

  roleData.forEach(([role, count, pct, color]) => {
    sheet.getCell(`A${rowNum}`).value = role
    sheet.getCell(`B${rowNum}`).value = count
    sheet.getCell(`C${rowNum}`).value = pct

    sheet.getCell(`A${rowNum}`).font = { bold: true, color: { argb: color } }
    sheet.getCell(`B${rowNum}`).font = { bold: true, color: { argb: color } }
    sheet.getCell(`C${rowNum}`).font = { color: { argb: '6B7280' } }
    rowNum++
  })
}

// Helper: Create Users List Sheet
const createUsersListSheet = (workbook, users) => {
  const sheet = workbook.addWorksheet('Users', {
    properties: { tabColor: { argb: '10B981' } }
  })

  sheet.columns = [
    { width: 8 },
    { width: 18 },
    { width: 30 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 18 }
  ]

  // Header
  const headerRow = sheet.getRow(1)
  headerRow.values = ['ID', 'Username', 'Email', 'Role', 'Status', 'Verified', 'Challenges', 'Joined']
  headerRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '10B981' } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
  })
  headerRow.height = 25

  // Data rows
  users.forEach((user, index) => {
    const row = sheet.getRow(index + 2)
    const status = user.status?.is_banned ? 'Banned' : user.status?.is_frozen ? 'Frozen' : 'Active'
    const joinDate = user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'

    row.values = [
      user.id,
      user.username || 'N/A',
      user.email || 'N/A',
      user.role || 'user',
      status,
      user.email_verified ? 'Yes' : 'No',
      user.challenges_count || 0,
      joinDate
    ]

    const bgColor = index % 2 === 0 ? 'F8FAFC' : 'FFFFFF'
    row.eachCell((cell, colNumber) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
      cell.alignment = { horizontal: colNumber === 3 ? 'left' : 'center' }
    })

    // Status coloring
    const statusCell = row.getCell(5)
    if (status === 'Active') {
      statusCell.font = { bold: true, color: { argb: '10B981' } }
    } else if (status === 'Banned') {
      statusCell.font = { bold: true, color: { argb: 'EF4444' } }
    } else {
      statusCell.font = { bold: true, color: { argb: 'F59E0B' } }
    }

    // Role coloring
    const roleCell = row.getCell(4)
    if (user.role === 'superadmin') {
      roleCell.font = { bold: true, color: { argb: '8B5CF6' } }
    } else if (user.role === 'admin') {
      roleCell.font = { bold: true, color: { argb: '3B82F6' } }
    }

    // Verified coloring
    const verifiedCell = row.getCell(6)
    verifiedCell.font = { color: { argb: user.email_verified ? '10B981' : '9CA3AF' } }
  })

  // Auto-filter
  sheet.autoFilter = {
    from: 'A1',
    to: `H${users.length + 1}`
  }
}

// Export Users List to Excel
export const exportUsersListToExcel = async (users, stats) => {
  const workbook = new ExcelJS.Workbook()

  workbook.creator = 'TradeSense'
  workbook.created = new Date()
  workbook.modified = new Date()

  // Calculate stats if not provided
  const calculatedStats = stats || {
    total: users.length,
    active: users.filter(u => !u.status?.is_banned && !u.status?.is_frozen).length,
    banned: users.filter(u => u.status?.is_banned).length,
    withChallenges: users.filter(u => u.challenges_count > 0).length,
    verified: users.filter(u => u.email_verified).length,
    unverified: users.filter(u => !u.email_verified).length
  }

  // Create sheets
  createUsersOverviewSheet(workbook, users, calculatedStats)
  createUsersListSheet(workbook, users)

  // Generate and save file
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const filename = generateFileName('UsersList')
  saveAs(blob, filename)

  return filename
}

// =====================================================
// CHALLENGES LIST EXPORT FUNCTIONS
// =====================================================

// Helper: Create Challenges Overview Sheet
const createChallengesOverviewSheet = (workbook, stats) => {
  const sheet = workbook.addWorksheet('Overview', {
    properties: { tabColor: { argb: '3B82F6' } }
  })

  sheet.columns = [
    { width: 20 },
    { width: 15 },
    { width: 15 }
  ]

  // Title
  sheet.mergeCells('A1:C1')
  const titleCell = sheet.getCell('A1')
  titleCell.value = 'Challenges Report'
  titleCell.font = { size: 16, bold: true, color: { argb: '1F2937' } }
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F3F4F6' } }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  sheet.getRow(1).height = 35

  // Generated date
  sheet.mergeCells('A2:C2')
  const dateCell = sheet.getCell('A2')
  dateCell.value = `Generated: ${new Date().toLocaleString()}`
  dateCell.font = { size: 10, italic: true, color: { argb: '6B7280' } }
  dateCell.alignment = { horizontal: 'center' }

  // Stats Header
  let rowNum = 4
  sheet.mergeCells(`A${rowNum}:C${rowNum}`)
  const statsHeader = sheet.getCell(`A${rowNum}`)
  statsHeader.value = 'Challenge Statistics'
  statsHeader.font = { size: 12, bold: true, color: { argb: 'FFFFFF' } }
  statsHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '3B82F6' } }
  rowNum++

  const total = stats.total || 1
  const statusData = [
    ['Total Challenges', stats.total || 0, '100%', '6B7280'],
    ['Active', stats.active || 0, ((stats.active / total) * 100).toFixed(1) + '%', '3B82F6'],
    ['Passed', stats.passed || 0, ((stats.passed / total) * 100).toFixed(1) + '%', '10B981'],
    ['Failed', stats.failed || 0, ((stats.failed / total) * 100).toFixed(1) + '%', 'EF4444'],
    ['Funded', stats.funded || 0, ((stats.funded / total) * 100).toFixed(1) + '%', '8B5CF6']
  ]

  statusData.forEach(([label, count, pct, color]) => {
    sheet.getCell(`A${rowNum}`).value = label
    sheet.getCell(`B${rowNum}`).value = count
    sheet.getCell(`C${rowNum}`).value = pct

    sheet.getCell(`A${rowNum}`).font = { bold: true, color: { argb: color } }
    sheet.getCell(`B${rowNum}`).font = { bold: true, color: { argb: color } }
    sheet.getCell(`C${rowNum}`).font = { color: { argb: '6B7280' } }
    sheet.getCell(`B${rowNum}`).alignment = { horizontal: 'center' }
    sheet.getCell(`C${rowNum}`).alignment = { horizontal: 'center' }
    rowNum++
  })

  // Success Rate
  rowNum += 2
  const successRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : '0.0'
  sheet.getCell(`A${rowNum}`).value = 'Success Rate'
  sheet.getCell(`B${rowNum}`).value = `${successRate}%`
  sheet.getCell(`A${rowNum}`).font = { bold: true, size: 12, color: { argb: '374151' } }
  sheet.getCell(`B${rowNum}`).font = { bold: true, size: 14, color: { argb: '10B981' } }
}

// Helper: Create Challenges List Sheet
const createChallengesListSheet = (workbook, challenges) => {
  const sheet = workbook.addWorksheet('Challenges', {
    properties: { tabColor: { argb: '10B981' } }
  })

  sheet.columns = [
    { width: 8 },
    { width: 15 },
    { width: 25 },
    { width: 18 },
    { width: 12 },
    { width: 10 },
    { width: 15 },
    { width: 12 },
    { width: 12 },
    { width: 10 },
    { width: 14 }
  ]

  // Header
  const headerRow = sheet.getRow(1)
  headerRow.values = ['ID', 'Trader', 'Email', 'Challenge', 'Status', 'Phase', 'Balance', 'P&L %', 'Max DD', 'Trades', 'Started']
  headerRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '10B981' } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
  })
  headerRow.height = 25

  // Data rows
  challenges.forEach((ch, index) => {
    const row = sheet.getRow(index + 2)
    const startDate = ch.start_date ? new Date(ch.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'

    row.values = [
      ch.id,
      ch.user?.username || 'N/A',
      ch.user?.email || 'N/A',
      ch.model?.name || 'N/A',
      ch.status || 'pending',
      ch.phase === 'funded' ? 'Funded' : `Phase ${ch.phase}`,
      ch.current_balance || 0,
      (ch.profit_percent || 0).toFixed(1) + '%',
      (ch.max_drawdown || 0).toFixed(1) + '%',
      ch.trades_count || 0,
      startDate
    ]

    const bgColor = index % 2 === 0 ? 'F8FAFC' : 'FFFFFF'
    row.eachCell((cell, colNumber) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
      cell.alignment = { horizontal: colNumber <= 4 ? 'left' : 'center' }
    })

    // Balance formatting
    row.getCell(7).numFmt = '$#,##0'

    // Status coloring
    const statusCell = row.getCell(5)
    const status = ch.status?.toLowerCase()
    if (status === 'active') statusCell.font = { bold: true, color: { argb: '3B82F6' } }
    else if (status === 'passed') statusCell.font = { bold: true, color: { argb: '10B981' } }
    else if (status === 'failed') statusCell.font = { bold: true, color: { argb: 'EF4444' } }
    else if (status === 'funded') statusCell.font = { bold: true, color: { argb: '8B5CF6' } }

    // P&L coloring
    const plCell = row.getCell(8)
    plCell.font = { bold: true, color: { argb: (ch.profit_percent || 0) >= 0 ? '10B981' : 'EF4444' } }

    // Max DD coloring
    const ddCell = row.getCell(9)
    const dd = ch.max_drawdown || 0
    if (dd > 5) ddCell.font = { color: { argb: 'EF4444' } }
    else if (dd > 3) ddCell.font = { color: { argb: 'F59E0B' } }
    else ddCell.font = { color: { argb: '10B981' } }
  })

  // Auto-filter
  sheet.autoFilter = {
    from: 'A1',
    to: `K${challenges.length + 1}`
  }
}

// Export Challenges List to Excel
export const exportChallengesListToExcel = async (challenges, stats) => {
  const workbook = new ExcelJS.Workbook()

  workbook.creator = 'TradeSense'
  workbook.created = new Date()
  workbook.modified = new Date()

  // Create sheets
  createChallengesOverviewSheet(workbook, stats)
  createChallengesListSheet(workbook, challenges)

  // Generate and save file
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const filename = generateFileName('ChallengesList')
  saveAs(blob, filename)

  return filename
}

// =====================================================
// PAYMENTS LIST EXPORT FUNCTIONS
// =====================================================

// Helper: Create Payments Overview Sheet
const createPaymentsOverviewSheet = (workbook, stats, payments) => {
  const sheet = workbook.addWorksheet('Overview', {
    properties: { tabColor: { argb: '10B981' } }
  })

  sheet.columns = [
    { width: 20 },
    { width: 15 },
    { width: 15 }
  ]

  // Title
  sheet.mergeCells('A1:C1')
  const titleCell = sheet.getCell('A1')
  titleCell.value = 'Payments Report'
  titleCell.font = { size: 16, bold: true, color: { argb: '1F2937' } }
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F3F4F6' } }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  sheet.getRow(1).height = 35

  // Generated date
  sheet.mergeCells('A2:C2')
  const dateCell = sheet.getCell('A2')
  dateCell.value = `Generated: ${new Date().toLocaleString()}`
  dateCell.font = { size: 10, italic: true, color: { argb: '6B7280' } }
  dateCell.alignment = { horizontal: 'center' }

  // Total Revenue
  let rowNum = 4
  sheet.mergeCells(`A${rowNum}:C${rowNum}`)
  const revenueCell = sheet.getCell(`A${rowNum}`)
  revenueCell.value = `Total Revenue: $${(stats.totalAmount || 0).toLocaleString()}`
  revenueCell.font = { size: 14, bold: true, color: { argb: '10B981' } }
  revenueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F0FDF4' } }
  revenueCell.alignment = { horizontal: 'center' }
  sheet.getRow(rowNum).height = 30
  rowNum += 2

  // Stats Header
  sheet.mergeCells(`A${rowNum}:C${rowNum}`)
  const statsHeader = sheet.getCell(`A${rowNum}`)
  statsHeader.value = 'Payment Statistics'
  statsHeader.font = { size: 12, bold: true, color: { argb: 'FFFFFF' } }
  statsHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '10B981' } }
  rowNum++

  const total = stats.total || 1
  const statusData = [
    ['Total Payments', stats.total || 0, '100%', '6B7280'],
    ['Completed', stats.completed || 0, ((stats.completed / total) * 100).toFixed(1) + '%', '10B981'],
    ['Pending', stats.pending || 0, ((stats.pending / total) * 100).toFixed(1) + '%', 'F59E0B'],
    ['Failed', stats.failed || 0, ((stats.failed / total) * 100).toFixed(1) + '%', 'EF4444']
  ]

  statusData.forEach(([label, count, pct, color]) => {
    sheet.getCell(`A${rowNum}`).value = label
    sheet.getCell(`B${rowNum}`).value = count
    sheet.getCell(`C${rowNum}`).value = pct

    sheet.getCell(`A${rowNum}`).font = { bold: true, color: { argb: color } }
    sheet.getCell(`B${rowNum}`).font = { bold: true, color: { argb: color } }
    sheet.getCell(`C${rowNum}`).font = { color: { argb: '6B7280' } }
    sheet.getCell(`B${rowNum}`).alignment = { horizontal: 'center' }
    sheet.getCell(`C${rowNum}`).alignment = { horizontal: 'center' }
    rowNum++
  })

  // Payment Methods
  rowNum += 2
  sheet.mergeCells(`A${rowNum}:C${rowNum}`)
  const methodHeader = sheet.getCell(`A${rowNum}`)
  methodHeader.value = 'Payment Methods'
  methodHeader.font = { size: 12, bold: true, color: { argb: 'FFFFFF' } }
  methodHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '3B82F6' } }
  rowNum++

  const methodCount = {
    card: payments.filter(p => p.method === 'card').length,
    crypto: payments.filter(p => p.method === 'crypto').length,
    paypal: payments.filter(p => p.method === 'paypal').length,
    bank: payments.filter(p => p.method === 'bank').length
  }

  const totalPayments = payments.length || 1
  const methodData = [
    ['Card', methodCount.card, ((methodCount.card / totalPayments) * 100).toFixed(1) + '%'],
    ['Crypto', methodCount.crypto, ((methodCount.crypto / totalPayments) * 100).toFixed(1) + '%'],
    ['PayPal', methodCount.paypal, ((methodCount.paypal / totalPayments) * 100).toFixed(1) + '%'],
    ['Bank Transfer', methodCount.bank, ((methodCount.bank / totalPayments) * 100).toFixed(1) + '%']
  ]

  methodData.forEach(([method, count, pct]) => {
    sheet.getCell(`A${rowNum}`).value = method
    sheet.getCell(`B${rowNum}`).value = count
    sheet.getCell(`C${rowNum}`).value = pct

    sheet.getCell(`A${rowNum}`).font = { color: { argb: '374151' } }
    sheet.getCell(`B${rowNum}`).font = { bold: true, color: { argb: '3B82F6' } }
    sheet.getCell(`C${rowNum}`).font = { color: { argb: '6B7280' } }
    sheet.getCell(`B${rowNum}`).alignment = { horizontal: 'center' }
    sheet.getCell(`C${rowNum}`).alignment = { horizontal: 'center' }
    rowNum++
  })
}

// Helper: Create Payments List Sheet
const createPaymentsListSheet = (workbook, payments) => {
  const sheet = workbook.addWorksheet('Payments', {
    properties: { tabColor: { argb: '10B981' } }
  })

  sheet.columns = [
    { width: 12 },
    { width: 15 },
    { width: 25 },
    { width: 12 },
    { width: 10 },
    { width: 12 },
    { width: 25 },
    { width: 20 }
  ]

  // Header
  const headerRow = sheet.getRow(1)
  headerRow.values = ['Payment ID', 'Customer', 'Email', 'Amount', 'Method', 'Status', 'Description', 'Date']
  headerRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '10B981' } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
  })
  headerRow.height = 25

  // Data rows
  payments.forEach((p, index) => {
    const row = sheet.getRow(index + 2)
    const date = p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'

    row.values = [
      p.id || 'N/A',
      p.user?.username || 'N/A',
      p.user?.email || 'N/A',
      p.amount || 0,
      p.method || 'N/A',
      p.status || 'pending',
      p.description || 'N/A',
      date
    ]

    const bgColor = index % 2 === 0 ? 'F8FAFC' : 'FFFFFF'
    row.eachCell((cell, colNumber) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
      cell.alignment = { horizontal: colNumber <= 3 ? 'left' : 'center' }
    })

    // Amount formatting
    row.getCell(4).numFmt = '$#,##0.00'
    row.getCell(4).font = { bold: true, color: { argb: '10B981' } }

    // Status coloring
    const statusCell = row.getCell(6)
    const status = p.status?.toLowerCase()
    if (status === 'completed') statusCell.font = { bold: true, color: { argb: '10B981' } }
    else if (status === 'pending') statusCell.font = { bold: true, color: { argb: 'F59E0B' } }
    else if (status === 'failed') statusCell.font = { bold: true, color: { argb: 'EF4444' } }
    else if (status === 'refunded') statusCell.font = { bold: true, color: { argb: '3B82F6' } }
  })

  // Auto-filter
  sheet.autoFilter = {
    from: 'A1',
    to: `H${payments.length + 1}`
  }
}

// Export Payments List to Excel
export const exportPaymentsListToExcel = async (payments, stats) => {
  const workbook = new ExcelJS.Workbook()

  workbook.creator = 'TradeSense'
  workbook.created = new Date()
  workbook.modified = new Date()

  // Create sheets
  createPaymentsOverviewSheet(workbook, stats, payments)
  createPaymentsListSheet(workbook, payments)

  // Generate and save file
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const filename = generateFileName('PaymentsList')
  saveAs(blob, filename)

  return filename
}

// ==========================================
// PAYOUTS MANAGEMENT PAGE EXPORTS
// ==========================================

// Create Payouts Overview Sheet
const createPayoutsOverviewSheet = (workbook, stats, payouts) => {
  const sheet = workbook.addWorksheet('Overview', {
    properties: { tabColor: { argb: 'FF8B5CF6' } }
  })

  // Title
  sheet.mergeCells('A1:D1')
  const titleCell = sheet.getCell('A1')
  titleCell.value = 'Payouts Management Report'
  titleCell.font = { size: 18, bold: true, color: { argb: '1F2937' } }
  titleCell.alignment = { horizontal: 'center' }
  sheet.getRow(1).height = 30

  // Subtitle
  sheet.mergeCells('A2:D2')
  const subtitleCell = sheet.getCell('A2')
  subtitleCell.value = `Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`
  subtitleCell.font = { size: 10, color: { argb: '6B7280' } }
  subtitleCell.alignment = { horizontal: 'center' }

  // Stats Section Title
  sheet.mergeCells('A4:D4')
  const statsTitleCell = sheet.getCell('A4')
  statsTitleCell.value = 'Payout Statistics'
  statsTitleCell.font = { size: 14, bold: true, color: { argb: '1F2937' } }

  // Stats grid
  const statsData = [
    ['Total Payouts', stats.total || 0, 'Pending Amount', `$${(stats.pendingAmount || 0).toLocaleString()}`],
    ['Pending', stats.pending || 0, 'Processing', stats.processing || 0],
    ['Completed', stats.completed || 0, 'Rejected', stats.rejected || 0]
  ]

  let rowIndex = 5
  statsData.forEach(row => {
    sheet.getRow(rowIndex).values = ['', row[0], row[1], row[2], row[3]]

    // Style label cells
    sheet.getCell(`B${rowIndex}`).font = { bold: true, color: { argb: '6B7280' } }
    sheet.getCell(`D${rowIndex}`).font = { bold: true, color: { argb: '6B7280' } }

    // Style value cells
    const valueCell1 = sheet.getCell(`C${rowIndex}`)
    const valueCell2 = sheet.getCell(`E${rowIndex}`)
    valueCell1.font = { bold: true, size: 12, color: { argb: '1F2937' } }
    valueCell2.font = { bold: true, size: 12, color: { argb: '1F2937' } }

    rowIndex++
  })

  // Status Breakdown Section
  rowIndex += 2
  sheet.getCell(`A${rowIndex}`).value = 'Status Breakdown'
  sheet.getCell(`A${rowIndex}`).font = { size: 14, bold: true, color: { argb: '1F2937' } }

  rowIndex++
  const statusHeaders = ['Status', 'Count', 'Percentage']
  sheet.getRow(rowIndex).values = ['', ...statusHeaders]
  statusHeaders.forEach((_, i) => {
    const cell = sheet.getCell(rowIndex, i + 2)
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.primary } }
    cell.font = { bold: true, color: { argb: COLORS.white } }
    cell.alignment = { horizontal: 'center' }
  })

  const total = stats.total || 1
  const statusData = [
    { status: 'Pending', count: stats.pending || 0, color: COLORS.warning },
    { status: 'Processing', count: stats.processing || 0, color: COLORS.info },
    { status: 'Completed', count: stats.completed || 0, color: COLORS.success },
    { status: 'Rejected', count: stats.rejected || 0, color: COLORS.danger }
  ]

  statusData.forEach(item => {
    rowIndex++
    const percentage = ((item.count / total) * 100).toFixed(1) + '%'
    sheet.getRow(rowIndex).values = ['', item.status, item.count, percentage]
    sheet.getCell(`B${rowIndex}`).font = { bold: true, color: { argb: item.color } }
    sheet.getCell(`C${rowIndex}`).alignment = { horizontal: 'center' }
    sheet.getCell(`D${rowIndex}`).alignment = { horizontal: 'center' }
  })

  // Method Breakdown Section
  rowIndex += 3
  sheet.getCell(`A${rowIndex}`).value = 'Payout Method Breakdown'
  sheet.getCell(`A${rowIndex}`).font = { size: 14, bold: true, color: { argb: '1F2937' } }

  rowIndex++
  sheet.getRow(rowIndex).values = ['', 'Method', 'Count', 'Percentage']
  for (let i = 2; i <= 4; i++) {
    const cell = sheet.getCell(rowIndex, i)
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.primary } }
    cell.font = { bold: true, color: { argb: COLORS.white } }
    cell.alignment = { horizontal: 'center' }
  }

  const methodCount = { bank_transfer: 0, crypto: 0, paypal: 0, wise: 0 }
  payouts.forEach(p => {
    const method = p.method?.toLowerCase()
    if (methodCount.hasOwnProperty(method)) methodCount[method]++
  })

  const payoutsTotal = payouts.length || 1
  const methodData = [
    { method: 'Bank Transfer', count: methodCount.bank_transfer },
    { method: 'Cryptocurrency', count: methodCount.crypto },
    { method: 'PayPal', count: methodCount.paypal },
    { method: 'Wise', count: methodCount.wise }
  ]

  methodData.forEach(item => {
    rowIndex++
    const percentage = ((item.count / payoutsTotal) * 100).toFixed(1) + '%'
    sheet.getRow(rowIndex).values = ['', item.method, item.count, percentage]
    sheet.getCell(`B${rowIndex}`).font = { bold: true }
    sheet.getCell(`C${rowIndex}`).alignment = { horizontal: 'center' }
    sheet.getCell(`D${rowIndex}`).alignment = { horizontal: 'center' }
  })

  // Set column widths
  sheet.getColumn(1).width = 5
  sheet.getColumn(2).width = 20
  sheet.getColumn(3).width = 20
  sheet.getColumn(4).width = 20
  sheet.getColumn(5).width = 20
}

// Create Payouts List Sheet
const createPayoutsListSheet = (workbook, payouts) => {
  const sheet = workbook.addWorksheet('Payouts', {
    properties: { tabColor: { argb: 'FF22C55E' } }
  })

  // Headers
  const headers = ['ID', 'Trader', 'Email', 'Challenge', 'Amount', 'Split %', 'Method', 'Status', 'Requested']
  sheet.getRow(1).values = headers

  // Style headers
  sheet.getRow(1).eachCell((cell, colNumber) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.primary } }
    cell.font = { bold: true, color: { argb: COLORS.white } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = {
      bottom: { style: 'thin', color: { argb: COLORS.gray300 } }
    }
  })
  sheet.getRow(1).height = 25

  // Column widths
  sheet.getColumn(1).width = 12
  sheet.getColumn(2).width = 18
  sheet.getColumn(3).width = 25
  sheet.getColumn(4).width = 20
  sheet.getColumn(5).width = 15
  sheet.getColumn(6).width = 10
  sheet.getColumn(7).width = 18
  sheet.getColumn(8).width = 14
  sheet.getColumn(9).width = 18

  // Data rows
  payouts.forEach((p, index) => {
    const row = sheet.getRow(index + 2)
    const date = p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'
    const method = p.method ? p.method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A'

    row.values = [
      p.id || 'N/A',
      p.user?.username || 'N/A',
      p.user?.email || 'N/A',
      p.challenge?.model || 'N/A',
      p.amount || 0,
      p.profit_split || 0,
      method,
      p.status?.charAt(0).toUpperCase() + p.status?.slice(1) || 'Pending',
      date
    ]

    const bgColor = index % 2 === 0 ? 'F8FAFC' : 'FFFFFF'
    row.eachCell((cell, colNumber) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
      cell.alignment = { horizontal: colNumber <= 4 ? 'left' : 'center' }
    })

    // Amount formatting
    row.getCell(5).numFmt = '$#,##0.00'
    row.getCell(5).font = { bold: true, color: { argb: '10B981' } }

    // Split formatting
    row.getCell(6).numFmt = '0"%"'

    // Status coloring
    const statusCell = row.getCell(8)
    const status = p.status?.toLowerCase()
    if (status === 'completed') statusCell.font = { bold: true, color: { argb: '10B981' } }
    else if (status === 'pending') statusCell.font = { bold: true, color: { argb: 'F59E0B' } }
    else if (status === 'processing') statusCell.font = { bold: true, color: { argb: '3B82F6' } }
    else if (status === 'rejected') statusCell.font = { bold: true, color: { argb: 'EF4444' } }
  })

  // Auto-filter
  sheet.autoFilter = {
    from: 'A1',
    to: `I${payouts.length + 1}`
  }
}

// Export Payouts Management to Excel
export const exportPayoutsManagementToExcel = async (payouts, stats) => {
  const workbook = new ExcelJS.Workbook()

  workbook.creator = 'TradeSense'
  workbook.created = new Date()
  workbook.modified = new Date()

  // Create sheets
  createPayoutsOverviewSheet(workbook, stats, payouts)
  createPayoutsListSheet(workbook, payouts)

  // Generate and save file
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const filename = generateFileName('PayoutsManagement')
  saveAs(blob, filename)

  return filename
}

export default {
  generateFileName,
  exportCohortAnalysisToExcel,
  exportFinancialOverviewToExcel,
  exportAdvancedAnalyticsToExcel,
  exportAnalyticsDashboardToExcel,
  exportAdminDashboardToExcel,
  exportUsersListToExcel,
  exportChallengesListToExcel,
  exportPaymentsListToExcel,
  exportPayoutsManagementToExcel
}
