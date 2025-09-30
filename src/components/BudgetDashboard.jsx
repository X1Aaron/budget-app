import { useMemo, useState } from 'react'
import './BudgetDashboard.css'
import { getCategoryColor } from '../utils/categories'

function BudgetDashboard({ transactions, categories, onUpdateTransaction }) {
  const [editingIndex, setEditingIndex] = useState(null)
  const [filterCategory, setFilterCategory] = useState('all')

  const filteredTransactions = useMemo(() => {
    if (filterCategory === 'all') return transactions
    return transactions.filter(t => t.category === filterCategory)
  }, [transactions, filterCategory])

  const summary = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)

    const expenses = filteredTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    const balance = income - expenses

    const categoryBreakdown = filteredTransactions.reduce((acc, t) => {
      const category = t.category || 'Uncategorized'
      if (!acc[category]) {
        acc[category] = 0
      }
      acc[category] += t.amount
      return acc
    }, {})

    return { income, expenses, balance, categoryBreakdown }
  }, [filteredTransactions])

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
        <div className="transactions-list">
          {filteredTransactions.map((transaction, filteredIndex) => {
            const originalIndex = transactions.findIndex(t => t === transaction)
            const color = getCategoryColor(transaction.category, categories)
            const isEditing = editingIndex === originalIndex

            return (
              <div
                key={originalIndex}
                className={'transaction-item ' + (transaction.amount < 0 ? 'expense' : 'income')}
                style={{ borderLeftColor: color }}
              >
                <div className="transaction-info">
                  <div className="transaction-description">{transaction.description}</div>
                  <div className="transaction-meta">
                    <span className="transaction-date">{transaction.date}</span>
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
                        {[...categories].sort((a, b) => a.name.localeCompare(b.name)).map(cat => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className="transaction-category editable"
                        onClick={() => setEditingIndex(originalIndex)}
                        style={{ color }}
                      >
                        <span className="category-dot" style={{ backgroundColor: color }}></span>
                        {transaction.category || 'Uncategorized'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="transaction-amount">
                  {formatCurrency(transaction.amount)}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default BudgetDashboard
