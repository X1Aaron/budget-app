import { useMemo, useState } from 'react'
import './Overview.css'
import { getCategoryColor } from '../utils/categories'
import CategoryPieChart from './CategoryPieChart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

function Overview({
  transactions,
  categories,
  bills = [],
  selectedYear,
  selectedMonth,
  monthlyBudgets,
  onDateChange,
  onUpdateBudget,
  currentBalance = 0
}) {
  const [isEditingBudget, setIsEditingBudget] = useState(false)
  const [budgetInput, setBudgetInput] = useState('')

  const monthlyTransactions = useMemo(() => {
    return transactions.filter(t => {
      const date = new Date(t.date)
      return date.getFullYear() === selectedYear && date.getMonth() === selectedMonth
    })
  }, [transactions, selectedYear, selectedMonth])

  const summary = useMemo(() => {
    const income = monthlyTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)

    const expenses = monthlyTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    const balance = income - expenses

    const categoryBreakdown = monthlyTransactions.reduce((acc, t) => {
      const category = t.category || 'Uncategorized'
      if (!acc[category]) {
        acc[category] = 0
      }
      acc[category] += t.amount
      return acc
    }, {})

    return { income, expenses, balance, categoryBreakdown }
  }, [monthlyTransactions])

  const currentBudget = useMemo(() => {
    const key = `${selectedYear}-${selectedMonth}`
    return monthlyBudgets[key] || 0
  }, [monthlyBudgets, selectedYear, selectedMonth])

  const upcomingBills = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)

    return bills
      .filter(bill => {
        if (bill.isPaid) return false
        const dueDate = new Date(bill.dueDate)
        dueDate.setHours(0, 0, 0, 0)
        return dueDate >= today && dueDate <= nextWeek
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
  }, [bills])

  const cashFlowData = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()
    const data = []

    // Generate all recurring bills for the selected month
    const monthlyBills = []
    bills.forEach(bill => {
      const startDate = new Date(bill.dueDate)
      const billYear = startDate.getFullYear()
      const billMonth = startDate.getMonth()
      const billDay = startDate.getDate()

      if (bill.frequency === 'one-time') {
        const billDate = new Date(bill.dueDate)
        if (billDate.getFullYear() === selectedYear && billDate.getMonth() === selectedMonth) {
          const isPaid = (bill.paidDates || []).includes(bill.dueDate)
          if (!isPaid) {
            monthlyBills.push({
              day: billDate.getDate(),
              amount: bill.amount
            })
          }
        }
      } else if (bill.frequency === 'monthly') {
        // Check if this bill occurs in the selected month
        if (new Date(selectedYear, selectedMonth, billDay) >= startDate) {
          const occurrenceDate = new Date(selectedYear, selectedMonth, billDay).toISOString().split('T')[0]
          const isPaid = (bill.paidDates || []).includes(occurrenceDate)
          if (!isPaid) {
            monthlyBills.push({
              day: billDay <= daysInMonth ? billDay : daysInMonth,
              amount: bill.amount
            })
          }
        }
      } else if (bill.frequency === 'yearly') {
        if (billMonth === selectedMonth) {
          if (new Date(selectedYear, selectedMonth, billDay) >= startDate) {
            const occurrenceDate = new Date(selectedYear, selectedMonth, billDay).toISOString().split('T')[0]
            const isPaid = (bill.paidDates || []).includes(occurrenceDate)
            if (!isPaid) {
              monthlyBills.push({
                day: billDay <= daysInMonth ? billDay : daysInMonth,
                amount: bill.amount
              })
            }
          }
        }
      } else if (bill.frequency === 'quarterly') {
        for (let quarter = 0; quarter < 4; quarter++) {
          const month = billMonth + (quarter * 3)
          if (month === selectedMonth) {
            if (new Date(selectedYear, selectedMonth, billDay) >= startDate) {
              const occurrenceDate = new Date(selectedYear, selectedMonth, billDay).toISOString().split('T')[0]
              const isPaid = (bill.paidDates || []).includes(occurrenceDate)
              if (!isPaid) {
                monthlyBills.push({
                  day: billDay <= daysInMonth ? billDay : daysInMonth,
                  amount: bill.amount
                })
              }
            }
          }
        }
      } else if (bill.frequency === 'weekly') {
        const weekMs = 7 * 24 * 60 * 60 * 1000
        let currentDate = new Date(startDate)
        const monthEnd = new Date(selectedYear, selectedMonth + 1, 0)
        const monthStart = new Date(selectedYear, selectedMonth, 1)

        while (currentDate <= monthEnd) {
          if (currentDate >= monthStart && currentDate >= startDate) {
            const occurrenceDate = currentDate.toISOString().split('T')[0]
            const isPaid = (bill.paidDates || []).includes(occurrenceDate)
            if (!isPaid) {
              monthlyBills.push({
                day: currentDate.getDate(),
                amount: bill.amount
              })
            }
          }
          currentDate = new Date(currentDate.getTime() + weekMs)
        }
      }
    })

    // Calculate cumulative cash flow for each day
    let balance = currentBalance
    for (let day = 1; day <= daysInMonth; day++) {
      // Subtract bills due on this day
      const billsToday = monthlyBills.filter(b => b.day === day)
      const billsAmount = billsToday.reduce((sum, b) => sum + b.amount, 0)
      balance -= billsAmount

      data.push({
        day,
        balance: Math.round(balance * 100) / 100,
        date: `${selectedMonth + 1}/${day}`
      })
    }

    return data
  }, [bills, currentBalance, selectedYear, selectedMonth])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    date.setHours(0, 0, 0, 0)

    if (date.getTime() === today.getTime()) {
      return 'Today'
    } else if (date.getTime() === tomorrow.getTime()) {
      return 'Tomorrow'
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    }
  }

  const handlePreviousMonth = () => {
    if (selectedMonth === 0) {
      onDateChange(selectedYear - 1, 11)
    } else {
      onDateChange(selectedYear, selectedMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      onDateChange(selectedYear + 1, 0)
    } else {
      onDateChange(selectedYear, selectedMonth + 1)
    }
  }

  const handleSaveBudget = () => {
    const budget = parseFloat(budgetInput)
    if (!isNaN(budget) && budget >= 0) {
      onUpdateBudget(selectedYear, selectedMonth, budget)
      setIsEditingBudget(false)
    }
  }

  const handleEditBudget = () => {
    setBudgetInput(currentBudget.toString())
    setIsEditingBudget(true)
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const remaining = currentBudget - summary.expenses

  return (
    <div className="overview">
      <div className="month-selector">
        <button className="month-nav-btn" onClick={handlePreviousMonth}>
          ←
        </button>
        <h2 className="month-display">
          {monthNames[selectedMonth]} {selectedYear}
        </h2>
        <button className="month-nav-btn" onClick={handleNextMonth}>
          →
        </button>
      </div>

      <div className="budget-section">
        <div className="budget-card">
          <h3>Monthly Budget</h3>
          {isEditingBudget ? (
            <div className="budget-edit">
              <input
                type="number"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveBudget()}
                autoFocus
              />
              <button onClick={handleSaveBudget}>Save</button>
              <button onClick={() => setIsEditingBudget(false)}>Cancel</button>
            </div>
          ) : (
            <div className="budget-display" onClick={handleEditBudget}>
              <p className="amount">{formatCurrency(currentBudget)}</p>
              <span className="edit-hint">Click to edit</span>
            </div>
          )}
        </div>
        {currentBudget > 0 && (
          <div className={'budget-card ' + (remaining >= 0 ? 'positive' : 'negative')}>
            <h3>Remaining</h3>
            <p className="amount">{formatCurrency(remaining)}</p>
          </div>
        )}
      </div>

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
          <h3>Difference</h3>
          <p className="amount">{formatCurrency(summary.balance)}</p>
        </div>
      </div>

      {upcomingBills.length > 0 && (
        <div className="upcoming-bills-section">
          <h2>Bills in the Next 7 Days</h2>
          <div className="upcoming-bills-list">
            {upcomingBills.map((bill) => (
              <div key={bill.id} className="upcoming-bill-item">
                <div className="bill-info">
                  <div className="bill-name">{bill.name}</div>
                  <div className="bill-due">Due {formatDate(bill.dueDate)}</div>
                </div>
                <div className="bill-amount">{formatCurrency(bill.amount)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="cash-flow-section">
        <h2>Cash Flow for {monthNames[selectedMonth]}</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={cashFlowData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              label={{ value: 'Day of Month', position: 'insideBottom', offset: -5 }}
            />
            <YAxis
              label={{ value: 'Balance ($)', angle: -90, position: 'insideLeft' }}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
            />
            <Tooltip
              formatter={(value) => [`$${value.toLocaleString()}`, 'Balance']}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="balance"
              stroke="#8884d8"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <CategoryPieChart transactions={monthlyTransactions} categories={categories} />

      <div className="categories-section">
        <h2>Categories</h2>
        <div className="categories-list">
          {Object.entries(summary.categoryBreakdown)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([category, amount]) => {
              const color = getCategoryColor(category, categories)
              const categoryObj = categories.find(cat => cat.name === category)
              const budgeted = categoryObj?.budgeted || 0
              const spent = Math.abs(amount)
              const difference = budgeted - spent
              const isOverBudget = difference < 0

              return (
                <div
                  key={category}
                  className={'category-card ' + (amount < 0 ? 'expense' : 'income')}
                >
                  <div className="category-column">
                    <div className="category-header">
                      <div className="category-color-dot" style={{ backgroundColor: color }}></div>
                      <span className="category-name">{category}</span>
                    </div>
                  </div>
                  <div className="category-column">
                    <span className="detail-label">Spent</span>
                    <span className="detail-value">{formatCurrency(spent)}</span>
                  </div>
                  <div className="category-column">
                    <span className="detail-label">Budget</span>
                    <span className="detail-value">{formatCurrency(budgeted)}</span>
                  </div>
                  <div className="category-column">
                    <span className="detail-label">Difference</span>
                    {budgeted === 0 ? (
                      <span className="detail-value">No Budget</span>
                    ) : (
                      <span className={'detail-value ' + (isOverBudget ? 'over-budget' : 'under-budget')}>
                        {formatCurrency(Math.abs(difference))} {isOverBudget ? 'over' : 'left'}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}

export default Overview