import { writeFile, utils, type WorkBook, type WorkSheet } from 'xlsx'


interface ExportExcelOptions {
  data: any[]
  columns: string[]
  headers?: string[]
  title?: string
  filename: string
  summary?: Record<string, any>
  worksheet?: string
  styles?: {
    headerStyle?: Partial<CellStyle>
    bodyStyle?: Partial<CellStyle>
    summaryStyle?: Partial<CellStyle>
  }
}

interface CellStyle {
  font: {
    bold?: boolean
    color?: string
    size?: number
  }
  fill?: {
    backgroundColor?: string
  }
  alignment?: {
    horizontal?: 'left' | 'center' | 'right'
    vertical?: 'top' | 'middle' | 'bottom'
  }
  border?: {
    top?: string
    right?: string
    bottom?: string
    left?: string
  }
}

const formatNumber = (number: string | number): string => {
  return parseFloat(number.toString()).toFixed(2)
}

const ExportExcel = async (options: ExportExcelOptions): Promise<void> => {
  const {
    data,
    columns,
    headers,
    title,
    filename,
    summary,
    worksheet = 'Sheet1',
    styles = {}
  } = options


  // Create workbook and worksheet
  const wb: WorkBook = utils.book_new()

  // Convert headers to rows
  const headerRows: any[][] = []
  if (headers) {
    headerRows.push([{ v: title || filename, t: 's' }])
    headers.forEach((header) => {
      headerRows.push([{ v: header, t: 's' }])
    })
    // Add empty row after headers
    headerRows.push([])
  }

  // Convert columns to header row
  const columnRow = columns.map((col) => ({ v: col, t: 's' }))

  // Convert data to rows and format numbers
  const dataRows = data.map((item) =>
    columns.map((col) => ({
      v: typeof item[col] === 'number' ? formatNumber(item[col]) : item[col] || '',
      t: typeof item[col] === 'number' ? 'n' : 's'
    }))
  )

  // Add summary row if exists
  const summaryRow = summary
    ? columns.map((col) => ({
        v: summary[col] || '',
        t: 's',
        s: {
          font: { bold: true, color: { rgb: '1890FF' } },
          fill: { fgColor: { rgb: 'F0F7FF' } }
        }
      }))
    : null

  // Combine all rows
  const allRows = [...headerRows, columnRow, ...dataRows, ...(summaryRow ? [summaryRow] : [])]

  // Create worksheet
  const ws: WorkSheet = utils.aoa_to_sheet(allRows)

  // Set column widths
  const maxWidth = Math.max(...columns.map((col) => col.length))
  ws['!cols'] = columns.map(() => ({ wch: maxWidth + 5 }))

  // Apply styles
  const defaultStyles = {
    headerStyle: {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '#4c4c4c' } },
      alignment: { horizontal: 'center', vertical: 'center' }
    },
    bodyStyle: {
      alignment: { horizontal: 'center', vertical: 'center' }
    },
    summaryStyle: {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '#4c4c4c' } },
      alignment: { horizontal: 'center', vertical: 'center' }
    }
  }

  // Apply merged cells for headers
  if (headers) {
    ws['!merges'] = headerRows.map((_, idx) => ({
      s: { r: idx, c: 0 },
      e: { r: idx, c: columns.length - 1 }
    }))
  }

  // Apply styles to cells
  const range = utils.decode_range(ws['!ref'] || 'A1')
  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cell = ws[utils.encode_cell({ r: R, c: C })]
      if (!cell) continue

      if (R < headerRows.length) {
        // Header section style
        cell.s = { ...defaultStyles.headerStyle, ...styles.headerStyle }
      } else if (R === headerRows.length) {
        // Column headers style
        cell.s = { ...defaultStyles.headerStyle, ...styles.headerStyle }
      } else if (summaryRow && R === range.e.r) {
        // Summary row style
        cell.s = { ...defaultStyles.summaryStyle, ...styles.summaryStyle }
      } else {
        // Body style
        cell.s = { ...defaultStyles.bodyStyle, ...styles.bodyStyle }
      }
    }
  }

  // Add worksheet to workbook
  utils.book_append_sheet(wb, ws, worksheet)

  // Write file
  writeFile(wb, `${filename}.xlsx`)
}

export default ExportExcel
