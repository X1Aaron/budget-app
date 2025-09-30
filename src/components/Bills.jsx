import { useState, useMemo } from 'react'
import './Bills.css'

function Bills({ bills, onUpdateBills }) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    dueDate: '',
    frequency: 'monthly',
    category: '',
    isPaid: false
  })

  const handleAddBill = () => {
    if (!formData.name || !formData.amount || !formData.dueDate) {
      alert('Please fill in all required fields')
      return
    }

    const newBill = {
      id: Date.now(),
      ...formData,
      amount: parseFloat(formData.amount)
    }

    onUpdateBills([...bills, newBill])
    setFormData({
      name: '',
      amount: '',
      dueDate: '',
      frequency: 'monthly',
      category: '',
      isPaid: false
    })
    setIsAdding(false)
  }

  const handleEditBill = (bill) => {
    setEditingId(bill.id)
    setFormData(bill)
    setIsAdding(true)
  }

  const handleUpdateBill = () => {
    if (!formData.name || !formData.amount || !formData.dueDate) {
      alert('Please fill in all required fields')
      return
    }

    const updatedBills = bills.map(bill =>
      bill.id === editingId
        ? { ...formData, amount: parseFloat(formData.amount) }
        : bill
    )

    onUpdateBills(updatedBills)
    setFormData({
      name: '',
      amount: '',
      dueDate: '',
      frequency: 'monthly',
      category: '',
      isPaid: false
    })
    setIsAdding(false)
    setEditingId(null)
  }

  const handleDeleteBill = (id) => {
    if (confirm('Are you sure you want to delete this bill?')) {
      onUpdateBills(bills.filter(bill => bill.id !== id))
    }
  }

  const handleTogglePaid = (id) => {
    const updatedBills = bills.map(bill =>
      bill.id === id ? { ...bill, isPaid: !bill.isPaid } : bill
    )
    onUpdateBills(updatedBills)
  }

  const handleCancelEdit = () => {
    setIsAdding(false)
    setEditingId(null)
    setFormData({
      name: '',
      amount: '',
      dueDate: '',
      frequency: 'monthly',
      category: '',
      isPaid: false
    })
  }

  const sortedBills = useMemo(() => {
    return [...bills].sort((a, b) => {
      if (a.isPaid !== b.isPaid) return a.isPaid ? 1 : -1
      return new Date(a.dueDate) - new Date(b.dueDate)
    })
  }, [bills])

  const totalAmount = useMemo(() => {
    return bills.reduce((sum, bill) => sum + bill.amount, 0)
  }, [bills])

  const unpaidAmount = useMemo(() => {
    return bills.filter(b => !b.isPaid).reduce((sum, bill) => sum + bill.amount, 0)
  }, [bills])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="bills">
      <div className="bills-summary">
        <div className="summary-card total-bills">
          <h3>Total Bills</h3>
          <p className="amount">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="summary-card unpaid-bills">
          <h3>Unpaid Bills</h3>
          <p className="amount">{formatCurrency(unpaidAmount)}</p>
        </div>
      </div>

      <div className="bills-section">
        <div className="bills-header">
          <h2>Bills</h2>
          {!isAdding && (
            <button className="add-bill-btn" onClick={() => setIsAdding(true)}>
              + Add Bill
            </button>
          )}
        </div>

        {isAdding && (
          <div className="bill-form">
            <h3>{editingId ? 'Edit Bill' : 'Add New Bill'}</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Bill Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Electric Bill"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Amount *</label>
                <input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Due Date *</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Frequency</label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                  <option value="one-time">One-time</option>
                </select>
              </div>
              <div className="form-group">
                <label>Category</label>
                <input
                  type="text"
                  placeholder="e.g., Utilities"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
            </div>
            <div className="form-actions">
              <button className="cancel-btn" onClick={handleCancelEdit}>
                Cancel
              </button>
              <button
                className="save-btn"
                onClick={editingId ? handleUpdateBill : handleAddBill}
              >
                {editingId ? 'Update Bill' : 'Add Bill'}
              </button>
            </div>
          </div>
        )}

        {sortedBills.length === 0 ? (
          <div className="bills-empty">
            <p>No bills yet. Click "Add Bill" to get started.</p>
          </div>
        ) : (
          <div className="bills-list">
            {sortedBills.map((bill) => (
              <div
                key={bill.id}
                className={'bill-item' + (bill.isPaid ? ' paid' : '')}
              >
                <div className="bill-checkbox">
                  <input
                    type="checkbox"
                    checked={bill.isPaid}
                    onChange={() => handleTogglePaid(bill.id)}
                  />
                </div>
                <div className="bill-info">
                  <div className="bill-name">{bill.name}</div>
                  <div className="bill-meta">
                    <span className="bill-date">Due: {formatDate(bill.dueDate)}</span>
                    <span className="bill-frequency">{bill.frequency}</span>
                    {bill.category && <span className="bill-category">{bill.category}</span>}
                  </div>
                </div>
                <div className="bill-amount">{formatCurrency(bill.amount)}</div>
                <div className="bill-actions">
                  <button
                    className="edit-btn"
                    onClick={() => handleEditBill(bill)}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteBill(bill.id)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Bills