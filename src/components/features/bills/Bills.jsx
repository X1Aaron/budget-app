import { useState, useMemo } from 'react'
import '../../../styles/components/Bills.css'
import { generateBillOccurrences } from '../../../utils/billMatching'

function Bills({ transactions, onUpdateTransactions, selectedYear, selectedMonth, onDateChange, categories }) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    billName: '',
    billAmount: '',
    dueDate: '',
    frequency: 'monthly',
    category: '',
    memo: '',
    paidDates: []
  })

  // Filter to get only bill transactions
  const bills = transactions.filter(t => t.isBill)

  const cashRegisterSound = useMemo(() => new Audio('/cash-register.mp3'), [])

  const handleAddBill = () => {
    console.log('handleAddBill called with formData:', formData)

    if (!formData.billName || !formData.billAmount || !formData.dueDate) {
      alert('Please fill in all required fields')
      return
    }

    const newBill = {
      id: `bill-${Date.now()}`,
      date: formData.dueDate,
      description: formData.billName,
      amount: -Math.abs(parseFloat(formData.billAmount)), // Bills are expenses (negative)
      category: formData.category,
      isBill: true,
      billName: formData.billName,
      billAmount: parseFloat(formData.billAmount),
      dueDate: formData.dueDate,
      frequency: formData.frequency,
      memo: formData.memo,
      paidDates: [],
      payments: []
    }

    console.log('Adding new bill:', newBill)
    const updatedTransactions = [...transactions, newBill]
    onUpdateTransactions(updatedTransactions)

    setFormData({
      billName: '',
      billAmount: '',
      dueDate: '',
      frequency: 'monthly',
      category: '',
      memo: '',
      paidDates: []
    })
    setIsAdding(false)
  }

  const handleEditBill = (bill) => {
    setEditingId(bill.id)
    setFormData({
      billName: bill.billName || bill.description,
      billAmount: bill.billAmount || Math.abs(bill.amount),
      dueDate: bill.dueDate,
      frequency: bill.frequency || 'monthly',
      category: bill.category,
      memo: bill.memo || '',
      paidDates: bill.paidDates || []
    })
    setIsAdding(true)
  }

  const handleUpdateBill = () => {
    if (!formData.billName || !formData.billAmount || !formData.dueDate) {
      alert('Please fill in all required fields')
      return
    }

    const updatedTransactions = transactions.map(t =>
      t.id === editingId && t.isBill
        ? {
            ...t,
            description: formData.billName,
            billName: formData.billName,
            billAmount: parseFloat(formData.billAmount),
            amount: -Math.abs(parseFloat(formData.billAmount)),
            dueDate: formData.dueDate,
            frequency: formData.frequency,
            category: formData.category,
            memo: formData.memo
          }
        : t
    )

    onUpdateTransactions(updatedTransactions)
    setFormData({
      billName: '',
      billAmount: '',
      dueDate: '',
      frequency: 'monthly',
      category: '',
      memo: '',
      paidDates: []
    })
    setIsAdding(false)
    setEditingId(null)
  }

  const handleDeleteBill = (id) => {
    if (confirm('Are you sure you want to delete this bill?')) {
      onUpdateTransactions(transactions.filter(t => t.id !== id))
    }
  }

  const handleTogglePaid = (billId, occurrenceDate) => {
    const updatedTransactions = transactions.map(transaction => {
      if (transaction.id === billId && transaction.isBill) {
        // Use new payments structure
        const payments = transaction.payments || []
        const existingPayment = payments.find(p => p.occurrenceDate === occurrenceDate)

        if (existingPayment) {
          // Remove payment
          return {
            ...transaction,
            payments: payments.filter(p => p.occurrenceDate !== occurrenceDate)
          }
        } else {
          // Add manual payment
          cashRegisterSound.play().catch(err => console.log('Sound play failed:', err))
          return {
            ...transaction,
            payments: [...payments, {
              occurrenceDate,
              manuallyMarked: true
            }]
          }
        }
      }
      return transaction
    })
    onUpdateTransactions(updatedTransactions)
  }

  const handleCancelEdit = () => {
    setIsAdding(false)
    setEditingId(null)
    setFormData({
      billName: '',
      billAmount: '',
      dueDate: '',
      frequency: 'monthly',
      category: '',
      memo: '',
      paidDates: []
    })
  }

  const generateRecurringBills = useMemo(() => {
    // Use the new utility function to generate bill occurrences
    const startYear = selectedYear
    const endYear = selectedYear + 1
    const recurringBills = []

    // Generate occurrences for the entire year range
    for (let year = startYear; year <= endYear; year++) {
      for (let month = 0; month < 12; month++) {
        const occurrences = generateBillOccurrences(transactions, year, month)
        recurringBills.push(...occurrences.map(occ => ({
          ...occ.billTransaction,
          occurrenceDate: occ.occurrenceDate,
          isPaid: !!occ.payment,
          payment: occ.payment,
          billName: occ.billName,
          billAmount: occ.billAmount
        })))
      }
    }

    return recurringBills
  }, [transactions, selectedYear])


  const sortedBills = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return generateRecurringBills
      .filter(bill => {
        const [year] = bill.occurrenceDate.split('-').map(Number)
        return year === selectedYear
      })
      .map(bill => {
        const billDate = new Date(bill.occurrenceDate)
        billDate.setHours(0, 0, 0, 0)
        return {
          ...bill,
          isFuture: billDate > today
        }
      })
      .sort((a, b) => {
        if (a.isPaid !== b.isPaid) return a.isPaid ? 1 : -1
        return new Date(a.occurrenceDate) - new Date(b.occurrenceDate)
      })
  }, [generateRecurringBills, selectedYear])

  const currentMonthBills = useMemo(() => {
    console.log('Filtering bills for month:', selectedMonth, 'year:', selectedYear)
    console.log('sortedBills:', sortedBills)
    const filtered = sortedBills.filter(bill => {
      const [year, month] = bill.occurrenceDate.split('-').map(Number)
      const matches = month - 1 === selectedMonth && year === selectedYear
      console.log(`Bill ${bill.name}: occurrenceDate=${bill.occurrenceDate}, month=${month}, year=${year}, matches=${matches}`)
      return matches
    })
    console.log('currentMonthBills:', filtered)
    return filtered
  }, [sortedBills, selectedMonth, selectedYear])

  const totalAmount = useMemo(() => {
    return currentMonthBills.reduce((sum, bill) => sum + (bill.billAmount || Math.abs(bill.amount)), 0)
  }, [currentMonthBills])

  const unpaidAmount = useMemo(() => {
    return currentMonthBills.filter(b => !b.isPaid).reduce((sum, bill) => sum + (bill.billAmount || Math.abs(bill.amount)), 0)
  }, [currentMonthBills])

  const categoryTotals = useMemo(() => {
    const totals = {}
    currentMonthBills.forEach(bill => {
      const category = bill.category || 'Uncategorized'
      if (!totals[category]) {
        totals[category] = 0
      }
      totals[category] += (bill.billAmount || Math.abs(bill.amount))
    })
    return Object.entries(totals)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
  }, [currentMonthBills])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  return (
    <div className="bills">
      <div className="bills-section">
        <div className="bills-header">
          <h2>Bills</h2>
          <div className="bills-header-actions">
            {!isAdding && (
              <button className="add-bill-btn" onClick={() => setIsAdding(true)}>
                + Add Bill
              </button>
            )}
          </div>
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
                  value={formData.billName}
                  onChange={(e) => setFormData({ ...formData, billName: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Amount *</label>
                <input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={formData.billAmount}
                  onChange={(e) => setFormData({ ...formData, billAmount: e.target.value })}
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
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="">Select a category</option>
                  {categories && categories
                    .filter(cat => cat.type === 'expense' || cat.type === 'both')
                    .map(cat => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="form-group form-group-full">
                <label>Memo</label>
                <textarea
                  placeholder="Optional note about this bill"
                  value={formData.memo}
                  onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                  rows="2"
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={handleCancelEdit}>
                Cancel
              </button>
              <button
                type="button"
                className="save-btn"
                onClick={editingId ? handleUpdateBill : handleAddBill}
              >
                {editingId ? 'Update Bill' : 'Add Bill'}
              </button>
            </div>
          </div>
        )}

        {currentMonthBills.length === 0 ? (
          <div className="bills-empty">
            <p>No bills yet. Click "Add Bill" to get started.</p>
          </div>
        ) : (
          <>
            {categoryTotals.length > 0 && (
              <div className="category-totals">
                <h3>Total by Category</h3>
                <div className="category-list">
                  {categoryTotals.map(({ category, amount }) => (
                    <div key={category} className="category-item">
                      <span className="category-label">{category}</span>
                      <span className="category-amount">{formatCurrency(amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bills-list">
              {currentMonthBills.map((bill) => (
                <div
                  key={`${bill.id}-${bill.occurrenceDate}`}
                  className={'bill-item' + (bill.isPaid ? ' paid' : '') + (bill.isFuture ? ' future' : '')}
                >
                  <div className="bill-main">
                    <div className="bill-check">
                      <button
                        className="toggle-paid-btn"
                        onClick={() => handleTogglePaid(bill.id, bill.occurrenceDate)}
                        title={bill.isPaid ? 'Mark as Unpaid' : 'Mark as Paid'}
                      >
                        {bill.isPaid ? '✓' : '○'}
                      </button>
                    </div>
                    <div className="bill-info">
                      <div className="bill-header">
                        <div className="bill-name">
                          {bill.billName || bill.description}
                          {bill.sourceDescription && (
                            <span className="bill-source-badge" title="Created from transaction">📄</span>
                          )}
                          {bill.payment && (
                            <span className="bill-payment-badge" title={
                              bill.payment.manuallyMarked
                                ? 'Manually marked as paid'
                                : `Auto-matched: ${bill.payment.transactionDescription} (${formatCurrency(bill.payment.transactionAmount)} on ${bill.payment.transactionDate})`
                            }>
                              {bill.payment.manuallyMarked ? '✓' : '💰'}
                            </span>
                          )}
                        </div>
                        <div className="bill-amount">{formatCurrency(bill.billAmount || Math.abs(bill.amount))}</div>
                      </div>
                      <div className="bill-meta">
                        <span className="bill-date">{formatDate(bill.occurrenceDate)}</span>
                        <span className="bill-frequency">{bill.frequency}</span>
                        {bill.category && <span className="bill-category">{bill.category}</span>}
                      </div>
                      {bill.memo && <div className="bill-memo">{bill.memo}</div>}
                    </div>
                  </div>
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
          </>
        )}
      </div>
    </div>
  )
}

export default Bills