// Excel Styling Constants for TradeSense Reports

export const EXCEL_COLORS = {
  primary: 'FF6366F1',       // Indigo
  primaryLight: 'FFEEF2FF',  // Light indigo
  success: 'FF22C55E',       // Green
  successLight: 'FFDCFCE7',  // Light green
  warning: 'FFF59E0B',       // Amber
  warningLight: 'FFFEF3C7',  // Light amber
  danger: 'FFEF4444',        // Red
  dangerLight: 'FFFEE2E2',   // Light red
  info: 'FF3B82F6',          // Blue
  infoLight: 'FFDBEAFE',     // Light blue
  purple: 'FFA855F7',        // Purple
  purpleLight: 'FFF3E8FF',   // Light purple

  // Neutral
  white: 'FFFFFFFF',
  black: 'FF000000',
  gray50: 'FFF9FAFB',
  gray100: 'FFF3F4F6',
  gray200: 'FFE5E7EB',
  gray300: 'FFD1D5DB',
  gray400: 'FF9CA3AF',
  gray500: 'FF6B7280',
  gray600: 'FF4B5563',
  gray700: 'FF374151',
  gray800: 'FF1F2937',
  gray900: 'FF111827',
}

// Cell styles
export const EXCEL_STYLES = {
  // Header styles
  header: {
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: EXCEL_COLORS.primary },
    },
    font: {
      bold: true,
      color: { argb: EXCEL_COLORS.white },
      size: 11,
    },
    alignment: {
      horizontal: 'center',
      vertical: 'middle',
    },
    border: {
      top: { style: 'thin', color: { argb: EXCEL_COLORS.gray300 } },
      bottom: { style: 'thin', color: { argb: EXCEL_COLORS.gray300 } },
      left: { style: 'thin', color: { argb: EXCEL_COLORS.gray300 } },
      right: { style: 'thin', color: { argb: EXCEL_COLORS.gray300 } },
    },
  },

  // Title styles
  title: {
    font: {
      bold: true,
      size: 18,
      color: { argb: EXCEL_COLORS.gray800 },
    },
    alignment: {
      horizontal: 'left',
      vertical: 'middle',
    },
  },

  // Subtitle styles
  subtitle: {
    font: {
      size: 12,
      color: { argb: EXCEL_COLORS.gray500 },
    },
    alignment: {
      horizontal: 'left',
      vertical: 'middle',
    },
  },

  // Section header
  sectionHeader: {
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: EXCEL_COLORS.gray100 },
    },
    font: {
      bold: true,
      size: 12,
      color: { argb: EXCEL_COLORS.gray800 },
    },
    alignment: {
      horizontal: 'left',
      vertical: 'middle',
    },
  },

  // Body cell
  body: {
    font: {
      size: 10,
      color: { argb: EXCEL_COLORS.gray700 },
    },
    alignment: {
      horizontal: 'left',
      vertical: 'middle',
    },
    border: {
      top: { style: 'thin', color: { argb: EXCEL_COLORS.gray200 } },
      bottom: { style: 'thin', color: { argb: EXCEL_COLORS.gray200 } },
      left: { style: 'thin', color: { argb: EXCEL_COLORS.gray200 } },
      right: { style: 'thin', color: { argb: EXCEL_COLORS.gray200 } },
    },
  },

  // Centered body cell
  bodyCenter: {
    font: {
      size: 10,
      color: { argb: EXCEL_COLORS.gray700 },
    },
    alignment: {
      horizontal: 'center',
      vertical: 'middle',
    },
    border: {
      top: { style: 'thin', color: { argb: EXCEL_COLORS.gray200 } },
      bottom: { style: 'thin', color: { argb: EXCEL_COLORS.gray200 } },
      left: { style: 'thin', color: { argb: EXCEL_COLORS.gray200 } },
      right: { style: 'thin', color: { argb: EXCEL_COLORS.gray200 } },
    },
  },

  // Number cell
  number: {
    font: {
      size: 10,
      color: { argb: EXCEL_COLORS.gray700 },
    },
    alignment: {
      horizontal: 'right',
      vertical: 'middle',
    },
    border: {
      top: { style: 'thin', color: { argb: EXCEL_COLORS.gray200 } },
      bottom: { style: 'thin', color: { argb: EXCEL_COLORS.gray200 } },
      left: { style: 'thin', color: { argb: EXCEL_COLORS.gray200 } },
      right: { style: 'thin', color: { argb: EXCEL_COLORS.gray200 } },
    },
  },

  // Currency cell
  currency: {
    font: {
      size: 10,
      color: { argb: EXCEL_COLORS.gray700 },
    },
    alignment: {
      horizontal: 'right',
      vertical: 'middle',
    },
    numFmt: '$#,##0.00',
    border: {
      top: { style: 'thin', color: { argb: EXCEL_COLORS.gray200 } },
      bottom: { style: 'thin', color: { argb: EXCEL_COLORS.gray200 } },
      left: { style: 'thin', color: { argb: EXCEL_COLORS.gray200 } },
      right: { style: 'thin', color: { argb: EXCEL_COLORS.gray200 } },
    },
  },

  // Percentage cell
  percentage: {
    font: {
      size: 10,
      color: { argb: EXCEL_COLORS.gray700 },
    },
    alignment: {
      horizontal: 'center',
      vertical: 'middle',
    },
    numFmt: '0.0%',
    border: {
      top: { style: 'thin', color: { argb: EXCEL_COLORS.gray200 } },
      bottom: { style: 'thin', color: { argb: EXCEL_COLORS.gray200 } },
      left: { style: 'thin', color: { argb: EXCEL_COLORS.gray200 } },
      right: { style: 'thin', color: { argb: EXCEL_COLORS.gray200 } },
    },
  },
}

