import { useState } from 'react'
import {
  exportTransactionsToCSV,
  exportTransactionsToJSON,
  exportCategoriesToJSON,
  exportCategoriesToCSV,
  exportRulesToJSON,
  exportRulesToCSV
} from '../utils/export'
import './ExportButton.css'

function ExportButton({ transactions, categories, rules }) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeSubmenu, setActiveSubmenu] = useState(null)

  const handleExport = (type, format) => {
    if (type === 'transactions') {
      format === 'csv' ? exportTransactionsToCSV(transactions) : exportTransactionsToJSON(transactions)
    } else if (type === 'categories') {
      format === 'csv' ? exportCategoriesToCSV(categories) : exportCategoriesToJSON(categories)
    } else if (type === 'rules') {
      format === 'csv' ? exportRulesToCSV(rules) : exportRulesToJSON(rules)
    }
    setIsOpen(false)
    setActiveSubmenu(null)
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
            <div className="export-menu-group">
              <div
                className={'export-menu-item parent-item ' + (activeSubmenu === 'transactions' ? 'active' : '')}
                onMouseEnter={() => setActiveSubmenu('transactions')}
              >
                <span className="menu-icon">📄</span>
                <div className="menu-text">
                  <div className="menu-title">Transactions</div>
                  <div className="menu-subtitle">Choose format</div>
                </div>
                <span className="submenu-arrow">›</span>
              </div>
              {activeSubmenu === 'transactions' && (
                <div className="export-submenu">
                  <button
                    className="export-submenu-item"
                    onClick={() => handleExport('transactions', 'csv')}
                    disabled={transactions.length === 0}
                  >
                    CSV
                  </button>
                  <button
                    className="export-submenu-item"
                    onClick={() => handleExport('transactions', 'json')}
                    disabled={transactions.length === 0}
                  >
                    JSON
                  </button>
                </div>
              )}
            </div>

            <div className="export-menu-group">
              <div
                className={'export-menu-item parent-item ' + (activeSubmenu === 'categories' ? 'active' : '')}
                onMouseEnter={() => setActiveSubmenu('categories')}
              >
                <span className="menu-icon">🏷️</span>
                <div className="menu-text">
                  <div className="menu-title">Categories</div>
                  <div className="menu-subtitle">Choose format</div>
                </div>
                <span className="submenu-arrow">›</span>
              </div>
              {activeSubmenu === 'categories' && (
                <div className="export-submenu">
                  <button
                    className="export-submenu-item"
                    onClick={() => handleExport('categories', 'csv')}
                  >
                    CSV
                  </button>
                  <button
                    className="export-submenu-item"
                    onClick={() => handleExport('categories', 'json')}
                  >
                    JSON
                  </button>
                </div>
              )}
            </div>

            <div className="export-menu-group">
              <div
                className={'export-menu-item parent-item ' + (activeSubmenu === 'rules' ? 'active' : '')}
                onMouseEnter={() => setActiveSubmenu('rules')}
              >
                <span className="menu-icon">⚙️</span>
                <div className="menu-text">
                  <div className="menu-title">Auto-Categorization Rules</div>
                  <div className="menu-subtitle">Choose format</div>
                </div>
                <span className="submenu-arrow">›</span>
              </div>
              {activeSubmenu === 'rules' && (
                <div className="export-submenu">
                  <button
                    className="export-submenu-item"
                    onClick={() => handleExport('rules', 'csv')}
                    disabled={rules.length === 0}
                  >
                    CSV
                  </button>
                  <button
                    className="export-submenu-item"
                    onClick={() => handleExport('rules', 'json')}
                    disabled={rules.length === 0}
                  >
                    JSON
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ExportButton
