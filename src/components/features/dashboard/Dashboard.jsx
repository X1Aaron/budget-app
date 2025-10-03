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
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null)

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

    // Consolidated setup check - only show if user needs initial setup
    const needsInitialSetup = monthlyTransactions.length === 0 || categories.length === 0 || bills.length === 0

    // Account basics setup - only show if has transactions but missing financial basics
    const needsAccountBasics = monthlyTransactions.length > 0 && (missingStartingBalance || noRecurringIncome)

    return {
      unlinkedCount,
      uncategorizedCount,
      unpaidBillsThisMonth,
      overdueBills,
      overBudgetCategories,
      missingStartingBalance,
      noRecurringIncome,
      noBudgetedCategories,
      needsInitialSetup,
      needsAccountBasics
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

    // Generate projected recurring income for the selected month
    const monthlyIncomes = []

    recurringIncomes.forEach(income => {
      const startDate = new Date(income.startDate)
      const startDay = startDate.getDate()
      const startMonth = startDate.getMonth()

      if (income.frequency === 'weekly') {
        const weekMs = 7 * 24 * 60 * 60 * 1000
        let currentDate = new Date(startDate)
        const monthEnd = new Date(selectedYear, selectedMonth + 1, 0)
        const monthStart = new Date(selectedYear, selectedMonth, 1)

        while (currentDate <= monthEnd) {
          if (currentDate >= monthStart && currentDate >= startDate) {
            monthlyIncomes.push({
              day: currentDate.getDate(),
              amount: income.amount,
              name: income.name
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
              amount: income.amount,
              name: income.name
            })
          }
          currentDate = new Date(currentDate.getTime() + biWeekMs)
        }
      } else if (income.frequency === 'monthly') {
        if (new Date(selectedYear, selectedMonth, startDay) >= startDate) {
          monthlyIncomes.push({
            day: startDay <= daysInMonth ? startDay : daysInMonth,
            amount: income.amount,
            name: income.name
          })
        }
      } else if (income.frequency === 'quarterly') {
        for (let quarter = 0; quarter < 4; quarter++) {
          const month = startMonth + (quarter * 3)
          if (month === selectedMonth) {
            if (new Date(selectedYear, selectedMonth, startDay) >= startDate) {
              monthlyIncomes.push({
                day: startDay <= daysInMonth ? startDay : daysInMonth,
                amount: income.amount,
                name: income.name
              })
            }
          }
        }
      } else if (income.frequency === 'yearly') {
        if (startMonth === selectedMonth) {
          if (new Date(selectedYear, selectedMonth, startDay) >= startDate) {
            monthlyIncomes.push({
              day: startDay <= daysInMonth ? startDay : daysInMonth,
              amount: income.amount,
              name: income.name
            })
          }
        }
      }
    })

    // Generate all UNPAID bills for the selected month
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
              amount: bill.amount,
              name: bill.name
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
              amount: bill.amount,
              name: bill.name
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
                amount: bill.amount,
                name: bill.name
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
                  amount: bill.amount,
                  name: bill.name
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
                amount: bill.amount,
                name: bill.name
              })
            }
          }
          currentDate = new Date(currentDate.getTime() + weekMs)
        }
      }
    })

    // Group EXPENSE transactions by day (exclude income to avoid double-counting with recurring income)
    const dailyExpenses = {}
    const dailyExpenseDetails = {}

    monthlyTransactions.forEach(t => {
      // Only include expenses (negative amounts), skip income transactions
      if (t.amount < 0) {
        const day = new Date(t.date).getDate()
        if (!dailyExpenses[day]) {
          dailyExpenses[day] = 0
          dailyExpenseDetails[day] = []
        }
        dailyExpenses[day] += t.amount // This is negative, so it reduces balance
        dailyExpenseDetails[day].push({
          description: t.description,
          amount: t.amount,
          category: t.category
        })
      }
    })

    // Calculate cumulative cash flow for each day, starting with the starting balance
    let balance = startingBalance
    let previousDayBalance = startingBalance
    for (let day = 1; day <= daysInMonth; day++) {
      // Add projected recurring income for this day
      const incomesToday = monthlyIncomes.filter(i => i.day === day)
      const incomeAmount = incomesToday.reduce((sum, i) => sum + i.amount, 0)
      balance += incomeAmount

      // Subtract actual expenses that have occurred (from transactions)
      // This includes all expense transactions: bills that were paid, groceries, gas, etc.
      const expensesAmount = dailyExpenses[day] || 0
      balance += expensesAmount // expensesAmount is already negative

      // Subtract unpaid bills due on this day (future expenses)
      // Bills are only included here if they haven't been paid yet
      const billsToday = monthlyBills.filter(b => b.day === day)
      const billsAmount = billsToday.reduce((sum, b) => sum + b.amount, 0)
      balance -= billsAmount

      data.push({
        day,
        balance: Math.round(balance * 100) / 100,
        date: `${selectedMonth + 1}/${day}`,
        // Breakdown data for tooltip
        startingBalance: Math.round(previousDayBalance * 100) / 100,
        incomes: incomesToday,
        transactions: dailyExpenseDetails[day] || [],
        bills: billsToday,
        incomeAmount: Math.round(incomeAmount * 100) / 100,
        expensesAmount: Math.round(expensesAmount * 100) / 100,
        billsAmount: Math.round(billsAmount * 100) / 100
      })

      previousDayBalance = balance
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

  // Custom tooltip component for cash flow chart
  const CustomCashFlowTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload[0]) return null

    const data = payload[0].payload
    const hasActivity = data.incomeAmount > 0 || data.expensesAmount < 0 || data.billsAmount > 0

    return (
      <div
        style={{
          backgroundColor: chartColors.tooltipBg,
          border: `1px solid ${chartColors.tooltipBorder}`,
          borderRadius: '6px',
          padding: '12px',
          color: chartColors.text,
          fontSize: '13px',
          minWidth: '220px',
          maxWidth: '350px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>
          {data.date}
        </div>

        <div style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: `1px solid ${chartColors.tooltipBorder}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: '#9ca3af' }}>Starting Balance:</span>
            <span style={{ fontWeight: '500' }}>{formatCurrency(data.startingBalance)}</span>
          </div>
        </div>

        {hasActivity ? (
          <>
            {data.incomes.length > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ color: '#10b981', fontWeight: '500', marginBottom: '4px' }}>
                  Income: {formatCurrency(data.incomeAmount)}
                </div>
                {data.incomes.map((income, idx) => (
                  <div key={idx} style={{ fontSize: '12px', paddingLeft: '8px', color: '#9ca3af', marginBottom: '2px' }}>
                    • {income.name}: {formatCurrency(income.amount)}
                  </div>
                ))}
              </div>
            )}

            {data.transactions.length > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ color: '#ef4444', fontWeight: '500', marginBottom: '4px' }}>
                  Transactions: {formatCurrency(data.expensesAmount)}
                </div>
                {data.transactions.slice(0, 5).map((txn, idx) => (
                  <div key={idx} style={{ fontSize: '12px', paddingLeft: '8px', color: '#9ca3af', marginBottom: '2px' }}>
                    • {txn.description}: {formatCurrency(txn.amount)}
                  </div>
                ))}
                {data.transactions.length > 5 && (
                  <div style={{ fontSize: '12px', paddingLeft: '8px', color: '#9ca3af', fontStyle: 'italic' }}>
                    ... and {data.transactions.length - 5} more
                  </div>
                )}
              </div>
            )}

            {data.bills.length > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ color: '#f59e0b', fontWeight: '500', marginBottom: '4px' }}>
                  Bills Due: -{formatCurrency(data.billsAmount)}
                </div>
                {data.bills.map((bill, idx) => (
                  <div key={idx} style={{ fontSize: '12px', paddingLeft: '8px', color: '#9ca3af', marginBottom: '2px' }}>
                    • {bill.name}: {formatCurrency(bill.amount)}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div style={{ color: '#9ca3af', fontSize: '12px', fontStyle: 'italic', marginBottom: '8px' }}>
            No activity on this day
          </div>
        )}

        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${chartColors.tooltipBorder}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
            <span>Ending Balance:</span>
            <span style={{ color: data.balance >= 0 ? '#10b981' : '#ef4444' }}>
              {formatCurrency(data.balance)}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Prepare calendar data - use the same cashFlowData
  const calendarData = useMemo(() => {
    // cashFlowData already has all the information we need
    return cashFlowData
  }, [cashFlowData])

  const handleDayClick = (dayData) => {
    setSelectedCalendarDay(dayData)
  }

  const handleCloseModal = () => {
    setSelectedCalendarDay(null)
  }

  return (
    <div className="dashboard">
      {/* Action Items Section */}
      {(alerts.needsInitialSetup || alerts.needsAccountBasics || alerts.noBudgetedCategories || alerts.uncategorizedCount > 0 || alerts.unpaidBillsThisMonth > 0 || alerts.overdueBills > 0 || alerts.overBudgetCategories > 0) && (
        <div className="action-alerts">
          <h2>Action Items</h2>
          <div className="alerts-grid">
            {/* Consolidated Initial Setup */}
            {alerts.needsInitialSetup && (
              <div className="alert-card alert-info">
                <div className="alert-icon">🚀</div>
                <div className="alert-content">
                  <div className="alert-title">Get Started</div>
                  <div className="alert-description">Set up your budget tracking in a few quick steps</div>
                </div>
                <div className="alert-actions">
                  {monthlyTransactions.length === 0 && (
                    <>
                      <button className="alert-action" onClick={() => onNavigate?.('transactions')}>Import Transactions</button>
                      {onImportDemoData && (
                        <button className="alert-action alert-action-secondary" onClick={onImportDemoData}>Try Demo</button>
                      )}
                    </>
                  )}
                  {categories.length === 0 && monthlyTransactions.length > 0 && (
                    <button className="alert-action" onClick={() => onNavigate?.('categories')}>Add Categories</button>
                  )}
                  {bills.length === 0 && monthlyTransactions.length > 0 && categories.length > 0 && (
                    <button className="alert-action" onClick={() => onNavigate?.('bills')}>Add Bills</button>
                  )}
                </div>
              </div>
            )}

            {/* Consolidated Account Basics Setup */}
            {alerts.needsAccountBasics && !alerts.needsInitialSetup && (
              <div className="alert-card alert-info">
                <div className="alert-icon">💰</div>
                <div className="alert-content">
                  <div className="alert-title">Complete Account Setup</div>
                  <div className="alert-description">
                    {alerts.missingStartingBalance && alerts.noRecurringIncome && 'Add starting balance and recurring income for accurate projections'}
                    {alerts.missingStartingBalance && !alerts.noRecurringIncome && 'Set your starting balance for accurate cash flow tracking'}
                    {!alerts.missingStartingBalance && alerts.noRecurringIncome && 'Add recurring income for accurate projections'}
                  </div>
                </div>
                <div className="alert-actions">
                  {alerts.missingStartingBalance && (
                    <button className="alert-action" onClick={() => onNavigate?.('settings')}>Set Balance</button>
                  )}
                  {alerts.noRecurringIncome && (
                    <button className="alert-action" onClick={() => onNavigate?.('income')}>Add Income</button>
                  )}
                </div>
              </div>
            )}

            {/* Set Category Budgets - only if categories exist but have no budgets */}
            {alerts.noBudgetedCategories && !alerts.needsInitialSetup && (
              <div className="alert-card alert-info">
                <div className="alert-icon">🎯</div>
                <div className="alert-content">
                  <div className="alert-title">Set Category Budgets</div>
                  <div className="alert-description">Assign budgets to your categories to track spending</div>
                </div>
                <button className="alert-action" onClick={() => onNavigate?.('categories')}>Set Budgets</button>
              </div>
            )}

            {/* Time-Sensitive Alerts */}
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

              // Calculate days until due
              const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24))
              const isDueSoon = daysUntil <= 2 && daysUntil > 0

              let urgencyClass = 'upcoming'
              if (isOverdue) urgencyClass = 'overdue'
              else if (isDueToday) urgencyClass = 'due-today'
              else if (isDueSoon) urgencyClass = 'due-soon'

              // Format the due date with days indicator
              const getDueText = () => {
                if (isOverdue) {
                  const daysOverdue = Math.abs(daysUntil)
                  return `Overdue by ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''}`
                } else if (isDueToday) {
                  return 'Due Today'
                } else if (daysUntil === 1) {
                  return 'Due Tomorrow'
                } else {
                  return `Due in ${daysUntil} days`
                }
              }

              return (
                <div key={bill.id} className={`upcoming-bill-item ${urgencyClass}`}>
                  <div className="bill-info">
                    <div className="bill-name">{bill.name}</div>
                    <div className="bill-details">
                      <span className="bill-due">{getDueText()}</span>
                      {bill.category && (
                        <>
                          <span className="bill-separator">•</span>
                          <span className="bill-category">{bill.category}</span>
                        </>
                      )}
                      <span className="bill-separator">•</span>
                      <span className="bill-frequency">{bill.frequency}</span>
                    </div>
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
            <Tooltip content={<CustomCashFlowTooltip />} />
            <ReferenceLine y={0} stroke="#e74c3c" strokeWidth={2} strokeDasharray="3 3" />
            <Line
              type="monotone"
              dataKey="balance"
              stroke={chartColors.line}
              strokeWidth={2}
              dot={{ fill: chartColors.line, r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Calendar Section */}
      <div className="calendar-section">
        <h2>Monthly Calendar</h2>
        <div className="calendar-grid">
          {/* Day headers */}
          <div className="calendar-header">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="calendar-day-header">{day}</div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="calendar-days">
            {(() => {
              const firstDay = new Date(selectedYear, selectedMonth, 1).getDay()
              const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()
              const days = []

              // Empty cells for days before month starts
              for (let i = 0; i < firstDay; i++) {
                days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>)
              }

              // Actual days of the month
              for (let day = 1; day <= daysInMonth; day++) {
                const dayData = calendarData.find(d => d.day === day)
                const netChange = (dayData?.incomeAmount || 0) + (dayData?.expensesAmount || 0) - (dayData?.billsAmount || 0)
                const hasActivity = (dayData?.incomes.length > 0) || (dayData?.transactions.length > 0) || (dayData?.bills.length > 0)

                // Determine if this is today
                const today = new Date()
                const isToday = today.getDate() === day &&
                               today.getMonth() === selectedMonth &&
                               today.getFullYear() === selectedYear

                days.push(
                  <div
                    key={day}
                    className={`calendar-day ${hasActivity ? 'has-activity' : ''} ${isToday ? 'today' : ''}`}
                    onClick={() => hasActivity && handleDayClick(dayData)}
                  >
                    <div className="calendar-day-number">{day}</div>
                    {hasActivity && (
                      <div className="calendar-day-content">
                        {dayData.incomes.length > 0 && (
                          <div className="calendar-indicator income">
                            💰 {formatCurrency(dayData.incomeAmount)}
                            {dayData.incomes.length > 1 && <span className="count">({dayData.incomes.length})</span>}
                            {dayData.incomes.length === 1 && (
                              <div className="calendar-item-name">{dayData.incomes[0].name}</div>
                            )}
                          </div>
                        )}
                        {dayData.transactions.length > 0 && (
                          <div className="calendar-indicator transaction">
                            🛒 {formatCurrency(Math.abs(dayData.expensesAmount))}
                            {dayData.transactions.length > 1 && <span className="count">({dayData.transactions.length})</span>}
                            {dayData.transactions.length === 1 && (
                              <div className="calendar-item-name">{dayData.transactions[0].category}</div>
                            )}
                          </div>
                        )}
                        {dayData.bills.length > 0 && (
                          <div className="calendar-indicator bill">
                            📄 {formatCurrency(dayData.billsAmount)}
                            {dayData.bills.length > 1 && <span className="count">({dayData.bills.length})</span>}
                            {dayData.bills.length === 1 && (
                              <div className="calendar-item-name">{dayData.bills[0].name}</div>
                            )}
                          </div>
                        )}
                        <div className={`calendar-day-total ${netChange >= 0 ? 'positive' : 'negative'}`}>
                          Net: {netChange >= 0 ? '+' : ''}{formatCurrency(netChange)}
                        </div>
                        <div className="calendar-day-balance">
                          Balance: {formatCurrency(dayData.endingBalance)}
                        </div>
                      </div>
                    )}
                  </div>
                )
              }

              return days
            })()}
          </div>
        </div>
      </div>

      {/* Day Detail Modal */}
      {selectedCalendarDay && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Details for {monthNames[selectedMonth]} {selectedCalendarDay.day}, {selectedYear}</h3>
              <button className="modal-close" onClick={handleCloseModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-section">
                <div className="modal-balance-row">
                  <span>Starting Balance:</span>
                  <span className="modal-amount">{formatCurrency(selectedCalendarDay.startingBalance)}</span>
                </div>
              </div>

              {selectedCalendarDay.incomes.length > 0 && (
                <div className="modal-section">
                  <h4 className="modal-section-title income">Income ({formatCurrency(selectedCalendarDay.incomeAmount)})</h4>
                  {selectedCalendarDay.incomes.map((income, idx) => (
                    <div key={idx} className="modal-item">
                      <span>{income.name}</span>
                      <span className="modal-amount positive">{formatCurrency(income.amount)}</span>
                    </div>
                  ))}
                </div>
              )}

              {selectedCalendarDay.transactions.length > 0 && (
                <div className="modal-section">
                  <h4 className="modal-section-title expense">Transactions ({formatCurrency(selectedCalendarDay.expensesAmount)})</h4>
                  {selectedCalendarDay.transactions.map((txn, idx) => (
                    <div key={idx} className="modal-item">
                      <div>
                        <div>{txn.description}</div>
                        {txn.category && <div className="modal-item-subtitle">{txn.category}</div>}
                      </div>
                      <span className="modal-amount negative">{formatCurrency(txn.amount)}</span>
                    </div>
                  ))}
                </div>
              )}

              {selectedCalendarDay.bills.length > 0 && (
                <div className="modal-section">
                  <h4 className="modal-section-title bill">Bills Due (-{formatCurrency(selectedCalendarDay.billsAmount)})</h4>
                  {selectedCalendarDay.bills.map((bill, idx) => (
                    <div key={idx} className="modal-item">
                      <span>{bill.name}</span>
                      <span className="modal-amount negative">-{formatCurrency(bill.amount)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="modal-section modal-total">
                <div className="modal-balance-row">
                  <span className="modal-total-label">Ending Balance:</span>
                  <span className={`modal-amount ${selectedCalendarDay.balance >= 0 ? 'positive' : 'negative'}`}>
                    {formatCurrency(selectedCalendarDay.balance)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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