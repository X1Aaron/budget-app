import { useState } from 'react'
import './CategorySettings.css'

function CategorySettings({ categories, rules, onUpdateCategories, onUpdateRules }) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('categories')
  const [newCategory, setNewCategory] = useState({
    name: '',
    color: '#6b7280',
    type: 'expense',
    keywords: ''
  })
  const [newRule, setNewRule] = useState({
    pattern: '',
    category: '',
    matchType: 'contains'
  })
  const [editingRuleId, setEditingRuleId] = useState(null)

  const handleAddCategory = () => {
    if (!newCategory.name.trim()) return

    const category = {
      id: newCategory.name.toLowerCase().replace(/\s+/g, '-'),
      name: newCategory.name,
      color: newCategory.color,
      type: newCategory.type,
      keywords: newCategory.keywords.split(',').map(k => k.trim()).filter(k => k)
    }

    onUpdateCategories([...categories, category])
    setNewCategory({ name: '', color: '#6b7280', type: 'expense', keywords: '' })
  }

  const handleDeleteCategory = (categoryId) => {
    if (categoryId === 'uncategorized') return
    onUpdateCategories(categories.filter(cat => cat.id !== categoryId))
  }

  const handleAddRule = () => {
    if (!newRule.pattern.trim() || !newRule.category) return

    const rule = {
      id: Date.now().toString(),
      pattern: newRule.pattern.trim(),
      category: newRule.category,
      matchType: newRule.matchType,
      caseSensitive: false,
      priority: rules.length
    }

    onUpdateRules([...rules, rule])
    setNewRule({ pattern: '', category: '', matchType: 'contains' })
  }

  const handleUpdateRule = () => {
    if (!newRule.pattern.trim() || !newRule.category) return

    const updatedRules = rules.map(rule => {
      if (rule.id === editingRuleId) {
        return {
          ...rule,
          pattern: newRule.pattern.trim(),
          category: newRule.category,
          matchType: newRule.matchType
        }
      }
      return rule
    })

    onUpdateRules(updatedRules)
    setEditingRuleId(null)
    setNewRule({ pattern: '', category: '', matchType: 'contains' })
  }

  const handleEditRule = (rule) => {
    setEditingRuleId(rule.id)
    setNewRule({
      pattern: rule.pattern,
      category: rule.category,
      matchType: rule.matchType
    })
  }

  const handleCancelEdit = () => {
    setEditingRuleId(null)
    setNewRule({ pattern: '', category: '', matchType: 'contains' })
  }

  const handleDeleteRule = (ruleId) => {
    onUpdateRules(rules.filter(rule => rule.id !== ruleId))
  }

  const handleMoveRule = (index, direction) => {
    const newRules = [...rules]
    const newIndex = direction === 'up' ? index - 1 : index + 1

    if (newIndex < 0 || newIndex >= newRules.length) return

    const temp = newRules[index]
    newRules[index] = newRules[newIndex]
    newRules[newIndex] = temp

    newRules.forEach((rule, idx) => {
      rule.priority = idx
    })

    onUpdateRules(newRules)
  }

  return (
    <div className="category-settings">
      <button className="settings-btn" onClick={() => setIsOpen(!isOpen)}>
        Category Settings
      </button>

      {isOpen && (
        <div className="settings-modal">
          <div className="settings-modal-content">
            <div className="modal-header">
              <h2>Category Settings</h2>
              <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
            </div>

            <div className="modal-tabs">
              <button
                className={'tab-btn' + (activeTab === 'categories' ? ' active' : '')}
                onClick={() => setActiveTab('categories')}
              >
                Categories
              </button>
              <button
                className={'tab-btn' + (activeTab === 'rules' ? ' active' : '')}
                onClick={() => setActiveTab('rules')}
              >
                Auto-Rules ({rules.length})
              </button>
            </div>

            <div className="modal-body">
              {activeTab === 'categories' ? (
                <>
                  <div className="add-section">
                    <h3>Add Category</h3>
                    <div className="add-form">
                      <input
                        type="text"
                        placeholder="Category name (e.g., Groceries)"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                        className="input-name"
                      />
                      <div className="form-row">
                        <select
                          value={newCategory.type}
                          onChange={(e) => setNewCategory({ ...newCategory, type: e.target.value })}
                          className="input-type"
                        >
                          <option value="expense">Expense</option>
                          <option value="income">Income</option>
                          <option value="both">Both</option>
                        </select>
                        <input
                          type="color"
                          value={newCategory.color}
                          onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                          className="input-color"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Keywords for auto-categorization (comma separated, e.g., walmart, safeway, kroger)"
                        value={newCategory.keywords}
                        onChange={(e) => setNewCategory({ ...newCategory, keywords: e.target.value })}
                        className="input-keywords"
                      />
                      <button className="add-btn" onClick={handleAddCategory}>Add Category</button>
                    </div>
                    <p className="help-text">
                      💡 Add keywords to automatically categorize transactions that contain those words
                    </p>
                  </div>

                  <div className="list-section">
                    <h3>Your Categories ({categories.length})</h3>
                    <div className="categories-grid">
                      {[...categories].sort((a, b) => a.name.localeCompare(b.name)).map(category => (
                        <div key={category.id} className="category-card">
                          <div className="category-header">
                            <div className="category-color" style={{ backgroundColor: category.color }}></div>
                            <span className="category-name">{category.name}</span>
                            {category.id !== 'uncategorized' && (
                              <button
                                className="delete-btn"
                                onClick={() => handleDeleteCategory(category.id)}
                                title="Delete category"
                              >
                                ×
                              </button>
                            )}
                          </div>
                          <div className="category-info">
                            <span className="category-type-badge">{category.type}</span>
                            {category.keywords && category.keywords.length > 0 && (
                              <div className="category-keywords">
                                <strong>Keywords:</strong> {category.keywords.join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="rules-info">
                    <p>🎯 Advanced rules for complex pattern matching. Rules are checked in order (top to bottom).</p>
                  </div>

                  <div className="add-section">
                    <h3>{editingRuleId ? 'Edit Rule' : 'Add Advanced Rule'}</h3>
                    <div className="add-form">
                      <input
                        type="text"
                        placeholder="Pattern (e.g., Amazon, AMZN, etc.)"
                        value={newRule.pattern}
                        onChange={(e) => setNewRule({ ...newRule, pattern: e.target.value })}
                        className="input-pattern"
                      />
                      <div className="form-row">
                        <select
                          value={newRule.matchType}
                          onChange={(e) => setNewRule({ ...newRule, matchType: e.target.value })}
                          className="input-match"
                        >
                          <option value="contains">Contains</option>
                          <option value="starts">Starts with</option>
                          <option value="ends">Ends with</option>
                          <option value="exact">Exact match</option>
                        </select>
                        <select
                          value={newRule.category}
                          onChange={(e) => setNewRule({ ...newRule, category: e.target.value })}
                          className="input-category"
                        >
                          <option value="">Select category...</option>
                          {[...categories].sort((a, b) => a.name.localeCompare(b.name)).map(cat => (
                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-actions">
                        {editingRuleId ? (
                          <>
                            <button className="update-btn" onClick={handleUpdateRule}>Update Rule</button>
                            <button className="cancel-btn" onClick={handleCancelEdit}>Cancel</button>
                          </>
                        ) : (
                          <button className="add-btn" onClick={handleAddRule}>Add Rule</button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="list-section">
                    <h3>Active Rules ({rules.length})</h3>
                    {rules.length === 0 ? (
                      <p className="empty-message">No advanced rules yet. Most transactions can be categorized using keywords in the Categories tab.</p>
                    ) : (
                      <div className="rules-list">
                        {rules.map((rule, index) => (
                          <div key={rule.id} className="rule-item">
                            <div className="rule-priority">
                              <button
                                className="priority-btn"
                                onClick={() => handleMoveRule(index, 'up')}
                                disabled={index === 0}
                                title="Move up"
                              >
                                ↑
                              </button>
                              <span className="priority-number">#{index + 1}</span>
                              <button
                                className="priority-btn"
                                onClick={() => handleMoveRule(index, 'down')}
                                disabled={index === rules.length - 1}
                                title="Move down"
                              >
                                ↓
                              </button>
                            </div>

                            <div className="rule-details">
                              <div className="rule-pattern">"{rule.pattern}"</div>
                              <div className="rule-meta">
                                <span className="rule-match-badge">{rule.matchType}</span>
                                <span className="rule-arrow">→</span>
                                <span className="rule-category">{rule.category}</span>
                              </div>
                            </div>

                            <div className="rule-actions">
                              <button className="edit-btn-small" onClick={() => handleEditRule(rule)} title="Edit">
                                ✏️
                              </button>
                              <button className="delete-btn-small" onClick={() => handleDeleteRule(rule.id)} title="Delete">
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CategorySettings