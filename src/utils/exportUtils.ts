/**
 * Export Utilities
 * Helper functions for exporting data to various formats
 */

export interface ExportData {
  headers: string[]
  rows: Array<string[] | Record<string, any>>
  filename: string
}

/**
 * Export data to CSV
 */
export const exportToCSV = (data: ExportData): void => {
  const { headers, rows, filename } = data

  // Convert rows to CSV format
  const csvContent = [
    headers.join(','),
    ...rows.map(row => {
      if (Array.isArray(row)) {
        return row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      } else {
        return headers.map(header => `"${String(row[header] || '').replace(/"/g, '""')}"`).join(',')
      }
    })
  ].join('\n')

  downloadFile(csvContent, `${filename}.csv`, 'text/csv')
}

/**
 * Export data to JSON
 */
export const exportToJSON = (data: ExportData): void => {
  const { headers, rows, filename } = data

  // Convert rows to array of objects
  const jsonData = rows.map(row => {
    if (Array.isArray(row)) {
      const obj: Record<string, any> = {}
      headers.forEach((header, index) => {
        obj[header] = row[index]
      })
      return obj
    }
    return row
  })

  const jsonContent = JSON.stringify(jsonData, null, 2)
  downloadFile(jsonContent, `${filename}.json`, 'application/json')
}

/**
 * Export data to Excel (simple HTML table format)
 */
export const exportToExcel = (data: ExportData): void => {
  const { headers, rows, filename } = data

  // Create HTML table
  let table = '<table>'
  
  // Headers
  table += '<thead><tr>'
  headers.forEach(header => {
    table += `<th>${header}</th>`
  })
  table += '</tr></thead>'
  
  // Body
  table += '<tbody>'
  rows.forEach(row => {
    table += '<tr>'
    if (Array.isArray(row)) {
      row.forEach(cell => {
        table += `<td>${cell}</td>`
      })
    } else {
      headers.forEach(header => {
        table += `<td>${row[header] || ''}</td>`
      })
    }
    table += '</tr>'
  })
  table += '</tbody></table>'

  downloadFile(table, `${filename}.xls`, 'application/vnd.ms-excel')
}

/**
 * Download file helper
 */
const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Format date for export
 */
export const formatDateForExport = (date: string | Date): string => {
  return new Date(date).toLocaleString('en-IN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

/**
 * Format currency for export
 */
export const formatCurrencyForExport = (amount: number): string => {
  return `₹${amount.toFixed(2)}`
}
