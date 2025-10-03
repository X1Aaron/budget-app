import React, { useMemo, useState, useEffect } from 'react'
import '../../../styles/components/Bills.css'
import { getCategoryColor } from '../../../utils/categories'

function Bills({
  bills,
  categories,
  selectedYear,
  selectedMonth,
  onUpdateBills,
  conversionData,
  onConversionComplete
}) {
  const [expandedBillId, setExpandedBillId] = useState(null)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editingBill, setEditingBill] = useState(null)
  const [formData, setFormData] = useState({
    billName: '',
    amount: '',
    dueDate: '',
    frequency: 'monthly',
    category: '',
    memo: ''
  })
  const [editingInlineId, setEditingInlineId] = useState(null)
  const [inlineFormData, setInlineFormData] = useState({})

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // Get bills for the current month
  const monthlyBills = useMemo(() => {
    return bills.filter(bill => {
      const [year, month] = bill.dueDate.split('-').map(Number)
      return year === selectedYear && month - 1 === selectedMonth
    })
  }, [bills, selectedYear, selectedMonth])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const handleOpenAddModal = () => {
    const today = new Date()
    const currentDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    setFormData({
      billName: '',
      amount: '',
      dueDate: currentDate,
      frequency: 'monthly',
      category: '',
      memo: ''
    })
    setEditingBill(null)
    setAddModalOpen(true)
  }

  // Handle conversion from transaction
  useEffect(() => {
    if (conversionData) {
      setFormData({
        billName: conversionData.merchantName || conversionData.description,
        amount: Math.abs(conversionData.amount).toString(),
        dueDate: conversionData.date,
        frequency: 'monthly',
        category: conversionData.category || '',
        memo: conversionData.memo || ''
      })
      setEditingBill(null)
      setAddModalOpen(true)
    }
  }, [conversionData])

  const handleEditBill = (bill) => {
    setFormData({
      billName: bill.billName || bill.description,
      amount: bill.billAmount || Math.abs(bill.amount),
      dueDate: bill.dueDate || bill.date,
      frequency: bill.frequency || 'monthly',
      category: bill.category || '',
      memo: bill.memo || ''
    })
    setEditingBill(bill)
    setAddModalOpen(true)
  }

  const handleDeleteBill = (billId) => {
    if (confirm('Are you sure you want to delete this bill?')) {
      onUpdateBills(prevBills => prevBills.filter(b => b.id !== billId))
    }
  }

  const handleSaveForm = () => {
    if (!formData.billName || !formData.amount || !formData.dueDate) {
      alert('Please fill in all required fields')
      return
    }

    if (editingBill) {
      // Update existing bill
      onUpdateBills(prevBills => prevBills.map(b => {
        if (b.id === editingBill.id) {
          return {
            ...b,
            billName: formData.billName,
            description: formData.billName,
            billAmount: parseFloat(formData.amount),
            amount: -Math.abs(parseFloat(formData.amount)),
            dueDate: formData.dueDate,
            date: formData.dueDate,
            frequency: formData.frequency,
            category: formData.category || 'Uncategorized',
            memo: formData.memo
          }
        }
        return b
      }))
    } else {
      // Create new bill
      const billId = `bill-${Date.now()}`
      const newBill = {
        id: billId,
        date: formData.dueDate,
        description: formData.billName,
        amount: -Math.abs(parseFloat(formData.amount)),
        category: formData.category || 'Uncategorized',
        memo: formData.memo,
        isBill: true,
        billName: formData.billName,
        billAmount: parseFloat(formData.amount),
        dueDate: formData.dueDate,
        frequency: formData.frequency,
        isPaid: false
      }

      onUpdateBills(prevBills => [...prevBills, newBill])
    }

    setFormData({
      billName: '',
      amount: '',
      dueDate: '',
      frequency: 'monthly',
      category: '',
      memo: ''
    })
    setEditingBill(null)
    setAddModalOpen(false)
    if (onConversionComplete) {
      onConversionComplete()
    }
  }

  const handleTogglePaid = (bill) => {
    onUpdateBills(prevBills => prevBills.map(b => {
      if (b.id === bill.id) {
        return {
          ...b,
          isPaid: !b.isPaid
        }
      }
      return b
    }))
  }

  const handleStartInlineEdit = (bill) => {
    setEditingInlineId(bill.id)
    setInlineFormData({
      billName: bill.billName,
      amount: bill.billAmount,
      dueDate: bill.dueDate,
      frequency: bill.frequency,
      category: bill.category,
      memo: bill.memo || ''
    })
  }

  const handleCancelInlineEdit = () => {
    setEditingInlineId(null)
    setInlineFormData({})
  }

  const handleSaveInlineEdit = (billId) => {
    if (!inlineFormData.billName || !inlineFormData.amount || !inlineFormData.dueDate) {
      alert('Please fill in all required fields')
      return
    }

    onUpdateBills(prevBills => prevBills.map(b => {
      if (b.id === billId) {
        return {
          ...b,
          billName: inlineFormData.billName,
          description: inlineFormData.billName,
          billAmount: parseFloat(inlineFormData.amount),
          amount: -Math.abs(parseFloat(inlineFormData.amount)),
          dueDate: inlineFormData.dueDate,
          date: inlineFormData.dueDate,
          frequency: inlineFormData.frequency,
          category: inlineFormData.category || 'Uncategorized',
          memo: inlineFormData.memo
        }
      }
      return b
    }))

    setEditingInlineId(null)
    setInlineFormData({})
  }

  // Summary stats
  const summary = useMemo(() => {
    const totalBills = monthlyBills.length
    const paidBills = monthlyBills.filter(b => b.isPaid).length
    const unpaidBills = totalBills - paidBills
    const totalAmount = monthlyBills.reduce((sum, b) => sum + b.billAmount, 0)
    const paidAmount = monthlyBills.filter(b => b.isPaid).reduce((sum, b) => sum + b.billAmount, 0)
    const unpaidAmount = totalAmount - paidAmount

    return {
      totalBills,
      paidBills,
      unpaidBills,
      totalAmount,
      paidAmount,
      unpaidAmount
    }
  }, [monthlyBills])

  return (
    <div className="bills-page">
      {/* Add/Edit Bill Modal */}
      {addModalOpen && (
        <div className="bill-modal-backdrop" onClick={() => { setAddModalOpen(false); if (onConversionComplete) onConversionComplete(); }}>
          <div className="bill-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingBill ? 'Edit Bill' : 'Add New Bill'}</h3>
            <div className="bill-modal-content">
              <div className="bill-modal-form">
                <div className="form-group">
                  <label>Bill Name *</label>
                  <input
                    type="text"
                    value={formData.billName}
                    onChange={(e) => setFormData({ ...formData, billName: e.target.value })}
                    placeholder="e.g., Netflix Subscription"
                  />
                </div>
                <div className="form-group">
                  <label>Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="Expected bill amount"
                  />
                </div>
                <div className="form-group">
                  <label>Due Date *</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                  <p className="field-help">Set the date of the first bill occurrence.</p>
                </div>
                <div className="form-group">
                  <label>Frequency *</label>
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
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="">Select a category</option>
                    {categories && [...categories]
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(cat => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Memo</label>
                  <textarea
                    value={formData.memo}
                    onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                    placeholder="Optional note"
                    rows="2"
                  />
                </div>
              </div>
            </div>
            <div className="bill-modal-actions">
              <button className="cancel-btn" onClick={() => { setAddModalOpen(false); if (onConversionComplete) onConversionComplete(); }}>
                Cancel
              </button>
              <button className="save-btn" onClick={handleSaveForm}>
                {editingBill ? 'Update Bill' : 'Add Bill'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bills-section">
        <div className="bills-header">
          <h2>Bills - {monthNames[selectedMonth]} {selectedYear}</h2>
          <div className="header-controls">
            <button className="action-btn add-bill-btn" onClick={handleOpenAddModal}>
              + Add Bill
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="summary-card">
            <div className="summary-label">Total Bills</div>
            <div className="summary-value">{summary.totalBills}</div>
            <div className="summary-detail">{formatCurrency(summary.totalAmount)}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Paid</div>
            <div className="summary-value paid">{summary.paidBills}</div>
            <div className="summary-detail">{formatCurrency(summary.paidAmount)}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Unpaid</div>
            <div className="summary-value unpaid">{summary.unpaidBills}</div>
            <div className="summary-detail">{formatCurrency(summary.unpaidAmount)}</div>
          </div>
        </div>

        {/* Bills List */}
        <div className="bills-list">
          {monthlyBills.length === 0 ? (
            <div className="empty-state">
              <p>No bills for this month.</p>
              <p>Click "Add Bill" to create your first bill.</p>
            </div>
          ) : (
            monthlyBills.map((bill, index) => {
              const isExpanded = expandedBillId === bill.id
              const isEditing = editingInlineId === bill.id
              const color = getCategoryColor(bill.category, categories)

              return (
                <div key={bill.id} className={`bill-card ${bill.isPaid ? 'paid' : 'unpaid'} ${isEditing ? 'editing' : ''}`}>
                  {isEditing ? (
                    <div className="bill-card-inline-edit">
                      <input
                        type="text"
                        className="inline-edit-name"
                        value={inlineFormData.billName}
                        onChange={(e) => setInlineFormData({ ...inlineFormData, billName: e.target.value })}
                        placeholder="Bill name"
                      />
                      <input
                        type="number"
                        step="0.01"
                        className="inline-edit-amount"
                        value={inlineFormData.amount}
                        onChange={(e) => setInlineFormData({ ...inlineFormData, amount: e.target.value })}
                        placeholder="Amount"
                      />
                      <input
                        type="date"
                        className="inline-edit-date"
                        value={inlineFormData.dueDate}
                        onChange={(e) => setInlineFormData({ ...inlineFormData, dueDate: e.target.value })}
                      />
                      <select
                        className="inline-edit-frequency"
                        value={inlineFormData.frequency}
                        onChange={(e) => setInlineFormData({ ...inlineFormData, frequency: e.target.value })}
                      >
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                        <option value="one-time">One-time</option>
                      </select>
                      <select
                        className="inline-edit-category"
                        value={inlineFormData.category}
                        onChange={(e) => setInlineFormData({ ...inlineFormData, category: e.target.value })}
                      >
                        {categories && [...categories]
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map(cat => (
                            <option key={cat.id} value={cat.name}>
                              {cat.name}
                            </option>
                          ))}
                      </select>
                      <div className="inline-edit-actions">
                        <button
                          className="save-inline-btn"
                          onClick={() => handleSaveInlineEdit(bill.id)}
                          title="Save"
                        >
                          ✓ Save
                        </button>
                        <button
                          className="cancel-inline-btn"
                          onClick={handleCancelInlineEdit}
                          title="Cancel"
                        >
                          ✕ Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bill-card-header" onClick={() => setExpandedBillId(isExpanded ? null : bill.id)}>
                      <div className="bill-name">{bill.billName}</div>
                      <div className="bill-amount">{formatCurrency(bill.billAmount)}</div>
                      <div className="bill-date">Due: {bill.dueDate}</div>
                      <div className="bill-frequency">{bill.frequency}</div>
                      <div className="bill-category" style={{ color }}>{bill.category}</div>
                      <div className="bill-status">
                        {bill.isPaid ? (
                          <span className="status-badge paid">✓ Paid</span>
                        ) : (
                          <span className="status-badge unpaid">⏳ Unpaid</span>
                        )}
                      </div>
                      <div className="bill-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="toggle-paid-btn"
                          onClick={() => handleTogglePaid(bill)}
                          title={bill.isPaid ? 'Mark as Unpaid' : 'Mark as Paid'}
                        >
                          {bill.isPaid ? '↶ Unpay' : '✓ Pay'}
                        </button>
                        <button
                          className="edit-btn"
                          onClick={() => handleStartInlineEdit(bill)}
                          title="Edit Bill"
                        >
                          ✎ Edit
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteBill(bill.id)}
                          title="Delete Bill"
                        >
                          🗑 Delete
                        </button>
                      </div>
                    </div>
                  )}

                  {isExpanded && !isEditing && (
                    <div className="bill-card-details">
                      {bill.memo && (
                        <div className="detail-row">
                          <strong>Memo:</strong> {bill.memo}
                        </div>
                      )}
                      <div className="detail-row">
                        <strong>Status:</strong> {bill.isPaid ? 'Paid' : 'Unpaid'}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default Bills
