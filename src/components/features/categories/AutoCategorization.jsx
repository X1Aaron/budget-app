import React, { useMemo, useState } from 'react'
import '../../../styles/components/AutoCategorization.css'

function AutoCategorization({ merchantMappings, categoryMappings, onDeleteMerchantMapping, onDeleteCategoryMapping, categories, disabledKeywords = {}, onToggleKeyword, onAddExactRule, onAddKeywordToCategory }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showRuleType, setShowRuleType] = useState('all') // 'all', 'exact', 'keyword'
  const [showAddExactRule, setShowAddExactRule] = useState(false)
  const [showAddKeyword, setShowAddKeyword] = useState(false)
  const [newExactRule, setNewExactRule] = useState({ description: '', category: '', merchantName: '' })
  const [newKeyword, setNewKeyword] = useState({ category: '', keyword: '' })
  const [expandedCategories, setExpandedCategories] = useState(new Set())

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

  const handleAddExactRule = () => {
    if (newExactRule.description && newExactRule.category) {
      onAddExactRule(newExactRule.description, newExactRule.category, newExactRule.merchantName)
      setNewExactRule({ description: '', category: '', merchantName: '' })
      setShowAddExactRule(false)
    }
  }

  const handleAddKeyword = () => {
    if (newKeyword.category && newKeyword.keyword) {
      onAddKeywordToCategory(newKeyword.category, newKeyword.keyword)
      setNewKeyword({ category: '', keyword: '' })
      setShowAddKeyword(false)
    }
  }

  const toggleCategory = (categoryName) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(categoryName)) {
        next.delete(categoryName)
      } else {
        next.add(categoryName)
      }
      return next
    })
  }

  // Group keyword rules by category
  const keywordRulesByCategory = useMemo(() => {
    const grouped = {}
    filteredRules
      .filter(rule => rule.type === 'keyword')
      .forEach(rule => {
        if (!grouped[rule.category]) {
          grouped[rule.category] = []
        }
        grouped[rule.category].push(rule)
      })
    return grouped
  }, [filteredRules])

  return (
    <div className="auto-categorization">
      <div className="auto-cat-header">
        <div className="header-content">
          <h2>Categorization Rules</h2>
          <div className="header-actions">
            <button
              className="add-rule-btn"
              onClick={() => setShowAddExactRule(true)}
            >
              + Add Exact Rule
            </button>
            <button
              className="add-rule-btn"
              onClick={() => setShowAddKeyword(true)}
            >
              + Add Keyword
            </button>
          </div>
        </div>
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
              ) : showRuleType === 'keyword' || showRuleType === 'all' ? (
                <>
                  {/* Show exact rules if not filtering to keywords only */}
                  {showRuleType === 'all' && filteredRules.filter(r => r.type === 'exact').length > 0 && (
                    <div className="exact-rules-section">
                      <h3>Exact Match Rules</h3>
                      <table className="rules-table">
                        <thead>
                          <tr>
                            <th>Description</th>
                            <th>Category</th>
                            <th>Merchant Name</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRules
                            .filter(rule => rule.type === 'exact')
                            .map((rule, index) => (
                              <tr key={`exact-${index}`}>
                                <td className="description-cell">{rule.description}</td>
                                <td className="category-cell">
                                  {rule.category ? (
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
                    </div>
                  )}

                  {/* Show grouped keyword rules */}
                  {Object.keys(keywordRulesByCategory).length > 0 && (
                    <div className="keyword-rules-section">
                      <h3>Keyword Rules</h3>
                      {Object.entries(keywordRulesByCategory).map(([categoryName, rules]) => (
                        <div key={categoryName} className="category-group">
                          <div
                            className="category-group-header"
                            onClick={() => toggleCategory(categoryName)}
                          >
                            <span className="expand-icon">
                              {expandedCategories.has(categoryName) ? '▼' : '▶'}
                            </span>
                            <span className="category-name">{categoryName}</span>
                            <span className="keyword-count">
                              {rules.length} keyword{rules.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          {expandedCategories.has(categoryName) && (
                            <div className="keywords-list">
                              {rules.map((rule, index) => (
                                <div
                                  key={`keyword-${categoryName}-${index}`}
                                  className={`keyword-item ${rule.isDisabled ? 'disabled' : ''}`}
                                >
                                  <span className="keyword-text">{rule.keyword}</span>
                                  <span className="category-type-badge">{rule.categoryType}</span>
                                  <button
                                    className={`toggle-btn ${rule.isDisabled ? 'disabled' : 'enabled'}`}
                                    onClick={() => onToggleKeyword(rule.category, rule.keyword)}
                                    title={rule.isDisabled ? 'Enable keyword' : 'Disable keyword'}
                                  >
                                    {rule.isDisabled ? 'Disabled' : 'Enabled'}
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                /* Show exact rules in table format when filtering to exact only */
                <table className="rules-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Category</th>
                      <th>Merchant Name</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRules
                      .filter(rule => rule.type === 'exact')
                      .map((rule, index) => (
                        <tr key={index}>
                          <td className="description-cell">{rule.description}</td>
                          <td className="category-cell">
                            {rule.category ? (
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

      {/* Add Exact Rule Modal */}
      {showAddExactRule && (
        <div className="modal-overlay" onClick={() => setShowAddExactRule(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add Exact Match Rule</h3>
            <div className="form-group">
              <label>Transaction Description</label>
              <input
                type="text"
                placeholder="e.g., AMZN MKTP US*1234567890"
                value={newExactRule.description}
                onChange={(e) => setNewExactRule({ ...newExactRule, description: e.target.value })}
                className="form-input"
              />
              <p className="form-help">The exact transaction description to match</p>
            </div>
            <div className="form-group">
              <label>Category</label>
              <select
                value={newExactRule.category}
                onChange={(e) => setNewExactRule({ ...newExactRule, category: e.target.value })}
                className="form-input"
              >
                <option value="">Select a category...</option>
                {categories
                  .filter(cat => cat.id !== 'uncategorized')
                  .map(cat => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="form-group">
              <label>Merchant Name (Optional)</label>
              <input
                type="text"
                placeholder="e.g., Amazon"
                value={newExactRule.merchantName}
                onChange={(e) => setNewExactRule({ ...newExactRule, merchantName: e.target.value })}
                className="form-input"
              />
              <p className="form-help">A friendly name to display instead of the raw description</p>
            </div>
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowAddExactRule(false)}
              >
                Cancel
              </button>
              <button
                className="save-btn"
                onClick={handleAddExactRule}
                disabled={!newExactRule.description || !newExactRule.category}
              >
                Add Rule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Keyword Modal */}
      {showAddKeyword && (
        <div className="modal-overlay" onClick={() => setShowAddKeyword(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add Keyword Rule</h3>
            <div className="form-group">
              <label>Category</label>
              <select
                value={newKeyword.category}
                onChange={(e) => setNewKeyword({ ...newKeyword, category: e.target.value })}
                className="form-input"
              >
                <option value="">Select a category...</option>
                {categories
                  .filter(cat => cat.id !== 'uncategorized')
                  .map(cat => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="form-group">
              <label>Keyword</label>
              <input
                type="text"
                placeholder="e.g., coffee, netflix, gas station"
                value={newKeyword.keyword}
                onChange={(e) => setNewKeyword({ ...newKeyword, keyword: e.target.value.toLowerCase() })}
                className="form-input"
              />
              <p className="form-help">Keywords are case-insensitive and will match anywhere in the description</p>
            </div>
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowAddKeyword(false)}
              >
                Cancel
              </button>
              <button
                className="save-btn"
                onClick={handleAddKeyword}
                disabled={!newKeyword.category || !newKeyword.keyword}
              >
                Add Keyword
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AutoCategorization
