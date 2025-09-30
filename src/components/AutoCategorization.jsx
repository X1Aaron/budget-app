import React, { useMemo, useState } from 'react'
import './AutoCategorization.css'

function AutoCategorization({ merchantMappings, categoryMappings, onDeleteMerchantMapping, onDeleteCategoryMapping }) {
  const [activeTab, setActiveTab] = useState('category')

  const merchantMappingsList = useMemo(() => {
    return Object.entries(merchantMappings).map(([description, merchantName]) => ({
      description,
      merchantName
    }))
  }, [merchantMappings])

  const categoryMappingsList = useMemo(() => {
    return Object.entries(categoryMappings).map(([description, category]) => ({
      description,
      category
    }))
  }, [categoryMappings])

  return (
    <div className="auto-categorization">
      <div className="auto-cat-header">
        <h2>Auto Categorization Rules</h2>
        <p className="auto-cat-description">
          These rules are automatically created when you manually change merchant names or categories.
          They will be applied to future transactions with matching descriptions.
        </p>
      </div>

      <div className="auto-cat-tabs">
        <button
          className={'tab-btn' + (activeTab === 'category' ? ' active' : '')}
          onClick={() => setActiveTab('category')}
        >
          Category Mappings ({categoryMappingsList.length})
        </button>
        <button
          className={'tab-btn' + (activeTab === 'merchant' ? ' active' : '')}
          onClick={() => setActiveTab('merchant')}
        >
          Merchant Name Mappings ({merchantMappingsList.length})
        </button>
      </div>

      <div className="auto-cat-content">
        {activeTab === 'category' ? (
          <div className="mappings-table-container">
            {categoryMappingsList.length === 0 ? (
              <div className="empty-state">
                <p>No category mappings yet.</p>
                <p className="empty-hint">When you manually assign a category to a transaction, a mapping will be created here.</p>
              </div>
            ) : (
              <table className="mappings-table">
                <thead>
                  <tr>
                    <th>Transaction Description</th>
                    <th>Assigned Category</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryMappingsList.map((mapping, index) => (
                    <tr key={index}>
                      <td className="description-cell">{mapping.description}</td>
                      <td className="category-cell">{mapping.category}</td>
                      <td className="actions-cell">
                        <button
                          className="delete-btn"
                          onClick={() => onDeleteCategoryMapping(mapping.description)}
                          title="Delete this mapping"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="mappings-table-container">
            {merchantMappingsList.length === 0 ? (
              <div className="empty-state">
                <p>No merchant name mappings yet.</p>
                <p className="empty-hint">When you manually change a merchant name for a transaction, a mapping will be created here.</p>
              </div>
            ) : (
              <table className="mappings-table">
                <thead>
                  <tr>
                    <th>Transaction Description</th>
                    <th>Merchant Name</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {merchantMappingsList.map((mapping, index) => (
                    <tr key={index}>
                      <td className="description-cell">{mapping.description}</td>
                      <td className="merchant-cell">{mapping.merchantName}</td>
                      <td className="actions-cell">
                        <button
                          className="delete-btn"
                          onClick={() => onDeleteMerchantMapping(mapping.description)}
                          title="Delete this mapping"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AutoCategorization
