import { useState, useEffect } from 'react'
import './App.css'
import Overview from './components/Overview'
import Spending from './components/Spending'
import CSVImport from './components/CSVImport'
import CategoryManager from './components/CategoryManager'
import AutoCategorizationRules from './components/AutoCategorizationRules'
import ExportButton from './components/ExportButton'
import ImportButton from './components/ImportButton'
import { DEFAULT_CATEGORIES, autoCategorize } from './utils/categories'

function App() {
  const [activeSection, setActiveSection] = useState('overview')
  const [transactions, setTransactions] = useState([])
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
        </nav>
      </header>
      <main className="app-main">
        <CSVImport onImport={handleImport} />
        <div className="settings-buttons">
          <CategoryManager categories={categories} onUpdateCategories={setCategories} />
          <AutoCategorizationRules rules={rules} categories={categories} onUpdateRules={setRules} />
          <ImportButton
            onImportTransactions={handleImportTransactions}
            onImportCategories={handleImportCategories}
            onImportRules={handleImportRules}
          />
          <ExportButton transactions={transactions} categories={categories} rules={rules} />
        </div>
        {activeSection === 'overview' ? (
          <Overview transactions={transactions} categories={categories} />
        ) : (
          <Spending
            transactions={transactions}
            categories={categories}
            onUpdateTransaction={handleUpdateTransaction}
          />
        )}
      </main>
    </div>
  )
}

export default App
