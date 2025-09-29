import { useMemo, useState } from 'react'
import './BudgetDashboard.css'
import { getCategoryColor } from '../utils/categories'

function BudgetDashboard({ transactions, categories, onUpdateTransaction }) {
  const [editingIndex, setEditingIndex] = useState(null)

  const summary = useMemo(() => {
    const income = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)
    
    const expenses = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    
    const balance = income - expenses

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

      <div className="categories-section">
        <h2>Categories</h2>
        <div className="categories-list">
          {Object.entries(summary.categoryBreakdown).map(([category, amount]) => {
            const color = getCategoryColor(category, categories)
            return (
              <div
                key={category}
                className={'category-item ' + (amount < 0 ? 'expense' : 'income')}
                style={{ borderLeftColor: color }}
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
        <h2>Transactions</h2>
        <div className="transactions-list">
          {transactions.map((transaction, index) => {
            const color = getCategoryColor(transaction.category, categories)
            const isEditing = editingIndex === index

            return (
              <div
                key={index}
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
                          onUpdateTransaction(index, { ...transaction, category: e.target.value })
                          setEditingIndex(null)
                        }}
                        onBlur={() => setEditingIndex(null)}
                        autoFocus
                      >
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className="transaction-category editable"
                        onClick={() => setEditingIndex(index)}
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
