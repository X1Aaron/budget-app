import { useState, useEffect } from 'react'
import './App.css'
import BudgetDashboard from './components/BudgetDashboard'
import CSVImport from './components/CSVImport'
import CategoryManager from './components/CategoryManager'
import { DEFAULT_CATEGORIES, autoCategorize } from './utils/categories'

function App() {
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('categories')
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES
  })

  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories))
  }, [categories])

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
    const categorizedTransactions = importedTransactions.map(t => ({
      ...t,
      category: autoCategorize(t.description, t.amount, t.category)
    }))
    setTransactions(categorizedTransactions)
  }

  const handleUpdateTransaction = (index, updatedTransaction) => {
    const newTransactions = [...transactions]
    newTransactions[index] = updatedTransaction
    setTransactions(newTransactions)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Budget Tracker</h1>
      </header>
      <main className="app-main">
        <CSVImport onImport={handleImport} />
        <CategoryManager categories={categories} onUpdateCategories={setCategories} />
        <BudgetDashboard
          transactions={transactions}
          categories={categories}
          onUpdateTransaction={handleUpdateTransaction}
        />
      </main>
    </div>
  )
}

export default App
