import { useMemo, useState } from 'react'
import './Overview.css'
import { getCategoryColor } from '../utils/categories'
import CategoryPieChart from './CategoryPieChart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts'

function Overview({
  transactions,
  categories,
  bills = [],
  selectedYear,
  selectedMonth,
  monthlyBudgets,
  monthlyStartingBalances,
  onDateChange,
  onUpdateBudget,
  onUpdateStartingBalance,
  currentBalance = 0
}) {
  const [isEditingBudget, setIsEditingBudget] = useState(false)
  const [budgetInput, setBudgetInput] = useState('')
  const [isEditingStartingBalance, setIsEditingStartingBalance] = useState(false)
  const [startingBalanceInput, setStartingBalanceInput] = useState('')

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

    // Calculate necessary vs discretionary spending
    const necessarySpending = monthlyTransactions
      .filter(t => {
        if (t.amount >= 0) return false
        const category = categories.find(cat => cat.name === t.category)
        return category?.needWant === 'need'
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    const discretionarySpending = monthlyTransactions
      .filter(t => {
        if (t.amount >= 0) return false
        const category = categories.find(cat => cat.name === t.category)
        return category?.needWant === 'want'
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    return { income, expenses, balance, categoryBreakdown, necessarySpending, discretionarySpending }
  }, [monthlyTransactions, categories])

  const currentBudget = useMemo(() => {
    const key = `${selectedYear}-${selectedMonth}`
    return monthlyBudgets[key] || 0
  }, [monthlyBudgets, selectedYear, selectedMonth])

  const currentStartingBalance = useMemo(() => {
    const key = `${selectedYear}-${selectedMonth}`
    return monthlyStartingBalances[key] || 0
  }, [monthlyStartingBalances, selectedYear, selectedMonth])

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

  const categorySpendingData = useMemo(() => {
    // Group transactions by day and category
    const dailySpending = {}

    monthlyTransactions.forEach(t => {
      if (t.amount < 0) { // Only expenses
        const day = new Date(t.date).getDate()
        const category = t.category || 'Uncategorized'

        if (!dailySpending[day]) {
          dailySpending[day] = { day, date: `${selectedMonth + 1}/${day}` }
        }

        if (!dailySpending[day][category]) {
          dailySpending[day][category] = 0
        }

        dailySpending[day][category] += Math.abs(t.amount)
      }
    })

    // Convert to array and sort by day
    const data = Object.values(dailySpending).sort((a, b) => a.day - b.day)

    return data
  }, [monthlyTransactions, selectedMonth])

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

  const handleSaveStartingBalance = () => {
    const balance = parseFloat(startingBalanceInput)
    if (!isNaN(balance)) {
      onUpdateStartingBalance(selectedYear, selectedMonth, balance)
      setIsEditingStartingBalance(false)
    }
  }

  const handleEditStartingBalance = () => {
    // Auto-calculate from previous month if current is 0
    if (currentStartingBalance === 0) {
      const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1
      const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear
      const prevKey = `${prevYear}-${prevMonth}`
      const prevStartingBalance = monthlyStartingBalances[prevKey] || 0

      // Get all transactions from previous month
      const prevMonthTransactions = transactions.filter(t => {
        const date = new Date(t.date)
        return date.getFullYear() === prevYear && date.getMonth() === prevMonth
      })

      // Calculate ending balance of previous month
      const prevMonthTotal = prevMonthTransactions.reduce((sum, t) => sum + t.amount, 0)
      const calculatedStartingBalance = prevStartingBalance + prevMonthTotal

      setStartingBalanceInput(calculatedStartingBalance.toString())
    } else {
      setStartingBalanceInput(currentStartingBalance.toString())
    }
    setIsEditingStartingBalance(true)
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

      <div className="summary-cards">
        <div className="summary-card necessary">
          <h3>Necessary Spending</h3>
          <p className="amount">{formatCurrency(summary.necessarySpending)}</p>
        </div>
        <div className="summary-card discretionary">
          <h3>Discretionary Spending</h3>
          <p className="amount">{formatCurrency(summary.discretionarySpending)}</p>
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

      <div className="cash-flow-section">
        <h2>Category Spending Over Time</h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={categorySpendingData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              label={{ value: 'Day of Month', position: 'insideBottom', offset: -5 }}
            />
            <YAxis
              label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft' }}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
            />
            <Tooltip
              formatter={(value) => `$${value.toLocaleString()}`}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend />
            {Array.from(new Set(monthlyTransactions.filter(t => t.amount < 0).map(t => t.category || 'Uncategorized'))).map(category => {
              const color = getCategoryColor(category, categories)
              return (
                <Line
                  key={category}
                  type="monotone"
                  dataKey={category}
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                />
              )
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <CategoryPieChart transactions={monthlyTransactions} categories={categories} />

      <div className="categories-section">
        <h2>Categories</h2>
        <div className="categories-list">
          {Object.entries(summary.categoryBreakdown)
            .filter(([category, amount]) => amount < 0)
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