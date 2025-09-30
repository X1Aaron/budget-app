// Parse CSV string into array of objects
const parseCSV = (csvText, expectedHeaders) => {
  const lines = csvText.trim().split('\n')
  if (lines.length === 0) {
    throw new Error('File is empty')
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))

  // Validate headers
  const missingHeaders = expectedHeaders.filter(h => !headers.includes(h))
  if (missingHeaders.length > 0) {
    throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`)
  }

  const data = []
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '') continue

    const values = []
    let currentValue = ''
    let insideQuotes = false

    for (let char of lines[i]) {
      if (char === '"') {
        insideQuotes = !insideQuotes
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim())
        currentValue = ''
      } else {
        currentValue += char
      }
    }
    values.push(currentValue.trim())

    const row = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    data.push(row)
  }

  return data
}

// Import transactions from CSV
export const importTransactionsFromCSV = async (file) => {
  const text = await file.text()
  const data = parseCSV(text, ['date', 'description', 'amount', 'category'])

  return data.map(row => ({
    id: Date.now() + Math.random(),
    date: row.date,
    description: row.description,
    amount: parseFloat(row.amount),
    category: row.category || 'Uncategorized',
    needWant: row.needWant || undefined,
    autoCategorized: row.autoCategorized === 'true' || row.autoCategorized === true || false
  }))
}

// Import transactions from JSON
export const importTransactionsFromJSON = async (file) => {
  const text = await file.text()
  const data = JSON.parse(text)

  if (!Array.isArray(data)) {
    throw new Error('Invalid JSON format: expected an array of transactions')
  }

  return data.map(t => ({
    id: t.id || Date.now() + Math.random(),
    date: t.date,
    description: t.description,
    amount: parseFloat(t.amount),
    category: t.category || 'Uncategorized',
    needWant: t.needWant || undefined,
    autoCategorized: t.autoCategorized || false
  }))
}

// Import categories from CSV
export const importCategoriesFromCSV = async (file) => {
  const text = await file.text()
  const data = parseCSV(text, ['name', 'color', 'type'])

  return data.map(row => ({
    id: row.id || Date.now() + Math.random(),
    name: row.name,
    color: row.color,
    type: row.type || 'expense',
    keywords: row.keywords ? row.keywords.split(',').map(k => k.trim()) : []
  }))
}

// Import categories from JSON
export const importCategoriesFromJSON = async (file) => {
  const text = await file.text()
  const data = JSON.parse(text)

  if (!Array.isArray(data)) {
    throw new Error('Invalid JSON format: expected an array of categories')
  }

  return data.map(cat => ({
    id: cat.id || Date.now() + Math.random(),
    name: cat.name,
    color: cat.color,
    type: cat.type || 'expense',
    keywords: cat.keywords || []
  }))
}

// Import auto-categorization rules from CSV
export const importRulesFromCSV = async (file) => {
  const text = await file.text()
  const data = parseCSV(text, ['pattern', 'category', 'matchType'])

  return data.map((row, index) => ({
    id: Date.now() + Math.random(),
    pattern: row.pattern,
    category: row.category,
    matchType: row.matchType || 'contains',
    caseSensitive: row.caseSensitive === 'true' || row.caseSensitive === true,
    priority: row.priority ? parseInt(row.priority) : index + 1
  }))
}

// Import auto-categorization rules from JSON
export const importRulesFromJSON = async (file) => {
  const text = await file.text()
  const data = JSON.parse(text)

  if (!Array.isArray(data)) {
    throw new Error('Invalid JSON format: expected an array of rules')
  }

  return data.map((rule, index) => ({
    id: rule.id || Date.now() + Math.random(),
    pattern: rule.pattern,
    category: rule.category,
    matchType: rule.matchType || 'contains',
    caseSensitive: rule.caseSensitive || false,
    priority: rule.priority || index + 1
  }))
}