import { useState, useMemo } from 'react';
import {
  getUnmatchedExpenseTransactions,
  getUnpaidBillOccurrences,
  getLowConfidenceMatches,
  manuallyMatchTransactionToBill,
  unmatchTransactionFromBill,
  generateBillOccurrences
} from '../../../utils/billMatching';
import '../../../styles/components/BillReconciliation.css';

export function BillReconciliation({
  transactions,
  selectedYear,
  selectedMonth,
  billMatchingSettings,
  onUpdateTransactions
}) {
  const [selectedTab, setSelectedTab] = useState('unpaid-bills');
  const [expandedBill, setExpandedBill] = useState(null);

  const unmatchedExpenses = useMemo(() =>
    getUnmatchedExpenseTransactions(transactions, selectedYear, selectedMonth),
    [transactions, selectedYear, selectedMonth]
  );

  const unpaidBills = useMemo(() =>
    getUnpaidBillOccurrences(transactions, selectedYear, selectedMonth),
    [transactions, selectedYear, selectedMonth]
  );

  const suggestedMatches = useMemo(() =>
    getLowConfidenceMatches(transactions, selectedYear, selectedMonth, billMatchingSettings),
    [transactions, selectedYear, selectedMonth, billMatchingSettings]
  );

  const allBillOccurrences = useMemo(() =>
    generateBillOccurrences(transactions, selectedYear, selectedMonth),
    [transactions, selectedYear, selectedMonth]
  );

  const handleManualMatch = (transactionId, billId, occurrenceDate) => {
    const updatedTransactions = manuallyMatchTransactionToBill(
      transactions,
      transactionId,
      billId,
      occurrenceDate
    );
    onUpdateTransactions(updatedTransactions);
  };

  const handleUnmatch = (transactionId) => {
    const updatedTransactions = unmatchTransactionFromBill(transactions, transactionId);
    onUpdateTransactions(updatedTransactions);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Math.abs(amount));
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getMatchScoreColor = (score) => {
    if (score >= 70) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  };

  return (
    <div className="bill-reconciliation">
      <h2>Bill Reconciliation</h2>
      <p className="reconciliation-description">
        Review unmatched transactions and unpaid bills. Manually match transactions to bills or mark bills as paid.
      </p>

      <div className="reconciliation-tabs">
        <button
          className={`tab-btn ${selectedTab === 'unpaid-bills' ? 'active' : ''}`}
          onClick={() => setSelectedTab('unpaid-bills')}
        >
          Unpaid Bills ({unpaidBills.length})
        </button>
        <button
          className={`tab-btn ${selectedTab === 'unmatched-expenses' ? 'active' : ''}`}
          onClick={() => setSelectedTab('unmatched-expenses')}
        >
          Unmatched Expenses ({unmatchedExpenses.length})
        </button>
        <button
          className={`tab-btn ${selectedTab === 'suggested-matches' ? 'active' : ''}`}
          onClick={() => setSelectedTab('suggested-matches')}
        >
          Suggested Matches ({suggestedMatches.length})
        </button>
      </div>

      <div className="reconciliation-content">
        {selectedTab === 'unpaid-bills' && (
          <div className="unpaid-bills-section">
            {unpaidBills.length === 0 ? (
              <div className="empty-state">
                <p>✓ All bills for this month have been paid!</p>
              </div>
            ) : (
              <div className="bill-list">
                {unpaidBills.map((bill) => {
                  const isExpanded = expandedBill === `${bill.billId}-${bill.occurrenceDate}`;
                  const potentialMatches = unmatchedExpenses.filter(t => {
                    const amountDiff = Math.abs(Math.abs(t.amount) - bill.billAmount);
                    return amountDiff <= billMatchingSettings.amountTolerance * 2; // More lenient for suggestions
                  });

                  return (
                    <div key={`${bill.billId}-${bill.occurrenceDate}`} className="unpaid-bill-item">
                      <div className="bill-header" onClick={() => setExpandedBill(isExpanded ? null : `${bill.billId}-${bill.occurrenceDate}`)}>
                        <div className="bill-info">
                          <span className="bill-name">{bill.billName}</span>
                          <span className="bill-amount">{formatCurrency(bill.billAmount)}</span>
                          <span className="bill-date">Due: {formatDate(bill.occurrenceDate)}</span>
                        </div>
                        <button className="expand-btn">{isExpanded ? '▼' : '▶'}</button>
                      </div>

                      {isExpanded && (
                        <div className="bill-matches">
                          {potentialMatches.length === 0 ? (
                            <p className="no-matches">No potential matches found</p>
                          ) : (
                            <>
                              <p className="matches-header">Potential matches:</p>
                              {potentialMatches.map((transaction) => {
                                const transId = transaction.id || `${transaction.date}-${transaction.description}`;
                                return (
                                  <div key={transId} className="potential-match">
                                    <div className="match-info">
                                      <span className="match-desc">{transaction.merchantName || transaction.description}</span>
                                      <span className="match-amount">{formatCurrency(transaction.amount)}</span>
                                      <span className="match-date">{formatDate(transaction.date)}</span>
                                    </div>
                                    <button
                                      className="match-btn"
                                      onClick={() => handleManualMatch(transId, bill.billId, bill.occurrenceDate)}
                                    >
                                      Match
                                    </button>
                                  </div>
                                );
                              })}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {selectedTab === 'unmatched-expenses' && (
          <div className="unmatched-expenses-section">
            {unmatchedExpenses.length === 0 ? (
              <div className="empty-state">
                <p>✓ All expenses have been categorized or matched to bills!</p>
              </div>
            ) : (
              <div className="expense-list">
                {unmatchedExpenses.map((transaction) => {
                  const transId = transaction.id || `${transaction.date}-${transaction.description}`;
                  const isExpanded = expandedBill === transId;
                  const potentialBills = allBillOccurrences.filter(bill => {
                    const amountDiff = Math.abs(Math.abs(transaction.amount) - bill.billAmount);
                    return amountDiff <= billMatchingSettings.amountTolerance * 2 && !bill.payment;
                  });

                  return (
                    <div key={transId} className="unmatched-expense-item">
                      <div className="expense-header" onClick={() => setExpandedBill(isExpanded ? null : transId)}>
                        <div className="expense-info">
                          <span className="expense-desc">{transaction.merchantName || transaction.description}</span>
                          <span className="expense-amount">{formatCurrency(transaction.amount)}</span>
                          <span className="expense-date">{formatDate(transaction.date)}</span>
                          <span className="expense-category">{transaction.category}</span>
                        </div>
                        <button className="expand-btn">{isExpanded ? '▼' : '▶'}</button>
                      </div>

                      {isExpanded && (
                        <div className="expense-matches">
                          {potentialBills.length === 0 ? (
                            <p className="no-matches">No matching unpaid bills found</p>
                          ) : (
                            <>
                              <p className="matches-header">Potential bills to match:</p>
                              {potentialBills.map((bill) => {
                                const billKey = `${bill.billId}-${bill.occurrenceDate}`;
                                return (
                                  <div key={billKey} className="potential-match">
                                    <div className="match-info">
                                      <span className="match-desc">{bill.billName}</span>
                                      <span className="match-amount">{formatCurrency(bill.billAmount)}</span>
                                      <span className="match-date">Due: {formatDate(bill.occurrenceDate)}</span>
                                    </div>
                                    <button
                                      className="match-btn"
                                      onClick={() => handleManualMatch(transId, bill.billId, bill.occurrenceDate)}
                                    >
                                      Match
                                    </button>
                                  </div>
                                );
                              })}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {selectedTab === 'suggested-matches' && (
          <div className="suggested-matches-section">
            {suggestedMatches.length === 0 ? (
              <div className="empty-state">
                <p>No suggested matches. All high-confidence matches have been applied automatically.</p>
              </div>
            ) : (
              <div className="suggestion-list">
                <p className="suggestion-info">
                  These transactions scored below the automatic matching threshold ({billMatchingSettings.minimumScore}) but may still be valid matches.
                </p>
                {suggestedMatches.map((match) => {
                  const transId = match.transaction.id || `${match.transaction.date}-${match.transaction.description}`;
                  return (
                    <div key={transId} className="suggested-match-item">
                      <div className="match-score-badge" data-score={getMatchScoreColor(match.matchScore)}>
                        {match.matchScore}%
                      </div>
                      <div className="match-details">
                        <div className="transaction-side">
                          <label>Transaction</label>
                          <span className="match-desc">{match.transaction.merchantName || match.transaction.description}</span>
                          <span className="match-amount">{formatCurrency(match.transaction.amount)}</span>
                          <span className="match-date">{formatDate(match.transaction.date)}</span>
                        </div>
                        <div className="match-arrow">→</div>
                        <div className="bill-side">
                          <label>Bill</label>
                          <span className="match-desc">{match.matchedBill.billName}</span>
                          <span className="match-amount">{formatCurrency(match.matchedBill.billAmount)}</span>
                          <span className="match-date">Due: {formatDate(match.matchedBill.occurrenceDate)}</span>
                        </div>
                      </div>
                      <div className="match-breakdown">
                        <span className={match.matchDetails.descriptionMatch ? 'match-yes' : 'match-no'}>
                          {match.matchDetails.descriptionMatch ? '✓' : '✗'} Description
                        </span>
                        <span className={match.matchDetails.amountMatch ? 'match-yes' : 'match-no'}>
                          {match.matchDetails.amountMatch ? '✓' : '✗'} Amount
                        </span>
                        <span className={match.matchDetails.withinWindow ? 'match-yes' : 'match-no'}>
                          {match.matchDetails.withinWindow ? '✓' : '✗'} Date ({match.matchDetails.dateProximity} days)
                        </span>
                      </div>
                      <button
                        className="match-btn primary"
                        onClick={() => handleManualMatch(
                          transId,
                          match.matchedBill.billId,
                          match.matchedBill.occurrenceDate
                        )}
                      >
                        Accept Match
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
