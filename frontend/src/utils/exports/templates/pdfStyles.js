// PDF Styling Constants for TradeSense Reports

export const PDF_COLORS = {
  primary: [99, 102, 241],      // #6366f1 - Indigo
  primaryDark: [79, 70, 229],   // #4f46e5
  success: [34, 197, 94],       // #22c55e - Green
  warning: [245, 158, 11],      // #f59e0b - Amber
  danger: [239, 68, 68],        // #ef4444 - Red
  info: [59, 130, 246],         // #3b82f6 - Blue
  purple: [168, 85, 247],       // #a855f7 - Purple

  // Dark theme colors
  darkBg: [26, 26, 46],         // #1a1a2e
  darkCard: [30, 30, 50],       // #1e1e32
  darkBorder: [45, 45, 75],     // #2d2d4b

  // Text colors
  textWhite: [255, 255, 255],
  textGray: [156, 163, 175],    // #9ca3af
  textDark: [31, 41, 55],       // #1f2937

  // Table colors
  tableHeader: [99, 102, 241],
  tableRowEven: [248, 250, 252], // #f8fafc
  tableRowOdd: [255, 255, 255],
  tableBorder: [229, 231, 235],  // #e5e7eb
}

export const PDF_FONTS = {
  title: { size: 24, style: 'bold' },
  subtitle: { size: 14, style: 'normal' },
  sectionTitle: { size: 16, style: 'bold' },
  body: { size: 10, style: 'normal' },
  small: { size: 8, style: 'normal' },
  tableHeader: { size: 9, style: 'bold' },
  tableBody: { size: 9, style: 'normal' },
}

export const PDF_MARGINS = {
  top: 40,
  right: 40,
  bottom: 40,
  left: 40,
}

export const PDF_LAYOUT = {
  pageWidth: 595.28,  // A4 width in points
  pageHeight: 841.89, // A4 height in points
  contentWidth: 515.28, // pageWidth - margins
  headerHeight: 60,
  footerHeight: 30,
}

// Table styles for jspdf-autotable
export const getTableStyles = (variant = 'default') => {
  const styles = {
    default: {
      headStyles: {
        fillColor: PDF_COLORS.primary,
        textColor: PDF_COLORS.textWhite,
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'left',
        cellPadding: 6,
      },
      bodyStyles: {
        textColor: PDF_COLORS.textDark,
        fontSize: 9,
        cellPadding: 5,
      },
      alternateRowStyles: {
        fillColor: PDF_COLORS.tableRowEven,
      },
      styles: {
        lineColor: PDF_COLORS.tableBorder,
        lineWidth: 0.1,
      },
    },
    compact: {
      headStyles: {
        fillColor: PDF_COLORS.primary,
        textColor: PDF_COLORS.textWhite,
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'left',
        cellPadding: 4,
      },
      bodyStyles: {
        textColor: PDF_COLORS.textDark,
        fontSize: 8,
        cellPadding: 3,
      },
      alternateRowStyles: {
        fillColor: PDF_COLORS.tableRowEven,
      },
      styles: {
        lineColor: PDF_COLORS.tableBorder,
        lineWidth: 0.1,
      },
    },
    colorCoded: {
      headStyles: {
        fillColor: PDF_COLORS.primary,
        textColor: PDF_COLORS.textWhite,
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center',
        cellPadding: 5,
      },
      bodyStyles: {
        textColor: PDF_COLORS.textDark,
        fontSize: 9,
        cellPadding: 4,
        halign: 'center',
      },
      styles: {
        lineColor: PDF_COLORS.tableBorder,
        lineWidth: 0.1,
      },
    },
  }

  return styles[variant] || styles.default
}

// Get retention color based on value
export const getRetentionPdfColor = (value) => {
  if (value === null || value === undefined) return [200, 200, 200]
  if (value >= 60) return [34, 197, 94]   // Green
  if (value >= 40) return [59, 130, 246]  // Blue
  if (value >= 25) return [245, 158, 11]  // Yellow/Amber
  return [239, 68, 68]                     // Red
}

// Get retention background color (lighter version)
export const getRetentionBgColor = (value) => {
  if (value === null || value === undefined) return [240, 240, 240]
  if (value >= 60) return [220, 252, 231]  // Light green
  if (value >= 40) return [219, 234, 254]  // Light blue
  if (value >= 25) return [254, 243, 199]  // Light yellow
  return [254, 226, 226]                    // Light red
}
