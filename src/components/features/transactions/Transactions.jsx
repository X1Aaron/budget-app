import React, { useMemo, useState } from 'react'
import '../../../styles/components/Transactions.css'
import { getCategoryColor } from '../../../utils/categories'
import { calculateMonthStartingBalance } from '../../../utils/balanceCalculations'
import { generateBillOccurrences } from '../../../utils/billMatching'

function Transactions({
  transactions,
  categories,
  selectedYear,
  selectedMonth,
  onUpdateTransaction,
  accountStartingBalance,
  onUpdateTransactions
}) {
  const [expandedIndex, setExpandedIndex] = useState(null)
  const [editingMerchantIndex, setEditingMerchantIndex] = useState(null)
  const [filterCategory, setFilterCategory] = useState('all')
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'asc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    date: '',
    description: '',
    amount: '',
    category: '',
    memo: ''
  })
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importPreview, setImportPreview] = useState(null)
  const [importCurrentPage, setImportCurrentPage] = useState(1)
  const [importItemsPerPage, setImportItemsPerPage] = useState(25)

  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // Get bill occurrences for this month (to identify matched transactions)
  const billOccurrences = useMemo(() => {
    return generateBillOccurrences(transactions, selectedYear, selectedMonth)
  }, [transactions, selectedYear, selectedMonth])

  // Get actual non-bill transactions for the month
  const monthlyTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        if (t.isBill) return false
        const [year, month] = t.date.split('-').map(Number)
        return year === selectedYear && month - 1 === selectedMonth
      })
      .map((t, idx) => ({
        ...t,
        originalIndex: transactions.indexOf(t)
      }))
  }, [transactions, selectedYear, selectedMonth])

  // Calculate starting balance for the current month
  const currentStartingBalance = useMemo(() => {
    return calculateMonthStartingBalance(
      accountStartingBalance,
      transactions,
      selectedYear,
      selectedMonth
    )
  }, [accountStartingBalance, transactions, selectedYear, selectedMonth])

  // Calculate running balance
  const transactionsWithBalance = useMemo(() => {
    let runningBalance = currentStartingBalance
    return monthlyTransactions.map(item => {
      runningBalance += item.amount
      return {
        ...item,
        runningBalance
      }
    })
  }, [monthlyTransactions, currentStartingBalance])

  // Apply filters and sorting
  const filteredTransactions = useMemo(() => {
    let filtered = transactionsWithBalance

    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(item => item.category === filterCategory)
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key]
        let bVal = b[sortConfig.key]

        if (sortConfig.key === 'amount' || sortConfig.key === 'runningBalance') {
          aVal = parseFloat(aVal || 0)
          bVal = parseFloat(bVal || 0)
        } else if (sortConfig.key === 'date') {
          aVal = new Date(aVal)
          bVal = new Date(bVal)
        } else {
          aVal = String(aVal || '').toLowerCase()
          bVal = String(bVal || '').toLowerCase()
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return filtered
  }, [transactionsWithBalance, filterCategory, sortConfig])

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredTransactions.slice(startIndex, endIndex)
  }, [filteredTransactions, currentPage, itemsPerPage])

  React.useEffect(() => {
    setCurrentPage(1)
  }, [filterCategory, sortConfig, itemsPerPage])

  const availableCategories = useMemo(() => {
    const categorySet = new Set()
    monthlyTransactions.forEach(item => {
      if (item.category) categorySet.add(item.category)
    })
    return Array.from(categorySet).sort()
  }, [monthlyTransactions])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const handleOpenAddModal = () => {
    const today = new Date()
    const currentDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    setFormData({
      date: currentDate,
      description: '',
      amount: '',
      category: '',
      memo: ''
    })
    setAddModalOpen(true)
  }

  const handleSaveForm = () => {
    if (!formData.date || !formData.description || !formData.amount) {
      alert('Please fill in all required fields')
      return
    }

    const newTransaction = {
      id: `trans-${Date.now()}`,
      date: formData.date,
      description: formData.description,
      merchantName: formData.description,
      amount: parseFloat(formData.amount),
      category: formData.category || 'Uncategorized',
      memo: formData.memo || '',
      autoCategorized: false
    }

    onUpdateTransactions(prevTransactions => [...prevTransactions, newTransaction])

    setFormData({
      date: '',
      description: '',
      amount: '',
      category: '',
      memo: ''
    })
    setAddModalOpen(false)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target.result
        const lines = text.split('\n').filter(line => line.trim())

        if (lines.length < 2) {
          alert('CSV file must have at least a header row and one data row')
          return
        }

        // Parse CSV
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
        const data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim())
          const row = {}
          headers.forEach((header, i) => {
            row[header] = values[i] || ''
          })
          return row
        })

        // Convert to transactions
        const importedTransactions = data.map((row, index) => {
          // Try to find date field (common variations)
          let date = row.date || row.transactiondate || row['transaction date'] || row.posted || row['posted date']

          // Try to find description field
          const description = row.description || row.merchant || row.name || row.payee

          // Try to find amount field
          let amount = row.amount || row.debit || row.credit

          // If separate debit/credit columns, handle them
          if (row.debit && row.credit) {
            amount = parseFloat(row.debit || 0) - parseFloat(row.credit || 0)
          } else if (amount) {
            amount = parseFloat(amount)
          }

          // Normalize date to YYYY-MM-DD format
          if (date) {
            try {
              // Handle various date formats
              const dateObj = new Date(date)
              if (!isNaN(dateObj.getTime())) {
                const year = dateObj.getFullYear()
                const month = String(dateObj.getMonth() + 1).padStart(2, '0')
                const day = String(dateObj.getDate()).padStart(2, '0')
                date = `${year}-${month}-${day}`
              }
            } catch (e) {
              console.warn('Invalid date format:', date)
              return null
            }
          }

          if (!date || !description || isNaN(amount)) {
            console.warn('Skipping invalid row:', row)
            return null
          }

          return {
            id: `import-${Date.now()}-${index}`,
            date: date,
            description: description,
            merchantName: description,
            amount: amount,
            category: row.category || 'Uncategorized',
            memo: row.memo || row.notes || '',
            autoCategorized: false,
            isBill: false
          }
        }).filter(t => t !== null)

        setImportPreview(importedTransactions)
        setImportModalOpen(true)
      } catch (error) {
        alert('Error parsing CSV file: ' + error.message)
      }
    }
    reader.readAsText(file)
  }

  const handleConfirmImport = () => {
    if (!importPreview || importPreview.length === 0) return

    // Check for duplicates
    const duplicates = []
    const newTransactions = []

    importPreview.forEach(imported => {
      const isDuplicate = transactions.some(existing =>
        existing.date === imported.date &&
        existing.description === imported.description &&
        existing.amount === imported.amount
      )

      if (isDuplicate) {
        duplicates.push(imported)
      } else {
        newTransactions.push(imported)
      }
    })

    if (duplicates.length > 0) {
      if (!confirm(`Found ${duplicates.length} duplicate transaction(s). Import the remaining ${newTransactions.length} unique transaction(s)?`)) {
        return
      }
    }

    if (newTransactions.length > 0) {
      onUpdateTransactions(prevTransactions => [...prevTransactions, ...newTransactions])
      alert(`Successfully imported ${newTransactions.length} transaction(s)`)
    }

    setImportPreview(null)
    setImportModalOpen(false)
    setImportCurrentPage(1)
  }

  const handleCloseImportModal = () => {
    setImportPreview(null)
    setImportModalOpen(false)
    setImportCurrentPage(1)
  }

  // Summary stats
  const summary = useMemo(() => {
    const income = monthlyTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)
    const expenses = monthlyTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const matchedToBills = monthlyTransactions.filter(t => t.matchedToBillId).length

    return {
      income,
      expenses,
      net: income - expenses,
      matchedToBills
    }
  }, [monthlyTransactions])

  return (
    <div className="transactions-page">
      {/* Import Preview Modal */}
      {importModalOpen && importPreview && (() => {
        const importTotalPages = Math.ceil(importPreview.length / importItemsPerPage)
        const importStartIndex = (importCurrentPage - 1) * importItemsPerPage
        const importEndIndex = importStartIndex + importItemsPerPage
        const importPaginatedData = importPreview.slice(importStartIndex, importEndIndex)

        return (
          <div className="import-modal-backdrop" onClick={handleCloseImportModal}>
            <div className="import-modal" onClick={(e) => e.stopPropagation()}>
              <div className="import-modal-header">
                <h2>Import Preview</h2>
                <button className="close-btn" onClick={handleCloseImportModal}>×</button>
              </div>

              <div className="import-info-banner">
                <span className="info-icon">ℹ️</span>
                <p>
                  Ready to import <strong>{importPreview.length}</strong> transaction(s).
                  Review the data below and click "Import" to continue.
                </p>
              </div>

              <div className="import-table-container">
                <table className="import-preview-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importPaginatedData.map((trans, idx) => {
                      const globalIndex = importStartIndex + idx + 1
                      return (
                        <tr key={idx} className={trans.amount < 0 ? 'expense-row' : 'income-row'}>
                          <td className="row-number">{globalIndex}</td>
                          <td className="import-date">{trans.date}</td>
                          <td className="import-description">{trans.description}</td>
                          <td className={`import-amount ${trans.amount < 0 ? 'negative' : 'positive'}`}>
                            {formatCurrency(trans.amount)}
                          </td>
                          <td className="import-category">{trans.category}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {importTotalPages > 1 && (
                <div className="import-pagination-controls">
                  <div className="import-pagination-size">
                    <label>Show:</label>
                    <select
                      value={importItemsPerPage}
                      onChange={(e) => {
                        setImportItemsPerPage(Number(e.target.value))
                        setImportCurrentPage(1)
                      }}
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={importPreview.length}>All ({importPreview.length})</option>
                    </select>
                    <span>per page</span>
                  </div>

                  <div className="import-pagination-nav">
                    <button
                      className="pagination-btn"
                      onClick={() => setImportCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={importCurrentPage === 1}
                    >
                      ← Previous
                    </button>
                    <span className="pagination-current">
                      Page {importCurrentPage} of {importTotalPages}
                    </span>
                    <button
                      className="pagination-btn"
                      onClick={() => setImportCurrentPage(prev => Math.min(prev + 1, importTotalPages))}
                      disabled={importCurrentPage === importTotalPages}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}

              <div className="import-modal-footer">
                <div className="import-stats">
                  <span>Showing {importStartIndex + 1}-{Math.min(importEndIndex, importPreview.length)} of {importPreview.length} transactions</span>
                </div>
                <div className="import-modal-actions">
                  <button className="cancel-btn" onClick={handleCloseImportModal}>
                    Cancel
                  </button>
                  <button className="import-btn" onClick={handleConfirmImport}>
                    Import {importPreview.length} Transaction{importPreview.length !== 1 ? 's' : ''}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Add Transaction Modal */}
      {addModalOpen && (
        <div className="bill-modal-backdrop" onClick={() => setAddModalOpen(false)}>
          <div className="bill-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Transaction</h3>
            <div className="bill-modal-form">
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Description *</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Grocery Store"
                />
              </div>
              <div className="form-group">
                <label>Amount * (negative by default)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => {
                    let value = e.target.value
                    // Only auto-negate if user enters a positive number without explicit + sign
                    if (value && !value.startsWith('-') && !value.startsWith('+') && parseFloat(value) > 0) {
                      value = '-' + value
                    }
                    // If user explicitly adds +, keep it positive
                    if (value.startsWith('+')) {
                      value = value.substring(1)
                    }
                    setFormData({ ...formData, amount: value })
                  }}
                  placeholder="Enter amount (automatically negative)"
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="">Select a category</option>
                  {categories && [...categories]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(cat => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="form-group">
                <label>Memo</label>
                <textarea
                  value={formData.memo}
                  onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                  placeholder="Optional note"
                  rows="2"
                />
              </div>
            </div>
            <div className="bill-modal-actions">
              <button className="cancel-btn" onClick={() => setAddModalOpen(false)}>
                Cancel
              </button>
              <button className="save-btn" onClick={handleSaveForm}>
                Add Transaction
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="transactions-section">
        <div className="transactions-header">
          <h2>Transactions - {monthNames[selectedMonth]} {selectedYear}</h2>
          <div className="header-controls">
            <button className="action-btn add-transaction-btn" onClick={handleOpenAddModal}>
              + Add Transaction
            </button>
            <label className="action-btn import-btn">
              📁 Import CSV
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>
            <div className="starting-balance-display">
              <span className="starting-balance-label">Starting Balance:</span>
              <span className="starting-balance-value">{formatCurrency(currentStartingBalance)}</span>
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Categories</option>
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {filterCategory !== 'all' && (
              <button className="clear-filter-btn" onClick={() => setFilterCategory('all')}>
                Clear Filter
              </button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="summary-card">
            <div className="summary-label">Income</div>
            <div className="summary-value income">{formatCurrency(summary.income)}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Expenses</div>
            <div className="summary-value expenses">{formatCurrency(summary.expenses)}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Net</div>
            <div className={`summary-value ${summary.net >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(summary.net)}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Matched to Bills</div>
            <div className="summary-value">{summary.matchedToBills}</div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="transactions-table-container">
          <table className="transactions-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('date')} className="sortable">
                  Date
                  <span className="sort-arrow">
                    {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? ' ↑' : ' ↓')}
                  </span>
                </th>
                <th onClick={() => handleSort('merchantName')} className="sortable">
                  Description
                  <span className="sort-arrow">
                    {sortConfig.key === 'merchantName' && (sortConfig.direction === 'asc' ? ' ↑' : ' ↓')}
                  </span>
                </th>
                <th onClick={() => handleSort('amount')} className="sortable">
                  Amount
                  <span className="sort-arrow">
                    {sortConfig.key === 'amount' && (sortConfig.direction === 'asc' ? ' ↑' : ' ↓')}
                  </span>
                </th>
                <th onClick={() => handleSort('category')} className="sortable">
                  Category
                  <span className="sort-arrow">
                    {sortConfig.key === 'category' && (sortConfig.direction === 'asc' ? ' ↑' : ' ↓')}
                  </span>
                </th>
                <th onClick={() => handleSort('runningBalance')} className="sortable">
                  Balance
                  <span className="sort-arrow">
                    {sortConfig.key === 'runningBalance' && (sortConfig.direction === 'asc' ? ' ↑' : ' ↓')}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedTransactions.map((item, paginatedIndex) => {
                const index = (currentPage - 1) * itemsPerPage + paginatedIndex
                const color = getCategoryColor(item.category, categories)
                const isExpanded = expandedIndex === index
                const isEditingMerchant = editingMerchantIndex === index
                const isUncategorized = !item.category || item.category === 'Uncategorized'
                const isBillPayment = item.matchedToBillId

                // Find matched bill if any
                const matchedBill = isBillPayment
                  ? billOccurrences.find(b => b.billId === item.matchedToBillId)
                  : null

                return (
                  <React.Fragment key={item.id || index}>
                    <tr
                      className={`transaction-row ${item.amount < 0 ? 'expense' : 'income'}${isUncategorized ? ' uncategorized' : ''}${isExpanded ? ' expanded' : ''}${isBillPayment ? ' bill-payment' : ''}`}
                      onClick={() => setExpandedIndex(isExpanded ? null : index)}
                    >
                      <td className="transaction-date">{item.date}</td>

                      <td className="transaction-merchant-cell" onClick={(e) => e.stopPropagation()}>
                        {isEditingMerchant ? (
                          <input
                            type="text"
                            className="merchant-name-input"
                            defaultValue={item.merchantName || item.description}
                            onBlur={(e) => {
                              onUpdateTransaction(item.originalIndex, {
                                ...item,
                                merchantName: e.target.value
                              }, true)
                              setEditingMerchantIndex(null)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.target.blur()
                              } else if (e.key === 'Escape') {
                                setEditingMerchantIndex(null)
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          <div className="transaction-description-wrapper">
                            <span
                              className="transaction-merchant editable"
                              onClick={() => setEditingMerchantIndex(index)}
                              title="Click to edit merchant name"
                            >
                              {item.merchantName || item.description}
                            </span>
                            {isBillPayment && matchedBill && (
                              <span className="bill-payment-indicator" title={`Paid bill: ${matchedBill.billName}`}>
                                💰 {matchedBill.billName}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className={`transaction-amount ${item.amount < 0 ? 'negative' : 'positive'}`}>
                        {formatCurrency(Math.abs(item.amount))}
                      </td>

                      <td className="transaction-category-cell" onClick={(e) => e.stopPropagation()}>
                        <select
                          className={`transaction-category-select${isUncategorized ? ' uncategorized-label' : ''}`}
                          value={item.category || 'Uncategorized'}
                          onChange={(e) => {
                            onUpdateTransaction(item.originalIndex, {
                              ...item,
                              category: e.target.value,
                              autoCategorized: false
                            })
                          }}
                        >
                          <option value="Uncategorized">Uncategorized</option>
                          {[...categories].sort((a, b) => a.name.localeCompare(b.name)).map(cat => (
                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                          ))}
                        </select>
                        {item.autoCategorized && <span className="auto-icon" title="Auto-categorized"> 🤖</span>}
                        {isUncategorized && <span className="warning-icon"> ⚠️</span>}
                      </td>

                      <td className={`transaction-balance ${item.runningBalance < 0 ? 'negative' : 'positive'}`}>
                        {formatCurrency(item.runningBalance)}
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr key={`${index}-expanded`} className="transaction-expanded-row">
                        <td colSpan="5" onClick={(e) => e.stopPropagation()}>
                          <div className="transaction-details">
                            <div className="detail-section">
                              <label className="detail-label">Description:</label>
                              <span className="detail-value">{item.description}</span>
                            </div>

                            {isBillPayment && matchedBill && (
                              <div className="detail-section bill-payment-section">
                                <label className="detail-label">Bill Payment:</label>
                                <div className="bill-payment-details">
                                  <div className="bill-payment-row">
                                    <strong>✓ This transaction paid a bill</strong>
                                  </div>
                                  <div className="bill-payment-row">
                                    <strong>Bill Name:</strong> {matchedBill.billName}
                                  </div>
                                  <div className="bill-payment-row">
                                    <strong>Expected Amount:</strong> {formatCurrency(matchedBill.billAmount)}
                                  </div>
                                  <div className="bill-payment-row">
                                    <strong>Due Date:</strong> {matchedBill.occurrenceDate}
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="detail-section">
                              <label className="detail-label">Category:</label>
                              <select
                                className="category-select-expanded"
                                value={item.category || 'Uncategorized'}
                                onChange={(e) => {
                                  onUpdateTransaction(item.originalIndex, {
                                    ...item,
                                    category: e.target.value,
                                    autoCategorized: false
                                  })
                                }}
                              >
                                <option value="Uncategorized">Uncategorized</option>
                                {[...categories].sort((a, b) => a.name.localeCompare(b.name)).map(cat => (
                                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                                ))}
                              </select>
                            </div>

                            <div className="detail-section memo-section">
                              <label className="detail-label">Memo:</label>
                              <textarea
                                className="memo-input"
                                value={item.memo || ''}
                                onChange={(e) => {
                                  onUpdateTransaction(item.originalIndex, {
                                    ...item,
                                    memo: e.target.value
                                  })
                                }}
                                placeholder="Add notes about this transaction..."
                                rows="3"
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredTransactions.length > 0 && (
          <div className="pagination-controls">
            <div className="pagination-size-selector">
              <label htmlFor="page-size">Show:</label>
              <select
                id="page-size"
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="page-size-select"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>per page</span>
            </div>

            {totalPages > 1 && (
              <>
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  ← Previous
                </button>
                <div className="pagination-info">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      className={`pagination-number ${page === currentPage ? 'active' : ''}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next →
                </button>
              </>
            )}
          </div>
        )}

        <div className="transactions-footer">
          <span className="item-count">
            {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
            {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
          </span>
        </div>
      </div>
    </div>
  )
}

export default Transactions
