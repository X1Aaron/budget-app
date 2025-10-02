import { useMemo, useState } from 'react'
import '../../../styles/components/Dashboard.css'
import { getCategoryColor } from '../../../utils/categories'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { calculateMonthStartingBalance } from '../../../utils/balanceCalculations'
import { useTheme } from '../../../contexts/ThemeContext'

function Dashboard({
  transactions,
  categories,
  bills = [],
  recurringIncomes = [],
  selectedYear,
  selectedMonth,
  accountStartingBalance,
  onDateChange,
  onMarkBillPaid,
  onNavigate,
  onImportDemoData
}) {
  const { theme } = useTheme()
  const [categoryFilter, setCategoryFilter] = useState('all') // 'all', 'over-budget', 'approaching'

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

  // Calculate actionable items for alerts
  const alerts = useMemo(() => {
    const unlinkedCount = monthlyTransactions.filter(t => !t.billId && t.amount < 0).length
    const uncategorizedCount = monthlyTransactions.filter(t => !t.category || t.category === 'Uncategorized').length

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const unpaidBillsThisMonth = bills.filter(bill => {
      if (bill.isPaid) return false
      const dueDate = new Date(bill.dueDate)
      return dueDate.getFullYear() === selectedYear && dueDate.getMonth() === selectedMonth
    }).length

    const overdueBills = bills.filter(bill => {
      if (bill.isPaid) return false
      const dueDate = new Date(bill.dueDate)
      dueDate.setHours(0, 0, 0, 0)
      return dueDate < today
    }).length

    const overBudgetCategories = categories.filter(cat => {
      if (cat.budgeted <= 0) return false
      const categoryAmount = summary.categoryBreakdown[cat.name] || 0
      const spent = categoryAmount < 0 ? Math.abs(categoryAmount) : 0
      return spent > cat.budgeted
    }).length

    const missingStartingBalance = accountStartingBalance === 0
    const noRecurringIncome = recurringIncomes.length === 0 && monthlyTransactions.length > 0
    const noBudgetedCategories = categories.length > 0 && categories.every(cat => (cat.budgeted || 0) === 0)

    return {
      unlinkedCount,
      uncategorizedCount,
      unpaidBillsThisMonth,
      overdueBills,
      overBudgetCategories,
      missingStartingBalance,
      noRecurringIncome,
      noBudgetedCategories
    }
  }, [monthlyTransactions, bills, categories, summary.categoryBreakdown, selectedYear, selectedMonth, accountStartingBalance, recurringIncomes])

  // Calculate starting balance for this month (used in multiple places)
  const monthStartingBalance = useMemo(() => {
    return calculateMonthStartingBalance(
      accountStartingBalance,
      transactions,
      selectedYear,
      selectedMonth
    )
  }, [accountStartingBalance, transactions, selectedYear, selectedMonth])

  const cashFlowData = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()
    const data = []

    // Use the pre-calculated starting balance
    const startingBalance = monthStartingBalance

    // Generate all recurring bills for the selected month
    const monthlyBills = []
    const monthlyIncomes = []

    // Process recurring incomes
    recurringIncomes.forEach(income => {
      const startDate = new Date(income.startDate)
      const startDay = startDate.getDate()
      const startMonth = startDate.getMonth()
      const startYear = startDate.getFullYear()

      if (income.frequency === 'weekly') {
        const weekMs = 7 * 24 * 60 * 60 * 1000
        let currentDate = new Date(startDate)
        const monthEnd = new Date(selectedYear, selectedMonth + 1, 0)
        const monthStart = new Date(selectedYear, selectedMonth, 1)

        while (currentDate <= monthEnd) {
          if (currentDate >= monthStart && currentDate >= startDate) {
            monthlyIncomes.push({
              day: currentDate.getDate(),
              amount: income.amount
            })
          }
          currentDate = new Date(currentDate.getTime() + weekMs)
        }
      } else if (income.frequency === 'bi-weekly') {
        const biWeekMs = 14 * 24 * 60 * 60 * 1000
        let currentDate = new Date(startDate)
        const monthEnd = new Date(selectedYear, selectedMonth + 1, 0)
        const monthStart = new Date(selectedYear, selectedMonth, 1)

        while (currentDate <= monthEnd) {
          if (currentDate >= monthStart && currentDate >= startDate) {
            monthlyIncomes.push({
              day: currentDate.getDate(),
              amount: income.amount
            })
          }
          currentDate = new Date(currentDate.getTime() + biWeekMs)
        }
      } else if (income.frequency === 'monthly') {
        if (new Date(selectedYear, selectedMonth, startDay) >= startDate) {
          monthlyIncomes.push({
            day: startDay <= daysInMonth ? startDay : daysInMonth,
            amount: income.amount
          })
        }
      } else if (income.frequency === 'quarterly') {
        for (let quarter = 0; quarter < 4; quarter++) {
          const month = startMonth + (quarter * 3)
          if (month === selectedMonth) {
            if (new Date(selectedYear, selectedMonth, startDay) >= startDate) {
              monthlyIncomes.push({
                day: startDay <= daysInMonth ? startDay : daysInMonth,
                amount: income.amount
              })
            }
          }
        }
      } else if (income.frequency === 'yearly') {
        if (startMonth === selectedMonth) {
          if (new Date(selectedYear, selectedMonth, startDay) >= startDate) {
            monthlyIncomes.push({
              day: startDay <= daysInMonth ? startDay : daysInMonth,
              amount: income.amount
            })
          }
        }
      }
    })

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

    // Group transactions by day
    const dailyTransactions = {}
    monthlyTransactions.forEach(t => {
      const day = new Date(t.date).getDate()
      if (!dailyTransactions[day]) {
        dailyTransactions[day] = 0
      }
      dailyTransactions[day] += t.amount
    })

    // Calculate cumulative cash flow for each day, starting with the starting balance
    let balance = startingBalance
    for (let day = 1; day <= daysInMonth; day++) {
      // Add transactions for this day (income is positive, expenses are negative)
      const transactionsAmount = dailyTransactions[day] || 0
      balance += transactionsAmount

      // Add recurring income for this day
      const incomesToday = monthlyIncomes.filter(i => i.day === day)
      const incomeAmount = incomesToday.reduce((sum, i) => sum + i.amount, 0)
      balance += incomeAmount

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
  }, [bills, recurringIncomes, selectedYear, selectedMonth, monthlyTransactions, monthStartingBalance])

  const filteredCategories = useMemo(() => {
    return categories
      .filter(cat => cat.budgeted > 0)
      .filter(cat => {
        if (categoryFilter === 'all') return true

        const categoryAmount = summary.categoryBreakdown[cat.name] || 0
        const spent = categoryAmount < 0 ? Math.abs(categoryAmount) : 0
        const difference = cat.budgeted - spent

        if (categoryFilter === 'over-budget') {
          return difference < 0
        } else if (categoryFilter === 'approaching') {
          return spent >= cat.budgeted * 0.8 && difference >= 0
        }
        return true
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [categories, categoryFilter, summary.categoryBreakdown])

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

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // Theme-aware chart colors
  const chartColors = {
    text: theme === 'dark' ? '#e5e7eb' : '#374151',
    grid: theme === 'dark' ? '#374151' : '#e5e7eb',
    line: theme === 'dark' ? '#60a5fa' : '#8884d8',
    tooltipBg: theme === 'dark' ? '#1f2937' : '#ffffff',
    tooltipBorder: theme === 'dark' ? '#374151' : '#e5e7eb'
  }

  return (
    <div className="dashboard">
      {/* Action Items Section */}
      {(alerts.unlinkedCount > 0 || alerts.uncategorizedCount > 0 || alerts.unpaidBillsThisMonth > 0 || alerts.overdueBills > 0 || alerts.overBudgetCategories > 0 || alerts.missingStartingBalance || alerts.noRecurringIncome || alerts.noBudgetedCategories || monthlyTransactions.length === 0 || categories.length === 0 || bills.length === 0) && (
        <div className="action-alerts">
          <h2>Action Items</h2>
          <div className="alerts-grid">
            {alerts.missingStartingBalance && (
              <div className="alert-card alert-info">
                <div className="alert-icon">💰</div>
                <div className="alert-content">
                  <div className="alert-title">Set Starting Balance</div>
                  <div className="alert-description">Set your account balance when you started tracking for accurate cash flow</div>
                </div>
                <button className="alert-action" onClick={() => onNavigate?.('settings')}>Set Balance</button>
              </div>
            )}
            {monthlyTransactions.length === 0 && (
              <div className="alert-card alert-info">
                <div className="alert-icon">📊</div>
                <div className="alert-content">
                  <div className="alert-title">No Transactions Yet</div>
                  <div className="alert-description">Import your bank transactions or try demo data</div>
                </div>
                <div className="alert-actions">
                  <button className="alert-action" onClick={() => onNavigate?.('transactions')}>Import</button>
                  {onImportDemoData && (
                    <button className="alert-action alert-action-secondary" onClick={onImportDemoData}>Demo Data</button>
                  )}
                </div>
              </div>
            )}
            {categories.length === 0 && (
              <div className="alert-card alert-info">
                <div className="alert-icon">🏷️</div>
                <div className="alert-content">
                  <div className="alert-title">Set Up Categories</div>
                  <div className="alert-description">Create categories to organize your budget</div>
                </div>
                <button className="alert-action" onClick={() => onNavigate?.('categories')}>Set Up</button>
              </div>
            )}
            {bills.length === 0 && monthlyTransactions.length > 0 && (
              <div className="alert-card alert-info">
                <div className="alert-icon">📄</div>
                <div className="alert-content">
                  <div className="alert-title">Add Your Bills</div>
                  <div className="alert-description">Track recurring payments</div>
                </div>
                <button className="alert-action" onClick={() => onNavigate?.('bills')}>Add Bills</button>
              </div>
            )}
            {alerts.noRecurringIncome && (
              <div className="alert-card alert-info">
                <div className="alert-icon">💵</div>
                <div className="alert-content">
                  <div className="alert-title">Add Recurring Income</div>
                  <div className="alert-description">Track your regular income sources for accurate projections</div>
                </div>
                <button className="alert-action" onClick={() => onNavigate?.('income')}>Add Income</button>
              </div>
            )}
            {alerts.noBudgetedCategories && (
              <div className="alert-card alert-info">
                <div className="alert-icon">🎯</div>
                <div className="alert-content">
                  <div className="alert-title">Set Category Budgets</div>
                  <div className="alert-description">Assign budgets to your categories to track spending</div>
                </div>
                <button className="alert-action" onClick={() => onNavigate?.('categories')}>Set Budgets</button>
              </div>
            )}
            {alerts.overdueBills > 0 && (
              <div className="alert-card alert-danger">
                <div className="alert-icon">🚨</div>
                <div className="alert-content">
                  <div className="alert-title">{alerts.overdueBills} Overdue Bill{alerts.overdueBills !== 1 ? 's' : ''}</div>
                  <div className="alert-description">You have bill{alerts.overdueBills !== 1 ? 's' : ''} past the due date</div>
                </div>
                <button className="alert-action" onClick={() => onNavigate?.('bills')}>View</button>
              </div>
            )}
            {alerts.uncategorizedCount > 0 && (
              <div className="alert-card alert-warning">
                <div className="alert-icon">⚠️</div>
                <div className="alert-content">
                  <div className="alert-title">{alerts.uncategorizedCount} Uncategorized Transaction{alerts.uncategorizedCount !== 1 ? 's' : ''}</div>
                  <div className="alert-description">Review and categorize your transactions</div>
                </div>
                <button className="alert-action" onClick={() => onNavigate?.('transactions')}>Review</button>
              </div>
            )}
            {alerts.overBudgetCategories > 0 && (
              <div className="alert-card alert-danger">
                <div className="alert-icon">🚨</div>
                <div className="alert-content">
                  <div className="alert-title">{alerts.overBudgetCategories} Categor{alerts.overBudgetCategories !== 1 ? 'ies' : 'y'} Over Budget</div>
                  <div className="alert-description">You've exceeded your budget in {alerts.overBudgetCategories} categor{alerts.overBudgetCategories !== 1 ? 'ies' : 'y'}</div>
                </div>
                <button className="alert-action" onClick={() => setCategoryFilter('over-budget')}>View</button>
              </div>
            )}
            {alerts.unpaidBillsThisMonth > 0 && (
              <div className="alert-card alert-warning">
                <div className="alert-icon">💳</div>
                <div className="alert-content">
                  <div className="alert-title">{alerts.unpaidBillsThisMonth} Unpaid Bill{alerts.unpaidBillsThisMonth !== 1 ? 's' : ''}</div>
                  <div className="alert-description">You have bills due this month</div>
                </div>
                <button className="alert-action" onClick={() => onNavigate?.('bills')}>Pay</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card starting-balance">
          <h3>Starting Balance</h3>
          <p className="amount">{formatCurrency(monthStartingBalance)}</p>
          <p className="card-subtitle">Balance at start of {monthNames[selectedMonth]}</p>
        </div>
        <div className={`summary-card balance ${summary.balance >= 0 ? 'positive' : 'negative'}`}>
          <h3>Net Cash Flow</h3>
          <p className="amount">{formatCurrency(summary.balance)}</p>
          <p className="card-subtitle">{summary.balance >= 0 ? 'Surplus' : 'Deficit'} this month</p>
        </div>
        <div className="summary-card expenses">
          <h3>Total Spending</h3>
          <p className="amount">{formatCurrency(summary.expenses)}</p>
          <p className="card-subtitle">
            <span className="spending-breakdown">Need: {formatCurrency(summary.necessarySpending)} · Want: {formatCurrency(summary.discretionarySpending)}</span>
          </p>
        </div>
      </div>

      {upcomingBills.length > 0 && (
        <div className="upcoming-bills-section">
          <div className="bills-header">
            <h2>Upcoming Bills (Next 7 Days)</h2>
            <div className="bills-total">Total: {formatCurrency(upcomingBills.reduce((sum, b) => sum + b.amount, 0))}</div>
          </div>
          <div className="upcoming-bills-list">
            {upcomingBills.map((bill) => {
              const dueDate = new Date(bill.dueDate)
              const today = new Date()
              today.setHours(0, 0, 0, 0)
              dueDate.setHours(0, 0, 0, 0)

              const isOverdue = dueDate < today
              const isDueToday = dueDate.getTime() === today.getTime()

              let urgencyClass = 'upcoming'
              if (isOverdue) urgencyClass = 'overdue'
              else if (isDueToday) urgencyClass = 'due-today'

              return (
                <div key={bill.id} className={`upcoming-bill-item ${urgencyClass}`}>
                  <div className="bill-info">
                    <div className="bill-name">{bill.name}</div>
                    <div className="bill-due">Due {formatDate(bill.dueDate)}</div>
                  </div>
                  <div className="bill-amount">{formatCurrency(bill.amount)}</div>
                  {onMarkBillPaid && (
                    <button
                      className="mark-paid-btn"
                      onClick={() => onMarkBillPaid(bill.id, bill.dueDate)}
                      title="Mark as paid"
                    >
                      ✓
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="cash-flow-section">
        <h2>Cash Flow for {monthNames[selectedMonth]}</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={cashFlowData}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
            <XAxis
              dataKey="date"
              label={{ value: 'Day of Month', position: 'insideBottom', offset: -5, fill: chartColors.text }}
              tick={{ fill: chartColors.text }}
            />
            <YAxis
              label={{ value: 'Balance ($)', angle: -90, position: 'insideLeft', fill: chartColors.text }}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
              tick={{ fill: chartColors.text }}
            />
            <Tooltip
              formatter={(value) => [`$${value.toLocaleString()}`, 'Balance']}
              labelFormatter={(label) => `Date: ${label}`}
              contentStyle={{
                backgroundColor: chartColors.tooltipBg,
                border: `1px solid ${chartColors.tooltipBorder}`,
                color: chartColors.text
              }}
            />
            <ReferenceLine y={0} stroke="#e74c3c" strokeWidth={2} strokeDasharray="3 3" />
            <Line
              type="monotone"
              dataKey="balance"
              stroke={chartColors.line}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="categories-section">
        <div className="categories-header">
          <h2>Category Budgets</h2>
          <div className="category-filters">
            <button
              className={`filter-btn ${categoryFilter === 'all' ? 'active' : ''}`}
              onClick={() => setCategoryFilter('all')}
            >
              All
            </button>
            <button
              className={`filter-btn ${categoryFilter === 'over-budget' ? 'active' : ''}`}
              onClick={() => setCategoryFilter('over-budget')}
            >
              Over Budget
            </button>
            <button
              className={`filter-btn ${categoryFilter === 'approaching' ? 'active' : ''}`}
              onClick={() => setCategoryFilter('approaching')}
            >
              Approaching (≥80%)
            </button>
          </div>
        </div>
        <div className="categories-table-container">
          <table className="categories-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Spent</th>
                <th>Budget</th>
                <th>Remaining</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.length === 0 && (
                <tr>
                  <td colSpan="5" className="empty-state">
                    {categoryFilter === 'over-budget' && 'No categories are over budget'}
                    {categoryFilter === 'approaching' && 'No categories are approaching their budget limit'}
                    {categoryFilter === 'all' && 'No budgeted categories yet'}
                  </td>
                </tr>
              )}
              {filteredCategories.map((categoryObj) => {
                  const category = categoryObj.name
                  const color = getCategoryColor(category, categories)
                  const budgeted = categoryObj.budgeted || 0
                  const categoryAmount = summary.categoryBreakdown[category] || 0
                  const spent = categoryAmount < 0 ? Math.abs(categoryAmount) : 0
                  const difference = budgeted - spent
                  const isOverBudget = difference < 0

                  return (
                    <tr key={category}>
                      <td className="category-name-cell">
                        <span className="category-color-dot" style={{ backgroundColor: color }}></span>
                        <span className="category-name" style={{ color }}>{category}</span>
                      </td>
                      <td className="spent-cell">{formatCurrency(spent)}</td>
                      <td className="budget-cell">{budgeted === 0 ? '—' : formatCurrency(budgeted)}</td>
                      <td className={'remaining-cell ' + (budgeted === 0 ? '' : isOverBudget ? 'over-budget' : 'under-budget')}>
                        {budgeted === 0 ? '—' : formatCurrency(Math.abs(difference))}
                      </td>
                      <td className="progress-cell">
                        {budgeted > 0 ? (
                          <div className="category-progress">
                            <div className="progress-bar-container">
                              <div className="progress-bar">
                                <div
                                  className={'progress-fill ' + (isOverBudget ? 'over-budget' : spent >= budgeted * 0.75 ? 'approaching-budget' : '')}
                                  style={{ width: `${Math.min((spent / budgeted) * 100, 150)}%` }}
                                ></div>
                                <div className="progress-100-marker"></div>
                              </div>
                              <div className="progress-labels">
                                <span className="progress-label">$0</span>
                                <span className="progress-label budget-marker">${budgeted.toLocaleString()}</span>
                              </div>
                            </div>
                            <span className={'progress-text ' + (isOverBudget ? 'over-budget-text' : '')}>
                              {Math.round((spent / budgeted) * 100)}%
                            </span>
                          </div>
                        ) : (
                          <span className="no-budget-text">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}

export default Dashboard