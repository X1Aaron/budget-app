import { useState } from 'react'
import './CategoryManager.css'

function CategoryManager({ categories, onUpdateCategories }) {
  const [isOpen, setIsOpen] = useState(false)
  const [newCategory, setNewCategory] = useState({ name: '', color: '#6b7280', type: 'expense', keywords: '' })

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

  const handleUpdateKeywords = (categoryId, newKeywords) => {
    const updatedCategories = categories.map(cat =>
      cat.id === categoryId
        ? { ...cat, keywords: newKeywords.split(',').map(k => k.trim()).filter(k => k) }
        : cat
    )
    onUpdateCategories(updatedCategories)
  }

  return (
    <div className="category-manager">
      <button className="manage-categories-btn" onClick={() => setIsOpen(!isOpen)}>
        Manage Categories
      </button>

      {isOpen && (
        <div className="category-modal">
          <div className="category-modal-content">
            <div className="modal-header">
              <h2>Manage Categories</h2>
              <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="add-category-section">
                <h3>Add New Category</h3>
                <div className="add-category-form">
                  <input
                    type="text"
                    placeholder="Category name"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  />
                  <select
                    value={newCategory.type}
                    onChange={(e) => setNewCategory({ ...newCategory, type: e.target.value })}
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                    <option value="both">Both</option>
                  </select>
                  <input
                    type="color"
                    value={newCategory.color}
                    onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Keywords (comma separated)"
                    value={newCategory.keywords}
                    onChange={(e) => setNewCategory({ ...newCategory, keywords: e.target.value })}
                    className="keywords-input"
                  />
                  <button className="add-btn" onClick={handleAddCategory}>Add</button>
                </div>
              </div>

              <div className="categories-list-section">
                <h3>Existing Categories</h3>
                <div className="categories-grid">
                  {[...categories].sort((a, b) => a.name.localeCompare(b.name)).map(category => (
                    <div key={category.id} className="category-card">
                      <div className="category-card-header">
                        <div className="category-color" style={{ backgroundColor: category.color }}></div>
                        <span className="category-card-name">{category.name}</span>
                        {category.id !== 'uncategorized' && (
                          <button 
                            className="delete-btn"
                            onClick={() => handleDeleteCategory(category.id)}
                          >
                            ×
                          </button>
                        )}
                      </div>
                      <div className="category-card-info">
                        <span className="category-type">{category.type}</span>
                        <input
                          type="text"
                          placeholder="Keywords (comma separated)"
                          value={category.keywords.join(', ')}
                          onChange={(e) => handleUpdateKeywords(category.id, e.target.value)}
                          className="keywords-input inline-keywords"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CategoryManager
