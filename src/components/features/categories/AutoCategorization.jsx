import React, { useMemo, useState } from 'react'
import '../../../styles/components/AutoCategorization.css'

function AutoCategorization({ merchantMappings, categoryMappings, onDeleteMerchantMapping, onDeleteCategoryMapping, categories }) {
  const [searchTerm, setSearchTerm] = useState('')

  // Only show exact match rules (from manual categorization)
  const allRules = useMemo(() => {
    const rules = []

    const allDescriptions = new Set([
      ...Object.keys(merchantMappings),
      ...Object.keys(categoryMappings)
    ])

    Array.from(allDescriptions).forEach(description => {
      rules.push({
        type: 'exact',
        description,
        merchantName: merchantMappings[description],
        category: categoryMappings[description],
        hasCategory: !!categoryMappings[description],
        hasMerchant: !!merchantMappings[description]
      })
    })

    return rules
  }, [merchantMappings, categoryMappings])

  const filteredRules = useMemo(() => {
    let filtered = allRules

    // Filter by search term
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase()
      filtered = filtered.filter(rule => {
        return (
          rule.description.toLowerCase().includes(lowerSearch) ||
          (rule.category && rule.category.toLowerCase().includes(lowerSearch)) ||
          (rule.merchantName && rule.merchantName.toLowerCase().includes(lowerSearch))
        )
      })
    }

    return filtered
  }, [allRules, searchTerm])

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
        <h2>Categorization Rules</h2>
        <p className="auto-cat-description">
          These rules are created when you manually categorize transactions or change merchant names.
          They ensure consistent categorization for future transactions with the same description.
        </p>
      </div>

      <div className="auto-cat-content">
        {allRules.length === 0 ? (
          <div className="empty-state">
            <p>No rules yet.</p>
            <p className="empty-hint">When you manually assign a category or change a merchant name for a transaction, a rule will be created here.</p>
          </div>
        ) : (
          <>
            <div className="filters-bar">
              <div className="search-bar">
                <input
                  type="text"
                  placeholder="Search rules..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              <div className="rule-count">
                {allRules.length} {allRules.length === 1 ? 'rule' : 'rules'}
              </div>
            </div>

            <div className="rules-table-wrapper">
              {filteredRules.length === 0 ? (
                <div className="no-results">
                  No rules match your search.
                </div>
              ) : (
                <table className="rules-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Category</th>
                      <th>Merchant</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRules.map((rule, index) => (
                      <tr key={index}>
                        <td className="description-cell">{rule.description}</td>
                        <td className="category-cell">
                          {rule.hasCategory ? (
                            <span className="category-badge">{rule.category}</span>
                          ) : (
                            <span className="no-value">—</span>
                          )}
                        </td>
                        <td className="merchant-cell">
                          {rule.hasMerchant ? (
                            <span className="merchant-badge">{rule.merchantName}</span>
                          ) : (
                            <span className="no-value">—</span>
                          )}
                        </td>
                        <td className="actions-cell">
                          <button
                            className="delete-btn"
                            onClick={() => handleDeleteRule(rule.description, rule.hasCategory, rule.hasMerchant)}
                            title="Delete this rule"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AutoCategorization
