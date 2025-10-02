import React, { useState, useMemo } from 'react'
import '../../../styles/components/Income.css'

function Income({
  recurringIncomes,
  onUpdateRecurringIncomes,
  categories,
  selectedYear,
  selectedMonth
}) {
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editingIncome, setEditingIncome] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    startDate: '',
    frequency: 'bi-weekly',
    category: 'Income',
    memo: ''
  })

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  // Generate income occurrences for the current month
  const monthlyIncomeOccurrences = useMemo(() => {
    const occurrences = []
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()
    const monthStart = new Date(selectedYear, selectedMonth, 1)
    const monthEnd = new Date(selectedYear, selectedMonth, daysInMonth)

    recurringIncomes.forEach(income => {
      const startDate = new Date(income.startDate)
      const startDay = startDate.getDate()
      const startMonth = startDate.getMonth()
      const startYear = startDate.getFullYear()

      if (income.frequency === 'weekly') {
        const weekMs = 7 * 24 * 60 * 60 * 1000
        let currentDate = new Date(startDate)

        while (currentDate <= monthEnd) {
          if (currentDate >= monthStart && currentDate >= startDate) {
            occurrences.push({
              ...income,
              occurrenceDate: currentDate.toISOString().split('T')[0],
              day: currentDate.getDate()
            })
          }
          currentDate = new Date(currentDate.getTime() + weekMs)
        }
      } else if (income.frequency === 'bi-weekly') {
        const biWeekMs = 14 * 24 * 60 * 60 * 1000
        let currentDate = new Date(startDate)

        while (currentDate <= monthEnd) {
          if (currentDate >= monthStart && currentDate >= startDate) {
            occurrences.push({
              ...income,
              occurrenceDate: currentDate.toISOString().split('T')[0],
              day: currentDate.getDate()
            })
          }
          currentDate = new Date(currentDate.getTime() + biWeekMs)
        }
      } else if (income.frequency === 'monthly') {
        if (new Date(selectedYear, selectedMonth, startDay) >= startDate) {
          const day = startDay <= daysInMonth ? startDay : daysInMonth
          occurrences.push({
            ...income,
            occurrenceDate: new Date(selectedYear, selectedMonth, day).toISOString().split('T')[0],
            day: day
          })
        }
      } else if (income.frequency === 'quarterly') {
        for (let quarter = 0; quarter < 4; quarter++) {
          const month = startMonth + (quarter * 3)
          if (month === selectedMonth) {
            if (new Date(selectedYear, selectedMonth, startDay) >= startDate) {
              const day = startDay <= daysInMonth ? startDay : daysInMonth
              occurrences.push({
                ...income,
                occurrenceDate: new Date(selectedYear, selectedMonth, day).toISOString().split('T')[0],
                day: day
              })
            }
          }
        }
      } else if (income.frequency === 'yearly') {
        if (startMonth === selectedMonth) {
          if (new Date(selectedYear, selectedMonth, startDay) >= startDate) {
            const day = startDay <= daysInMonth ? startDay : daysInMonth
            occurrences.push({
              ...income,
              occurrenceDate: new Date(selectedYear, selectedMonth, day).toISOString().split('T')[0],
              day: day
            })
          }
        }
      }
    })

    return occurrences.sort((a, b) => new Date(a.occurrenceDate) - new Date(b.occurrenceDate))
  }, [recurringIncomes, selectedYear, selectedMonth])

  const handleOpenAddModal = () => {
    const today = new Date()
    const currentDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    setFormData({
      name: '',
      amount: '',
      startDate: currentDate,
      frequency: 'bi-weekly',
      category: 'Income',
      memo: ''
    })
    setEditingIncome(null)
    setAddModalOpen(true)
  }

  const handleEditIncome = (income) => {
    setFormData({
      name: income.name,
      amount: income.amount,
      startDate: income.startDate,
      frequency: income.frequency,
      category: income.category || 'Income',
      memo: income.memo || ''
    })
    setEditingIncome(income)
    setAddModalOpen(true)
  }

  const handleDeleteIncome = (incomeId) => {
    if (confirm('Are you sure you want to delete this recurring income?')) {
      onUpdateRecurringIncomes(prev => prev.filter(i => i.id !== incomeId))
    }
  }

  const handleSaveForm = () => {
    if (!formData.name || !formData.amount || !formData.startDate) {
      alert('Please fill in all required fields')
      return
    }

    if (editingIncome) {
      // Update existing income
      onUpdateRecurringIncomes(prev => prev.map(i => {
        if (i.id === editingIncome.id) {
          return {
            ...i,
            name: formData.name,
            amount: parseFloat(formData.amount),
            startDate: formData.startDate,
            frequency: formData.frequency,
            category: formData.category || 'Income',
            memo: formData.memo
          }
        }
        return i
      }))
    } else {
      // Create new income
      const newIncome = {
        id: `income-${Date.now()}`,
        name: formData.name,
        amount: parseFloat(formData.amount),
        startDate: formData.startDate,
        frequency: formData.frequency,
        category: formData.category || 'Income',
        memo: formData.memo
      }
      onUpdateRecurringIncomes(prev => [...prev, newIncome])
    }

    setFormData({
      name: '',
      amount: '',
      startDate: '',
      frequency: 'bi-weekly',
      category: 'Income',
      memo: ''
    })
    setEditingIncome(null)
    setAddModalOpen(false)
  }

  // Summary stats
  const summary = useMemo(() => {
    const totalIncome = monthlyIncomeOccurrences.reduce((sum, occ) => sum + occ.amount, 0)
    const incomeCount = monthlyIncomeOccurrences.length

    return {
      totalIncome,
      incomeCount
    }
  }, [monthlyIncomeOccurrences])

  return (
    <div className="income-page">
      {/* Add/Edit Income Modal */}
      {addModalOpen && (
        <div className="income-modal-backdrop" onClick={() => setAddModalOpen(false)}>
          <div className="income-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingIncome ? 'Edit Recurring Income' : 'Add Recurring Income'}</h3>
            <div className="income-modal-content">
              <div className="income-modal-form">
                <div className="form-group">
                  <label>Income Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Paycheck - ABC Corp"
                  />
                </div>
                <div className="form-group">
                  <label>Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="Expected income amount"
                  />
                </div>
                <div className="form-group">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                  <p className="field-help">Set the date of the first income occurrence.</p>
                </div>
                <div className="form-group">
                  <label>Frequency *</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  >
                    <option value="weekly">Weekly</option>
                    <option value="bi-weekly">Bi-weekly (Every 2 weeks)</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="Income">Income</option>
                    {categories && [...categories]
                      .filter(cat => cat.type === 'income' || cat.type === 'both')
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
            <div className="income-modal-actions">
              <button className="cancel-btn" onClick={() => setAddModalOpen(false)}>
                Cancel
              </button>
              <button className="save-btn" onClick={handleSaveForm}>
                {editingIncome ? 'Update Income' : 'Add Income'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="income-section">
        <div className="income-header">
          <h2>Recurring Income - {monthNames[selectedMonth]} {selectedYear}</h2>
          <div className="header-controls">
            <button className="action-btn add-income-btn" onClick={handleOpenAddModal}>
              + Add Recurring Income
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="summary-card">
            <div className="summary-label">Expected Income This Month</div>
            <div className="summary-value income">{formatCurrency(summary.totalIncome)}</div>
            <div className="summary-detail">{summary.incomeCount} occurrence{summary.incomeCount !== 1 ? 's' : ''}</div>
          </div>
        </div>

        {/* Income List */}
        <div className="income-list">
          {monthlyIncomeOccurrences.length === 0 ? (
            <div className="empty-state">
              <p>No recurring income for this month.</p>
              <p>Click "Add Recurring Income" to create your first income entry.</p>
            </div>
          ) : (
            monthlyIncomeOccurrences.map((occ, index) => {
              return (
                <div key={`${occ.id}-${occ.occurrenceDate}`} className="income-card">
                  <div className="income-card-header">
                    <div className="income-name">{occ.name}</div>
                    <div className="income-amount positive">{formatCurrency(occ.amount)}</div>
                    <div className="income-date">Date: {occ.occurrenceDate}</div>
                    <div className="income-frequency">{occ.frequency}</div>
                    <div className="income-category">{occ.category || 'Income'}</div>
                    <div className="income-actions">
                      <button
                        className="edit-btn"
                        onClick={() => handleEditIncome(recurringIncomes.find(i => i.id === occ.id))}
                        title="Edit Recurring Income"
                      >
                        ✎ Edit
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteIncome(occ.id)}
                        title="Delete Recurring Income"
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </div>
                  {occ.memo && (
                    <div className="income-card-details">
                      <div className="detail-row">
                        <strong>Memo:</strong> {occ.memo}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* All Recurring Income Entries */}
        <div className="all-income-section">
          <h3>All Recurring Income Entries</h3>
          <div className="all-income-list">
            {recurringIncomes.length === 0 ? (
              <div className="empty-state">
                <p>No recurring income entries.</p>
              </div>
            ) : (
              recurringIncomes.map((income) => {
                return (
                  <div key={income.id} className="income-summary-card">
                    <div className="income-summary-header">
                      <div className="income-summary-name">{income.name}</div>
                      <div className="income-summary-amount">{formatCurrency(income.amount)}</div>
                    </div>
                    <div className="income-summary-details">
                      <span className="income-summary-frequency">{income.frequency}</span>
                      <span className="income-summary-start">Starting {income.startDate}</span>
                    </div>
                    <div className="income-summary-actions">
                      <button
                        className="edit-btn-small"
                        onClick={() => handleEditIncome(income)}
                        title="Edit"
                      >
                        ✎
                      </button>
                      <button
                        className="delete-btn-small"
                        onClick={() => handleDeleteIncome(income.id)}
                        title="Delete"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Income
