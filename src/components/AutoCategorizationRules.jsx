import { useState } from 'react'
import './AutoCategorizationRules.css'

function AutoCategorizationRules({ rules, categories, onUpdateRules }) {
  const [isOpen, setIsOpen] = useState(false)
  const [newRule, setNewRule] = useState({
    pattern: '',
    category: '',
    matchType: 'contains',
    caseSensitive: false
  })
  const [editingId, setEditingId] = useState(null)

  const handleAddRule = () => {
    if (!newRule.pattern.trim() || !newRule.category) return

    const rule = {
      id: Date.now().toString(),
      pattern: newRule.pattern.trim(),
      category: newRule.category,
      matchType: newRule.matchType,
      caseSensitive: newRule.caseSensitive,
      priority: rules.length
    }

    onUpdateRules([...rules, rule])
    setNewRule({ pattern: '', category: '', matchType: 'contains', caseSensitive: false })
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

  const handleEditRule = (rule) => {
    setEditingId(rule.id)
    setNewRule({
      pattern: rule.pattern,
      category: rule.category,
      matchType: rule.matchType,
      caseSensitive: rule.caseSensitive
    })
  }

  const handleUpdateRule = () => {
    if (!newRule.pattern.trim() || !newRule.category) return

    const updatedRules = rules.map(rule => {
      if (rule.id === editingId) {
        return {
          ...rule,
          pattern: newRule.pattern.trim(),
          category: newRule.category,
          matchType: newRule.matchType,
          caseSensitive: newRule.caseSensitive
        }
      }
      return rule
    })

    onUpdateRules(updatedRules)
    setEditingId(null)
    setNewRule({ pattern: '', category: '', matchType: 'contains', caseSensitive: false })
  }

  const handleCancel = () => {
    setEditingId(null)
    setNewRule({ pattern: '', category: '', matchType: 'contains', caseSensitive: false })
  }

  return (
    <div className="auto-categorization-rules">
      <button className="manage-rules-btn" onClick={() => setIsOpen(!isOpen)}>
        Auto-Categorization Rules
      </button>

      {isOpen && (
        <div className="rules-modal">
          <div className="rules-modal-content">
            <div className="modal-header">
              <h2>Auto-Categorization Rules</h2>
              <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="rules-info">
                <p>Rules are applied in order from top to bottom. The first matching rule wins.</p>
              </div>

              <div className="add-rule-section">
                <h3>{editingId ? 'Edit Rule' : 'Add New Rule'}</h3>
                <div className="add-rule-form">
                  <div className="form-row">
                    <label>Pattern</label>
                    <input
                      type="text"
                      placeholder="e.g., Starbucks, Amazon, etc."
                      value={newRule.pattern}
                      onChange={(e) => setNewRule({ ...newRule, pattern: e.target.value })}
                    />
                  </div>
                  
                  <div className="form-row">
                    <label>Match Type</label>
                    <select
                      value={newRule.matchType}
                      onChange={(e) => setNewRule({ ...newRule, matchType: e.target.value })}
                    >
                      <option value="contains">Contains</option>
                      <option value="starts">Starts with</option>
                      <option value="ends">Ends with</option>
                      <option value="exact">Exact match</option>
                    </select>
                  </div>

                  <div className="form-row">
                    <label>Category</label>
                    <select
                      value={newRule.category}
                      onChange={(e) => setNewRule({ ...newRule, category: e.target.value })}
                    >
                      <option value="">Select category...</option>
                      {[...categories].sort((a, b) => a.name.localeCompare(b.name)).map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row checkbox-row">
                    <label>
                      <input
                        type="checkbox"
                        checked={newRule.caseSensitive}
                        onChange={(e) => setNewRule({ ...newRule, caseSensitive: e.target.checked })}
                      />
                      Case sensitive
                    </label>
                  </div>

                  <div className="form-actions">
                    {editingId ? (
                      <>
                        <button className="update-btn" onClick={handleUpdateRule}>Update</button>
                        <button className="cancel-btn" onClick={handleCancel}>Cancel</button>
                      </>
                    ) : (
                      <button className="add-btn" onClick={handleAddRule}>Add Rule</button>
                    )}
                  </div>
                </div>
              </div>

              <div className="rules-list-section">
                <h3>Existing Rules ({rules.length})</h3>
                {rules.length === 0 ? (
                  <p className="no-rules">No custom rules yet. Add one above!</p>
                ) : (
                  <div className="rules-list">
                    {rules.map((rule, index) => (
                      <div key={rule.id} className="rule-item">
                        <div className="rule-priority">
                          <button
                            className="priority-btn"
                            onClick={() => handleMoveRule(index, 'up')}
                            disabled={index === 0}
                          >
                            ↑
                          </button>
                          <span className="priority-number">{index + 1}</span>
                          <button
                            className="priority-btn"
                            onClick={() => handleMoveRule(index, 'down')}
                            disabled={index === rules.length - 1}
                          >
                            ↓
                          </button>
                        </div>
                        
                        <div className="rule-details">
                          <div className="rule-pattern">
                            <strong>Pattern:</strong> "{rule.pattern}"
                            <span className="rule-match-type">({rule.matchType})</span>
                            {rule.caseSensitive && <span className="case-badge">Case sensitive</span>}
                          </div>
                          <div className="rule-category">
                            <strong>Category:</strong> {rule.category}
                          </div>
                        </div>

                        <div className="rule-actions">
                          <button className="edit-btn" onClick={() => handleEditRule(rule)}>
                            Edit
                          </button>
                          <button className="delete-btn" onClick={() => handleDeleteRule(rule.id)}>
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AutoCategorizationRules
