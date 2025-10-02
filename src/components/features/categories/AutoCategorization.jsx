import React, { useMemo, useState } from 'react'
import '../../../styles/components/AutoCategorization.css'

function AutoCategorization({ merchantMappings, categoryMappings, onDeleteMerchantMapping, onDeleteCategoryMapping }) {
  const [searchTerm, setSearchTerm] = useState('')

  const combinedMappings = useMemo(() => {
    const allDescriptions = new Set([
      ...Object.keys(merchantMappings),
      ...Object.keys(categoryMappings)
    ])

    return Array.from(allDescriptions).map(description => ({
      description,
      merchantName: merchantMappings[description],
      category: categoryMappings[description],
      hasCategory: !!categoryMappings[description],
      hasMerchant: !!merchantMappings[description]
    }))
  }, [merchantMappings, categoryMappings])

  const filteredMappings = useMemo(() => {
    if (!searchTerm) return combinedMappings

    const lowerSearch = searchTerm.toLowerCase()
    return combinedMappings.filter(mapping =>
      mapping.description.toLowerCase().includes(lowerSearch) ||
      (mapping.category && mapping.category.toLowerCase().includes(lowerSearch)) ||
      (mapping.merchantName && mapping.merchantName.toLowerCase().includes(lowerSearch))
    )
  }, [combinedMappings, searchTerm])

  const handleDeleteRule = (description, hasCategory, hasMerchant) => {
    if (hasCategory) {
      onDeleteCategoryMapping(description)
    }
    if (hasMerchant) {
      onDeleteMerchantMapping(description)
    }
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
        {combinedMappings.length === 0 ? (
          <div className="empty-state">
            <p>No rules yet.</p>
            <p className="empty-hint">When you manually assign a category or change a merchant name for a transaction, a rule will be created here.</p>
          </div>
        ) : (
          <>
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search rules by description, category, or merchant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="rules-grid">
              {filteredMappings.length === 0 ? (
                <div className="no-results">
                  No rules match your search.
                </div>
              ) : (
                filteredMappings.map((mapping, index) => (
                  <div key={index} className="rule-card">
                    <div className="rule-header">
                      <span className="rule-label">When description matches:</span>
                      <div className="rule-description">{mapping.description}</div>
                    </div>

                    <div className="rule-actions-list">
                      {mapping.hasCategory && (
                        <div className="rule-action">
                          <span className="action-arrow">→</span>
                          <span className="action-label">Category:</span>
                          <span className="action-value category-badge">{mapping.category}</span>
                        </div>
                      )}
                      {mapping.hasMerchant && (
                        <div className="rule-action">
                          <span className="action-arrow">→</span>
                          <span className="action-label">Merchant:</span>
                          <span className="action-value merchant-badge">{mapping.merchantName}</span>
                        </div>
                      )}
                    </div>

                    <div className="rule-footer">
                      <button
                        className="delete-rule-btn"
                        onClick={() => handleDeleteRule(mapping.description, mapping.hasCategory, mapping.hasMerchant)}
                        title="Delete this rule"
                      >
                        Delete Rule
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AutoCategorization
