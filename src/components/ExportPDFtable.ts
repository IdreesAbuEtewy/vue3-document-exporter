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
}


const ExportPDFTable = async (
  filename: string,
  content: Content | Content[], // Accept both single content and array
  attributes?: Attribute
): Promise<void> => {
  const pdfDocument = new jsPDF()
  const logoHeight = attributes?.logoHeight || 30
  const logoWidth = attributes?.logoWidth || 30
  let currentY = 20
  const headerLineHeight = 5
  const titleOffsetY = 2
  const pageNumberOffsetY = 10
  const tableSpacing = 15

  // Normalize to array
  const contents = Array.isArray(content) ? content : [content]

  // Handle logo only once (use first content's logo if available)
  const firstContent = contents[0]
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

    // Format numeric values in the data
    const rows = content.data?.map((item) => {
      return content.columns.map((columnTitle) => {
        const value = item[columnTitle]
        const isNumber = typeof value === 'number' || !isNaN(parseFloat(value))
        const hasDecimal = isNumber && !Number.isInteger(parseFloat(value))
        return hasDecimal ? formatNumber(value) : value || ''
      })
    })

    // Add summary row if exists
    if (content.summary) {
      const summaryRow = content.columns.map((columnTitle) => {
        const value = content.summary?.[columnTitle]
        const isNumber = typeof value === 'number' || !isNaN(parseFloat(value))
        const hasDecimal = isNumber && !Number.isInteger(parseFloat(value))
        return hasDecimal ? formatNumber(value) : value || ''
      })
      rows.push(summaryRow)
    }

    // Add the table
    pdfDocument.autoTable({
      head: [content.columns],
      body: rows,
      startY: currentY,
      columnWidth: 'wrap',
      pageBreak: 'auto',
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
        if (content.summary && data.row.index === rows.length - 1) {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.textColor = [24, 144, 255] // Primary color
        }
      }
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