// Get retention cell style based on value
export const getRetentionCellStyle = (value) => {
  let bgColor = EXCEL_COLORS.gray100
  let textColor = EXCEL_COLORS.gray600

  if (value === null || value === undefined) {
    bgColor = EXCEL_COLORS.gray100
    textColor = EXCEL_COLORS.gray400
  } else if (value >= 60) {
    bgColor = EXCEL_COLORS.successLight
    textColor = EXCEL_COLORS.success
  } else if (value >= 40) {
    bgColor = EXCEL_COLORS.infoLight
    textColor = EXCEL_COLORS.info
  } else if (value >= 25) {
    bgColor = EXCEL_COLORS.warningLight
    textColor = EXCEL_COLORS.warning
  } else {
    bgColor = EXCEL_COLORS.dangerLight
    textColor = EXCEL_COLORS.danger
  }

  return {
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: bgColor },
    },
    font: {
      bold: true,
      size: 10,
      color: { argb: textColor },
    },
    alignment: {
      horizontal: 'center',
      vertical: 'middle',
    },
    border: {
      top: { style: 'thin', color: { argb: EXCEL_COLORS.gray200 } },
      bottom: { style: 'thin', color: { argb: EXCEL_COLORS.gray200 } },
      left: { style: 'thin', color: { argb: EXCEL_COLORS.gray200 } },
      right: { style: 'thin', color: { argb: EXCEL_COLORS.gray200 } },
    },
  }
}

// Get trend cell style (positive/negative)
export const getTrendCellStyle = (value) => {
  const isPositive = value >= 0

  return {
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: isPositive ? EXCEL_COLORS.successLight : EXCEL_COLORS.dangerLight },
    },
    font: {
      bold: true,
      size: 10,
      color: { argb: isPositive ? EXCEL_COLORS.success : EXCEL_COLORS.danger },
    },
    alignment: {
      horizontal: 'center',
      vertical: 'middle',
    },
    border: {
      top: { style: 'thin', color: { argb: EXCEL_COLORS.gray200 } },
      bottom: { style: 'thin', color: { argb: EXCEL_COLORS.gray200 } },
      left: { style: 'thin', color: { argb: EXCEL_COLORS.gray200 } },
      right: { style: 'thin', color: { argb: EXCEL_COLORS.gray200 } },
    },
  }
}

// Column width presets
export const COLUMN_WIDTHS = {
  narrow: 8,
  date: 12,
  default: 15,
  medium: 20,
  wide: 25,
  extraWide: 35,
}
