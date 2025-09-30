import { useState, useMemo } from 'react'
import './Bills.css'

function Bills({ bills, onUpdateBills, selectedYear, selectedMonth, onDateChange, categories }) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const getDefaultDueDate = () => {
    const date = new Date(selectedYear, selectedMonth, 15)
    return date.toISOString().split('T')[0]
  }

  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    dueDate: getDefaultDueDate(),
    frequency: 'monthly',
    category: '',
    paidDates: []
  })

  const cashRegisterSound = useMemo(() => new Audio('/cash-register.mp3'), [])

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

    console.log('Adding new bill:', newBill)
    console.log('Current bills:', bills)
    const updatedBills = [...bills, newBill]
    console.log('Updated bills:', updatedBills)
    onUpdateBills(updatedBills)
    setFormData({
      name: '',
      amount: '',
      dueDate: getDefaultDueDate(),
      frequency: 'monthly',
      category: '',
      paidDates: []
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
      dueDate: getDefaultDueDate(),
      frequency: 'monthly',
      category: '',
      paidDates: []
    })
    setIsAdding(false)
    setEditingId(null)
  }

  const handleDeleteBill = (id) => {
    if (confirm('Are you sure you want to delete this bill?')) {
      onUpdateBills(bills.filter(bill => bill.id !== id))
    }
  }

  const handleTogglePaid = (billId, occurrenceDate) => {
    const updatedBills = bills.map(bill => {
      if (bill.id === billId) {
        const paidDates = bill.paidDates || []
        const isPaid = paidDates.includes(occurrenceDate)

        if (isPaid) {
          return {
            ...bill,
            paidDates: paidDates.filter(date => date !== occurrenceDate)
          }
        } else {
          cashRegisterSound.play().catch(err => console.log('Sound play failed:', err))
          return {
            ...bill,
            paidDates: [...paidDates, occurrenceDate]
          }
        }
      }
      return bill
    })
    onUpdateBills(updatedBills)
  }

  const handleCancelEdit = () => {
    setIsAdding(false)
    setEditingId(null)
    setFormData({
      name: '',
      amount: '',
      dueDate: getDefaultDueDate(),
      frequency: 'monthly',
      category: '',
      paidDates: []
    })
  }

  const generateRecurringBills = useMemo(() => {
    const recurringBills = []

    bills.forEach(bill => {
      const startDate = new Date(bill.dueDate)
      const billYear = startDate.getFullYear()
      const billMonth = startDate.getMonth()
      const billDay = startDate.getDate()

      if (bill.frequency === 'one-time') {
        recurringBills.push({
          ...bill,
          occurrenceDate: bill.dueDate,
          isPaid: (bill.paidDates || []).includes(bill.dueDate)
        })
      } else {
        const startYear = Math.min(billYear, selectedYear)
        const endYear = Math.max(billYear, selectedYear + 1)

        for (let year = startYear; year <= endYear; year++) {
          if (bill.frequency === 'yearly') {
            const occurrenceDate = new Date(year, billMonth, billDay).toISOString().split('T')[0]
            if (new Date(occurrenceDate) >= startDate) {
              recurringBills.push({
                ...bill,
                occurrenceDate,
                isPaid: (bill.paidDates || []).includes(occurrenceDate)
              })
            }
          } else if (bill.frequency === 'monthly') {
            for (let month = 0; month < 12; month++) {
              const occurrenceDate = new Date(year, month, billDay).toISOString().split('T')[0]
              if (new Date(occurrenceDate) >= startDate) {
                recurringBills.push({
                  ...bill,
                  occurrenceDate,
                  isPaid: (bill.paidDates || []).includes(occurrenceDate)
                })
              }
            }
          } else if (bill.frequency === 'quarterly') {
            for (let quarter = 0; quarter < 4; quarter++) {
              const month = billMonth + (quarter * 3)
              if (month < 12) {
                const occurrenceDate = new Date(year, month, billDay).toISOString().split('T')[0]
                if (new Date(occurrenceDate) >= startDate) {
                  recurringBills.push({
                    ...bill,
                    occurrenceDate,
                    isPaid: (bill.paidDates || []).includes(occurrenceDate)
                  })
                }
              }
            }
          } else if (bill.frequency === 'weekly') {
            const weekMs = 7 * 24 * 60 * 60 * 1000
            let currentDate = new Date(startDate)
            const endDate = new Date(endYear + 1, 0, 1)

            while (currentDate < endDate) {
              const occurrenceDate = currentDate.toISOString().split('T')[0]
              recurringBills.push({
                ...bill,
                occurrenceDate,
                isPaid: (bill.paidDates || []).includes(occurrenceDate)
              })
              currentDate = new Date(currentDate.getTime() + weekMs)
            }
          }
        }
      }
    })

    return recurringBills
  }, [bills, selectedYear])


  const sortedBills = useMemo(() => {
    return generateRecurringBills
      .filter(bill => {
        const dueDate = new Date(bill.occurrenceDate)
        return dueDate.getFullYear() === selectedYear
      })
      .sort((a, b) => {
        if (a.isPaid !== b.isPaid) return a.isPaid ? 1 : -1
        return new Date(a.occurrenceDate) - new Date(b.occurrenceDate)
      })
  }, [generateRecurringBills, selectedYear])

  const currentMonthBills = useMemo(() => {
    return sortedBills.filter(bill => {
      const billDate = new Date(bill.occurrenceDate)
      return billDate.getMonth() === selectedMonth && billDate.getFullYear() === selectedYear
    })
  }, [sortedBills, selectedMonth, selectedYear])

  const totalAmount = useMemo(() => {
    return currentMonthBills.reduce((sum, bill) => sum + bill.amount, 0)
  }, [currentMonthBills])

  const unpaidAmount = useMemo(() => {
    return currentMonthBills.filter(b => !b.isPaid).reduce((sum, bill) => sum + bill.amount, 0)
  }, [currentMonthBills])

  const categoryTotals = useMemo(() => {
    const totals = {}
    currentMonthBills.forEach(bill => {
      const category = bill.category || 'Uncategorized'
      if (!totals[category]) {
        totals[category] = 0
      }
      totals[category] += bill.amount
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
    return new Date(dateString).toLocaleDateString('en-US', {
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
            <div className="bills-list">
              {currentMonthBills.map((bill) => (
                <div
                  key={`${bill.id}-${bill.occurrenceDate}`}
                  className={'bill-item' + (bill.isPaid ? ' paid' : '')}
                >
                  <div className="bill-checkbox">
                    <input
                      type="checkbox"
                      checked={bill.isPaid}
                      onChange={() => handleTogglePaid(bill.id, bill.occurrenceDate)}
                    />
                  </div>
                  <div className="bill-info">
                    <div className="bill-name">{bill.name}</div>
                    <div className="bill-meta">
                      <span className="bill-date">Due: {formatDate(bill.occurrenceDate)}</span>
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
          </>
        )}
      </div>
    </div>
  )
}

export default Bills