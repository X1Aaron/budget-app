import { useState } from 'react'
import './App.css'
import BudgetDashboard from './components/BudgetDashboard'
import CSVImport from './components/CSVImport'

function App() {
  const [transactions, setTransactions] = useState([])

  const handleImport = (importedTransactions) => {
    setTransactions(importedTransactions)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Budget Tracker</h1>
      </header>
      <main className="app-main">
        <CSVImport onImport={handleImport} />
        <BudgetDashboard transactions={transactions} />
      </main>
    </div>
  )
}

export default App
