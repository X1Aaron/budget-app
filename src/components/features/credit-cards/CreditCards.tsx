import React, { useState, useMemo } from 'react'
import '../../../styles/components/CreditCards.css'
import type { CreditCard, MonthlyPayment, Reward, CardBenefit, BalanceSnapshot, CreditCardBrand } from '../../../types'
import CreditCardLogo from '../../ui/CreditCardLogo'
import { detectCardBrand, COMMON_CARD_ISSUERS, getIssuerBrand } from '../../../utils/creditCardBrands'

interface CreditCardsProps {
  creditCards: CreditCard[]
  onUpdateCreditCards: (cards: CreditCard[]) => void
  selectedYear?: number
}

type PayoffStrategy = 'avalanche' | 'snowball' | 'custom'
type ViewMode = 'list' | 'comparison'

function CreditCards({ creditCards, onUpdateCreditCards, selectedYear }: CreditCardsProps) {
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null)
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [showPayoffOptimizer, setShowPayoffOptimizer] = useState(false)
  const [showCreditScoreSimulator, setShowCreditScoreSimulator] = useState(false)
  const [extraMonthlyBudget, setExtraMonthlyBudget] = useState(0)
  const [selectedStrategy, setSelectedStrategy] = useState<PayoffStrategy>('avalanche')

  // Modal states
  const [showRewardsModal, setShowRewardsModal] = useState(false)
  const [showBenefitsModal, setShowBenefitsModal] = useState(false)
  const [showBalanceUpdateModal, setShowBalanceUpdateModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentModalData, setPaymentModalData] = useState<{cardId: string, year: number, month: number} | null>(null)

  const [formData, setFormData] = useState({
    issuerType: 'predefined' as 'predefined' | 'custom',
    issuerName: '',
    customName: '',
    name: '',
    balance: '',
    interestRate: '',
    minimumPayment: '',
    dueDate: '',
    creditLimit: '',
    memo: '',
    autopay: false,
    autopayAmount: 'minimum' as 'minimum' | 'statement' | 'full',
    rewardsType: '' as '' | 'points' | 'cashback' | 'miles',
    rewardsBalance: '',
    annualFee: '',
    annualFeeDate: '',
    color: '#667eea',
    icon: 'credit-card',
    brand: 'other' as CreditCardBrand
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

    // Custom payoff plan
    if (card.customPayoffPlan?.active && card.customPayoffPlan.monthlyPayment > minPayment) {
      const result = calculateScenario(card.customPayoffPlan.monthlyPayment)
      scenarios.push({ payment: card.customPayoffPlan.monthlyPayment, ...result, isCustom: true })
    }

    return scenarios
  }

  const calculateOptimalPayoffStrategy = () => {
    if (creditCards.length === 0) return null

    const totalMinPayments = creditCards.reduce((sum, card) => sum + card.minimumPayment, 0)
    const extraPayment = extraMonthlyBudget - totalMinPayments

    if (extraPayment <= 0) {
      return { strategy: selectedStrategy, message: 'Not enough budget to cover minimum payments', cards: [] }
    }

    // Sort cards based on strategy
    let sortedCards = [...creditCards]
    if (selectedStrategy === 'avalanche') {
      sortedCards.sort((a, b) => b.interestRate - a.interestRate)
    } else if (selectedStrategy === 'snowball') {
      sortedCards.sort((a, b) => a.balance - b.balance)
    }

    // Calculate payment allocation
    const allocation = sortedCards.map((card, index) => {
      const payment = index === 0 ? card.minimumPayment + extraPayment : card.minimumPayment
      const monthlyRate = card.interestRate / 100 / 12

      let remainingBalance = card.balance
      let months = 0
      let totalInterest = 0
      const maxMonths = 600

      while (remainingBalance > 0.01 && months < maxMonths) {
        const interest = remainingBalance * monthlyRate
        totalInterest += interest
        const principal = Math.min(payment - interest, remainingBalance)

        if (principal <= 0) break

        remainingBalance -= principal
        months++
      }

      return {
        card,
        payment,
        months,
        totalInterest,
        interestSaved: 0
      }
    })

    return { strategy: selectedStrategy, cards: allocation, totalSavings: 0 }
  }

  const simulateCreditScoreImpact = () => {
    const scenarios = [
      {
        name: 'Current State',
        totalUtilization: creditCards.reduce((sum, card) => {
          if (!card.creditLimit) return sum
          return sum + (card.balance / card.creditLimit) * 100
        }, 0) / creditCards.filter(c => c.creditLimit).length,
        estimatedScoreImpact: 0
      },
      {
        name: 'Pay All to 30% Utilization',
        totalUtilization: 30,
        estimatedScoreImpact: 15
      },
      {
        name: 'Pay All to 10% Utilization',
        totalUtilization: 10,
        estimatedScoreImpact: 35
      },
      {
        name: 'Pay Off All Cards',
        totalUtilization: 0,
        estimatedScoreImpact: 50
      }
    ]

    return scenarios
  }

  const handleOpenAddModal = () => {
    setFormData({
      issuerType: 'predefined',
      issuerName: '',
      customName: '',
      name: '',
      balance: '',
      interestRate: '',
      minimumPayment: '',
      dueDate: '',
      creditLimit: '',
      memo: '',
      autopay: false,
      autopayAmount: 'minimum',
      rewardsType: '',
      rewardsBalance: '',
      annualFee: '',
      annualFeeDate: '',
      color: '#667eea',
      icon: 'credit-card',
      brand: 'other'
    })
    setEditingCard(null)
    setAddModalOpen(true)
  }

  const handleOpenEditModal = (card: CreditCard) => {
    // Check if card name matches a predefined issuer
    const matchingIssuer = COMMON_CARD_ISSUERS.find(issuer => card.name === issuer.name)

    setFormData({
      issuerType: matchingIssuer ? 'predefined' : 'custom',
      issuerName: matchingIssuer?.name || '',
      customName: matchingIssuer ? '' : card.name,
      name: card.name,
      balance: card.balance.toString(),
      interestRate: card.interestRate.toString(),
      minimumPayment: card.minimumPayment.toString(),
      dueDate: card.dueDate,
      creditLimit: card.creditLimit?.toString() || '',
      memo: card.memo || '',
      autopay: card.autopay || false,
      autopayAmount: typeof card.autopayAmount === 'string' ? card.autopayAmount : 'minimum',
      rewardsType: card.rewardsType || '',
      rewardsBalance: card.rewardsBalance?.toString() || '',
      annualFee: card.annualFee?.toString() || '',
      annualFeeDate: card.annualFeeDate || '',
      color: card.color || '#667eea',
      icon: card.icon || 'credit-card',
      brand: card.brand || detectCardBrand(card.name)
    })
    setEditingCard(card)
    setAddModalOpen(true)
  }

  const handleIssuerChange = (issuerName: string) => {
    const brand = getIssuerBrand(issuerName)
    setFormData({ ...formData, issuerName, brand })
  }

  const handleCustomNameChange = (customName: string) => {
    const brand = detectCardBrand(customName)
    setFormData({ ...formData, customName, brand })
  }

  const handleSaveCard = () => {
    const cardName = formData.issuerType === 'predefined' ? formData.issuerName : formData.customName

    if (!cardName || !formData.balance || !formData.interestRate || !formData.minimumPayment || !formData.dueDate) {
      alert('Please fill in all required fields')
      return
    }

    const cardData: CreditCard = {
      id: editingCard?.id || crypto.randomUUID(),
      name: cardName,
      balance: parseFloat(formData.balance),
      interestRate: parseFloat(formData.interestRate),
      minimumPayment: parseFloat(formData.minimumPayment),
      dueDate: formData.dueDate,
      creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : undefined,
      memo: formData.memo || undefined,
      autopay: formData.autopay,
      autopayAmount: formData.autopay ? formData.autopayAmount : undefined,
      rewardsType: formData.rewardsType || undefined,
      rewardsBalance: formData.rewardsBalance ? parseFloat(formData.rewardsBalance) : undefined,
      annualFee: formData.annualFee ? parseFloat(formData.annualFee) : undefined,
      annualFeeDate: formData.annualFeeDate || undefined,
      color: formData.color,
      icon: formData.icon,
      brand: formData.brand,
      balanceHistory: editingCard?.balanceHistory || [{ date: new Date().toISOString(), balance: parseFloat(formData.balance) }],
      paymentHistory: editingCard?.paymentHistory,
      rewardsHistory: editingCard?.rewardsHistory,
      benefits: editingCard?.benefits,
      customPayoffPlan: editingCard?.customPayoffPlan
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
      selectedCards.delete(cardId)
      setSelectedCards(new Set(selectedCards))
    }
  }

  const handleBulkDelete = () => {
    if (selectedCards.size === 0) return
    if (confirm(`Are you sure you want to delete ${selectedCards.size} credit card(s)? This action cannot be undone.`)) {
      onUpdateCreditCards(creditCards.filter(c => !selectedCards.has(c.id)))
      setSelectedCards(new Set())
    }
  }

  const handleTogglePayment = (cardId: string, year: number, month: number, amountPaid?: number) => {
    const card = creditCards.find(c => c.id === cardId)
    if (!card) return

    const paymentHistory = card.paymentHistory || []
    const existingPayment = paymentHistory.find(p => p.year === year && p.month === month)

    let updatedHistory: MonthlyPayment[]
    if (existingPayment) {
      // Toggle existing payment
      updatedHistory = paymentHistory.map(p =>
        p.year === year && p.month === month
          ? { ...p, paid: !p.paid, datePaid: !p.paid ? new Date().toISOString() : undefined, amountPaid: !p.paid ? amountPaid : undefined }
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
          datePaid: new Date().toISOString(),
          amountPaid
        }
      ]
    }

    onUpdateCreditCards(
      creditCards.map(c => c.id === cardId ? { ...c, paymentHistory: updatedHistory } : c)
    )
  }

  const handleOpenPaymentModal = (cardId: string, year: number, month: number) => {
    setPaymentModalData({ cardId, year, month })
    setShowPaymentModal(true)
  }

  const handleUpdateBalance = (cardId: string, newBalance: number) => {
    const card = creditCards.find(c => c.id === cardId)
    if (!card) return

    const balanceHistory = card.balanceHistory || []
    const newSnapshot: BalanceSnapshot = {
      date: new Date().toISOString(),
      balance: newBalance
    }

    onUpdateCreditCards(
      creditCards.map(c =>
        c.id === cardId
          ? { ...c, balance: newBalance, balanceHistory: [...balanceHistory, newSnapshot] }
          : c
      )
    )
  }

  const handleExportData = () => {
    const dataStr = JSON.stringify(creditCards, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)

    const exportFileDefaultName = `credit-cards-${new Date().toISOString().split('T')[0]}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string)
        if (Array.isArray(imported)) {
          onUpdateCreditCards([...creditCards, ...imported])
          alert(`Successfully imported ${imported.length} credit card(s)`)
        }
      } catch (error) {
        alert('Failed to import data. Please check the file format.')
      }
    }
    reader.readAsText(file)
  }

  const getLast12Months = () => {
    const months = []
    const currentYear = selectedYear ?? new Date().getFullYear()

    for (let i = 0; i < 12; i++) {
      const date = new Date(currentYear, i, 1)
      months.push({
        year: currentYear,
        month: i + 1,
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

  const getPaymentAmount = (card: CreditCard, year: number, month: number) => {
    if (!card.paymentHistory) return null
    const payment = card.paymentHistory.find(p => p.year === year && p.month === month)
    return payment?.amountPaid || null
  }

  const isPaymentUpcoming = (card: CreditCard) => {
    const today = new Date()
    const dueDay = parseInt(card.dueDate)
    const daysUntilDue = dueDay - today.getDate()

    return daysUntilDue >= 0 && daysUntilDue <= 7
  }

  const filteredCards = useMemo(() => {
    return creditCards.filter(card =>
      card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.memo?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [creditCards, searchQuery])

  const totalBalance = creditCards.reduce((sum, card) => sum + card.balance, 0)
  const totalMinPayment = creditCards.reduce((sum, card) => sum + card.minimumPayment, 0)
  const avgInterestRate = creditCards.length > 0
    ? creditCards.reduce((sum, card) => sum + card.interestRate, 0) / creditCards.length
    : 0
  const totalCreditLimit = creditCards.reduce((sum, card) => sum + (card.creditLimit || 0), 0)
  const totalUtilization = totalCreditLimit > 0 ? (totalBalance / totalCreditLimit) * 100 : 0

  return (
    <div className="credit-cards-page">
      {/* Add/Edit Modal */}
      {addModalOpen && (
        <div className="credit-card-modal-backdrop" onClick={() => setAddModalOpen(false)}>
          <div className="credit-card-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingCard ? 'Edit Credit Card' : 'Add Credit Card'}</h3>
            <div className="credit-card-modal-form">
              <div className="form-group">
                <label>Card Issuer *</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="radio"
                      value="predefined"
                      checked={formData.issuerType === 'predefined'}
                      onChange={(e) => setFormData({ ...formData, issuerType: 'predefined' })}
                    />
                    <span>Select from list</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="radio"
                      value="custom"
                      checked={formData.issuerType === 'custom'}
                      onChange={(e) => setFormData({ ...formData, issuerType: 'custom' })}
                    />
                    <span>Enter custom name</span>
                  </label>
                </div>
                {formData.issuerType === 'predefined' ? (
                  <select
                    value={formData.issuerName}
                    onChange={(e) => handleIssuerChange(e.target.value)}
                  >
                    <option value="">-- Select Card Issuer --</option>
                    {COMMON_CARD_ISSUERS.map((issuer) => (
                      <option key={issuer.name} value={issuer.name}>
                        {issuer.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.customName}
                    onChange={(e) => handleCustomNameChange(e.target.value)}
                    placeholder="e.g., My Custom Card"
                  />
                )}
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

              {/* Autopay Section */}
              <div className="form-section">
                <h4>Autopay Settings</h4>
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.autopay}
                      onChange={(e) => setFormData({ ...formData, autopay: e.target.checked })}
                    />
                    <span>Enable Autopay</span>
                  </label>
                </div>
                {formData.autopay && (
                  <div className="form-group">
                    <label>Autopay Amount</label>
                    <select
                      value={formData.autopayAmount}
                      onChange={(e) => setFormData({ ...formData, autopayAmount: e.target.value as any })}
                    >
                      <option value="minimum">Minimum Payment</option>
                      <option value="statement">Statement Balance</option>
                      <option value="full">Full Balance</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Rewards Section */}
              <div className="form-section">
                <h4>Rewards</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Rewards Type</label>
                    <select
                      value={formData.rewardsType}
                      onChange={(e) => setFormData({ ...formData, rewardsType: e.target.value as any })}
                    >
                      <option value="">None</option>
                      <option value="points">Points</option>
                      <option value="cashback">Cash Back</option>
                      <option value="miles">Miles</option>
                    </select>
                  </div>
                  {formData.rewardsType && (
                    <div className="form-group">
                      <label>Current Rewards Balance</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.rewardsBalance}
                        onChange={(e) => setFormData({ ...formData, rewardsBalance: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Annual Fee Section */}
              <div className="form-section">
                <h4>Annual Fee</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Annual Fee Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.annualFee}
                      onChange={(e) => setFormData({ ...formData, annualFee: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  {formData.annualFee && (
                    <div className="form-group">
                      <label>Fee Date (MM-DD)</label>
                      <input
                        type="text"
                        value={formData.annualFeeDate}
                        onChange={(e) => setFormData({ ...formData, annualFeeDate: e.target.value })}
                        placeholder="01-15"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Customization Section */}
              <div className="form-section">
                <h4>Customization</h4>
                <div className="form-group">
                  <label>Card Brand</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value as CreditCardBrand })}
                    >
                      <option value="visa">Visa</option>
                      <option value="mastercard">Mastercard</option>
                      <option value="amex">American Express</option>
                      <option value="discover">Discover</option>
                      <option value="other">Other</option>
                    </select>
                    <CreditCardLogo brand={formData.brand} width={48} height={32} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Card Color</label>
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Icon</label>
                    <select
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    >
                      <option value="credit-card">Credit Card</option>
                      <option value="wallet">Wallet</option>
                      <option value="star">Star</option>
                      <option value="plane">Plane</option>
                      <option value="shopping">Shopping</option>
                    </select>
                  </div>
                </div>
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

      {/* Payment Amount Modal */}
      {showPaymentModal && paymentModalData && (
        <div className="credit-card-modal-backdrop" onClick={() => setShowPaymentModal(false)}>
          <div className="credit-card-modal small" onClick={(e) => e.stopPropagation()}>
            <h3>Record Payment</h3>
            <div className="credit-card-modal-form">
              <div className="form-group">
                <label>Payment Amount</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Enter amount paid"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const amount = parseFloat((e.target as HTMLInputElement).value)
                      if (amount > 0) {
                        handleTogglePayment(paymentModalData.cardId, paymentModalData.year, paymentModalData.month, amount)
                        setShowPaymentModal(false)
                      }
                    }
                  }}
                />
              </div>
            </div>
            <div className="credit-card-modal-actions">
              <button className="cancel-btn" onClick={() => setShowPaymentModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="credit-cards-section">
        <div className="credit-cards-header">
          <h2>Credit Cards</h2>
          <div className="header-actions">
            <input
              type="text"
              className="search-input"
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {selectedCards.size > 0 && (
              <button className="bulk-delete-btn" onClick={handleBulkDelete}>
                Delete Selected ({selectedCards.size})
              </button>
            )}
            <button className="view-toggle-btn" onClick={() => setViewMode(viewMode === 'list' ? 'comparison' : 'list')}>
              {viewMode === 'list' ? 'Comparison View' : 'List View'}
            </button>
            <button className="export-btn" onClick={handleExportData}>
              Export
            </button>
            <label className="import-btn">
              Import
              <input type="file" accept=".json" onChange={handleImportData} style={{ display: 'none' }} />
            </label>
            <button className="add-card-btn" onClick={handleOpenAddModal}>
              + Add Credit Card
            </button>
          </div>
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
              <div className="summary-label">Overall Utilization</div>
              <div className={`summary-value ${totalUtilization > 30 ? 'warning' : ''}`}>
                {totalUtilization.toFixed(1)}%
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Total Cards</div>
              <div className="summary-value">{creditCards.length}</div>
            </div>
          </div>
        )}

        {/* Optimizer Section */}
        {creditCards.length > 0 && (
          <div className="optimizer-section">
            <button
              className="optimizer-toggle-btn"
              onClick={() => setShowPayoffOptimizer(!showPayoffOptimizer)}
            >
              {showPayoffOptimizer ? '▼' : '▶'} Debt Payoff Optimizer
            </button>
            {showPayoffOptimizer && (
              <div className="optimizer-content">
                <div className="optimizer-controls">
                  <div className="form-group">
                    <label>Total Monthly Budget for Debt</label>
                    <input
                      type="number"
                      step="0.01"
                      value={extraMonthlyBudget}
                      onChange={(e) => setExtraMonthlyBudget(parseFloat(e.target.value) || 0)}
                      placeholder={`Min: ${formatCurrency(totalMinPayment)}`}
                    />
                  </div>
                  <div className="form-group">
                    <label>Strategy</label>
                    <select value={selectedStrategy} onChange={(e) => setSelectedStrategy(e.target.value as PayoffStrategy)}>
                      <option value="avalanche">Avalanche (Highest Interest First)</option>
                      <option value="snowball">Snowball (Lowest Balance First)</option>
                    </select>
                  </div>
                </div>
                {extraMonthlyBudget > 0 && (
                  <div className="optimizer-results">
                    {calculateOptimalPayoffStrategy()?.cards.map((allocation, index) => (
                      <div key={allocation.card.id} className="allocation-card">
                        <div className="allocation-header">
                          <span className="priority-badge">Priority #{index + 1}</span>
                          <span className="card-name">{allocation.card.name}</span>
                        </div>
                        <div className="allocation-details">
                          <div className="allocation-row">
                            <span>Recommended Payment:</span>
                            <span className="highlight">{formatCurrency(allocation.payment)}/mo</span>
                          </div>
                          <div className="allocation-row">
                            <span>Payoff Time:</span>
                            <span>{Math.floor(allocation.months / 12)}y {allocation.months % 12}m</span>
                          </div>
                          <div className="allocation-row">
                            <span>Total Interest:</span>
                            <span>{formatCurrency(allocation.totalInterest)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Credit Score Simulator */}
        {creditCards.length > 0 && creditCards.some(c => c.creditLimit) && (
          <div className="optimizer-section">
            <button
              className="optimizer-toggle-btn"
              onClick={() => setShowCreditScoreSimulator(!showCreditScoreSimulator)}
            >
              {showCreditScoreSimulator ? '▼' : '▶'} Credit Score Impact Simulator
            </button>
            {showCreditScoreSimulator && (
              <div className="optimizer-content">
                <div className="score-scenarios">
                  {simulateCreditScoreImpact().map((scenario, index) => (
                    <div key={index} className="score-scenario">
                      <div className="scenario-name">{scenario.name}</div>
                      <div className="scenario-utilization">{scenario.totalUtilization.toFixed(1)}% Utilization</div>
                      <div className={`scenario-impact ${scenario.estimatedScoreImpact > 0 ? 'positive' : ''}`}>
                        {scenario.estimatedScoreImpact > 0 ? '+' : ''}{scenario.estimatedScoreImpact} pts
                      </div>
                    </div>
                  ))}
                </div>
                <div className="score-note">
                  * These are rough estimates. Actual credit score changes depend on many factors including payment history, credit age, and credit mix.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Credit Cards List or Comparison View */}
        {filteredCards.length === 0 ? (
          <div className="empty-state">
            <p>No credit cards found</p>
            <p>{searchQuery ? 'Try adjusting your search query.' : 'Click "Add Credit Card" to get started tracking your credit cards and payoff plans.'}</p>
          </div>
        ) : viewMode === 'comparison' ? (
          <div className="comparison-view">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Card Name</th>
                  <th>Balance</th>
                  <th>APR</th>
                  <th>Min Payment</th>
                  <th>Utilization</th>
                  <th>Rewards</th>
                  <th>Annual Fee</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCards.map((card) => {
                  const utilizationRate = card.creditLimit ? (card.balance / card.creditLimit) * 100 : null
                  return (
                    <tr key={card.id}>
                      <td>
                        <div className="card-name-cell" style={{ borderLeft: `4px solid ${card.color}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <CreditCardLogo brand={card.brand || detectCardBrand(card.name)} width={40} height={26} />
                          <span>{card.name}</span>
                        </div>
                      </td>
                      <td>{formatCurrency(card.balance)}</td>
                      <td>{card.interestRate}%</td>
                      <td>{formatCurrency(card.minimumPayment)}</td>
                      <td>
                        {utilizationRate !== null ? (
                          <span className={utilizationRate > 30 ? 'high-utilization' : 'good-utilization'}>
                            {utilizationRate.toFixed(1)}%
                          </span>
                        ) : 'N/A'}
                      </td>
                      <td>
                        {card.rewardsType && card.rewardsBalance
                          ? `${card.rewardsBalance} ${card.rewardsType}`
                          : 'None'}
                      </td>
                      <td>{card.annualFee ? formatCurrency(card.annualFee) : 'None'}</td>
                      <td>
                        <button className="edit-card-btn" onClick={() => handleOpenEditModal(card)}>Edit</button>
                        <button className="delete-card-btn" onClick={() => handleDeleteCard(card.id)}>Delete</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="credit-cards-list">
            {filteredCards.map((card) => {
              const isExpanded = expandedCardId === card.id
              const scenarios = calculatePayoffScenarios(card)
              const utilizationRate = card.creditLimit ? (card.balance / card.creditLimit) * 100 : null
              const isUpcoming = isPaymentUpcoming(card)

              return (
                <div key={card.id} className="credit-card" style={{ borderLeft: `4px solid ${card.color}` }}>
                  <div
                    className="credit-card-header"
                    onClick={() => setExpandedCardId(isExpanded ? null : card.id)}
                  >
                    <div className="card-select">
                      <input
                        type="checkbox"
                        checked={selectedCards.has(card.id)}
                        onChange={(e) => {
                          e.stopPropagation()
                          const newSelected = new Set(selectedCards)
                          if (e.target.checked) {
                            newSelected.add(card.id)
                          } else {
                            newSelected.delete(card.id)
                          }
                          setSelectedCards(newSelected)
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="card-info">
                      <div className="card-name" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CreditCardLogo brand={card.brand || detectCardBrand(card.name)} width={40} height={26} />
                        <span>{card.name}</span>
                        {card.autopay && <span className="autopay-badge">Autopay</span>}
                        {isUpcoming && <span className="due-soon-badge">Due Soon</span>}
                      </div>
                      <div className="card-due-date">Due: Day {card.dueDate} of month</div>
                    </div>
                    <div className="card-balance">
                      <div className="balance-label">Balance</div>
                      <div className="balance-amount">{formatCurrency(card.balance)}</div>
                      {card.balanceHistory && card.balanceHistory.length > 1 && (
                        <div className="balance-change">
                          {card.balanceHistory[card.balanceHistory.length - 1].balance <
                           card.balanceHistory[card.balanceHistory.length - 2].balance
                            ? '↓ Decreasing' : '↑ Increasing'}
                        </div>
                      )}
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
                      {/* Balance History Chart */}
                      {card.balanceHistory && card.balanceHistory.length > 1 && (
                        <div className="detail-section">
                          <div className="detail-label">Balance History</div>
                          <div className="balance-chart">
                            {card.balanceHistory.slice(-6).map((snapshot, index) => (
                              <div key={index} className="balance-bar">
                                <div className="bar-value">{formatCurrency(snapshot.balance)}</div>
                                <div
                                  className="bar-fill"
                                  style={{
                                    height: `${(snapshot.balance / Math.max(...card.balanceHistory!.map(s => s.balance))) * 100}%`
                                  }}
                                />
                                <div className="bar-label">
                                  {new Date(snapshot.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

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
                                High utilization may impact credit score. Try to keep below 30%.
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Rewards Section */}
                      {card.rewardsType && (
                        <div className="detail-section rewards-section">
                          <div className="detail-label">
                            Rewards ({card.rewardsType})
                            <span className="rewards-balance">{card.rewardsBalance || 0}</span>
                          </div>
                          {card.rewardsHistory && card.rewardsHistory.length > 0 && (
                            <div className="rewards-list">
                              {card.rewardsHistory.slice(-5).map((reward) => (
                                <div key={reward.id} className="reward-item">
                                  <span>{reward.description || 'Reward earned'}</span>
                                  <span className={reward.redeemed ? 'redeemed' : 'available'}>
                                    {reward.amount} {card.rewardsType}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Benefits Section */}
                      {card.benefits && card.benefits.length > 0 && (
                        <div className="detail-section benefits-section">
                          <div className="detail-label">Card Benefits</div>
                          <div className="benefits-list">
                            {card.benefits.map((benefit) => (
                              <div key={benefit.id} className="benefit-item">
                                <div className="benefit-name">{benefit.name}</div>
                                {benefit.description && (
                                  <div className="benefit-description">{benefit.description}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Annual Fee */}
                      {card.annualFee && (
                        <div className="detail-section fee-section">
                          <div className="detail-label">Annual Fee</div>
                          <div className="fee-info">
                            <span className="fee-amount">{formatCurrency(card.annualFee)}</span>
                            {card.annualFeeDate && (
                              <span className="fee-date">Charged on {card.annualFeeDate}</span>
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
                            const paymentAmount = getPaymentAmount(card, year, month)
                            return (
                              <div
                                key={`${year}-${month}`}
                                className="payment-month"
                                title={
                                  isPaid && paymentDate
                                    ? `Paid ${paymentAmount ? formatCurrency(paymentAmount) : ''} on ${new Date(paymentDate).toLocaleDateString()}`
                                    : `Mark as paid for ${label} ${year}`
                                }
                              >
                                <div className="month-label">{label}</div>
                                <label className="payment-checkbox">
                                  <input
                                    type="checkbox"
                                    checked={isPaid}
                                    onChange={() => {
                                      if (!isPaid) {
                                        handleOpenPaymentModal(card.id, year, month)
                                      } else {
                                        handleTogglePayment(card.id, year, month)
                                      }
                                    }}
                                  />
                                  <span className="checkmark"></span>
                                </label>
                                {paymentAmount && (
                                  <div className="payment-amount-display">
                                    ${paymentAmount.toFixed(0)}
                                  </div>
                                )}
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
                          {scenarios.map((scenario: any, index) => {
                            const years = scenario.months >= 0 ? Math.floor(scenario.months / 12) : 0
                            const months = scenario.months >= 0 ? scenario.months % 12 : 0
                            const isMinPayment = index === 0
                            const isCustom = scenario.isCustom

                            return (
                              <div key={index} className={`scenario-card ${isMinPayment ? 'min-payment' : ''} ${isCustom ? 'custom' : ''}`}>
                                <div className="scenario-header">
                                  <div className="scenario-title">
                                    {isCustom && 'Custom Plan'}
                                    {!isCustom && index === 0 && 'Minimum Payment'}
                                    {!isCustom && index === 1 && '3-Year Payoff'}
                                    {!isCustom && index === 2 && '2-Year Payoff'}
                                    {!isCustom && index === 3 && '1-Year Payoff'}
                                  </div>
                                  <div className="scenario-payment">{formatCurrency(scenario.payment)}/mo</div>
                                </div>
                                <div className="scenario-details">
                                  {scenario.months === -1 ? (
                                    <div className="scenario-warning">
                                      Payment doesn't cover interest - will never pay off!
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
                                          Save {formatCurrency(scenarios[0].totalInterest - scenario.totalInterest)} in interest
                                        </div>
                                      )}
                                      {/* Progress Bar */}
                                      <div className="payoff-progress">
                                        <div
                                          className="progress-fill"
                                          style={{ width: `${100 - (scenario.months / scenarios[0].months * 100)}%` }}
                                        />
                                      </div>
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
