import { useMemo, useState } from 'react'
import './Spending.css'
import { getCategoryColor } from '../utils/categories'

function Spending({
  transactions,
  categories,
  selectedYear,
  selectedMonth,
  onDateChange,
  onUpdateTransaction,
  startingBalances,
  onUpdateStartingBalance
}) {
  const [editingIndex, setEditingIndex] = useState(null)
  const [filterCategory, setFilterCategory] = useState('all')
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [editingStartingBalance, setEditingStartingBalance] = useState(false)

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

  // Get starting balance for the current month
  const currentStartingBalance = useMemo(() => {
    const key = `${selectedYear}-${selectedMonth}`
    return startingBalances[key] || 0
  }, [startingBalances, selectedYear, selectedMonth])

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

  const handleStartingBalanceSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const balance = parseFloat(formData.get('startingBalance'))
    if (!isNaN(balance)) {
      onUpdateStartingBalance(selectedYear, selectedMonth, balance)
      setEditingStartingBalance(false)
    }
  }

  return (
    <div className="spending">
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
            {!editingStartingBalance ? (
              <div className="starting-balance-display">
                <span className="starting-balance-label">Starting Balance:</span>
                <span className="starting-balance-value">{formatCurrency(currentStartingBalance)}</span>
                <button
                  className="edit-balance-btn"
                  onClick={() => setEditingStartingBalance(true)}
                >
                  Edit
                </button>
              </div>
            ) : (
              <form onSubmit={handleStartingBalanceSubmit} className="starting-balance-form">
                <input
                  type="number"
                  name="startingBalance"
                  step="0.01"
                  defaultValue={currentStartingBalance}
                  placeholder="Enter starting balance"
                  className="starting-balance-input"
                  autoFocus
                />
                <div className="balance-form-buttons">
                  <button type="submit" className="save-balance-btn">Save</button>
                  <button
                    type="button"
                    className="cancel-balance-btn"
                    onClick={() => setEditingStartingBalance(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
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
                <th onClick={() => handleSort('date')} className="sortable">
                  Date
                  <span className="sort-arrow">
                    {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? ' ↑' : ' ↓')}
                  </span>
                </th>
                <th onClick={() => handleSort('description')} className="sortable">
                  Description
                  <span className="sort-arrow">
                    {sortConfig.key === 'description' && (sortConfig.direction === 'asc' ? ' ↑' : ' ↓')}
                  </span>
                </th>
                <th onClick={() => handleSort('category')} className="sortable">
                  Category
                  <span className="sort-arrow">
                    {sortConfig.key === 'category' && (sortConfig.direction === 'asc' ? ' ↑' : ' ↓')}
                  </span>
                </th>
                <th onClick={() => handleSort('amount')} className="sortable">
                  Amount
                  <span className="sort-arrow">
                    {sortConfig.key === 'amount' && (sortConfig.direction === 'asc' ? ' ↑' : ' ↓')}
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
                const isEditing = editingIndex === originalIndex
                const isUncategorized = !transaction.category || transaction.category === 'Uncategorized'

                return (
                  <tr
                    key={originalIndex}
                    className={'transaction-row ' + (transaction.amount < 0 ? 'expense' : 'income') + (isUncategorized ? ' uncategorized' : '')}
                  >
                    <td className="transaction-date">{transaction.date}</td>
                    <td className="transaction-description">{transaction.description}</td>
                    <td className="transaction-category-cell">
                      {isEditing ? (
                        <select
                          className="category-select"
                          value={transaction.category || 'Uncategorized'}
                          onChange={(e) => {
                            onUpdateTransaction(originalIndex, {
                              ...transaction,
                              category: e.target.value,
                              autoCategorized: false
                            })
                            setEditingIndex(null)
                          }}
                          autoFocus
                        >
                          <option value="Uncategorized">Uncategorized</option>
                          {[...categories].sort((a, b) => a.name.localeCompare(b.name)).map(cat => (
                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={'transaction-category editable' + (isUncategorized ? ' uncategorized-label' : '')}
                          onClick={() => setEditingIndex(originalIndex)}
                          style={{ color }}
                        >
                          <span className="category-dot" style={{ backgroundColor: color }}></span>
                          {transaction.category || 'Uncategorized'}
                          {transaction.autoCategorized && <span className="auto-icon" title="Auto-categorized"> 🤖</span>}
                          {isUncategorized && <span className="warning-icon"> ⚠️</span>}
                        </span>
                      )}
                    </td>
                    <td className={'transaction-amount ' + (transaction.amount < 0 ? 'negative' : 'positive')}>
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className={'transaction-balance ' + (transaction.runningBalance < 0 ? 'negative' : 'positive')}>
                      {formatCurrency(transaction.runningBalance)}
                    </td>
                  </tr>
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