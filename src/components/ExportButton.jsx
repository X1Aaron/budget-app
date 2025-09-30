import { useState } from 'react'
import { exportTransactionsToCSV, exportCategoriesToJSON, exportRulesToJSON } from '../utils/export'
import './ExportButton.css'

function ExportButton({ transactions, categories, rules }) {
  const [isOpen, setIsOpen] = useState(false)

  const handleExport = (type) => {
    switch (type) {
      case 'transactions':
        exportTransactionsToCSV(transactions)
        break
      case 'categories':
        exportCategoriesToJSON(categories)
        break
      case 'rules':
        exportRulesToJSON(rules)
        break
    }
    setIsOpen(false)
  }

  return (
    <div className="export-button-container">
      <button className="export-btn" onClick={() => setIsOpen(!isOpen)}>
        Export Data
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>
      
      {isOpen && (
        <>
          <div className="export-backdrop" onClick={() => setIsOpen(false)}></div>
          <div className="export-menu">
            <button 
              className="export-menu-item"
              onClick={() => handleExport('transactions')}
              disabled={transactions.length === 0}
            >
              <span className="menu-icon">📄</span>
              <div className="menu-text">
                <div className="menu-title">Transactions</div>
                <div className="menu-subtitle">Export as CSV</div>
              </div>
            </button>
            
            <button 
              className="export-menu-item"
              onClick={() => handleExport('categories')}
            >
              <span className="menu-icon">🏷️</span>
              <div className="menu-text">
                <div className="menu-title">Categories</div>
                <div className="menu-subtitle">Export as JSON</div>
              </div>
            </button>
            
            <button 
              className="export-menu-item"
              onClick={() => handleExport('rules')}
              disabled={rules.length === 0}
            >
              <span className="menu-icon">⚙️</span>
              <div className="menu-text">
                <div className="menu-title">Auto-Categorization Rules</div>
                <div className="menu-subtitle">Export as JSON</div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default ExportButton
