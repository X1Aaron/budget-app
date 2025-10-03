import React, { useState } from 'react'
import '../../../styles/components/CreditCards.css'
import type { CreditCard, MonthlyPayment } from '../../../types'

interface CreditCardsProps {
  creditCards: CreditCard[]
  onUpdateCreditCards: (cards: CreditCard[]) => void
  selectedYear?: number
}

function CreditCards({ creditCards, onUpdateCreditCards, selectedYear }: CreditCardsProps) {
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null)
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    balance: '',
    interestRate: '',
    minimumPayment: '',
    dueDate: '',
    creditLimit: '',
    memo: ''
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const calculatePayoffScenarios = (card: CreditCard) => {
    const balance = card.balance
    const monthlyRate = card.interestRate / 100 / 12
    const minPayment = card.minimumPayment

    const scenarios = []

    const calculateScenario = (payment: number) => {
      let remainingBalance = balance
      let months = 0
      let totalInterest = 0
      const maxMonths = 600

      while (remainingBalance > 0.01 && months < maxMonths) {
        const interest = remainingBalance * monthlyRate
        totalInterest += interest
        const principal = Math.min(payment - interest, remainingBalance)

        if (principal <= 0) {
          return { months: -1, totalInterest: -1, totalPaid: -1 }
        }

        remainingBalance -= principal
        months++
      }

      return { months, totalInterest, totalPaid: balance + totalInterest }
    }

    // Scenario 1: Minimum payment only
    if (minPayment > 0) {
      const result = calculateScenario(minPayment)
      scenarios.push({ payment: minPayment, ...result })
    }

    // Scenario 2: Pay off in 3 years (36 months)
    const payment36Months = balance * (monthlyRate * Math.pow(1 + monthlyRate, 36)) / (Math.pow(1 + monthlyRate, 36) - 1)
    if (payment36Months > minPayment && payment36Months < balance) {
      const result = calculateScenario(payment36Months)
      scenarios.push({ payment: payment36Months, ...result })
    }

    // Scenario 3: Pay off in 2 years (24 months)
    const payment24Months = balance * (monthlyRate * Math.pow(1 + monthlyRate, 24)) / (Math.pow(1 + monthlyRate, 24) - 1)
    if (payment24Months > minPayment && payment24Months < balance) {
      const result = calculateScenario(payment24Months)
      scenarios.push({ payment: payment24Months, ...result })
    }

    // Scenario 4: Pay off in 1 year (12 months)
    const payment12Months = balance * (monthlyRate * Math.pow(1 + monthlyRate, 12)) / (Math.pow(1 + monthlyRate, 12) - 1)
    if (payment12Months > minPayment && payment12Months < balance) {
      const result = calculateScenario(payment12Months)
      scenarios.push({ payment: payment12Months, ...result })
    }

    return scenarios
  }

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      balance: '',
      interestRate: '',
      minimumPayment: '',
      dueDate: '',
      creditLimit: '',
      memo: ''
    })
    setEditingCard(null)
    setAddModalOpen(true)
  }

  const handleOpenEditModal = (card: CreditCard) => {
    setFormData({
      name: card.name,
      balance: card.balance.toString(),
      interestRate: card.interestRate.toString(),
      minimumPayment: card.minimumPayment.toString(),
      dueDate: card.dueDate,
      creditLimit: card.creditLimit?.toString() || '',
      memo: card.memo || ''
    })
    setEditingCard(card)
    setAddModalOpen(true)
  }

  const handleSaveCard = () => {
    if (!formData.name || !formData.balance || !formData.interestRate || !formData.minimumPayment || !formData.dueDate) {
      alert('Please fill in all required fields')
      return
    }

    const cardData: CreditCard = {
      id: editingCard?.id || crypto.randomUUID(),
      name: formData.name,
      balance: parseFloat(formData.balance),
      interestRate: parseFloat(formData.interestRate),
      minimumPayment: parseFloat(formData.minimumPayment),
      dueDate: formData.dueDate,
      creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : undefined,
      memo: formData.memo || undefined
    }

    if (editingCard) {
      // Update existing card
      onUpdateCreditCards(creditCards.map(c => c.id === editingCard.id ? cardData : c))
    } else {
      // Add new card
      onUpdateCreditCards([...creditCards, cardData])
    }

    setAddModalOpen(false)
    setEditingCard(null)
  }

  const handleDeleteCard = (cardId: string) => {
    if (confirm('Are you sure you want to delete this credit card? This action cannot be undone.')) {
      onUpdateCreditCards(creditCards.filter(c => c.id !== cardId))
      if (expandedCardId === cardId) {
        setExpandedCardId(null)
      }
    }
  }

  const handleTogglePayment = (cardId: string, year: number, month: number) => {
    const card = creditCards.find(c => c.id === cardId)
    if (!card) return

    const paymentHistory = card.paymentHistory || []
    const existingPayment = paymentHistory.find(p => p.year === year && p.month === month)

    let updatedHistory: MonthlyPayment[]
    if (existingPayment) {
      // Toggle existing payment
      updatedHistory = paymentHistory.map(p =>
        p.year === year && p.month === month
          ? { ...p, paid: !p.paid, datePaid: !p.paid ? new Date().toISOString() : undefined }
          : p
      )
    } else {
      // Add new payment
      updatedHistory = [
        ...paymentHistory,
        {
          year,
          month,
          paid: true,
          datePaid: new Date().toISOString()
        }
      ]
    }

    onUpdateCreditCards(
      creditCards.map(c => c.id === cardId ? { ...c, paymentHistory: updatedHistory } : c)
    )
  }

  const getLast12Months = () => {
    const months = []
    const currentYear = selectedYear ?? new Date().getFullYear()

    for (let i = 0; i < 12; i++) {
      const date = new Date(currentYear, i, 1)
      months.push({
        year: currentYear,
        month: i + 1, // 1-12
        label: date.toLocaleDateString('en-US', { month: 'short' })
      })
    }
    return months
  }

  const isMonthPaid = (card: CreditCard, year: number, month: number) => {
    if (!card.paymentHistory) return false
    const payment = card.paymentHistory.find(p => p.year === year && p.month === month)
    return payment?.paid || false
  }

  const getPaymentDate = (card: CreditCard, year: number, month: number) => {
    if (!card.paymentHistory) return null
    const payment = card.paymentHistory.find(p => p.year === year && p.month === month)
    return payment?.datePaid || null
  }

  const totalBalance = creditCards.reduce((sum, card) => sum + card.balance, 0)
  const totalMinPayment = creditCards.reduce((sum, card) => sum + card.minimumPayment, 0)
  const avgInterestRate = creditCards.length > 0
    ? creditCards.reduce((sum, card) => sum + card.interestRate, 0) / creditCards.length
    : 0

  return (
    <div className="credit-cards-page">
      {/* Add/Edit Modal */}
      {addModalOpen && (
        <div className="credit-card-modal-backdrop" onClick={() => setAddModalOpen(false)}>
          <div className="credit-card-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingCard ? 'Edit Credit Card' : 'Add Credit Card'}</h3>
            <div className="credit-card-modal-form">
              <div className="form-group">
                <label>Card Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Chase Sapphire Preferred"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Current Balance *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.balance}
                    onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="form-group">
                  <label>Credit Limit</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>APR (%) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.interestRate}
                    onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                    placeholder="e.g., 18.99"
                  />
                </div>
                <div className="form-group">
                  <label>Minimum Payment *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.minimumPayment}
                    onChange={(e) => setFormData({ ...formData, minimumPayment: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Payment Due Date (Day of Month) *</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  placeholder="e.g., 15"
                />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={formData.memo}
                  onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                  placeholder="Optional notes about this card"
                  rows={2}
                />
              </div>
            </div>
            <div className="credit-card-modal-actions">
              <button className="cancel-btn" onClick={() => setAddModalOpen(false)}>
                Cancel
              </button>
              <button className="save-btn" onClick={handleSaveCard}>
                {editingCard ? 'Update Card' : 'Add Card'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="credit-cards-section">
        <div className="credit-cards-header">
          <h2>Credit Cards</h2>
          <button className="add-card-btn" onClick={handleOpenAddModal}>
            + Add Credit Card
          </button>
        </div>

        {/* Summary Cards */}
        {creditCards.length > 0 && (
          <div className="summary-cards">
            <div className="summary-card">
              <div className="summary-label">Total Balance</div>
              <div className="summary-value balance">{formatCurrency(totalBalance)}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Total Min Payment</div>
              <div className="summary-value">{formatCurrency(totalMinPayment)}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Avg Interest Rate</div>
              <div className="summary-value">{avgInterestRate.toFixed(2)}%</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Total Cards</div>
              <div className="summary-value">{creditCards.length}</div>
            </div>
          </div>
        )}

        {/* Credit Cards List */}
        {creditCards.length === 0 ? (
          <div className="empty-state">
            <p>No credit cards added yet</p>
            <p>Click "Add Credit Card" to get started tracking your credit cards and payoff plans.</p>
          </div>
        ) : (
          <div className="credit-cards-list">
            {creditCards.map((card) => {
              const isExpanded = expandedCardId === card.id
              const scenarios = calculatePayoffScenarios(card)
              const utilizationRate = card.creditLimit ? (card.balance / card.creditLimit) * 100 : null

              return (
                <div key={card.id} className="credit-card">
                  <div
                    className="credit-card-header"
                    onClick={() => setExpandedCardId(isExpanded ? null : card.id)}
                  >
                    <div className="card-info">
                      <div className="card-name">{card.name}</div>
                      <div className="card-due-date">Due: Day {card.dueDate} of month</div>
                    </div>
                    <div className="card-balance">
                      <div className="balance-label">Balance</div>
                      <div className="balance-amount">{formatCurrency(card.balance)}</div>
                    </div>
                    <div className="card-rate">
                      <div className="rate-label">APR</div>
                      <div className="rate-value">{card.interestRate}%</div>
                    </div>
                    <div className="card-min-payment">
                      <div className="min-payment-label">Min Payment</div>
                      <div className="min-payment-amount">{formatCurrency(card.minimumPayment)}</div>
                    </div>
                    <div className="card-actions">
                      <button
                        className="edit-card-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenEditModal(card)
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-card-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteCard(card.id)
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="credit-card-details">
                      {card.creditLimit && (
                        <div className="detail-section utilization-section">
                          <div className="detail-label">Credit Utilization</div>
                          <div className="utilization-info">
                            <div className="utilization-text">
                              {formatCurrency(card.balance)} / {formatCurrency(card.creditLimit)}
                              <span className={`utilization-rate ${utilizationRate! > 30 ? 'high' : 'good'}`}>
                                {utilizationRate!.toFixed(1)}%
                              </span>
                            </div>
                            <div className="utilization-bar">
                              <div
                                className={`utilization-fill ${utilizationRate! > 30 ? 'high' : 'good'}`}
                                style={{ width: `${Math.min(utilizationRate!, 100)}%` }}
                              />
                            </div>
                            {utilizationRate! > 30 && (
                              <div className="utilization-warning">
                                ⚠️ High utilization may impact credit score. Try to keep below 30%.
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Monthly Payment Tracker */}
                      <div className="detail-section payment-tracker-section">
                        <div className="detail-label">Monthly Payment Tracker</div>
                        <div className="payment-tracker">
                          {getLast12Months().map(({ year, month, label }) => {
                            const isPaid = isMonthPaid(card, year, month)
                            const paymentDate = getPaymentDate(card, year, month)
                            return (
                              <div
                                key={`${year}-${month}`}
                                className="payment-month"
                                title={
                                  isPaid && paymentDate
                                    ? `Paid on ${new Date(paymentDate).toLocaleDateString()}`
                                    : `Mark as paid for ${label} ${year}`
                                }
                              >
                                <div className="month-label">{label}</div>
                                <label className="payment-checkbox">
                                  <input
                                    type="checkbox"
                                    checked={isPaid}
                                    onChange={() => handleTogglePayment(card.id, year, month)}
                                  />
                                  <span className="checkmark"></span>
                                </label>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {card.memo && (
                        <div className="detail-section">
                          <div className="detail-label">Notes</div>
                          <div className="detail-value">{card.memo}</div>
                        </div>
                      )}

                      <div className="payoff-scenarios">
                        <h4>Payoff Scenarios</h4>
                        <div className="scenarios-grid">
                          {scenarios.map((scenario, index) => {
                            const years = scenario.months >= 0 ? Math.floor(scenario.months / 12) : 0
                            const months = scenario.months >= 0 ? scenario.months % 12 : 0
                            const isMinPayment = index === 0

                            return (
                              <div key={index} className={`scenario-card ${isMinPayment ? 'min-payment' : ''}`}>
                                <div className="scenario-header">
                                  <div className="scenario-title">
                                    {index === 0 && 'Minimum Payment'}
                                    {index === 1 && '3-Year Payoff'}
                                    {index === 2 && '2-Year Payoff'}
                                    {index === 3 && '1-Year Payoff'}
                                  </div>
                                  <div className="scenario-payment">{formatCurrency(scenario.payment)}/mo</div>
                                </div>
                                <div className="scenario-details">
                                  {scenario.months === -1 ? (
                                    <div className="scenario-warning">
                                      ⚠️ Payment doesn't cover interest - will never pay off!
                                    </div>
                                  ) : (
                                    <>
                                      <div className="scenario-time">
                                        <span className="time-label">Payoff Time:</span>
                                        <span className="time-value">
                                          {years > 0 && `${years} year${years !== 1 ? 's' : ''}`}
                                          {years > 0 && months > 0 && ', '}
                                          {months > 0 && `${months} month${months !== 1 ? 's' : ''}`}
                                          {years === 0 && months === 0 && '< 1 month'}
                                        </span>
                                      </div>
                                      <div className="scenario-interest">
                                        <span className="interest-label">Total Interest:</span>
                                        <span className="interest-value">{formatCurrency(scenario.totalInterest)}</span>
                                      </div>
                                      <div className="scenario-total">
                                        <span className="total-label">Total Paid:</span>
                                        <span className="total-value">{formatCurrency(scenario.totalPaid)}</span>
                                      </div>
                                      {index > 0 && scenarios[0].months > 0 && (
                                        <div className="scenario-savings">
                                          💰 Save {formatCurrency(scenarios[0].totalInterest - scenario.totalInterest)} in interest
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default CreditCards
