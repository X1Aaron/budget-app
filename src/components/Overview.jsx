import { useMemo } from 'react'
import './Overview.css'
import { getCategoryColor } from '../utils/categories'
import CategoryPieChart from './CategoryPieChart'

function Overview({ transactions, categories }) {
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
      <div className="overview-empty">
        <p>No transactions yet. Import a CSV file to get started.</p>
      </div>
    )
  }

  return (
    <div className="overview">
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

      <CategoryPieChart transactions={transactions} categories={categories} />

      <div className="categories-section">
        <h2>Categories</h2>
        <div className="categories-list">
          {Object.entries(summary.categoryBreakdown)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([category, amount]) => {
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
    </div>
  )
}

export default Overview