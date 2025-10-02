import React, { useMemo, useState } from 'react'
import '../../../styles/components/AutoCategorization.css'

function AutoCategorization({ merchantMappings, categoryMappings, onDeleteMerchantMapping, onDeleteCategoryMapping, categories, disabledKeywords = {}, onToggleKeyword }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showRuleType, setShowRuleType] = useState('all') // 'all', 'exact', 'keyword'

  // Combine exact match rules and keyword rules
  const allRules = useMemo(() => {
    const rules = []

    // Exact match rules (from manual categorization)
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

    // Keyword rules (from categories)
    categories.forEach(category => {
      if (category.keywords && category.keywords.length > 0) {
        category.keywords.forEach(keyword => {
          const isDisabled = disabledKeywords[category.name]?.includes(keyword)
          rules.push({
            type: 'keyword',
            keyword,
            category: category.name,
            categoryType: category.type,
            isDisabled
          })
        })
      }
    })

    return rules
  }, [merchantMappings, categoryMappings, categories, disabledKeywords])

  const filteredRules = useMemo(() => {
    let filtered = allRules

    // Filter by rule type
    if (showRuleType !== 'all') {
      filtered = filtered.filter(rule => rule.type === showRuleType)
    }

    // Filter by search term
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase()
      filtered = filtered.filter(rule => {
        if (rule.type === 'exact') {
          return (
            rule.description?.toLowerCase().includes(lowerSearch) ||
            (rule.category && rule.category.toLowerCase().includes(lowerSearch)) ||
            (rule.merchantName && rule.merchantName.toLowerCase().includes(lowerSearch))
          )
        } else {
          return (
            rule.keyword.toLowerCase().includes(lowerSearch) ||
            rule.category.toLowerCase().includes(lowerSearch)
          )
        }
      })
    }

    return filtered
  }, [allRules, searchTerm, showRuleType])

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
          View and manage all categorization rules. Exact rules are created when you manually categorize transactions.
          Keyword rules are predefined patterns that automatically categorize transactions.
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
              <div className="rule-type-filter">
                <button
                  className={showRuleType === 'all' ? 'active' : ''}
                  onClick={() => setShowRuleType('all')}
                >
                  All
                </button>
                <button
                  className={showRuleType === 'exact' ? 'active' : ''}
                  onClick={() => setShowRuleType('exact')}
                >
                  Exact
                </button>
                <button
                  className={showRuleType === 'keyword' ? 'active' : ''}
                  onClick={() => setShowRuleType('keyword')}
                >
                  Keywords
                </button>
              </div>
              <div className="rule-count">
                {filteredRules.length} {filteredRules.length === 1 ? 'rule' : 'rules'}
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
                      <th>Type</th>
                      <th>Pattern/Description</th>
                      <th>Category</th>
                      <th>Merchant/Info</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRules.map((rule, index) => (
                      <tr key={index} className={rule.isDisabled ? 'disabled-rule' : ''}>
                        <td className="type-cell">
                          <span className={`type-badge ${rule.type}`}>
                            {rule.type === 'exact' ? 'Exact' : 'Keyword'}
                          </span>
                        </td>
                        <td className="description-cell">
                          {rule.type === 'exact' ? rule.description : rule.keyword}
                        </td>
                        <td className="category-cell">
                          {rule.category ? (
                            <span className="category-badge">{rule.category}</span>
                          ) : (
                            <span className="no-value">—</span>
                          )}
                        </td>
                        <td className="merchant-cell">
                          {rule.type === 'exact' && rule.hasMerchant ? (
                            <span className="merchant-badge">{rule.merchantName}</span>
                          ) : rule.type === 'keyword' ? (
                            <span className="category-type-badge">{rule.categoryType}</span>
                          ) : (
                            <span className="no-value">—</span>
                          )}
                        </td>
                        <td className="actions-cell">
                          {rule.type === 'exact' ? (
                            <button
                              className="delete-btn"
                              onClick={() => handleDeleteRule(rule.description, rule.hasCategory, rule.hasMerchant)}
                              title="Delete this rule"
                            >
                              ×
                            </button>
                          ) : (
                            <button
                              className={`toggle-btn ${rule.isDisabled ? 'disabled' : 'enabled'}`}
                              onClick={() => onToggleKeyword(rule.category, rule.keyword)}
                              title={rule.isDisabled ? 'Enable keyword' : 'Disable keyword'}
                            >
                              {rule.isDisabled ? '○' : '●'}
                            </button>
                          )}
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
