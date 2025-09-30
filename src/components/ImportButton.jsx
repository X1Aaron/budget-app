import { useState, useRef } from 'react'
import {
  importTransactionsFromCSV,
  importTransactionsFromJSON,
  importCategoriesFromCSV,
  importCategoriesFromJSON,
  importBillsFromCSV,
  importBillsFromJSON
} from '../utils/import'
import './ImportButton.css'

function ImportButton({ activeSection, onImportTransactions, onImportCategories, onImportRules, onImportBills }) {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState(null)
  const csvInputRef = useRef(null)
  const jsonInputRef = useRef(null)

  const handleFileSelect = async (format, event) => {
    const file = event.target.files[0]
    if (!file) return

    setError(null)

    try {
      let data
      switch (activeSection) {
        case 'spending':
          data = format === 'csv'
            ? await importTransactionsFromCSV(file)
            : await importTransactionsFromJSON(file)
          onImportTransactions(data)
          break
        case 'categories':
          data = format === 'csv'
            ? await importCategoriesFromCSV(file)
            : await importCategoriesFromJSON(file)
          onImportCategories(data)
          break
        case 'auto-categorization':
          const text = await file.text()
          const importedData = JSON.parse(text)
          if (importedData.merchantMappings && importedData.categoryMappings) {
            onImportRules(importedData.merchantMappings, importedData.categoryMappings)
          } else {
            throw new Error('Invalid file format. Please select a valid auto-categorization rules file.')
          }
          break
        case 'bills':
          data = format === 'csv'
            ? await importBillsFromCSV(file)
            : await importBillsFromJSON(file)
          onImportBills(data)
          break
        default:
          return
      }
      setIsOpen(false)
    } catch (err) {
      setError(err.message)
      setTimeout(() => setError(null), 5000)
    }

    // Reset file input
    event.target.value = null
  }

  const triggerFileInput = (format) => {
    if (format === 'csv') {
      csvInputRef.current?.click()
    } else {
      jsonInputRef.current?.click()
    }
  }

  const getSectionLabel = () => {
    switch (activeSection) {
      case 'spending': return 'Transactions'
      case 'categories': return 'Categories'
      case 'auto-categorization': return 'Rules'
      case 'bills': return 'Bills'
      default: return null
    }
  }

  const sectionLabel = getSectionLabel()
  if (!sectionLabel) return null

  return (
    <div className="import-button-container">
      <button className="import-btn" onClick={() => setIsOpen(!isOpen)}>
        Import {sectionLabel}
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {error && (
        <div className="import-error">{error}</div>
      )}

      {isOpen && (
        <>
          <div className="import-backdrop" onClick={() => setIsOpen(false)}></div>
          <div className="import-menu">
            {activeSection === 'auto-categorization' ? (
              <button
                className="import-menu-item"
                onClick={() => triggerFileInput('json')}
              >
                <span className="menu-icon">📋</span>
                <div className="menu-text">
                  <div className="menu-title">Import Rules (JSON)</div>
                </div>
              </button>
            ) : (
              <>
                <button
                  className="import-menu-item"
                  onClick={() => triggerFileInput('csv')}
                >
                  <span className="menu-icon">📄</span>
                  <div className="menu-text">
                    <div className="menu-title">Import from CSV</div>
                  </div>
                </button>
                <button
                  className="import-menu-item"
                  onClick={() => triggerFileInput('json')}
                >
                  <span className="menu-icon">📋</span>
                  <div className="menu-text">
                    <div className="menu-title">Import from JSON</div>
                  </div>
                </button>
              </>
            )}
          </div>
        </>
      )}

      {/* Hidden file inputs */}
      <input
        ref={csvInputRef}
        type="file"
        accept=".csv"
        onChange={(e) => handleFileSelect('csv', e)}
        style={{ display: 'none' }}
      />
      <input
        ref={jsonInputRef}
        type="file"
        accept=".json"
        onChange={(e) => handleFileSelect('json', e)}
        style={{ display: 'none' }}
      />
    </div>
  )
}

export default ImportButton