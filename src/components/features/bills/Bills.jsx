import React, { useMemo, useState, useEffect } from 'react'
import '../../../styles/components/Bills.css'
import { getCategoryColor } from '../../../utils/categories'
import { generateBillOccurrences, findSuggestedTransactionsForBill } from '../../../utils/billMatching'

function Bills({
  transactions,
  bills,
  categories,
  selectedYear,
  selectedMonth,
  onUpdateTransactions,
  onUpdateBills,
  billMatchingSettings,
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
  const [suggestedTransactions, setSuggestedTransactions] = useState([])
  const [selectedSuggestion, setSelectedSuggestion] = useState(null)
  const [confirmLinkTransaction, setConfirmLinkTransaction] = useState(false)
  const [editingInlineId, setEditingInlineId] = useState(null)
  const [inlineFormData, setInlineFormData] = useState({})

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // Generate bill occurrences for the current month
  const billOccurrences = useMemo(() => {
    return generateBillOccurrences(bills, selectedYear, selectedMonth)
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
    setSuggestedTransactions([])
    setSelectedSuggestion(null)
    setConfirmLinkTransaction(false)
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
      setSuggestedTransactions([])
      setSelectedSuggestion(null)
      setConfirmLinkTransaction(false)
      setAddModalOpen(true)
    }
  }, [conversionData])

  // Update suggestions when bill name or amount changes
  useEffect(() => {
    if (addModalOpen && !editingBill && formData.billName && formData.amount) {
      const amount = parseFloat(formData.amount)
      if (!isNaN(amount) && amount > 0) {
        const suggestions = findSuggestedTransactionsForBill(
          transactions,
          formData.billName,
          amount,
          billMatchingSettings?.amountTolerance || 5
        )
        setSuggestedTransactions(suggestions.slice(0, 5)) // Show top 5
      } else {
        setSuggestedTransactions([])
      }
    } else {
      setSuggestedTransactions([])
    }
  }, [formData.billName, formData.amount, addModalOpen, editingBill, transactions, billMatchingSettings])

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
      // Unlink any transactions from this bill
      onUpdateTransactions(prevTransactions =>
        prevTransactions.map(t => {
          if (t.matchedToBillId === billId) {
            return {
              ...t,
              matchedToBillId: undefined,
              hiddenAsBillPayment: false
            }
          }
          return t
        })
      )
      // Remove the bill
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
        paidDates: [],
        payments: []
      }

      // If a transaction was selected AND user confirmed the link, match it to the bill
      if (selectedSuggestion && confirmLinkTransaction) {
        const selectedTransaction = selectedSuggestion.transaction

        // Verify the transaction isn't already matched (shouldn't happen, but safety check)
        if (selectedTransaction.matchedToBillId) {
          alert('This transaction is already matched to another bill. Please refresh and try again.')
          return
        }

        const occurrenceDate = formData.dueDate

        // Add payment to the new bill
        newBill.payments = [{
          occurrenceDate: occurrenceDate,
          transactionDate: selectedTransaction.date,
          transactionAmount: selectedTransaction.amount,
          transactionDescription: selectedTransaction.description,
          manuallyMarked: true
        }]

        // Mark selected transaction as matched
        onUpdateTransactions(prevTransactions => {
          return prevTransactions.map(t => {
            if (t.id === selectedTransaction.id) {
              return {
                ...t,
                matchedToBillId: billId,
                hiddenAsBillPayment: true
              }
            }
            return t
          })
        })
        // Add the new bill
        onUpdateBills(prevBills => [...prevBills, newBill])
      } else {
        // No transaction selected, just add the bill
        onUpdateBills(prevBills => [...prevBills, newBill])
      }
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
    setSuggestedTransactions([])
    setSelectedSuggestion(null)
    setConfirmLinkTransaction(false)
    setAddModalOpen(false)
    if (onConversionComplete) {
      onConversionComplete()
    }
  }

  const handleUnlinkTransaction = (transactionId) => {
    if (confirm('Unlink this transaction from the bill?')) {
      onUpdateTransactions(prevTransactions =>
        prevTransactions.map(t =>
          t.id === transactionId
            ? { ...t, matchedToBillId: undefined, hiddenAsBillPayment: false }
            : t
        )
      )
    }
  }

  const handleTogglePaid = (billOccurrence) => {
    onUpdateBills(prevBills => prevBills.map(bill => {
      if (bill.id === billOccurrence.billId) {
        const payments = bill.payments || []
        const existingPayment = payments.find(p => p.occurrenceDate === billOccurrence.occurrenceDate)

        if (existingPayment) {
          // Remove payment
          return {
            ...bill,
            payments: payments.filter(p => p.occurrenceDate !== billOccurrence.occurrenceDate)
          }
        } else {
          // Add manual payment
          return {
            ...bill,
            payments: [...payments, {
              occurrenceDate: billOccurrence.occurrenceDate,
              manuallyMarked: true
            }]
          }
        }
      }
      return bill
    }))
  }

  const handleStartInlineEdit = (occ) => {
    setEditingInlineId(occ.billId)
    setInlineFormData({
      billName: occ.billName,
      amount: occ.billAmount,
      dueDate: occ.billTransaction.dueDate,
      frequency: occ.frequency,
      category: occ.category,
      memo: occ.billTransaction.memo || ''
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

              {/* Transaction Suggestions */}
              {!editingBill && suggestedTransactions.length > 0 && (
                <div className="suggestions-panel">
                  <h4>Suggested Matches</h4>
                  <p className="field-help">These transactions might correspond to this bill based on the name and amount.</p>
                  <div className="suggestions-list">
                    {suggestedTransactions.map((suggestion, idx) => {
                      const isSelected = selectedSuggestion?.transaction.id === suggestion.transaction.id
                      return (
                        <div
                          key={suggestion.transaction.id || idx}
                          className={`suggestion-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedSuggestion(isSelected ? null : suggestion)
                            setConfirmLinkTransaction(false) // Reset confirmation when changing selection
                          }}
                        >
                          <div className="suggestion-header">
                            <span className="suggestion-date">{suggestion.transaction.date}</span>
                            <span className="suggestion-amount">{formatCurrency(suggestion.transaction.amount)}</span>
                          </div>
                          <div className="suggestion-description">
                            {suggestion.transaction.merchantName || suggestion.transaction.description}
                          </div>
                          <div className="suggestion-match-reason">
                            {suggestion.matchReason} (score: {suggestion.matchScore})
                          </div>
                          {isSelected && (
                            <div className="suggestion-selected-indicator">
                              <label className="link-checkbox-label">
                                <input
                                  type="checkbox"
                                  checked={confirmLinkTransaction}
                                  onChange={(e) => {
                                    e.stopPropagation()
                                    setConfirmLinkTransaction(e.target.checked)
                                  }}
                                />
                                Link this transaction to the bill
                              </label>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
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
          {billOccurrences.length === 0 ? (
            <div className="empty-state">
              <p>No bills for this month.</p>
              <p>Click "Add Bill" to create your first bill.</p>
            </div>
          ) : (
            billOccurrences.map((occ, index) => {
              const isExpanded = expandedBillId === occ.billId
              const isEditing = editingInlineId === occ.billId
              const color = getCategoryColor(occ.category, categories)

              return (
                <div key={`${occ.billId}-${occ.occurrenceDate}`} className={`bill-card ${occ.payment ? 'paid' : 'unpaid'} ${isEditing ? 'editing' : ''}`}>
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
                          onClick={() => handleSaveInlineEdit(occ.billId)}
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
                    <div className="bill-card-header" onClick={() => setExpandedBillId(isExpanded ? null : occ.billId)}>
                      <div className="bill-name">{occ.billName}</div>
                      <div className="bill-amount">{formatCurrency(occ.billAmount)}</div>
                      <div className="bill-date">Due: {occ.occurrenceDate}</div>
                      <div className="bill-frequency">{occ.frequency}</div>
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
                          onClick={() => handleStartInlineEdit(occ)}
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
                  )}

                  {isExpanded && !isEditing && (
                    <div className="bill-card-details">
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
                      {(() => {
                        const linkedTransactions = transactions.filter(t => !t.isBill && t.matchedToBillId === occ.billId)
                        if (linkedTransactions.length > 0) {
                          return (
                            <div className="detail-row linked-transactions">
                              <strong>Linked Transactions:</strong>
                              <div className="linked-transactions-list">
                                {linkedTransactions.map(trans => (
                                  <div key={trans.id} className="linked-transaction-item">
                                    <div className="linked-transaction-info">
                                      <span className="linked-transaction-date">{trans.date}</span>
                                      <span className="linked-transaction-description">{trans.description}</span>
                                      <span className="linked-transaction-amount">{formatCurrency(trans.amount)}</span>
                                    </div>
                                    <button
                                      className="unlink-transaction-btn"
                                      onClick={() => handleUnlinkTransaction(trans.id)}
                                      title="Unlink transaction"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        }
                        return null
                      })()}
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
