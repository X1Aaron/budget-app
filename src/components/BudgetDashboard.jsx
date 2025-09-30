import { useMemo, useState } from 'react'
import './BudgetDashboard.css'
import { getCategoryColor } from '../utils/categories'
import CategoryPieChart from './CategoryPieChart'

function BudgetDashboard({ transactions, categories, onUpdateTransaction }) {
  const [editingIndex, setEditingIndex] = useState(null)
  const [filterCategory, setFilterCategory] = useState('all')
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })

  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const filteredTransactions = useMemo(() => {
    let filtered = filterCategory === 'all'
      ? [...transactions]
      : transactions.filter(t => t.category === filterCategory)

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key]
        let bVal = b[sortConfig.key]

        if (sortConfig.key === 'amount') {
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
  }, [transactions, filterCategory, sortConfig])

  const filteredTotal = useMemo(() => {
    return filteredTransactions.reduce((sum, t) => sum + t.amount, 0)
  }, [filteredTransactions])

  const summary = useMemo(() => {
    // Calculate totals from all transactions, not filtered
    const income = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)

    const expenses = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    const balance = income - expenses

    // Always show all categories, not just filtered ones
    const categoryBreakdown = transactions.reduce((acc, t) => {
      const category = t.category || 'Uncategorized'
      if (!acc[category]) {
        acc[category] = 0
      }
      acc[category] += t.amount
      return acc
    }, {})

    return { income, expenses, balance, categoryBreakdown }
  }, [transactions])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  if (transactions.length === 0) {
    return (
      <div className="dashboard-empty">
        <p>No transactions yet. Import a CSV file to get started.</p>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="summary-cards">
        <div className="summary-card income">
          <h3>Income</h3>
          <p className="amount">{formatCurrency(summary.income)}</p>
        </div>
        <div className="summary-card expenses">
          <h3>Expenses</h3>
          <p className="amount">{formatCurrency(summary.expenses)}</p>
        </div>
        <div className="summary-card balance">
          <h3>Balance</h3>
          <p className="amount">{formatCurrency(summary.balance)}</p>
        </div>
      </div>

      <CategoryPieChart categoryBreakdown={summary.categoryBreakdown} categories={categories} />

      <div className="categories-section">
        <h2>Categories</h2>
        <div className="categories-list">
          {Object.entries(summary.categoryBreakdown)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([category, amount]) => {
              const color = getCategoryColor(category, categories)
              const isActive = filterCategory === category
              return (
                <div
                  key={category}
                  className={'category-item ' + (amount < 0 ? 'expense' : 'income') + (isActive ? ' active' : '')}
                  style={{ borderLeftColor: color }}
                  onClick={() => setFilterCategory(filterCategory === category ? 'all' : category)}
                >
                  <div className="category-color-dot" style={{ backgroundColor: color }}></div>
                  <span className="category-name">{category}</span>
                  <span className="category-amount">{formatCurrency(amount)}</span>
                </div>
              )
            })}
        </div>
      </div>

      <div className="transactions-section">
        <div className="transactions-header">
          <h2>Transactions{filterCategory !== 'all' && ` - ${filterCategory}`}</h2>
          {filterCategory !== 'all' && (
            <button className="clear-filter-btn" onClick={() => setFilterCategory('all')}>
              Clear Filter
            </button>
          )}
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
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction, filteredIndex) => {
                const originalIndex = transactions.findIndex(t => t === transaction)
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
                          value={transaction.category}
                          onChange={(e) => {
                            onUpdateTransaction(originalIndex, { ...transaction, category: e.target.value })
                            setEditingIndex(null)
                          }}
                          onBlur={() => setTimeout(() => setEditingIndex(null), 200)}
                          autoFocus
                        >
                          <option value="Uncategorized">Select category</option>
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
                          {isUncategorized && <span className="warning-icon"> ⚠️</span>}
                        </span>
                      )}
                    </td>
                    <td className={'transaction-amount ' + (transaction.amount < 0 ? 'negative' : 'positive')}>
                      {formatCurrency(transaction.amount)}
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
    </div>
  )
}

export default BudgetDashboard
