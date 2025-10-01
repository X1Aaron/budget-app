import React, { useMemo, useState } from 'react'
import './Spending.css'
import { getCategoryColor } from '../utils/categories'
import { calculateMonthStartingBalance } from '../utils/balanceCalculations'

function Spending({
  transactions,
  categories,
  selectedYear,
  selectedMonth,
  onDateChange,
  onUpdateTransaction,
  accountStartingBalance,
  bills,
  onUpdateBills
}) {
  const [expandedIndex, setExpandedIndex] = useState(null)
  const [editingMerchantIndex, setEditingMerchantIndex] = useState(null)
  const [filterCategory, setFilterCategory] = useState('all')
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [billModalOpen, setBillModalOpen] = useState(false)
  const [billFormData, setBillFormData] = useState(null)

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

  const monthlyTransactions = useMemo(() => {
    const filtered = transactions.filter(t => {
      const date = new Date(t.date)
      return date.getFullYear() === selectedYear && date.getMonth() === selectedMonth
    })
    // Sort by date ascending for running balance calculation
    return filtered.sort((a, b) => new Date(a.date) - new Date(b.date))
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

  // Calculate running balance for each transaction
  const transactionsWithBalance = useMemo(() => {
    let runningBalance = currentStartingBalance
    return monthlyTransactions.map(t => {
      runningBalance += t.amount
      return {
        ...t,
        runningBalance: runningBalance
      }
    })
  }, [monthlyTransactions, currentStartingBalance])

  const filteredTransactions = useMemo(() => {
    let filtered = filterCategory === 'all'
      ? [...transactionsWithBalance]
      : transactionsWithBalance.filter(t => t.category === filterCategory)

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key]
        let bVal = b[sortConfig.key]

        if (sortConfig.key === 'amount' || sortConfig.key === 'runningBalance') {
          aVal = parseFloat(aVal)
          bVal = parseFloat(bVal)
        } else if (sortConfig.key === 'date') {
          aVal = new Date(aVal)
          bVal = new Date(bVal)
        } else {
          aVal = String(aVal).toLowerCase()
          bVal = String(bVal).toLowerCase()
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return filtered
  }, [transactionsWithBalance, filterCategory, sortConfig])

  const filteredTotal = useMemo(() => {
    return filteredTransactions.reduce((sum, t) => sum + t.amount, 0)
  }, [filteredTransactions])

  const availableCategories = useMemo(() => {
    const categorySet = new Set()
    monthlyTransactions.forEach(t => {
      categorySet.add(t.category || 'Uncategorized')
    })
    return Array.from(categorySet).sort()
  }, [monthlyTransactions])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const handleBillCheckbox = (transaction, originalIndex) => {
    // Check if this transaction is already a bill (by matching description)
    const existingBill = bills.find(b =>
      b.sourceDescription === transaction.description ||
      b.name === (transaction.merchantName || transaction.description)
    )

    if (existingBill) {
      // Uncheck - remove the bill
      if (confirm(`Remove "${existingBill.name}" from bills?`)) {
        onUpdateBills(bills.filter(b => b.id !== existingBill.id))
      }
    } else {
      // Check - open modal to configure bill
      const transactionDate = new Date(transaction.date)
      setBillFormData({
        name: transaction.merchantName || transaction.description,
        amount: Math.abs(transaction.amount),
        dueDate: transaction.date,
        frequency: 'monthly',
        category: transaction.category || '',
        memo: transaction.memo || '',
        sourceDescription: transaction.description,
        sourceTransactionIndex: originalIndex
      })
      setBillModalOpen(true)
    }
  }

  const handleSaveBill = () => {
    if (!billFormData.name || !billFormData.amount || !billFormData.dueDate) {
      alert('Please fill in all required fields')
      return
    }

    // Mark the source transaction date as paid
    const paidDates = [billFormData.dueDate]

    const newBill = {
      id: Date.now(),
      name: billFormData.name,
      amount: parseFloat(billFormData.amount),
      dueDate: billFormData.dueDate,
      frequency: billFormData.frequency,
      category: billFormData.category,
      memo: billFormData.memo,
      sourceDescription: billFormData.sourceDescription,
      paidDates: paidDates
    }

    onUpdateBills([...bills, newBill])
    setBillModalOpen(false)
    setBillFormData(null)
  }

  const isTransactionABill = (transaction) => {
    return bills.some(b =>
      b.sourceDescription === transaction.description ||
      b.name === (transaction.merchantName || transaction.description)
    )
  }


  return (
    <div className="spending">
      {/* Bill Configuration Modal */}
      {billModalOpen && billFormData && (
        <div className="bill-modal-backdrop" onClick={() => setBillModalOpen(false)}>
          <div className="bill-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add Recurring Bill</h3>
            <div className="bill-modal-form">
              <div className="form-group">
                <label>Bill Name *</label>
                <input
                  type="text"
                  value={billFormData.name}
                  onChange={(e) => setBillFormData({ ...billFormData, name: e.target.value })}
                  placeholder="e.g., Netflix Subscription"
                />
              </div>
              <div className="form-group">
                <label>Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  value={billFormData.amount}
                  onChange={(e) => setBillFormData({ ...billFormData, amount: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Due Date *</label>
                <input
                  type="date"
                  value={billFormData.dueDate}
                  onChange={(e) => setBillFormData({ ...billFormData, dueDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Frequency *</label>
                <select
                  value={billFormData.frequency}
                  onChange={(e) => setBillFormData({ ...billFormData, frequency: e.target.value })}
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                  <option value="one-time">One-time</option>
                </select>
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={billFormData.category}
                  onChange={(e) => setBillFormData({ ...billFormData, category: e.target.value })}
                >
                  <option value="">Select a category</option>
                  {categories && categories
                    .filter(cat => cat.type === 'expense' || cat.type === 'both')
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
                  value={billFormData.memo}
                  onChange={(e) => setBillFormData({ ...billFormData, memo: e.target.value })}
                  placeholder="Optional note"
                  rows="2"
                />
              </div>
            </div>
            <div className="bill-modal-actions">
              <button className="cancel-btn" onClick={() => setBillModalOpen(false)}>
                Cancel
              </button>
              <button className="save-btn" onClick={handleSaveBill}>
                Add Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {monthlyTransactions.length === 0 ? (
        <div className="spending-empty">
          <p>No transactions for {monthNames[selectedMonth]} {selectedYear}.</p>
        </div>
      ) : (
        <>
      <div className="transactions-section">
        <div className="transactions-header">
          <h2>Transactions{filterCategory !== 'all' && ` - ${filterCategory}`}</h2>
          <div className="header-controls">
            <div className="starting-balance-display">
              <span className="starting-balance-label">Starting Balance:</span>
              <span className="starting-balance-value">{formatCurrency(currentStartingBalance)}</span>
            </div>
            <select
              id="category-filter"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="category-filter-select"
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
            <span className="transaction-count">
              {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div className="transactions-table-container">
          <table className="transactions-table">
            <thead>
              <tr>
                <th className="bill-checkbox-header">Bill</th>
                <th onClick={() => handleSort('date')} className="sortable">
                  Date
                  <span className="sort-arrow">
                    {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? ' ↑' : ' ↓')}
                  </span>
                </th>
                <th onClick={() => handleSort('merchantName')} className="sortable">
                  Merchant
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
              {filteredTransactions.map((transaction, filteredIndex) => {
                const originalIndex = transactions.findIndex(t =>
                  t.date === transaction.date &&
                  t.description === transaction.description &&
                  t.amount === transaction.amount
                )
                const color = getCategoryColor(transaction.category, categories)
                const isExpanded = expandedIndex === originalIndex
                const isEditingMerchant = editingMerchantIndex === originalIndex
                const isUncategorized = !transaction.category || transaction.category === 'Uncategorized'

                return (
                  <React.Fragment key={originalIndex}>
                    <tr
                      className={`transaction-row ${transaction.amount < 0 ? 'expense' : 'income'}${isUncategorized ? ' uncategorized' : ''}${isExpanded ? ' expanded' : ''}`}
                      onClick={() => setExpandedIndex(isExpanded ? null : originalIndex)}
                    >
                      <td className="bill-checkbox-cell" onClick={(e) => e.stopPropagation()}>
                        {transaction.amount < 0 && (
                          <input
                            type="checkbox"
                            checked={isTransactionABill(transaction)}
                            onChange={() => handleBillCheckbox(transaction, originalIndex)}
                            title="Mark as recurring bill"
                          />
                        )}
                      </td>
                      <td className="transaction-date">{transaction.date}</td>
                      <td className="transaction-merchant-cell" onClick={(e) => e.stopPropagation()}>
                        {isEditingMerchant ? (
                          <input
                            type="text"
                            className="merchant-name-input"
                            defaultValue={transaction.merchantName || transaction.description}
                            onBlur={(e) => {
                              onUpdateTransaction(originalIndex, {
                                ...transaction,
                                merchantName: e.target.value
                              }, true) // Pass true to update all matching transactions
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
                          <span
                            className="transaction-merchant editable"
                            onClick={() => setEditingMerchantIndex(originalIndex)}
                            title="Click to edit merchant name (updates all with same description)"
                          >
                            {transaction.merchantName || transaction.description}
                          </span>
                        )}
                      </td>
                      <td className={'transaction-amount ' + (transaction.amount < 0 ? 'negative' : 'positive')}>
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="transaction-category-cell" onClick={(e) => e.stopPropagation()}>
                        <select
                          className={'transaction-category-select' + (isUncategorized ? ' uncategorized-label' : '')}
                          value={transaction.category || 'Uncategorized'}
                          onChange={(e) => {
                            onUpdateTransaction(originalIndex, {
                              ...transaction,
                              category: e.target.value,
                              autoCategorized: false
                            })
                          }}
                          style={{ color }}
                        >
                          <option value="Uncategorized">Uncategorized</option>
                          {[...categories].sort((a, b) => a.name.localeCompare(b.name)).map(cat => (
                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                          ))}
                        </select>
                        {transaction.autoCategorized && <span className="auto-icon" title="Auto-categorized"> 🤖</span>}
                        {isUncategorized && <span className="warning-icon"> ⚠️</span>}
                      </td>
                      <td className={'transaction-balance ' + (transaction.runningBalance < 0 ? 'negative' : 'positive')}>
                        {formatCurrency(transaction.runningBalance)}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${originalIndex}-expanded`} className="transaction-expanded-row">
                        <td colSpan="6" onClick={(e) => e.stopPropagation()}>
                          <div className="transaction-details">
                            <div className="detail-section">
                              <label className="detail-label">Description:</label>
                              <span className="detail-value">{transaction.description}</span>
                            </div>
                            <div className="detail-section">
                              <label className="detail-label">Category:</label>
                              <select
                                className="category-select-expanded"
                                value={transaction.category || 'Uncategorized'}
                                onChange={(e) => {
                                  onUpdateTransaction(originalIndex, {
                                    ...transaction,
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
                                value={transaction.memo || ''}
                                onChange={(e) => {
                                  onUpdateTransaction(originalIndex, {
                                    ...transaction,
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
        {filterCategory !== 'all' && (
          <div className="transactions-total">
            <span className="total-label">Total for {filterCategory}:</span>
            <span className={'total-amount ' + (filteredTotal < 0 ? 'negative' : 'positive')}>
              {formatCurrency(filteredTotal)}
            </span>
          </div>
        )}
      </div>
        </>
      )}
    </div>
  )
}

export default Spending