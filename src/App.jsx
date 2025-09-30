import { useState, useEffect } from 'react'
import './App.css'
import Overview from './components/Overview'
import Spending from './components/Spending'
import Bills from './components/Bills'
import CSVImport from './components/CSVImport'
import CategorySettings from './components/CategorySettings'
import ExportButton from './components/ExportButton'
import ImportButton from './components/ImportButton'
import MonthYearSelector from './components/MonthYearSelector'
import { DEFAULT_CATEGORIES, autoCategorize, generateMerchantName } from './utils/categories'

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

  const handleUpdateBills = (updatedBills) => {
    console.log('handleUpdateBills called with:', updatedBills)
    setBills(updatedBills)
  }
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('categories')
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES
  })
  const [startingBalances, setStartingBalances] = useState(() => {
    const saved = localStorage.getItem('startingBalances')
    return saved ? JSON.parse(saved) : {}
  })

  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories))
  }, [categories])

  useEffect(() => {
    localStorage.setItem('startingBalances', JSON.stringify(startingBalances))
  }, [startingBalances])

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

  const handleImport = (importedTransactions, existingTransactions = transactions) => {
    // Check for duplicate transactions
    const duplicates = []
    const newTransactions = []

    importedTransactions.forEach(imported => {
      const isDuplicate = existingTransactions.some(existing =>
        existing.date === imported.date &&
        existing.description === imported.description &&
        existing.amount === imported.amount
      )

      if (isDuplicate) {
        duplicates.push(imported)
      } else {
        newTransactions.push(imported)
      }
    })

    if (duplicates.length > 0) {
      throw new Error(`Found ${duplicates.length} duplicate transaction${duplicates.length !== 1 ? 's' : ''} (same date, description, and amount). Import rejected to prevent duplicates.`)
    }

    const categorizedTransactions = newTransactions.map(t => {
      const result = autoCategorize(t.description, t.amount, t.category, categories)
      return {
        ...t,
        category: result.category,
        autoCategorized: result.wasAutoCategorized,
        merchantName: t.merchantName || t.friendlyName || generateMerchantName(t.description),
        memo: t.memo || ''
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
    // Check for duplicate transactions
    const duplicates = []
    const newTransactions = []

    importedTransactions.forEach(imported => {
      const isDuplicate = transactions.some(existing =>
        existing.date === imported.date &&
        existing.description === imported.description &&
        existing.amount === imported.amount
      )

      if (isDuplicate) {
        duplicates.push(imported)
      } else {
        newTransactions.push(imported)
      }
    })

    if (duplicates.length > 0) {
      throw new Error(`Found ${duplicates.length} duplicate transaction${duplicates.length !== 1 ? 's' : ''} (same date, description, and amount). Import rejected to prevent duplicates.`)
    }

    const categorizedTransactions = newTransactions.map(t => {
      const result = autoCategorize(t.description, t.amount, t.category, categories)
      return {
        ...t,
        category: result.category,
        autoCategorized: result.wasAutoCategorized,
        merchantName: t.merchantName || t.friendlyName || generateMerchantName(t.description),
        memo: t.memo || ''
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

  const handleUpdateStartingBalance = (year, month, balance) => {
    const key = `${year}-${month}`
    setStartingBalances(prev => ({
      ...prev,
      [key]: balance
    }))
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-top">
          <h1>Budget Tracker</h1>
          <MonthYearSelector
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onDateChange={handleDateChange}
          />
        </div>
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
            className={'nav-btn' + (activeSection === 'categories' ? ' active' : '')}
            onClick={() => setActiveSection('categories')}
          >
            Categories
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
            startingBalances={startingBalances}
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
            startingBalances={startingBalances}
            onUpdateStartingBalance={handleUpdateStartingBalance}
          />
        ) : activeSection === 'bills' ? (
          <Bills
            bills={bills}
            onUpdateBills={handleUpdateBills}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onDateChange={handleDateChange}
            categories={categories}
          />
        ) : activeSection === 'categories' ? (
          <div className="categories-section">
            <h2>Categories</h2>
            <CategorySettings
              categories={categories}
              onUpdateCategories={setCategories}
              transactions={transactions}
              onUpdateTransactions={setTransactions}
            />
          </div>
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
                />
                <ExportButton transactions={transactions} categories={categories} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
