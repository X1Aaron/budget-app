import React, { useMemo, useState } from 'react'
import '../../../styles/components/Bills.css'
import { getCategoryColor } from '../../../utils/categories'
import { generateBillOccurrences } from '../../../utils/billMatching'

function Bills({
  transactions,
  categories,
  selectedYear,
  selectedMonth,
  onUpdateTransactions,
  billMatchingSettings
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

  const cashRegisterSound = useMemo(() => new Audio('/cash-register.mp3'), [])

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // Get all bills (transactions with isBill = true)
  const bills = useMemo(() => {
    return transactions.filter(t => t.isBill)
  }, [transactions])

  // Generate bill occurrences for the current month
  const billOccurrences = useMemo(() => {
    return generateBillOccurrences(transactions, selectedYear, selectedMonth)
  }, [transactions, selectedYear, selectedMonth])

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
      onUpdateTransactions(prevTransactions => prevTransactions.filter(t => t.id !== billId))
    }
  }

  const handleSaveForm = () => {
    if (!formData.billName || !formData.amount || !formData.dueDate) {
      alert('Please fill in all required fields')
      return
    }

    if (editingBill) {
      // Update existing bill
      onUpdateTransactions(prevTransactions => prevTransactions.map(t => {
        if (t.id === editingBill.id) {
          return {
            ...t,
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
        return t
      }))
    } else {
      // Create new bill
      const newBill = {
        id: `bill-${Date.now()}`,
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
        paidDates: [],
        payments: []
      }
      onUpdateTransactions(prevTransactions => [...prevTransactions, newBill])
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
  }

  const handleTogglePaid = (billOccurrence) => {
    onUpdateTransactions(prevTransactions => prevTransactions.map(transaction => {
      if (transaction.isBill && transaction.id === billOccurrence.billId) {
        const payments = transaction.payments || []
        const existingPayment = payments.find(p => p.occurrenceDate === billOccurrence.occurrenceDate)

        if (existingPayment) {
          // Remove payment
          return {
            ...transaction,
            payments: payments.filter(p => p.occurrenceDate !== billOccurrence.occurrenceDate)
          }
        } else {
          // Add manual payment
          cashRegisterSound.play().catch(err => console.log('Sound play failed:', err))
          return {
            ...transaction,
            payments: [...payments, {
              occurrenceDate: billOccurrence.occurrenceDate,
              manuallyMarked: true
            }]
          }
        }
      }
      return transaction
    }))
  }

  const handleConvertTransaction = (transactionId) => {
    const transaction = transactions.find(t => t.id === transactionId)
    if (transaction) {
      handleEditBill({
        id: null, // New bill
        billName: transaction.merchantName || transaction.description,
        billAmount: Math.abs(transaction.amount),
        dueDate: transaction.date,
        frequency: 'monthly',
        category: transaction.category,
        memo: transaction.memo,
        sourceDescription: transaction.description
      })
    }
  }

  // Summary stats
  const summary = useMemo(() => {
    const totalBills = billOccurrences.length
    const paidBills = billOccurrences.filter(b => b.payment).length
    const unpaidBills = totalBills - paidBills
    const totalAmount = billOccurrences.reduce((sum, b) => sum + b.billAmount, 0)
    const paidAmount = billOccurrences.filter(b => b.payment).reduce((sum, b) => sum + b.billAmount, 0)
    const unpaidAmount = totalAmount - paidAmount

    return {
      totalBills,
      paidBills,
      unpaidBills,
      totalAmount,
      paidAmount,
      unpaidAmount
    }
  }, [billOccurrences])

  return (
    <div className="bills-page">
      {/* Add/Edit Bill Modal */}
      {addModalOpen && (
        <div className="bill-modal-backdrop" onClick={() => setAddModalOpen(false)}>
          <div className="bill-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingBill ? 'Edit Bill' : 'Add New Bill'}</h3>
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
            <div className="bill-modal-actions">
              <button className="cancel-btn" onClick={() => setAddModalOpen(false)}>
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
          {billOccurrences.length === 0 ? (
            <div className="empty-state">
              <p>No bills for this month.</p>
              <p>Click "Add Bill" to create your first bill.</p>
            </div>
          ) : (
            billOccurrences.map((occ, index) => {
              const isExpanded = expandedBillId === occ.billId
              const color = getCategoryColor(occ.category, categories)

              return (
                <div key={`${occ.billId}-${occ.occurrenceDate}`} className={`bill-card ${occ.payment ? 'paid' : 'unpaid'}`}>
                  <div className="bill-card-header" onClick={() => setExpandedBillId(isExpanded ? null : occ.billId)}>
                    <div className="bill-info">
                      <div className="bill-name">{occ.billName}</div>
                      <div className="bill-date">Due: {occ.occurrenceDate}</div>
                    </div>
                    <div className="bill-amount">{formatCurrency(occ.billAmount)}</div>
                    <div className="bill-category" style={{ color }}>{occ.category}</div>
                    <div className="bill-status">
                      {occ.payment ? (
                        <span className="status-badge paid">✓ Paid</span>
                      ) : (
                        <span className="status-badge unpaid">⏳ Unpaid</span>
                      )}
                    </div>
                    <div className="bill-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="toggle-paid-btn"
                        onClick={() => handleTogglePaid(occ)}
                        title={occ.payment ? 'Mark as Unpaid' : 'Mark as Paid'}
                      >
                        {occ.payment ? '↶ Unpay' : '✓ Pay'}
                      </button>
                      <button
                        className="edit-btn"
                        onClick={() => handleEditBill(occ.billTransaction)}
                        title="Edit Bill"
                      >
                        ✎ Edit
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteBill(occ.billId)}
                        title="Delete Bill"
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="bill-card-details">
                      <div className="detail-row">
                        <strong>Frequency:</strong> {occ.frequency}
                      </div>
                      {occ.billTransaction.memo && (
                        <div className="detail-row">
                          <strong>Memo:</strong> {occ.billTransaction.memo}
                        </div>
                      )}
                      {occ.payment && (
                        <div className="detail-row payment-info">
                          <strong>Payment:</strong>
                          {occ.payment.manuallyMarked ? (
                            <span> Manually marked as paid</span>
                          ) : (
                            <div>
                              <div>Auto-matched to transaction</div>
                              {occ.payment.transactionDate && <div>Date: {occ.payment.transactionDate}</div>}
                              {occ.payment.transactionAmount && <div>Amount: {formatCurrency(occ.payment.transactionAmount)}</div>}
                              {occ.payment.transactionDescription && <div>Description: {occ.payment.transactionDescription}</div>}
                            </div>
                          )}
                        </div>
                      )}
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
