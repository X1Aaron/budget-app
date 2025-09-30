import { useState, useEffect } from 'react'
import './App.css'
import Overview from './components/Overview'
import Spending from './components/Spending'
import Bills from './components/Bills'
import CSVImport from './components/CSVImport'
import CategorySettings from './components/CategorySettings'
import ExportButton from './components/ExportButton'
import ImportButton from './components/ImportButton'
import { DEFAULT_CATEGORIES, autoCategorize } from './utils/categories'

function App() {
  const [activeSection, setActiveSection] = useState('overview')
  const [transactions, setTransactions] = useState([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [monthlyBudgets, setMonthlyBudgets] = useState(() => {
    const saved = localStorage.getItem('monthlyBudgets')
    return saved ? JSON.parse(saved) : {}
  })
  const [bills, setBills] = useState(() => {
    const saved = localStorage.getItem('bills')
    return saved ? JSON.parse(saved) : []
  })
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('categories')
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES
  })
  const [rules, setRules] = useState(() => {
    const saved = localStorage.getItem('categorizationRules')
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories))
  }, [categories])

  useEffect(() => {
    localStorage.setItem('categorizationRules', JSON.stringify(rules))
  }, [rules])

  useEffect(() => {
    localStorage.setItem('bills', JSON.stringify(bills))
  }, [bills])

  useEffect(() => {
    localStorage.setItem('monthlyBudgets', JSON.stringify(monthlyBudgets))
  }, [monthlyBudgets])

  useEffect(() => {
    const saved = localStorage.getItem('transactions')
    if (saved) {
      setTransactions(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    if (transactions.length > 0) {
      localStorage.setItem('transactions', JSON.stringify(transactions))
    }
  }, [transactions])

  const handleImport = (importedTransactions) => {
    const categorizedTransactions = importedTransactions.map(t => {
      const result = autoCategorize(t.description, t.amount, t.category, rules)
      return {
        ...t,
        category: result.category,
        autoCategorized: result.wasAutoCategorized
      }
    })
    setTransactions(categorizedTransactions)
  }

  const handleUpdateTransaction = (index, updatedTransaction) => {
    const newTransactions = [...transactions]
    newTransactions[index] = updatedTransaction
    setTransactions(newTransactions)
  }

  const handleImportTransactions = (importedTransactions) => {
    const categorizedTransactions = importedTransactions.map(t => {
      const result = autoCategorize(t.description, t.amount, t.category, rules)
      return {
        ...t,
        category: result.category,
        autoCategorized: result.wasAutoCategorized
      }
    })
    setTransactions(categorizedTransactions)
  }

  const handleImportCategories = (importedCategories) => {
    // Merge imported categories with existing ones, avoiding duplicates by name
    const existingNames = new Set(categories.map(c => c.name.toLowerCase()))
    const newCategories = importedCategories.filter(
      c => !existingNames.has(c.name.toLowerCase())
    )
    setCategories([...categories, ...newCategories])
  }

  const handleImportRules = (importedRules) => {
    setRules(importedRules)
  }

  const handleDateChange = (year, month) => {
    setSelectedYear(year)
    setSelectedMonth(month)
  }

  const handleUpdateBudget = (year, month, budget) => {
    const key = `${year}-${month}`
    setMonthlyBudgets(prev => ({
      ...prev,
      [key]: budget
    }))
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Budget Tracker</h1>
        <nav className="app-nav">
          <button
            className={'nav-btn' + (activeSection === 'overview' ? ' active' : '')}
            onClick={() => setActiveSection('overview')}
          >
            Overview
          </button>
          <button
            className={'nav-btn' + (activeSection === 'spending' ? ' active' : '')}
            onClick={() => setActiveSection('spending')}
          >
            Spending
          </button>
          <button
            className={'nav-btn' + (activeSection === 'bills' ? ' active' : '')}
            onClick={() => setActiveSection('bills')}
          >
            Bills
          </button>
          <button
            className={'nav-btn' + (activeSection === 'settings' ? ' active' : '')}
            onClick={() => setActiveSection('settings')}
          >
            Settings
          </button>
        </nav>
      </header>
      <main className="app-main">
        {activeSection === 'overview' ? (
          <Overview
            transactions={transactions}
            categories={categories}
            bills={bills}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            monthlyBudgets={monthlyBudgets}
            onDateChange={handleDateChange}
            onUpdateBudget={handleUpdateBudget}
          />
        ) : activeSection === 'spending' ? (
          <Spending
            transactions={transactions}
            categories={categories}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onDateChange={handleDateChange}
            onUpdateTransaction={handleUpdateTransaction}
          />
        ) : activeSection === 'bills' ? (
          <Bills
            bills={bills}
            onUpdateBills={setBills}
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
            categories={categories}
          />
        ) : (
          <div className="settings-section">
            <h2>Settings</h2>
            <div className="settings-group">
              <h3>Import/Export Data</h3>
              <div className="settings-buttons">
                <CSVImport onImport={handleImport} />
                <ImportButton
                  onImportTransactions={handleImportTransactions}
                  onImportCategories={handleImportCategories}
                  onImportRules={handleImportRules}
                />
                <ExportButton transactions={transactions} categories={categories} rules={rules} />
              </div>
            </div>
            <div className="settings-group">
              <h3>Categories & Rules</h3>
              <CategorySettings
                categories={categories}
                rules={rules}
                onUpdateCategories={setCategories}
                onUpdateRules={setRules}
                transactions={transactions}
                onUpdateTransactions={setTransactions}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
