import jsPDF from 'jspdf'
import 'jspdf-autotable'

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export const formatNumber = (number: string | number): string => {
  const num = parseFloat(number.toString())
  return num % 1 === 0 ? num.toString() : num.toFixed(2)
}

// Helper function to format cell content with proper text handling
export const formatCellContent = (
  value: any,
  maxLength: number = 0 // Set to 0 to disable truncation by default
): string => {
  if (value === null || value === undefined) return ''

  const stringValue = String(value).trim()

  // Handle empty strings
  if (!stringValue) return ''

  // Handle date formatting - ensure year is included
  if (stringValue.match(/^\d{2}\.\d{2}$/)) {
    // If it's DD.MM format, add current year
    const currentYear = new Date().getFullYear()
    return `${stringValue}.${currentYear}`
  }

  // Handle date format DD.MM.YYYY or similar
  if (stringValue.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
    return stringValue // Already has year
  }

  // Handle numeric values
  const isNumber = typeof value === 'number' || !isNaN(parseFloat(stringValue))
  if (isNumber && !Number.isInteger(parseFloat(stringValue))) {
    return formatNumber(value)
  }

  // Only truncate if maxLength is explicitly set and greater than 0
  if (maxLength > 0 && stringValue.length > maxLength) {
    // Try to break at word boundaries
    const truncated = stringValue.substring(0, maxLength)
    const lastSpaceIndex = truncated.lastIndexOf(' ')

    if (lastSpaceIndex > maxLength * 0.8) {
      // Only break at word if it's reasonably close to the end
      return truncated.substring(0, lastSpaceIndex) + '...'
    }
    return truncated + '...'
  }

  return stringValue
}

// Helper function to detect content type for better column styling
export const detectContentType = (
  values: any[]
): 'numeric' | 'date' | 'text' | 'mixed' => {
  if (!values || values.length === 0) return 'text'

  let numericCount = 0
  let dateCount = 0
  let textCount = 0

  values.forEach((value) => {
    if (value === null || value === undefined || String(value).trim() === '')
      return

    const stringValue = String(value).trim()

    // Check if numeric
    if (!isNaN(parseFloat(stringValue)) && isFinite(parseFloat(stringValue))) {
      numericCount++
    }
    // Check if date-like
    else if (
      Date.parse(stringValue) &&
      stringValue.match(
        /\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{2}\.\d{2}\.\d{4}/
      )
    ) {
      dateCount++
    }
    // Otherwise it's text
    else {
      textCount++
    }
  })

  const total = numericCount + dateCount + textCount
  if (total === 0) return 'text'

  if (numericCount / total > 0.8) return 'numeric'
  if (dateCount / total > 0.8) return 'date'
  if (textCount / total > 0.8) return 'text'

  return 'mixed'
}

interface Content {
  data: any[]
  columns: string[]
  logo?: string
  logoText?: string
  headers?: string[]
  title?: string
  summary?: Record<string, any>
}

interface Attribute {
  width?: number
  style?: string
  font?: string
  fontSize?: number
  color?: string
  uppercaseTitle?: boolean
  language?: 'en' | 'de' | 'fr' | 'es' | 'pt' | 'it' | 'ru' | 'ja' | 'ko' | 'zh' | 'ar'
  themes?: 'grid' | 'striped' | 'plain' | 'first' | 'last'
  logoHeight?: number
  logoWidth?: number
  horizontalPadding?: number
}

