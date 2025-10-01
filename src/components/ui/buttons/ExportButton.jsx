import { useState } from 'react'
import {
  exportTransactionsToCSV,
  exportTransactionsToJSON,
  exportCategoriesToJSON,
  exportCategoriesToCSV,
  exportBillsToJSON,
  exportBillsToCSV
} from '../../../utils/export'
import '../../../styles/components/ExportButton.css'

function ExportButton({ activeSection, transactions, categories, merchantMappings, categoryMappings, bills }) {
  const [isOpen, setIsOpen] = useState(false)

  const handleExport = (format) => {
    switch (activeSection) {
      case 'spending':
        format === 'csv' ? exportTransactionsToCSV(transactions) : exportTransactionsToJSON(transactions)
        break
      case 'categories':
        format === 'csv' ? exportCategoriesToCSV(categories) : exportCategoriesToJSON(categories)
        break
      case 'auto-categorization':
        const rulesData = {
          merchantMappings,
          categoryMappings,
          exportedAt: new Date().toISOString()
        }
        const blob = new Blob([JSON.stringify(rulesData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `auto-categorization-rules-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        break
      case 'bills':
        format === 'csv' ? exportBillsToCSV(bills) : exportBillsToJSON(bills)
        break
      default:
        return
    }
    setIsOpen(false)
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
    <div className="export-button-container">
      <button className="export-btn" onClick={() => setIsOpen(!isOpen)}>
        Export {sectionLabel}
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <>
          <div className="export-backdrop" onClick={() => setIsOpen(false)}></div>
          <div className="export-menu">
            {activeSection === 'auto-categorization' ? (
              <button
                className="export-menu-item"
                onClick={() => handleExport('json')}
              >
                <span className="menu-icon">📋</span>
                <div className="menu-text">
                  <div className="menu-title">Export Rules (JSON)</div>
                </div>
              </button>
            ) : (
              <>
                <button
                  className="export-menu-item"
                  onClick={() => handleExport('csv')}
                >
                  <span className="menu-icon">📄</span>
                  <div className="menu-text">
                    <div className="menu-title">Export as CSV</div>
                  </div>
                </button>
                <button
                  className="export-menu-item"
                  onClick={() => handleExport('json')}
                >
                  <span className="menu-icon">📋</span>
                  <div className="menu-text">
                    <div className="menu-title">Export as JSON</div>
                  </div>
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default ExportButton
