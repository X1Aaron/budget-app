import React, { useMemo, useState } from 'react'
import '../../../styles/components/AutoCategorization.css'

function AutoCategorization({ merchantMappings, categoryMappings, onDeleteMerchantMapping, onDeleteCategoryMapping, categories }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all') // 'all', 'exact', 'keyword'

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

    // Keyword rules (from category keywords)
    if (categories) {
      categories.forEach(category => {
        if (category.keywords && category.keywords.length > 0 && category.id !== 'uncategorized') {
          category.keywords.forEach(keyword => {
            rules.push({
              type: 'keyword',
              keyword: keyword,
              category: category.name,
              categoryColor: category.color,
              hasCategory: true,
              hasMerchant: false
            })
          })
        }
      })
    }

    return rules
  }, [merchantMappings, categoryMappings, categories])

  const filteredRules = useMemo(() => {
    let filtered = allRules

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(rule => rule.type === filterType)
    }

    // Filter by search term
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase()
      filtered = filtered.filter(rule => {
        if (rule.type === 'exact') {
          return (
            rule.description.toLowerCase().includes(lowerSearch) ||
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
  }, [allRules, searchTerm, filterType])

  const handleDeleteRule = (description, hasCategory, hasMerchant) => {
    if (hasCategory) {
      onDeleteCategoryMapping(description)
    }
    if (hasMerchant) {
      onDeleteMerchantMapping(description)
    }
  }

  const exactMatchCount = allRules.filter(r => r.type === 'exact').length
  const keywordMatchCount = allRules.filter(r => r.type === 'keyword').length

  return (
    <div className="auto-categorization">
      <div className="auto-cat-header">
        <h2>Categorization Rules</h2>
        <p className="auto-cat-description">
          Rules are applied with priority: <strong>Exact Match</strong> (highest) → <strong>Keyword Match</strong> → Default.
          Exact match rules are created when you manually categorize transactions.
        </p>
      </div>

      <div className="auto-cat-content">
        {allRules.length === 0 ? (
          <div className="empty-state">
            <p>No rules yet.</p>
            <p className="empty-hint">When you manually assign a category or change a merchant name for a transaction, an exact match rule will be created here. Keyword rules are managed in the Categories section.</p>
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
                  className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterType('all')}
                >
                  All ({allRules.length})
                </button>
                <button
                  className={`filter-btn ${filterType === 'exact' ? 'active' : ''}`}
                  onClick={() => setFilterType('exact')}
                >
                  Exact Match ({exactMatchCount})
                </button>
                <button
                  className={`filter-btn ${filterType === 'keyword' ? 'active' : ''}`}
                  onClick={() => setFilterType('keyword')}
                >
                  Keyword ({keywordMatchCount})
                </button>
              </div>
            </div>

            <div className="rules-grid">
              {filteredRules.length === 0 ? (
                <div className="no-results">
                  No rules match your search.
                </div>
              ) : (
                filteredRules.map((rule, index) => (
                  <div key={index} className={`rule-card ${rule.type}`}>
                    <div className="rule-type-badge">
                      {rule.type === 'exact' ? '🎯 Exact Match' : '🔍 Keyword Match'}
                    </div>

                    {rule.type === 'exact' ? (
                      <>
                        <div className="rule-header">
                          <span className="rule-label">When description equals:</span>
                          <div className="rule-description">{rule.description}</div>
                        </div>

                        <div className="rule-actions-list">
                          {rule.hasCategory && (
                            <div className="rule-action">
                              <span className="action-arrow">→</span>
                              <span className="action-label">Category:</span>
                              <span className="action-value category-badge">{rule.category}</span>
                            </div>
                          )}
                          {rule.hasMerchant && (
                            <div className="rule-action">
                              <span className="action-arrow">→</span>
                              <span className="action-label">Merchant:</span>
                              <span className="action-value merchant-badge">{rule.merchantName}</span>
                            </div>
                          )}
                        </div>

                        <div className="rule-footer">
                          <button
                            className="delete-rule-btn"
                            onClick={() => handleDeleteRule(rule.description, rule.hasCategory, rule.hasMerchant)}
                            title="Delete this exact match rule"
                          >
                            Delete Rule
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="rule-header">
                          <span className="rule-label">When description contains:</span>
                          <div className="rule-keyword">{rule.keyword}</div>
                        </div>

                        <div className="rule-actions-list">
                          <div className="rule-action">
                            <span className="action-arrow">→</span>
                            <span className="action-label">Category:</span>
                            <span className="action-value category-badge" style={{ backgroundColor: rule.categoryColor }}>
                              {rule.category}
                            </span>
                          </div>
                        </div>

                        <div className="rule-footer">
                          <span className="rule-note">Edit in Categories section</span>
                        </div>
                      </>
                    )}
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
