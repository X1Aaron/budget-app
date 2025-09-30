// Export transactions to CSV
export const exportTransactionsToCSV = (transactions) => {
  if (transactions.length === 0) return

  const headers = ['date', 'description', 'amount', 'category', 'needWant', 'autoCategorized']
  const csvContent = [
    headers.join(','),
    ...transactions.map(t =>
      [t.date, `"${t.description}"`, t.amount, t.category, t.needWant || '', t.autoCategorized || false].join(',')
    )
  ].join('\n')

  downloadFile(csvContent, 'transactions.csv', 'text/csv')
}

// Export transactions to JSON
export const exportTransactionsToJSON = (transactions) => {
  const jsonContent = JSON.stringify(transactions, null, 2)
  downloadFile(jsonContent, 'transactions.json', 'application/json')
}

// Export categories to JSON
export const exportCategoriesToJSON = (categories) => {
  const jsonContent = JSON.stringify(categories, null, 2)
  downloadFile(jsonContent, 'categories.json', 'application/json')
}

// Export categories to CSV
export const exportCategoriesToCSV = (categories) => {
  const headers = ['id', 'name', 'color', 'type', 'keywords']
  const csvContent = [
    headers.join(','),
    ...categories.map(cat =>
      [cat.id, `"${cat.name}"`, cat.color, cat.type, `"${cat.keywords.join(', ')}"`].join(',')
    )
  ].join('\n')

  downloadFile(csvContent, 'categories.csv', 'text/csv')
}

// Export auto-categorization rules to JSON
export const exportRulesToJSON = (rules) => {
  const jsonContent = JSON.stringify(rules, null, 2)
  downloadFile(jsonContent, 'categorization-rules.json', 'application/json')
}

// Export auto-categorization rules to CSV
export const exportRulesToCSV = (rules) => {
  if (rules.length === 0) return

  const headers = ['pattern', 'category', 'matchType', 'caseSensitive', 'priority']
  const csvContent = [
    headers.join(','),
    ...rules.map(rule =>
      [`"${rule.pattern}"`, rule.category, rule.matchType, rule.caseSensitive, rule.priority].join(',')
    )
  ].join('\n')

  downloadFile(csvContent, 'categorization-rules.csv', 'text/csv')
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
