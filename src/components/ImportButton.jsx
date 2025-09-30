import { useState, useRef } from 'react'
import {
  importTransactionsFromCSV,
  importTransactionsFromJSON,
  importCategoriesFromCSV,
  importCategoriesFromJSON
} from '../utils/import'
import './ImportButton.css'

function ImportButton({ onImportTransactions, onImportCategories }) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeSubmenu, setActiveSubmenu] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRefs = {
    transactionsCSV: useRef(null),
    transactionsJSON: useRef(null),
    categoriesCSV: useRef(null),
    categoriesJSON: useRef(null)
  }

  const handleFileSelect = async (type, format, event) => {
    const file = event.target.files[0]
    if (!file) return

    setError(null)

    try {
      let data
      if (type === 'transactions') {
        data = format === 'csv'
          ? await importTransactionsFromCSV(file)
          : await importTransactionsFromJSON(file)
        onImportTransactions(data)
      } else if (type === 'categories') {
        data = format === 'csv'
          ? await importCategoriesFromCSV(file)
          : await importCategoriesFromJSON(file)
        onImportCategories(data)
      }
      setIsOpen(false)
      setActiveSubmenu(null)
    } catch (err) {
      setError(err.message)
      setTimeout(() => setError(null), 5000)
    }

    // Reset file input
    event.target.value = null
  }

  const triggerFileInput = (refKey) => {
    fileInputRefs[refKey].current?.click()
  }

  return (
    <div className="import-button-container">
      <button className="import-btn" onClick={() => setIsOpen(!isOpen)}>
        Import Data
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {error && (
        <div className="import-error">{error}</div>
      )}

      {isOpen && (
        <>
          <div className="import-backdrop" onClick={() => setIsOpen(false)}></div>
          <div className="import-menu">
            <div className="import-menu-group">
              <div
                className={'import-menu-item parent-item ' + (activeSubmenu === 'transactions' ? 'active' : '')}
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
                <div className="import-submenu">
                  <button
                    className="import-submenu-item"
                    onClick={() => triggerFileInput('transactionsCSV')}
                  >
                    CSV
                  </button>
                  <button
                    className="import-submenu-item"
                    onClick={() => triggerFileInput('transactionsJSON')}
                  >
                    JSON
                  </button>
                </div>
              )}
            </div>

            <div className="import-menu-group">
              <div
                className={'import-menu-item parent-item ' + (activeSubmenu === 'categories' ? 'active' : '')}
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
                <div className="import-submenu">
                  <button
                    className="import-submenu-item"
                    onClick={() => triggerFileInput('categoriesCSV')}
                  >
                    CSV
                  </button>
                  <button
                    className="import-submenu-item"
                    onClick={() => triggerFileInput('categoriesJSON')}
                  >
                    JSON
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRefs.transactionsCSV}
        type="file"
        accept=".csv"
        onChange={(e) => handleFileSelect('transactions', 'csv', e)}
        style={{ display: 'none' }}
      />
      <input
        ref={fileInputRefs.transactionsJSON}
        type="file"
        accept=".json"
        onChange={(e) => handleFileSelect('transactions', 'json', e)}
        style={{ display: 'none' }}
      />
      <input
        ref={fileInputRefs.categoriesCSV}
        type="file"
        accept=".csv"
        onChange={(e) => handleFileSelect('categories', 'csv', e)}
        style={{ display: 'none' }}
      />
      <input
        ref={fileInputRefs.categoriesJSON}
        type="file"
        accept=".json"
        onChange={(e) => handleFileSelect('categories', 'json', e)}
        style={{ display: 'none' }}
      />
    </div>
  )
}

export default ImportButton