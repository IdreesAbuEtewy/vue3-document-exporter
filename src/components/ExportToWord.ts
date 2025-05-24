import {
    Document,
    Packer,
    Paragraph,
    Table,
    TableRow,
    TableCell,
    HeadingLevel,
    AlignmentType,
    BorderStyle
  } from 'docx'
  import { saveAs } from 'file-saver'
  
  interface ExportWordOptions {
    data: any[]
    columns: string[]
    headers?: string[]
    title?: string
    filename: string
    summary?: Record<string, any>
    logoText?: string
    styles?: {
      headerStyle?: Partial<WordStyle>
      bodyStyle?: Partial<WordStyle>
      summaryStyle?: Partial<WordStyle>
    }
  }
  
  interface WordStyle {
    fontSize?: number
    bold?: boolean
    color?: string
    alignment?: typeof AlignmentType[keyof typeof AlignmentType]
    backgroundColor?: string
  }
  
  const ExportWord = async (options: ExportWordOptions): Promise<void> => {
    const { data, columns, headers, title, filename, summary, logoText, styles = {} } = options
  
    const defaultStyles = {
      headerStyle: {
        fontSize: 24,
        bold: true,
        color: '333333',
        alignment: AlignmentType.CENTER
      },
      bodyStyle: {
        fontSize: 11,
        alignment: AlignmentType.CENTER
      },
      summaryStyle: {
        fontSize: 11,
        bold: true,
        color: '1890FF',
        backgroundColor: 'F0F7FF',
        alignment: AlignmentType.CENTER
      }
    }
  
    // Create document sections
    const sections = []
  
    // Add title if provided
    if (title) {
      sections.push(
        new Paragraph({
          text: title,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { before: 300, after: 300 }
        })
      )
    }
  
    // Add logo text if provided
    if (logoText) {
      sections.push(
        new Paragraph({
          text: logoText,
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 }
        })
      )
    }
  
    // Add headers if provided
    if (headers) {
      headers.forEach((header) => {
        sections.push(
          new Paragraph({
            text: header,
            alignment: AlignmentType.LEFT,
            spacing: { before: 100, after: 100 }
          })
        )
      })
    }
  
    // Create table rows
    const tableRows: TableRow[] = []
  
    // Add column headers
    tableRows.push(
      new TableRow({
        children: columns.map(
          (col) =>
            new TableCell({
              children: [
                new Paragraph({
                  text: col,
                  ...defaultStyles.headerStyle,
                  ...styles.headerStyle
                })
              ],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
                left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
                right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' }
              }
            })
        )
      })
    )
  
    // Add data rows
    data.forEach((item) => {
      tableRows.push(
        new TableRow({
          children: columns.map(
            (col) =>
              new TableCell({
                children: [
                  new Paragraph({
                    text: item[col]?.toString() || '',
                    ...defaultStyles.bodyStyle,
                    ...styles.bodyStyle
                  })
                ],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
                  bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
                  left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
                  right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' }
                }
              })
          )
        })
      )
    })
  
    // Add summary row if exists
    if (summary) {
      tableRows.push(
        new TableRow({
          children: columns.map(
            (col) =>
              new TableCell({
                children: [
                  new Paragraph({
                    text: summary[col]?.toString() || '',
                    ...defaultStyles.summaryStyle,
                    ...styles.summaryStyle
                  })
                ],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 2, color: '1890FF' },
                  bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
                  left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
                  right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' }
                }
              })
          )
        })
      )
    }
  
    // Add table to sections
    sections.push(
      new Table({
        rows: tableRows,
        width: {
          size: 100,
          type: 'pct'
        }
      })
    )
  
    // Create document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: sections
        }
      ]
    })
  
    // Generate and save document
    const buffer = await Packer.toBlob(doc)
    saveAs(buffer, `${filename}.docx`)
  }
  
  export default ExportWord
  