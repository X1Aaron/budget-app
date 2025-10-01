import React, { useMemo, useState } from 'react'
import '../../../styles/components/AutoCategorization.css'

function AutoCategorization({ merchantMappings, categoryMappings, onDeleteMerchantMapping, onDeleteCategoryMapping }) {
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
      </div>
    </div>
  )
}

export default AutoCategorization