const ExportPDFTable = async (
  filename: string,
  content: Content | Content[], 
  attributes?: Attribute
): Promise<void> => {
  // Normalize to array
  const contents = Array.isArray(content) ? content : [content]
  const firstContent = contents[0]

  // Check if we need landscape orientation based on column count
  const shouldUseLandscape = firstContent.columns.length > 6

  const pdfDocument = new jsPDF({
    orientation: shouldUseLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const logoHeight = attributes?.logoHeight || 15
  const logoWidth = attributes?.logoWidth || 15
  let currentY = 20
  const headerLineHeight = 5
  const titleOffsetY = 2
  const pageNumberOffsetY = 10
  const tableSpacing = 15

  // Handle logo only once (use first content's logo if available)
  if (firstContent.logo) {
    const base64Image = await convertToBase64(firstContent.logo)
    const logoX = (pdfDocument.internal.pageSize.width - logoWidth) / 2
    pdfDocument.addImage(base64Image, 'JPEG', logoX, currentY, logoWidth, logoHeight)

    if (firstContent.logoText) {
      pdfDocument.setFontSize(14)
      pdfDocument.setFont(attributes?.font || 'Helvetica', 'bold')
      const textWidth = pdfDocument.getTextWidth(firstContent.logoText)
      const textX = (pdfDocument.internal.pageSize.width - textWidth) / 2
      pdfDocument.text(firstContent.logoText, textX, currentY + logoHeight + 5)
    }
    currentY += logoHeight + (firstContent.logoText ? 20 : 10)
  }

  // Set document-wide settings
  if (attributes?.language) {
    pdfDocument.setLanguage(attributes.language)
  }
  pdfDocument.setFontSize(attributes?.fontSize || 12)
  pdfDocument.setFont(attributes?.font || 'Helvetica')
  pdfDocument.setTextColor(attributes?.color || '#000000')

  // Process each content item
  for (let i = 0; i < contents.length; i++) {
    const content = contents[i]

    // Add headers if they exist
    pdfDocument.setFontSize(10)
    content.headers?.forEach((header: any) => {
      if (header.type === 'boxed-header') {
        // Calculate total width needed
        const textWidth = header.content.reduce((total: number, text: string) => {
          return total + pdfDocument.getTextWidth(text) + 20 // Add padding
        }, 0)

        // Draw box background
        pdfDocument.setFillColor(240, 240, 240)
        pdfDocument.rect(15, currentY, textWidth + 20, 15, 'F')

        // Draw box border
        pdfDocument.setDrawColor(217, 217, 217)
        pdfDocument.rect(15, currentY, textWidth + 20, 15)

        // Draw text elements
        let xPos = 20
        header.content.forEach((text: string, index: number) => {
          pdfDocument.text(text, xPos, currentY + 10)
          xPos += pdfDocument.getTextWidth(text) + 25

          // Add separator if not last element
          if (index < header.content.length - 1) {
            pdfDocument.setDrawColor(200, 200, 200)
            pdfDocument.line(xPos - 10, currentY + 2, xPos - 10, currentY + 13)
          }
        })

        currentY += 20
      } else {
        // Default header behavior (for backward compatibility)
        pdfDocument.text(header, 15, currentY)
        currentY += headerLineHeight
      }
    })

    const numberOfHeaders = content.headers?.length || 0
    currentY += numberOfHeaders * headerLineHeight + 5

    // Add title if it exists
    if (content.title) {
      pdfDocument.setFont(attributes?.font || 'Helvetica', 'bold')
      pdfDocument.setFontSize(14)
      pdfDocument.text(
        attributes?.uppercaseTitle ? content.title.toUpperCase() : content.title,
        15,
        currentY - titleOffsetY
      )
      currentY += 10
    }

    // Format all cell content using the helper function
    const rows = content.data?.map((item) => {
      return content.columns.map((columnTitle) => {
        const value = item[columnTitle]
        // Use formatCellContent without truncation to show full text
        return formatCellContent(value) // No length limit - show full text
      })
    }) || []

    // Add summary row if exists
    if (content.summary) {
      const summaryRow = content.columns.map((columnTitle) => {
        const value = content.summary?.[columnTitle]
        // Use formatCellContent for summary row without truncation
        return formatCellContent(value) // No length limit - show full text
      })
      rows.push(summaryRow)
    }

    // Calculate optimal column widths based on content
    const calculateColumnWidths = () => {
      const pageWidth = pdfDocument.internal.pageSize.width
      // Match the actual autoTable margins: left 5 + right 5 = 10 total
      const tableMargins = 10 
      const availableWidth = pageWidth - tableMargins

      // Calculate content-based widths first
      const columnWidths: { [key: string]: number } = {}
      const minWidth = 15 // Slightly increased minimum width for better readability

      content.columns.forEach((column, index) => {
        // Calculate width based on header text
        pdfDocument.setFontSize(attributes?.fontSize || 8)
        let maxContentWidth = pdfDocument.getTextWidth(column) + 10

        // Analyze content to determine optimal width
        let hasLongText = false
        let isNumericColumn = true
        let maxNumericWidth = 0

        if (rows && rows.length > 0) {
          rows.forEach((row) => {
            if (row[index]) {
              const cellText = String(row[index])
              const isNumeric =
                !isNaN(parseFloat(cellText)) && isFinite(parseFloat(cellText))

              if (!isNumeric) {
                isNumericColumn = false
              }

              if (cellText.length > 15) {
                hasLongText = true
              }

              if (isNumeric) {
                maxNumericWidth = Math.max(
                  maxNumericWidth,
                  pdfDocument.getTextWidth(cellText) + 8
                )
              } else {
                // For text content, calculate based on reasonable display length
                const displayText =
                  cellText.length > 25
                    ? cellText.substring(0, 25) + '...'
                    : cellText
                const textWidth = pdfDocument.getTextWidth(displayText) + 8
                maxContentWidth = Math.max(maxContentWidth, textWidth)
              }
            }
          })
        }

        // Set initial column width based on content type
        if (isNumericColumn && maxNumericWidth > 0) {
          columnWidths[column] = Math.max(maxNumericWidth, minWidth)
        } else if (hasLongText) {
          columnWidths[column] = Math.max(maxContentWidth, minWidth * 1.8)
        } else {
          columnWidths[column] = Math.max(maxContentWidth, minWidth)
        }
      })

      // Force table to fill the EXACT available width
      const currentTotal = Object.values(columnWidths).reduce(
        (sum, width) => sum + width,
        0
      )
      const scaleFactor = availableWidth / currentTotal

      // Apply scaling to all columns
      Object.keys(columnWidths).forEach((key) => {
        columnWidths[key] = columnWidths[key] * scaleFactor
      })

      // Final verification and micro-adjustment to ensure exact fit
      const finalTotal = Object.values(columnWidths).reduce(
        (sum, width) => sum + width,
        0
      )
      const finalDifference = availableWidth - finalTotal

      if (Math.abs(finalDifference) > 0.1) {
        // Distribute any remaining difference to the last column
        const lastColumn = content.columns[content.columns.length - 1]
        columnWidths[lastColumn] += finalDifference
      }

      return columnWidths
    }

    const columnWidths = calculateColumnWidths()

    // Add the table
    pdfDocument.autoTable({
      head: [content.columns],
      body: rows,
      startY: currentY,
      margin: {
        left: 5,
        right: 5,
      },
      tableWidth: 'wrap', 
      columnStyles: content.columns.reduce((styles: any, column, index) => {
        styles[index] = {
          cellWidth: columnWidths[column],
          overflow: 'linebreak',
          cellPadding: { top: 2, right: 2, bottom: 2, left: 2 },
          fontSize: attributes?.fontSize || 8, 
          textAlign: 'left',
          lineColor: [217, 217, 217],
          lineWidth: 0.1,
        }
        return styles
      }, {}),
      headStyles: {
        fillColor: [248, 249, 250],
        textColor: [52, 58, 64],
        fontStyle: 'bold',
        fontSize: (attributes?.fontSize || 8) + 1, 
        textAlign: 'center',
        cellPadding: { top: 3, right: 2, bottom: 3, left: 2 }, 
        overflow: 'linebreak',
        lineColor: [217, 217, 217],
        lineWidth: 0.2,
      },
      bodyStyles: {
        fontSize: attributes?.fontSize || 8, 
        textColor: [52, 58, 64],
        cellPadding: { top: 2, right: 2, bottom: 2, left: 2 }, 
        overflow: 'linebreak',
        lineColor: [233, 236, 239],
        lineWidth: 0.1,
        minCellHeight: 6,
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250],
      },
      tableLineColor: [217, 217, 217],
      tableLineWidth: 0.2,
      theme: attributes?.themes || 'grid',
      pageBreak: 'auto',
      showHead: 'everyPage',
      didDrawPage: (data: { pageNumber: number }) => {
        const pageHeight = pdfDocument.internal.pageSize.height
        const pageWidth = pdfDocument.internal.pageSize.width
        const totalPages = pdfDocument.internal.pages.length

        pdfDocument.setFontSize(10)
        pdfDocument.text(
          `Page ${data.pageNumber} of ${totalPages - 1}`,
          pageWidth - 20,
          pageHeight - pageNumberOffsetY,
          { align: 'right' }
        )
      },
      didParseCell: function (data: any) {
        // Style summary row if it exists
        if (content.summary && data.row.index === rows.length - 1) {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.textColor = [24, 144, 255] // Primary color
          data.cell.styles.fillColor = [240, 248, 255]
          data.cell.styles.fontSize = (attributes?.fontSize || 8) + 1
        }

        // Handle content based on column type
        if (data.cell.text && data.cell.text.length > 0) {
          const cellText = Array.isArray(data.cell.text)
            ? data.cell.text.join(' ')
            : String(data.cell.text)
          const columnIndex = data.column.index

          // Get column values for content type detection (excluding summary row)
          const columnValues = rows
            .slice(0, content.summary ? -1 : rows.length) // Exclude summary row from detection
            .map((row) => row[columnIndex])
            .filter((val) => val !== null && val !== undefined && val !== '')
          const contentType = detectContentType(columnValues)

          // Apply alignment based on content type
          switch (contentType) {
            case 'numeric':
              data.cell.styles.textAlign = 'right'
              data.cell.styles.cellPadding = {
                top: 3,
                right: 5,
                bottom: 3,
                left: 3,
              }
              break
            case 'date':
              data.cell.styles.textAlign = 'center'
              break
            case 'text':
              data.cell.styles.textAlign = 'left'
              // For long text, enable proper wrapping
              if (cellText.length > 30) {
                data.cell.styles.overflow = 'linebreak'
                data.cell.styles.cellPadding = {
                  top: 4,
                  right: 3,
                  bottom: 4,
                  left: 3,
                }
                data.cell.styles.minCellHeight = Math.max(
                  12,
                  Math.ceil(cellText.length / 25) * 6
                )
              }
              break
            case 'mixed':
              data.cell.styles.textAlign = 'left'
              break
          }

          // Handle very long text content with proper word wrapping
          if (cellText.length > 60) {
            data.cell.styles.overflow = 'linebreak'
            data.cell.styles.cellPadding = {
              top: 5,
              right: 4,
              bottom: 5,
              left: 4,
            }

            // Estimate required cell height based on text length and column width
            const estimatedLines = Math.ceil(cellText.length / 40) // Rough estimate
            data.cell.styles.minCellHeight = Math.max(
              15,
              estimatedLines * 6 + 8
            )
          }

          // Ensure proper text display for wrapped content
          if (Array.isArray(data.cell.text) && data.cell.text.length > 1) {
            data.cell.styles.valign = 'top'
            data.cell.styles.cellPadding = {
              top: 4,
              right: 3,
              bottom: 4,
              left: 3,
            }
          }
        }
      },
      willDrawCell: function (data: any) {
        // Add extra spacing for cells with wrapped text
        if (
          data.cell.text &&
          Array.isArray(data.cell.text) &&
          data.cell.text.length > 1
        ) {
          data.cell.height = Math.max(
            data.cell.height,
            data.cell.text.length * 5 + 6
          )
        }
      },
    })

    // Update currentY position to after the table
    const lastAutoTable = (pdfDocument as any).lastAutoTable
    currentY = lastAutoTable.finalY + tableSpacing

    // Add divider between tables (except after last table)
    if (i < contents.length - 1) {
      pdfDocument.setDrawColor(200, 200, 200) // Light gray divider
      pdfDocument.line(
        15,
        currentY - tableSpacing / 2,
        pdfDocument.internal.pageSize.width - 15,
        currentY - tableSpacing / 2
      )
    }
  }

  pdfDocument.save(`${filename}.pdf`)
}

const convertToBase64 = async (imagePath: string): Promise<string> => {
  try {
    const response = await fetch(imagePath)
    const blob = await response.blob()

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result)
        } else {
          reject(new Error('Failed to convert image to base64'))
        }
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Error converting image to base64:', error)
    alert('Error converting image. Please check the path and try again.')
    throw error
  }
}

export default ExportPDFTable