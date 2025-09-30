import { useState } from 'react'
import './CategorySettings.css'
import { autoCategorize } from '../utils/categories'

function CategorySettings({ categories, onUpdateCategories, transactions, onUpdateTransactions }) {
  const [isAdding, setIsAdding] = useState(false)
  const [newCategory, setNewCategory] = useState({
    name: '',
    color: '#6b7280',
    type: 'expense',
    keywords: '',
    budgeted: 0,
    needWant: 'need'
  })
  const [editingCategoryId, setEditingCategoryId] = useState(null)
  const [editBudget, setEditBudget] = useState('')
  const [editingCategory, setEditingCategory] = useState(null)
  const [editCategoryForm, setEditCategoryForm] = useState({
    name: '',
    color: '#6b7280',
    type: 'expense',
    keywords: '',
    budgeted: 0,
    needWant: 'need'
  })
  const [keywordInput, setKeywordInput] = useState('')
  const [editKeywordInput, setEditKeywordInput] = useState('')

  const handleAddKeyword = (e, isEdit = false) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const input = isEdit ? editKeywordInput : keywordInput
      const keyword = input.trim().replace(/,/g, '')

      if (keyword) {
        if (isEdit) {
          const currentKeywords = editCategoryForm.keywords ? editCategoryForm.keywords.split(',').map(k => k.trim()).filter(k => k) : []
          if (!currentKeywords.includes(keyword)) {
            setEditCategoryForm({
              ...editCategoryForm,
              keywords: [...currentKeywords, keyword].join(', ')
            })
          }
          setEditKeywordInput('')
        } else {
          const currentKeywords = newCategory.keywords ? newCategory.keywords.split(',').map(k => k.trim()).filter(k => k) : []
          if (!currentKeywords.includes(keyword)) {
            setNewCategory({
              ...newCategory,
              keywords: [...currentKeywords, keyword].join(', ')
            })
          }
          setKeywordInput('')
        }
      }
    }
  }

  const handleRemoveKeyword = (keywordToRemove, isEdit = false) => {
    if (isEdit) {
      const keywords = editCategoryForm.keywords.split(',').map(k => k.trim()).filter(k => k !== keywordToRemove)
      setEditCategoryForm({
        ...editCategoryForm,
        keywords: keywords.join(', ')
      })
    } else {
      const keywords = newCategory.keywords.split(',').map(k => k.trim()).filter(k => k !== keywordToRemove)
      setNewCategory({
        ...newCategory,
        keywords: keywords.join(', ')
      })
    }
  }

  const handleAddCategory = () => {
    if (!newCategory.name.trim()) return

    const category = {
      id: newCategory.name.toLowerCase().replace(/\s+/g, '-'),
      name: newCategory.name,
      color: newCategory.color,
      type: newCategory.type,
      keywords: newCategory.keywords.split(',').map(k => k.trim()).filter(k => k),
      budgeted: parseFloat(newCategory.budgeted) || 0,
      needWant: newCategory.needWant
    }

    const updatedCategories = [...categories, category]
    onUpdateCategories(updatedCategories)

    // Automatically recategorize transactions with the new category
    if (transactions && onUpdateTransactions && category.keywords.length > 0) {
      const updatedTransactions = transactions.map(t => {
        if (t.autoCategorized || !t.category || t.category === 'Uncategorized') {
          const result = autoCategorize(t.description, t.amount, 'Uncategorized', updatedCategories)
          return {
            ...t,
            category: result.category,
            autoCategorized: result.wasAutoCategorized
          }
        }
        return t
      })
      onUpdateTransactions(updatedTransactions)
    }

    setNewCategory({ name: '', color: '#6b7280', type: 'expense', keywords: '', budgeted: 0, needWant: 'need' })
    setKeywordInput('')
    setIsAdding(false)
  }

  const handleDeleteCategory = (categoryId) => {
    if (categoryId === 'uncategorized') return
    onUpdateCategories(categories.filter(cat => cat.id !== categoryId))
  }

  const handleEditCategory = (category) => {
    setEditingCategory(category.id)
    setEditCategoryForm({
      name: category.name,
      color: category.color,
      type: category.type,
      keywords: (category.keywords || []).join(', '),
      budgeted: category.budgeted || 0,
      needWant: category.needWant || 'need'
    })
  }

  const handleUpdateCategory = () => {
    if (!editCategoryForm.name.trim()) return

    const updatedCategories = categories.map(cat => {
      if (cat.id === editingCategory) {
        return {
          ...cat,
          name: editCategoryForm.name,
          color: editCategoryForm.color,
          type: editCategoryForm.type,
          keywords: editCategoryForm.keywords.split(',').map(k => k.trim()).filter(k => k),
          budgeted: parseFloat(editCategoryForm.budgeted) || 0,
          needWant: editCategoryForm.needWant
        }
      }
      return cat
    })

    onUpdateCategories(updatedCategories)
    setEditingCategory(null)
    setEditCategoryForm({ name: '', color: '#6b7280', type: 'expense', keywords: '', budgeted: 0, needWant: 'need' })
    setEditKeywordInput('')
  }

  const handleCancelCategoryEdit = () => {
    setEditingCategory(null)
    setEditCategoryForm({ name: '', color: '#6b7280', type: 'expense', keywords: '', budgeted: 0, needWant: 'need' })
    setEditKeywordInput('')
  }

  const handleUpdateBudget = (categoryId) => {
    const budget = parseFloat(editBudget)
    if (isNaN(budget) || budget < 0) return

    const updatedCategories = categories.map(cat => {
      if (cat.id === categoryId) {
        return { ...cat, budgeted: budget }
      }
      return cat
    })

    onUpdateCategories(updatedCategories)
    setEditingCategoryId(null)
    setEditBudget('')
  }

  const handleReapplyKeywords = () => {
    if (!transactions || !onUpdateTransactions) {
      alert('Unable to reapply keywords. Transactions data not available.')
      return
    }

    if (!confirm(`This will reapply keyword-based categorization to ${transactions.length} transactions. Manually categorized transactions will not be changed. Continue?`)) {
      return
    }

    const updatedTransactions = transactions.map(t => {
      // Only reapply if the transaction was auto-categorized or uncategorized
      if (t.autoCategorized || !t.category || t.category === 'Uncategorized') {
        const result = autoCategorize(t.description, t.amount, 'Uncategorized', categories)
        return {
          ...t,
          category: result.category,
          autoCategorized: result.wasAutoCategorized
        }
      }
      return t
    })

    onUpdateTransactions(updatedTransactions)
    alert('Keywords reapplied successfully!')
  }

  return (
    <div className="category-settings">
      <div className="category-settings-content">
                  <div className="list-section">
                    <div className="categories-header">
                      <h3>Your Categories ({categories.length})</h3>
                      {!isAdding && (
                        <button className="add-category-btn" onClick={() => setIsAdding(true)}>
                          + Add Category
                        </button>
                      )}
                    </div>

                    {isAdding && (
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
                          <div className="keywords-input-container">
                            <label>Keywords for auto-categorization</label>
                            <div className="keywords-tags">
                              {newCategory.keywords && newCategory.keywords.split(',').map(k => k.trim()).filter(k => k).map((keyword, idx) => (
                                <span key={idx} className="keyword-tag">
                                  {keyword}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveKeyword(keyword, false)}
                                    className="keyword-remove"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                              <input
                                type="text"
                                placeholder="Type keyword and press Enter or comma"
                                value={keywordInput}
                                onChange={(e) => setKeywordInput(e.target.value)}
                                onKeyDown={(e) => handleAddKeyword(e, false)}
                                className="keyword-input"
                              />
                            </div>
                          </div>
                          <div className="form-group">
                            <label htmlFor="new-budget">Budget Amount (optional)</label>
                            <input
                              id="new-budget"
                              type="number"
                              placeholder="0.00"
                              value={newCategory.budgeted}
                              onChange={(e) => setNewCategory({ ...newCategory, budgeted: e.target.value })}
                              className="input-budget"
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div className="need-want-selector">
                            <label>
                              <input
                                type="radio"
                                name="newCategoryNeedWant"
                                value="need"
                                checked={newCategory.needWant === 'need'}
                                onChange={(e) => setNewCategory({ ...newCategory, needWant: e.target.value })}
                              />
                              Need
                            </label>
                            <label>
                              <input
                                type="radio"
                                name="newCategoryNeedWant"
                                value="want"
                                checked={newCategory.needWant === 'want'}
                                onChange={(e) => setNewCategory({ ...newCategory, needWant: e.target.value })}
                              />
                              Want
                            </label>
                          </div>
                          <div className="form-actions">
                            <button className="cancel-btn" onClick={() => setIsAdding(false)}>Cancel</button>
                            <button className="add-btn" onClick={handleAddCategory}>Add Category</button>
                          </div>
                        </div>
                        <p className="help-text">
                          💡 Add keywords to automatically categorize transactions that contain those words
                        </p>
                      </div>
                    )}

                    {editingCategory && (
                      <div className="edit-category-section">
                        <h3>Edit Category</h3>
                        <div className="add-form">
                          <input
                            type="text"
                            placeholder="Category name"
                            value={editCategoryForm.name}
                            onChange={(e) => setEditCategoryForm({ ...editCategoryForm, name: e.target.value })}
                            className="input-name"
                          />
                          <div className="form-row">
                            <select
                              value={editCategoryForm.type}
                              onChange={(e) => setEditCategoryForm({ ...editCategoryForm, type: e.target.value })}
                              className="input-type"
                            >
                              <option value="expense">Expense</option>
                              <option value="income">Income</option>
                              <option value="both">Both</option>
                            </select>
                            <input
                              type="color"
                              value={editCategoryForm.color}
                              onChange={(e) => setEditCategoryForm({ ...editCategoryForm, color: e.target.value })}
                              className="input-color"
                            />
                          </div>
                          <div className="keywords-input-container">
                            <label>Keywords</label>
                            <div className="keywords-tags">
                              {editCategoryForm.keywords && editCategoryForm.keywords.split(',').map(k => k.trim()).filter(k => k).map((keyword, idx) => (
                                <span key={idx} className="keyword-tag">
                                  {keyword}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveKeyword(keyword, true)}
                                    className="keyword-remove"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                              <input
                                type="text"
                                placeholder="Type keyword and press Enter or comma"
                                value={editKeywordInput}
                                onChange={(e) => setEditKeywordInput(e.target.value)}
                                onKeyDown={(e) => handleAddKeyword(e, true)}
                                className="keyword-input"
                              />
                            </div>
                          </div>
                          <div className="form-group">
                            <label htmlFor="edit-budget">Budget Amount</label>
                            <input
                              id="edit-budget"
                              type="number"
                              placeholder="0.00"
                              value={editCategoryForm.budgeted}
                              onChange={(e) => setEditCategoryForm({ ...editCategoryForm, budgeted: e.target.value })}
                              className="input-budget"
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div className="need-want-selector">
                            <label>
                              <input
                                type="radio"
                                name="editCategoryNeedWant"
                                value="need"
                                checked={editCategoryForm.needWant === 'need'}
                                onChange={(e) => setEditCategoryForm({ ...editCategoryForm, needWant: e.target.value })}
                              />
                              Need
                            </label>
                            <label>
                              <input
                                type="radio"
                                name="editCategoryNeedWant"
                                value="want"
                                checked={editCategoryForm.needWant === 'want'}
                                onChange={(e) => setEditCategoryForm({ ...editCategoryForm, needWant: e.target.value })}
                              />
                              Want
                            </label>
                          </div>
                          <div className="form-actions">
                            <button className="cancel-btn" onClick={handleCancelCategoryEdit}>Cancel</button>
                            <button className="update-btn" onClick={handleUpdateCategory}>Update Category</button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="categories-table-wrapper">
                      <table className="categories-table">
                        <thead>
                          <tr>
                            <th></th>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Need/Want</th>
                            <th>Budget</th>
                            <th>Keywords</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...categories].sort((a, b) => a.name.localeCompare(b.name)).map(category => (
                            <tr key={category.id}>
                              <td className="color-cell">
                                <div className="category-color" style={{ backgroundColor: category.color }}></div>
                              </td>
                              <td className="name-cell">{category.name}</td>
                              <td className="type-cell">
                                <span className="category-type-badge">{category.type}</span>
                              </td>
                              <td className="need-want-cell">
                                {category.needWant ? (
                                  <span className={`need-want-badge ${category.needWant}`}>
                                    {category.needWant === 'need' ? 'Need' : 'Want'}
                                  </span>
                                ) : (
                                  <span className="no-keywords">—</span>
                                )}
                              </td>
                              <td className="budget-cell">
                                {editingCategoryId === category.id ? (
                                  <div className="budget-edit-inline">
                                    <input
                                      type="number"
                                      value={editBudget}
                                      onChange={(e) => setEditBudget(e.target.value)}
                                      onKeyDown={(e) => e.key === 'Enter' && handleUpdateBudget(category.id)}
                                      min="0"
                                      step="0.01"
                                      autoFocus
                                    />
                                    <button onClick={() => handleUpdateBudget(category.id)}>✓</button>
                                    <button onClick={() => { setEditingCategoryId(null); setEditBudget(''); }}>✗</button>
                                  </div>
                                ) : (
                                  <div className="budget-display" onClick={() => {
                                    setEditingCategoryId(category.id);
                                    setEditBudget((category.budgeted || 0).toString());
                                  }}>
                                    ${(category.budgeted || 0).toFixed(2)}
                                  </div>
                                )}
                              </td>
                              <td className="keywords-cell">
                                {category.keywords && category.keywords.length > 0 ? (
                                  category.keywords.join(', ')
                                ) : (
                                  <span className="no-keywords">—</span>
                                )}
                              </td>
                              <td className="actions-cell">
                                {category.id !== 'uncategorized' && (
                                  <>
                                    <button
                                      className="edit-btn-small"
                                      onClick={() => handleEditCategory(category)}
                                      title="Edit category"
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      className="delete-btn"
                                      onClick={() => handleDeleteCategory(category.id)}
                                      title="Delete category"
                                    >
                                      ×
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {transactions && onUpdateTransactions && (
                    <div className="reapply-section">
                      <button className="reapply-btn" onClick={handleReapplyKeywords}>
                        🔄 Reapply Keywords to All Transactions
                      </button>
                      <p className="reapply-note">
                        This will recategorize transactions that were auto-categorized or uncategorized. Manually categorized transactions will not be changed.
                      </p>
                    </div>
                  )}
      </div>
    </div>
  )
}

export default CategorySettings