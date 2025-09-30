import React, { useMemo, useState } from 'react'
import './AutoCategorization.css'

function AutoCategorization({ merchantMappings, categoryMappings, onDeleteMerchantMapping, onDeleteCategoryMapping, onImportRules }) {
  const combinedMappings = useMemo(() => {
    const allDescriptions = new Set([
      ...Object.keys(merchantMappings),
      ...Object.keys(categoryMappings)
    ])

    return Array.from(allDescriptions).map(description => ({
      description,
      merchantName: merchantMappings[description] || '-',
      category: categoryMappings[description] || '-'
    }))
  }, [merchantMappings, categoryMappings])

  const handleExport = () => {
    const exportData = {
      merchantMappings,
      categoryMappings,
      exportedAt: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `auto-categorization-rules-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleImport = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result)
        if (importedData.merchantMappings && importedData.categoryMappings) {
          onImportRules(importedData.merchantMappings, importedData.categoryMappings)
        } else {
          alert('Invalid file format. Please select a valid auto-categorization rules file.')
        }
      } catch (error) {
        alert('Error reading file: ' + error.message)
      }
    }
    reader.readAsText(file)
    event.target.value = '' // Reset input
  }

  return (
    <div className="auto-categorization">
      <div className="auto-cat-header">
        <h2>Auto Categorization Rules</h2>
        <p className="auto-cat-description">
          These rules are automatically created when you manually change merchant names or categories.
          They will be applied to future transactions with matching descriptions.
        </p>
      </div>

      <div className="auto-cat-content">
        <div className="mappings-table-container">
          {combinedMappings.length === 0 ? (
            <div className="empty-state">
              <p>No mappings yet.</p>
              <p className="empty-hint">When you manually assign a category or change a merchant name for a transaction, a mapping will be created here.</p>
            </div>
          ) : (
            <table className="mappings-table">
              <thead>
                <tr>
                  <th>Transaction Description</th>
                  <th>Assigned Category</th>
                  <th>Merchant Name</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {combinedMappings.map((mapping, index) => (
                  <tr key={index}>
                    <td className="description-cell">{mapping.description}</td>
                    <td className="category-cell">{mapping.category}</td>
                    <td className="merchant-cell">{mapping.merchantName}</td>
                    <td className="actions-cell">
                      {categoryMappings[mapping.description] && (
                        <button
                          className="delete-btn"
                          onClick={() => onDeleteCategoryMapping(mapping.description)}
                          title="Delete category mapping"
                        >
                          Delete Category
                        </button>
                      )}
                      {merchantMappings[mapping.description] && (
                        <button
                          className="delete-btn"
                          onClick={() => onDeleteMerchantMapping(mapping.description)}
                          title="Delete merchant mapping"
                        >
                          Delete Merchant
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="import-export-section">
          <button className="export-btn" onClick={handleExport}>
            Export Rules
          </button>
          <label className="import-btn">
            Import Rules
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>
    </div>
  )
}

export default AutoCategorization
