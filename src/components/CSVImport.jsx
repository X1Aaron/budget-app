import { useState } from 'react'
import './CSVImport.css'

function CSVImport({ onImport }) {
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')

  const parseCSV = (text) => {
    const lines = text.trim().split('\n')
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row')
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())

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
      const values = lines[i].split(',').map(v => v.trim())
      if (values.length < headers.length) continue

      const transaction = {
        date: values[dateIndex],
        description: values[descIndex],
        amount: parseFloat(values[amountIndex]),
        category: categoryIndex !== -1 && values[categoryIndex] ? values[categoryIndex] : 'Uncategorized',
        needWant: needWantIndex !== -1 && values[needWantIndex] ? values[needWantIndex] : undefined,
        autoCategorized: autoCategorizedIndex !== -1 && values[autoCategorizedIndex] ? (values[autoCategorizedIndex] === 'true') : false,
        merchantName: merchantNameIndex !== -1 && values[merchantNameIndex] ? values[merchantNameIndex] : (friendlyNameIndex !== -1 && values[friendlyNameIndex] ? values[friendlyNameIndex] : values[descIndex]),
        memo: memoIndex !== -1 && values[memoIndex] ? values[memoIndex] : ''
      }

      if (!isNaN(transaction.amount)) {
        transactions.push(transaction)
      }
    }

    return transactions
  }

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      setError('Please select a CSV file')
      return
    }

    setFileName(file.name)
    setError('')

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const transactions = parseCSV(e.target.result)
        await onImport(transactions)
        setError('')
      } catch (err) {
        setError(err.message)
      }
    }
    reader.onerror = () => {
      setError('Failed to read file')
    }
    reader.readAsText(file)
  }

  return (
    <div className="csv-import">
      <div className="import-card">
        <h2>Import Transactions</h2>
        <p className="import-description">
          Upload a CSV file with columns: date, description, amount, category (optional), merchantName (optional), memo (optional), needWant (optional)
        </p>
        
        <div className="file-input-wrapper">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            id="csv-file-input"
            className="file-input"
          />
          <label htmlFor="csv-file-input" className="file-label">
            <span className="file-button">Choose File</span>
            <span className="file-name">{fileName || 'No file chosen'}</span>
          </label>
        </div>

        {error && <div className="error-message">{error}</div>}
        
        <div className="example-format">
          <strong>Example CSV format:</strong>
          <pre>
date,description,amount,category,merchantName,memo,needWant
2024-01-01,ACME CORP PAYROLL,3000,Income,ACME Corp,Monthly salary payment,
2024-01-02,WHLE FDS #123,-150,Food,Whole Foods,Weekly groceries,need
2024-01-03,PROP MGT LLC,-1200,Housing,Rent Payment,January rent,need
2024-01-04,AMC THEATERS,-50,Entertainment,AMC,Watched new release,want
          </pre>
        </div>
      </div>
    </div>
  )
}

export default CSVImport
