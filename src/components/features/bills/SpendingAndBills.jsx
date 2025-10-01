import React, { useMemo, useState, useEffect, useRef } from 'react'
import '../../../styles/components/SpendingAndBills.css'
import { getCategoryColor } from '../../../utils/categories'
import { calculateMonthStartingBalance } from '../../../utils/balanceCalculations'
import { generateBillOccurrences, matchTransactionToBill } from '../../../utils/billMatching'

function SpendingAndBills({
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
  const [filterType, setFilterType] = useState('all') // all, bills-only, transactions-only, unpaid-bills
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'asc' })
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [addType, setAddType] = useState('transaction') // 'transaction' or 'bill'
  const [formData, setFormData] = useState({
    date: '',
    description: '',
    amount: '',
    category: '',
    memo: '',
    // Bill-specific fields
    frequency: 'monthly'
  })

  const cashRegisterSound = useMemo(() => new Audio('/cash-register.mp3'), [])

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

  // Generate bill occurrences for the current month
  const billOccurrences = useMemo(() => {
    const occurrences = generateBillOccurrences(bills, selectedYear, selectedMonth)
    return occurrences.map(occ => {
      const bill = bills.find(b => b.id === occ.billId)
      return {
        ...occ,
        bill,
        type: 'bill',
        date: occ.occurrenceDate,
        amount: -bill.amount, // Bills are expenses
        category: bill.category,
        description: bill.name,
        merchantName: bill.name,
        isPaid: !!occ.payment,
        payment: occ.payment
      }
    })
  }, [bills, selectedYear, selectedMonth])

  // Get actual transactions for the month
  const monthlyTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        const date = new Date(t.date)
        return date.getFullYear() === selectedYear && date.getMonth() === selectedMonth
      })
      .map(t => ({ ...t, type: 'transaction' }))
  }, [transactions, selectedYear, selectedMonth])

  // Merge transactions and bill occurrences into unified timeline
  const unifiedTimeline = useMemo(() => {
    const merged = [...monthlyTransactions, ...billOccurrences]

    // Sort by date
    merged.sort((a, b) => new Date(a.date) - new Date(b.date))

    return merged
  }, [monthlyTransactions, billOccurrences])

  // Calculate bill matches for actual transactions
  const billMatches = useMemo(() => {
    return transactions.map((transaction, index) => {
      const match = matchTransactionToBill(transaction, index, billOccurrences)
      return match
    })
  }, [transactions, billOccurrences])

  // Calculate starting balance for the current month
  const currentStartingBalance = useMemo(() => {
    return calculateMonthStartingBalance(
      accountStartingBalance,
      transactions,
      selectedYear,
      selectedMonth
    )
  }, [accountStartingBalance, transactions, selectedYear, selectedMonth])

  // Calculate running balance for timeline
  const timelineWithBalance = useMemo(() => {
    let runningBalance = currentStartingBalance
    return unifiedTimeline.map(item => {
      // Only add to running balance for actual transactions
      if (item.type === 'transaction') {
        runningBalance += item.amount
      }
      return {
        ...item,
        runningBalance: item.type === 'transaction' ? runningBalance : null
      }
    })
  }, [unifiedTimeline, currentStartingBalance])

  // Apply filters
  const filteredTimeline = useMemo(() => {
    let filtered = timelineWithBalance

    // Filter by type (all, bills-only, transactions-only, unpaid-bills)
    if (filterType === 'bills-only') {
      filtered = filtered.filter(item => item.type === 'bill')
    } else if (filterType === 'transactions-only') {
      filtered = filtered.filter(item => item.type === 'transaction')
    } else if (filterType === 'unpaid-bills') {
      filtered = filtered.filter(item => item.type === 'bill' && !item.isPaid)
    }

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
  }, [timelineWithBalance, filterCategory, filterType, sortConfig])

  const availableCategories = useMemo(() => {
    const categorySet = new Set()
    unifiedTimeline.forEach(item => {
      if (item.category) categorySet.add(item.category)
    })
    return Array.from(categorySet).sort()
  }, [unifiedTimeline])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const handleBillCheckbox = (transaction, originalIndex) => {
    // Check if this transaction is already a bill
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
      const today = new Date()
      const currentDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

      setFormData({
        date: transaction.date,
        description: transaction.merchantName || transaction.description,
        amount: Math.abs(transaction.amount),
        category: transaction.category || '',
        memo: transaction.memo || '',
        frequency: 'monthly',
        sourceDescription: transaction.description,
        sourceTransactionIndex: originalIndex
      })
      setAddType('bill')
      setAddModalOpen(true)
    }
  }

  const handleOpenAddModal = () => {
    // Pre-fill with current month's date
    const today = new Date()
    const currentDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    setFormData({
      date: currentDate,
      description: '',
      amount: '',
      category: '',
      memo: '',
      frequency: 'monthly'
    })
    setAddType('transaction')
    setAddModalOpen(true)
  }

  const handleSaveForm = () => {
    if (!formData.date || !formData.description || !formData.amount) {
      alert('Please fill in all required fields')
      return
    }

    if (addType === 'transaction') {
      const newTransaction = {
        id: Date.now(),
        date: formData.date,
        description: formData.description,
        merchantName: formData.description,
        amount: parseFloat(formData.amount),
        category: formData.category || 'Uncategorized',
        memo: formData.memo || '',
        autoCategorized: false
      }
      onUpdateTransaction(transactions.length, newTransaction)
    } else {
      const newBill = {
        id: Date.now(),
        name: formData.description,
        amount: parseFloat(formData.amount),
        dueDate: formData.date,
        frequency: formData.frequency,
        category: formData.category,
        memo: formData.memo,
        sourceDescription: formData.sourceDescription,
        paidDates: [formData.date]
      }
      onUpdateBills([...bills, newBill])
    }

    // Reset form and close modal
    setFormData({
      date: '',
      description: '',
      amount: '',
      category: '',
      memo: '',
      frequency: 'monthly'
    })
    setAddModalOpen(false)
  }

  const isTransactionABill = (transaction) => {
    return bills.some(b =>
      b.sourceDescription === transaction.description ||
      b.name === (transaction.merchantName || transaction.description)
    )
  }

  const handleTogglePaid = (billOccurrence) => {
    const updatedBills = bills.map(bill => {
      if (bill.id === billOccurrence.billId) {
        const payments = bill.payments || []
        const existingPayment = payments.find(p => p.occurrenceDate === billOccurrence.occurrenceDate)

        if (existingPayment) {
          // Remove payment
          return {
            ...bill,
            payments: payments.filter(p => p.occurrenceDate !== billOccurrence.occurrenceDate)
          }
        } else {
          // Add manual payment
          cashRegisterSound.play().catch(err => console.log('Sound play failed:', err))
          return {
            ...bill,
            payments: [...payments, {
              occurrenceDate: billOccurrence.occurrenceDate,
              manuallyMarked: true
            }]
          }
        }
      }
      return bill
    })
    onUpdateBills(updatedBills)
  }

  // Summary stats
  const summary = useMemo(() => {
    const billsTotal = billOccurrences.reduce((sum, b) => sum + b.bill.amount, 0)
    const billsUnpaid = billOccurrences.filter(b => !b.isPaid).reduce((sum, b) => sum + b.bill.amount, 0)
    const transactionsTotal = monthlyTransactions.reduce((sum, t) => sum + t.amount, 0)
    const income = monthlyTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)
    const expenses = monthlyTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0)

    return {
      billsTotal,
      billsUnpaid,
      transactionsTotal,
      income,
      expenses
    }
  }, [billOccurrences, monthlyTransactions])

  return (
    <div className="spending-and-bills">
      {/* Unified Add Modal */}
      {addModalOpen && (
        <div className="bill-modal-backdrop" onClick={() => setAddModalOpen(false)}>
          <div className="bill-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-with-toggle">
              <h3>Add New</h3>
              <div className="type-toggle">
                <button
                  className={`toggle-btn ${addType === 'transaction' ? 'active' : ''}`}
                  onClick={() => setAddType('transaction')}
                >
                  Transaction
                </button>
                <button
                  className={`toggle-btn ${addType === 'bill' ? 'active' : ''}`}
                  onClick={() => setAddType('bill')}
                >
                  Bill
                </button>
              </div>
            </div>
            <div className="bill-modal-form">
              <div className="form-group">
                <label>{addType === 'bill' ? 'Due Date' : 'Date'} *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>{addType === 'bill' ? 'Bill Name' : 'Description'} *</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={addType === 'bill' ? 'e.g., Netflix Subscription' : 'e.g., Grocery Store'}
                />
              </div>
              <div className="form-group">
                <label>Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder={addType === 'transaction' ? 'Use negative for expenses' : ''}
                />
              </div>
              {addType === 'bill' && (
                <div className="form-group">
                  <label>Frequency *</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                    <option value="one-time">One-time</option>
                  </select>
                </div>
              )}
              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="">Select a category</option>
                  {categories && [...categories]
                    .filter(cat => addType === 'bill' ? (cat.type === 'expense' || cat.type === 'both') : true)
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
                Add {addType === 'bill' ? 'Bill' : 'Transaction'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="timeline-section">
        <div className="timeline-header">
          <h2>Spending & Bills - {monthNames[selectedMonth]} {selectedYear}</h2>
          <div className="header-controls">
            <div className="action-buttons">
              <button
                className="action-btn add-unified-btn"
                onClick={handleOpenAddModal}
              >
                + Add
              </button>
            </div>
            <div className="starting-balance-display">
              <span className="starting-balance-label">Starting Balance:</span>
              <span className="starting-balance-value">{formatCurrency(currentStartingBalance)}</span>
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
            >
              <option value="all">Show: All</option>
              <option value="transactions-only">Transactions Only</option>
              <option value="bills-only">Bills Only</option>
              <option value="unpaid-bills">Unpaid Bills</option>
            </select>
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
            {(filterCategory !== 'all' || filterType !== 'all') && (
              <button className="clear-filter-btn" onClick={() => {
                setFilterCategory('all')
                setFilterType('all')
              }}>
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="summary-card">
            <div className="summary-label">Bills Total</div>
            <div className="summary-value bills">{formatCurrency(summary.billsTotal)}</div>
            <div className="summary-detail">{summary.billsUnpaid > 0 ? `${formatCurrency(summary.billsUnpaid)} unpaid` : 'All paid'}</div>
          </div>
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
            <div className={`summary-value ${summary.income - summary.expenses >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(summary.income - summary.expenses)}
            </div>
          </div>
        </div>

        {/* Timeline Table */}
        <div className="timeline-table-container">
          <table className="timeline-table">
            <thead>
              <tr>
                <th className="type-column">Type</th>
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
                <th>Status</th>
                <th onClick={() => handleSort('runningBalance')} className="sortable">
                  Balance
                  <span className="sort-arrow">
                    {sortConfig.key === 'runningBalance' && (sortConfig.direction === 'asc' ? ' ↑' : ' ↓')}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTimeline.map((item, index) => {
                const originalIndex = item.type === 'transaction'
                  ? transactions.findIndex(t =>
                      t.date === item.date &&
                      t.description === item.description &&
                      t.amount === item.amount
                    )
                  : null

                const color = getCategoryColor(item.category, categories)
                const isExpanded = expandedIndex === index
                const isEditingMerchant = editingMerchantIndex === index
                const isUncategorized = !item.category || item.category === 'Uncategorized'

                // Get bill match info for transactions
                const billMatch = item.type === 'transaction' && originalIndex !== null
                  ? billMatches[originalIndex]
                  : null
                const isMatchedToBill = billMatch && billMatch.matchedBill && billMatch.matchScore >= 60

                const rowClassName = item.type === 'bill'
                  ? `timeline-row bill-row ${item.isPaid ? 'paid' : 'unpaid'}`
                  : `timeline-row transaction-row ${item.amount < 0 ? 'expense' : 'income'}${isUncategorized ? ' uncategorized' : ''}${isExpanded ? ' expanded' : ''}${isMatchedToBill ? ' bill-matched' : ''}`

                return (
                  <React.Fragment key={`${item.type}-${index}`}>
                    <tr
                      className={rowClassName}
                      onClick={() => item.type === 'transaction' && setExpandedIndex(isExpanded ? null : index)}
                    >
                      {/* Type Column */}
                      <td className="type-cell" onClick={(e) => e.stopPropagation()}>
                        {item.type === 'bill' ? (
                          <span className={`type-badge bill ${item.isPaid ? 'paid' : 'unpaid'}`}>
                            {item.isPaid ? '📋 PAID' : '💡 DUE'}
                          </span>
                        ) : (
                          <div className="bill-checkbox-wrapper">
                            <input
                              type="checkbox"
                              checked={isTransactionABill(item)}
                              onChange={() => handleBillCheckbox(item, originalIndex)}
                              title="Mark as recurring bill"
                            />
                            {isMatchedToBill && (
                              <span className="bill-match-indicator" title={`Matched to bill: ${billMatch.matchedBill.billName}`}>
                                💰
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Date */}
                      <td className="timeline-date">{item.date}</td>

                      {/* Description/Merchant */}
                      <td className="timeline-merchant-cell" onClick={(e) => e.stopPropagation()}>
                        {item.type === 'bill' ? (
                          <div className="bill-description">
                            <span className="bill-name">{item.bill.name}</span>
                            {item.payment && !item.payment.manuallyMarked && (
                              <span className="matched-indicator" title="Auto-matched to transaction">
                                ↳ Matched transaction
                              </span>
                            )}
                            {item.payment && item.payment.manuallyMarked && (
                              <span className="manual-indicator" title="Manually marked as paid">
                                ↳ Manually marked paid
                              </span>
                            )}
                            {!item.isPaid && (
                              <span className="expected-indicator">💡 Expected bill (not paid yet)</span>
                            )}
                          </div>
                        ) : (
                          <>
                            {isEditingMerchant ? (
                              <input
                                type="text"
                                className="merchant-name-input"
                                defaultValue={item.merchantName || item.description}
                                onBlur={(e) => {
                                  onUpdateTransaction(originalIndex, {
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
                              <span
                                className="timeline-merchant editable"
                                onClick={() => setEditingMerchantIndex(index)}
                                title="Click to edit merchant name"
                              >
                                {item.merchantName || item.description}
                                {isMatchedToBill && (
                                  <span className="bill-match-badge" title={`Matched to: ${billMatch.matchedBill.billName}`}>
                                    📋 BILL
                                  </span>
                                )}
                              </span>
                            )}
                          </>
                        )}
                      </td>

                      {/* Amount */}
                      <td className={`timeline-amount ${item.amount < 0 ? 'negative' : 'positive'}`}>
                        {formatCurrency(item.amount)}
                      </td>

                      {/* Category */}
                      <td className="timeline-category-cell" onClick={(e) => e.stopPropagation()}>
                        {item.type === 'transaction' ? (
                          <>
                            <select
                              className={`timeline-category-select${isUncategorized ? ' uncategorized-label' : ''}`}
                              value={item.category || 'Uncategorized'}
                              onChange={(e) => {
                                onUpdateTransaction(originalIndex, {
                                  ...item,
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
                            {item.autoCategorized && <span className="auto-icon" title="Auto-categorized"> 🤖</span>}
                            {isUncategorized && <span className="warning-icon"> ⚠️</span>}
                          </>
                        ) : (
                          <span className="bill-category-badge" style={{ color }}>
                            {item.category || 'Uncategorized'}
                          </span>
                        )}
                      </td>

                      {/* Status/Actions */}
                      <td className="status-cell" onClick={(e) => e.stopPropagation()}>
                        {item.type === 'bill' && (
                          <button
                            className="toggle-paid-btn"
                            onClick={() => handleTogglePaid(item)}
                            title={item.isPaid ? 'Mark as Unpaid' : 'Mark as Paid'}
                          >
                            {item.isPaid ? '↶ Unpay' : '✓ Pay'}
                          </button>
                        )}
                      </td>

                      {/* Running Balance */}
                      <td className={`timeline-balance ${item.runningBalance !== null && item.runningBalance < 0 ? 'negative' : 'positive'}`}>
                        {item.runningBalance !== null ? formatCurrency(item.runningBalance) : '—'}
                      </td>
                    </tr>

                    {/* Expanded row for transactions */}
                    {isExpanded && item.type === 'transaction' && (
                      <tr key={`${index}-expanded`} className="timeline-expanded-row">
                        <td colSpan="7" onClick={(e) => e.stopPropagation()}>
                          <div className="timeline-details">
                            <div className="detail-section">
                              <label className="detail-label">Description:</label>
                              <span className="detail-value">{item.description}</span>
                            </div>
                            <div className="detail-section">
                              <label className="detail-label">Category:</label>
                              <select
                                className="category-select-expanded"
                                value={item.category || 'Uncategorized'}
                                onChange={(e) => {
                                  onUpdateTransaction(originalIndex, {
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
                                  onUpdateTransaction(originalIndex, {
                                    ...item,
                                    memo: e.target.value
                                  })
                                }}
                                placeholder="Add notes about this transaction..."
                                rows="3"
                              />
                            </div>
                            {isMatchedToBill && (
                              <div className="detail-section bill-match-section">
                                <label className="detail-label">Bill Match:</label>
                                <div className="bill-match-info">
                                  <div className="bill-match-row">
                                    <strong>Bill:</strong> {billMatch.matchedBill.billName}
                                  </div>
                                  <div className="bill-match-row">
                                    <strong>Due Date:</strong> {billMatch.matchedBill.occurrenceDate}
                                  </div>
                                  <div className="bill-match-row">
                                    <strong>Expected Amount:</strong> {formatCurrency(-billMatch.matchedBill.billAmount)}
                                  </div>
                                  <div className="bill-match-row">
                                    <strong>Match Score:</strong> {billMatch.matchScore}/100
                                  </div>
                                </div>
                              </div>
                            )}
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

        <div className="timeline-footer">
          <span className="item-count">
            {filteredTimeline.length} item{filteredTimeline.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  )
}

export default SpendingAndBills
