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
  const lines = text.trim().split('\n')

  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header row and one data row')
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''))

  const dateIndex = headers.findIndex(h => h.includes('date'))
  const descIndex = headers.findIndex(h => h.includes('desc'))
  const amountIndex = headers.findIndex(h => h.includes('amount'))
  const categoryIndex = headers.findIndex(h => h.includes('category') || h.includes('cat'))
  const needWantIndex = headers.findIndex(h => h.includes('need') || h.includes('want'))
  const autoCategorizedIndex = headers.findIndex(h => h.includes('auto'))
  const merchantNameIndex = headers.findIndex(h => h.includes('merchant'))
  const friendlyNameIndex = headers.findIndex(h => h.includes('friendly') || (h.includes('name') && !h.includes('merchant')))
  const memoIndex = headers.findIndex(h => h.includes('memo') || h.includes('note'))

  if (dateIndex === -1 || descIndex === -1 || amountIndex === -1) {
    throw new Error('CSV must have columns for: date, description, and amount')
  }

  const transactions = []
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

    const transaction = {
      id: Date.now() + Math.random(),
      date: values[dateIndex],
      description: values[descIndex],
      amount: parseFloat(values[amountIndex]),
      category: categoryIndex !== -1 ? values[categoryIndex] : 'Uncategorized',
      needWant: needWantIndex !== -1 ? values[needWantIndex] : undefined,
      autoCategorized: autoCategorizedIndex !== -1 ? (values[autoCategorizedIndex] === 'true') : false,
      merchantName: merchantNameIndex !== -1 ? values[merchantNameIndex] : (friendlyNameIndex !== -1 ? values[friendlyNameIndex] : values[descIndex]),
      memo: memoIndex !== -1 ? values[memoIndex] : ''
    }

    if (!isNaN(transaction.amount)) {
      transactions.push(transaction)
    }
  }

  return transactions
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
    autoCategorized: t.autoCategorized || false,
    merchantName: t.merchantName || t.friendlyName || t.description,
    memo: t.memo || ''
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

// Import bills from CSV
export const importBillsFromCSV = async (file) => {
  const text = await file.text()
  const data = parseCSV(text, ['name', 'amount', 'dueDate'])

  return data.map(row => ({
    id: row.id || Date.now() + Math.random(),
    name: row.name,
    amount: parseFloat(row.amount),
    dueDate: row.dueDate,
    frequency: row.frequency || 'monthly',
    category: row.category || '',
    memo: row.memo || '',
    paidDates: row.paidDates ? row.paidDates.split(';').filter(d => d) : []
  }))
}

// Import bills from JSON
export const importBillsFromJSON = async (file) => {
  const text = await file.text()
  const data = JSON.parse(text)

  if (!Array.isArray(data)) {
    throw new Error('Invalid JSON format: expected an array of bills')
  }

  return data.map(bill => ({
    id: bill.id || Date.now() + Math.random(),
    name: bill.name,
    amount: parseFloat(bill.amount),
    dueDate: bill.dueDate,
    frequency: bill.frequency || 'monthly',
    category: bill.category || '',
    memo: bill.memo || '',
    paidDates: bill.paidDates || []
  }))
}