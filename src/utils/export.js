// Export transactions to CSV
export const exportTransactionsToCSV = (transactions) => {
  if (transactions.length === 0) return

  const headers = ['date', 'description', 'amount', 'category']
  const csvContent = [
    headers.join(','),
    ...transactions.map(t => 
      [t.date, `"${t.description}"`, t.amount, t.category].join(',')
    )
  ].join('\n')

  downloadFile(csvContent, 'transactions.csv', 'text/csv')
}

// Export categories to JSON
export const exportCategoriesToJSON = (categories) => {
  const jsonContent = JSON.stringify(categories, null, 2)
  downloadFile(jsonContent, 'categories.json', 'application/json')
}

// Export auto-categorization rules to JSON
export const exportRulesToJSON = (rules) => {
  const jsonContent = JSON.stringify(rules, null, 2)
  downloadFile(jsonContent, 'categorization-rules.json', 'application/json')
}

// Helper function to trigger download
const downloadFile = (content, filename, mimeType) => {
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
