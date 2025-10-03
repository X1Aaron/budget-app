import { useState } from 'react'
import '../../../styles/components/CategoryModal.css'

function CategoryModal({ onClose, onSave, existingCategory = null }) {
  const [categoryForm, setCategoryForm] = useState({
    name: existingCategory?.name || '',
    color: existingCategory?.color || '#6b7280',
    type: existingCategory?.type || 'expense',
    budgeted: existingCategory?.budgeted || 0,
    needWant: existingCategory?.needWant || 'need'
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!categoryForm.name.trim()) return

    const category = {
      id: existingCategory?.id || categoryForm.name.toLowerCase().replace(/\s+/g, '-'),
      name: categoryForm.name,
      color: categoryForm.color,
      type: categoryForm.type,
      keywords: [],
      budgeted: parseFloat(categoryForm.budgeted) || 0,
      needWant: categoryForm.needWant
    }

    onSave(category)
  }

  return (
    <div className="category-modal-backdrop" onClick={onClose}>
      <div className="category-modal" onClick={(e) => e.stopPropagation()}>
        <div className="category-modal-header">
          <h2>{existingCategory ? 'Edit Category' : 'Add New Category'}</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="category-modal-form">
          {/* Name and Color */}
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="category-name">Category Name *</label>
              <input
                id="category-name"
                type="text"
                placeholder="e.g., Groceries, Entertainment"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                autoFocus
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category-type">Type</label>
                <select
                  id="category-type"
                  value={categoryForm.type}
                  onChange={(e) => setCategoryForm({ ...categoryForm, type: e.target.value })}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="both">Both</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="category-color">Color</label>
                <div className="color-picker-wrapper">
                  <input
                    id="category-color"
                    type="color"
                    value={categoryForm.color}
                    onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                  />
                  <div
                    className="color-preview"
                    style={{ backgroundColor: categoryForm.color }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Budget and Need/Want */}
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="category-budget">Monthly Budget (optional)</label>
              <div className="budget-input-wrapper">
                <span className="currency-symbol">$</span>
                <input
                  id="category-budget"
                  type="number"
                  placeholder="0.00"
                  value={categoryForm.budgeted}
                  onChange={(e) => setCategoryForm({ ...categoryForm, budgeted: e.target.value })}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Classification</label>
              <div className="need-want-selector">
                <label className={`need-want-option ${categoryForm.needWant === 'need' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="categoryNeedWant"
                    value="need"
                    checked={categoryForm.needWant === 'need'}
                    onChange={(e) => setCategoryForm({ ...categoryForm, needWant: e.target.value })}
                  />
                  <span className="need-want-label">Need</span>
                </label>
                <label className={`need-want-option ${categoryForm.needWant === 'want' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="categoryNeedWant"
                    value="want"
                    checked={categoryForm.needWant === 'want'}
                    onChange={(e) => setCategoryForm({ ...categoryForm, needWant: e.target.value })}
                  />
                  <span className="need-want-label">Want</span>
                </label>
              </div>
            </div>
          </div>

          <div className="category-modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="save-btn">
              {existingCategory ? 'Update Category' : 'Add Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CategoryModal
