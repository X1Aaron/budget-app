import type { Transaction, BillPayment, BillMatchingSettings } from '../types';

export interface BillOccurrence {
  billId: string;
  billName: string;
  billAmount: number;
  occurrenceDate: string; // YYYY-MM-DD
  dueDay: number;
  category: string;
  sourceDescription?: string;
  payment?: BillPayment;
  billTransaction: Transaction; // Reference to the original bill transaction
}

export interface TransactionBillMatch {
  transaction: Transaction;
  transactionIndex: number;
  matchedBill: BillOccurrence | null;
  matchScore: number; // 0-100, higher is better match
  matchDetails: {
    descriptionMatch: boolean;
    amountMatch: boolean;
    dateProximity: number; // days difference
    withinWindow: boolean;
  };
}

/**
 * Generate all bill occurrences for a given year and month
 * Now works with transactions that have isBill = true
 */
export function generateBillOccurrences(
  transactions: Transaction[],
  year: number,
  month: number
): BillOccurrence[] {
  const occurrences: BillOccurrence[] = [];

  // Filter to only bill transactions
  const billTransactions = transactions.filter(t => t.isBill);

  billTransactions.forEach(bill => {
    if (!bill.dueDate) return; // Skip if no due date

    const [billYear, billMonth, billDay] = bill.dueDate.split('-').map(Number);
    const startDate = new Date(billYear, billMonth - 1, billDay);
    const frequency = bill.frequency || 'one-time';

    if (frequency === 'one-time') {
      if (billYear === year && billMonth - 1 === month) {
        const payment = getPaymentForOccurrence(bill, bill.dueDate);
        occurrences.push({
          billId: bill.id || `${bill.date}-${bill.description}`,
          billName: bill.billName || bill.description,
          billAmount: bill.billAmount || Math.abs(bill.amount),
          occurrenceDate: bill.dueDate,
          dueDay: billDay,
          category: bill.category,
          sourceDescription: bill.sourceDescription,
          payment,
          billTransaction: bill
        });
      }
    } else if (frequency === 'monthly') {
      // For monthly bills, always create an occurrence for the requested month if it's the right day
      // This allows historical matching - bills can match to transactions from before the bill was created
      const occurrenceDate = new Date(year, month, billDay);
      const occurrenceDateStr = formatDate(occurrenceDate);
      const payment = getPaymentForOccurrence(bill, occurrenceDateStr);
      occurrences.push({
        billId: bill.id || `${bill.date}-${bill.description}`,
        billName: bill.billName || bill.description,
        billAmount: bill.billAmount || Math.abs(bill.amount),
        occurrenceDate: occurrenceDateStr,
        dueDay: billDay,
        category: bill.category,
        sourceDescription: bill.sourceDescription,
        payment,
        billTransaction: bill
      });
    } else if (frequency === 'quarterly') {
      // Calculate months since start, allowing negative values for historical matching
      const monthsSinceStart = (year - billYear) * 12 + (month - (billMonth - 1));
      if (monthsSinceStart % 3 === 0) {
        const occurrenceDate = new Date(year, month, billDay);
        const occurrenceDateStr = formatDate(occurrenceDate);
        const payment = getPaymentForOccurrence(bill, occurrenceDateStr);
        occurrences.push({
          billId: bill.id || `${bill.date}-${bill.description}`,
          billName: bill.billName || bill.description,
          billAmount: bill.billAmount || Math.abs(bill.amount),
          occurrenceDate: occurrenceDateStr,
          dueDay: billDay,
          category: bill.category,
          sourceDescription: bill.sourceDescription,
          payment,
          billTransaction: bill
        });
      }
    } else if (frequency === 'yearly') {
      // For yearly bills, create occurrence if month matches (allow historical matching)
      if (billMonth - 1 === month) {
        const occurrenceDate = new Date(year, month, billDay);
        const occurrenceDateStr = formatDate(occurrenceDate);
        const payment = getPaymentForOccurrence(bill, occurrenceDateStr);
        occurrences.push({
          billId: bill.id || `${bill.date}-${bill.description}`,
          billName: bill.billName || bill.description,
          billAmount: bill.billAmount || Math.abs(bill.amount),
          occurrenceDate: occurrenceDateStr,
          dueDay: billDay,
          category: bill.category,
          sourceDescription: bill.sourceDescription,
          payment,
          billTransaction: bill
        });
      }
    } else if (frequency === 'weekly') {
      const weekMs = 7 * 24 * 60 * 60 * 1000;
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);

      // For historical matching, start from the beginning of the requested month
      // and work forward in weekly intervals from the bill's day of week
      let currentDate = new Date(startDate);

      // If we're looking at a month before the bill start date,
      // calculate what the occurrence would have been
      if (monthStart < startDate) {
        // Go backward from startDate to find an occurrence in the target month
        let backDate = new Date(startDate);
        while (backDate > monthEnd) {
          backDate = new Date(backDate.getTime() - weekMs);
        }
        while (backDate >= monthStart && backDate <= monthEnd) {
          currentDate = backDate;
          backDate = new Date(backDate.getTime() - weekMs);
        }
      }

      // Add all weekly occurrences in this month
      while (currentDate <= monthEnd) {
        if (currentDate >= monthStart) {
          const occurrenceDateStr = formatDate(currentDate);
          const payment = getPaymentForOccurrence(bill, occurrenceDateStr);
          occurrences.push({
            billId: bill.id || `${bill.date}-${bill.description}`,
            billName: bill.billName || bill.description,
            billAmount: bill.billAmount || Math.abs(bill.amount),
            occurrenceDate: occurrenceDateStr,
            dueDay: currentDate.getDate(),
            category: bill.category,
            sourceDescription: bill.sourceDescription,
            payment,
            billTransaction: bill
          });
        }
        currentDate = new Date(currentDate.getTime() + weekMs);
      }
    }
  });

  return occurrences;
}

/**
 * Get payment info for a specific bill occurrence
 */
function getPaymentForOccurrence(bill: Transaction, occurrenceDate: string): BillPayment | undefined {
  // Check new payment format
  if (bill.payments) {
    return bill.payments.find(p => p.occurrenceDate === occurrenceDate);
  }

  // Check legacy paidDates format
  if (bill.paidDates && bill.paidDates.includes(occurrenceDate)) {
    return {
      occurrenceDate,
      manuallyMarked: true
    };
  }

  return undefined;
}

/**
 * Match a transaction to bill occurrences
 */
export function matchTransactionToBill(
  transaction: Transaction,
  transactionIndex: number,
  billOccurrences: BillOccurrence[],
  settings: BillMatchingSettings
): TransactionBillMatch {
  // Only match expense transactions
  if (transaction.amount >= 0) {
    return {
      transaction,
      transactionIndex,
      matchedBill: null,
      matchScore: 0,
      matchDetails: {
        descriptionMatch: false,
        amountMatch: false,
        dateProximity: 999,
        withinWindow: false
      }
    };
  }

  let bestMatch: BillOccurrence | null = null;
  let bestScore = 0;
  let bestMatchDetails = {
    descriptionMatch: false,
    amountMatch: false,
    dateProximity: 999,
    withinWindow: false
  };

  const transactionAmount = Math.abs(transaction.amount);
  const transactionDate = new Date(transaction.date);

  for (const billOcc of billOccurrences) {
    let score = 0;
    const matchDetails = {
      descriptionMatch: false,
      amountMatch: false,
      dateProximity: 999,
      withinWindow: false
    };

    // Check description match
    const descriptionMatch = checkDescriptionMatch(
      transaction,
      billOcc.billName,
      billOcc.sourceDescription
    );
    if (descriptionMatch) {
      score += 40;
      matchDetails.descriptionMatch = true;
    }

    // Check amount match (within tolerance from settings)
    const amountDiff = Math.abs(transactionAmount - billOcc.billAmount);
    if (amountDiff <= settings.amountTolerance) {
      score += 30;
      matchDetails.amountMatch = true;
      // Bonus for exact match
      if (amountDiff < 0.01) {
        score += 10;
      }
    }

    // Check date proximity (within date window from settings)
    const billDueDate = new Date(billOcc.occurrenceDate);
    const daysDiff = Math.abs(
      (transactionDate.getTime() - billDueDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    matchDetails.dateProximity = daysDiff;

    if (daysDiff <= settings.dateWindowDays) {
      matchDetails.withinWindow = true;
      score += Math.max(0, 30 - daysDiff * 3); // Closer = higher score
    }

    // Check required criteria from settings
    const meetsRequirements =
      (!settings.requireDescriptionMatch || matchDetails.descriptionMatch) &&
      (!settings.requireAmountMatch || matchDetails.amountMatch) &&
      (!settings.requireDateWindow || matchDetails.withinWindow);

    if (meetsRequirements && score > bestScore) {
      bestScore = score;
      bestMatch = billOcc;
      bestMatchDetails = matchDetails;
    }
  }

  return {
    transaction,
    transactionIndex,
    matchedBill: bestMatch,
    matchScore: bestScore,
    matchDetails: bestMatchDetails
  };
}

/**
 * Check if transaction description matches bill
 */
function checkDescriptionMatch(
  transaction: Transaction,
  billName: string,
  billSourceDescription?: string
): boolean {
  const transDesc = (transaction.merchantName || transaction.description).toLowerCase();
  const billNameLower = billName.toLowerCase();
  const sourceDescLower = billSourceDescription?.toLowerCase() || '';

  // Direct match with merchant name or description
  if (transDesc === billNameLower) return true;
  if (transDesc === sourceDescLower) return true;

  // Check if bill name is contained in transaction
  if (transDesc.includes(billNameLower)) return true;
  if (billNameLower.includes(transDesc)) return true;

  // Check source description match
  if (sourceDescLower && transaction.description.toLowerCase() === sourceDescLower) {
    return true;
  }

  // Extract key words and check for partial matches (for cases like "Electric Bill" vs "Electric Company")
  const billWords = billNameLower.split(/\s+/).filter(w => w.length > 3); // Words longer than 3 chars
  const transWords = transDesc.split(/\s+/).filter(w => w.length > 3);

  // If at least one significant word matches, consider it a potential match
  const hasCommonWord = billWords.some(billWord =>
    transWords.some(transWord =>
      transWord.includes(billWord) || billWord.includes(transWord)
    )
  );

  if (hasCommonWord) return true;

  return false;
}

/**
 * Update bill transactions with automatic payment matching
 * Now works with transactions that have isBill = true
 * Marks matched transactions as hidden (they'll show when you expand the bill)
 * Searches across ALL transactions in history, not just the current month
 */
export function updateBillsWithTransactionMatches(
  transactions: Transaction[],
  year: number,
  month: number,
  settings: BillMatchingSettings
): Transaction[] {
  // Generate bill occurrences for ALL months that have transactions
  // This allows matching historical transactions to their corresponding bill occurrences
  const regularTransactions = transactions.filter(t => !t.isBill);

  // Find all unique year-month combinations in transactions
  const monthsWithTransactions = new Set<string>();
  regularTransactions.forEach(t => {
    const [tYear, tMonth] = t.date.split('-').map(Number);
    monthsWithTransactions.add(`${tYear}-${tMonth - 1}`); // month - 1 because JS months are 0-indexed
  });

  // Generate bill occurrences for all those months
  const allBillOccurrences: BillOccurrence[] = [];
  monthsWithTransactions.forEach(yearMonth => {
    const [y, m] = yearMonth.split('-').map(Number);
    const occurrences = generateBillOccurrences(transactions, y, m);
    allBillOccurrences.push(...occurrences);
  });

  // Find all transaction matches (regular transactions matching to bills)
  const matches: TransactionBillMatch[] = regularTransactions
    .map((t, i) => matchTransactionToBill(t, i, allBillOccurrences, settings))
    .filter(m => m.matchedBill !== null && m.matchScore >= settings.minimumScore);

  // Prevent duplicate matches: ensure one transaction per bill occurrence
  // Key: billId-occurrenceDate, Value: best matching transaction
  const billOccurrenceToTransactionMap = new Map<string, TransactionBillMatch>();

  matches.forEach(match => {
    const occKey = `${match.matchedBill!.billId}-${match.matchedBill!.occurrenceDate}`;
    const existing = billOccurrenceToTransactionMap.get(occKey);

    // Keep the higher-scoring match (or first match if scores are equal)
    if (!existing || match.matchScore > existing.matchScore) {
      billOccurrenceToTransactionMap.set(occKey, match);
    }
  });

  // Convert back to array of best matches only
  const bestMatches = Array.from(billOccurrenceToTransactionMap.values());

  // Create a map of transaction ID -> matched bill ID (using only best matches)
  const transactionToBillMap = new Map<string, string>();
  bestMatches.forEach(match => {
    const transId = match.transaction.id || `${match.transaction.date}-${match.transaction.description}`;
    transactionToBillMap.set(transId, match.matchedBill!.billId);
  });

  // Update transactions: mark matched ones as hidden and update bills with payment info
  const updatedTransactions = transactions.map(transaction => {
    // For regular transactions: mark as hidden if matched to a bill
    if (!transaction.isBill) {
      const transId = transaction.id || `${transaction.date}-${transaction.description}`;
      const matchedBillId = transactionToBillMap.get(transId);

      if (matchedBillId) {
        return {
          ...transaction,
          matchedToBillId: matchedBillId, // Link to the bill it matched
          hiddenAsBillPayment: true // Hide from main transaction list
        };
      }
      return transaction;
    }

    // For bill transactions: add payment info
    const billId = transaction.id || `${transaction.date}-${transaction.description}`;
    const billMatches = bestMatches.filter(m => m.matchedBill?.billId === billId);

    if (billMatches.length === 0) return transaction;

    // Initialize payments array if needed
    const payments = transaction.payments || [];

    // Add new payments
    billMatches.forEach(match => {
      const occurrenceDate = match.matchedBill!.occurrenceDate;

      // Check if payment already exists for this occurrence
      const existingPaymentIndex = payments.findIndex(p => p.occurrenceDate === occurrenceDate);

      const newPayment: BillPayment = {
        occurrenceDate,
        transactionDate: match.transaction.date,
        transactionAmount: match.transaction.amount,
        transactionDescription: match.transaction.description,
        manuallyMarked: false
      };

      if (existingPaymentIndex >= 0) {
        // Update existing payment only if it was auto-matched (don't override manual)
        if (!payments[existingPaymentIndex].manuallyMarked) {
          payments[existingPaymentIndex] = newPayment;
        }
      } else {
        payments.push(newPayment);
      }
    });

    return {
      ...transaction,
      payments
    };
  });

  return updatedTransactions;
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get all unmatched expense transactions
 * Returns transactions that are expenses (negative amount) and not matched to bills
 */
export function getUnmatchedExpenseTransactions(
  transactions: Transaction[],
  year: number,
  month: number
): Transaction[] {
  return transactions.filter(t => {
    // Skip if it's a bill transaction itself
    if (t.isBill) return false;

    // Skip if it's not an expense
    if (t.amount >= 0) return false;

    // Skip if already matched to a bill
    if (t.matchedToBillId) return false;

    // Check if transaction is in the selected month
    const transDate = new Date(t.date);
    if (transDate.getFullYear() !== year || transDate.getMonth() !== month) {
      return false;
    }

    return true;
  });
}

/**
 * Get all unpaid bill occurrences
 * Returns bill occurrences that don't have a payment recorded
 */
export function getUnpaidBillOccurrences(
  transactions: Transaction[],
  year: number,
  month: number
): BillOccurrence[] {
  const billOccurrences = generateBillOccurrences(transactions, year, month);

  return billOccurrences.filter(occ => !occ.payment);
}

/**
 * Get low-confidence matches (potential matches that didn't meet threshold)
 * Useful for suggesting manual matches
 */
export function getLowConfidenceMatches(
  transactions: Transaction[],
  year: number,
  month: number,
  settings: BillMatchingSettings
): TransactionBillMatch[] {
  const billOccurrences = generateBillOccurrences(transactions, year, month);
  const regularTransactions = transactions.filter(t => !t.isBill && !t.matchedToBillId);

  // Find matches that score between 30-minimumScore
  const lowConfidenceThreshold = 30;

  return regularTransactions
    .map((t, i) => matchTransactionToBill(t, i, billOccurrences, settings))
    .filter(m =>
      m.matchedBill !== null &&
      m.matchScore >= lowConfidenceThreshold &&
      m.matchScore < settings.minimumScore
    )
    .sort((a, b) => b.matchScore - a.matchScore); // Highest scores first
}

/**
 * Manually match a transaction to a bill occurrence
 * Validates that the transaction amount matches the bill amount within tolerance
 * Auto-marks bill as paid if amounts match
 */
export function manuallyMatchTransactionToBill(
  transactions: Transaction[],
  transactionId: string,
  billId: string,
  occurrenceDate: string,
  amountTolerance: number = 5
): Transaction[] {
  // Find the transaction and bill to validate amount match
  const transaction = transactions.find(tr => {
    const trId = tr.id || `${tr.date}-${tr.description}`;
    return trId === transactionId;
  });

  const billTransaction = transactions.find(t => {
    const bId = t.id || `${t.date}-${t.description}`;
    return t.isBill && bId === billId;
  });

  if (!transaction || !billTransaction) {
    throw new Error('Transaction or bill not found');
  }

  // Validate amount match
  const transactionAmount = Math.abs(transaction.amount);
  const billAmount = billTransaction.billAmount || Math.abs(billTransaction.amount);
  const amountDiff = Math.abs(transactionAmount - billAmount);

  if (amountDiff > amountTolerance) {
    throw new Error(
      `Amount mismatch: Transaction amount ($${transactionAmount.toFixed(2)}) differs from bill amount ($${billAmount.toFixed(2)}) by $${amountDiff.toFixed(2)}, which exceeds tolerance of $${amountTolerance.toFixed(2)}`
    );
  }

  return transactions.map(t => {
    const tId = t.id || `${t.date}-${t.description}`;

    // Update the transaction being matched
    if (tId === transactionId) {
      return {
        ...t,
        matchedToBillId: billId,
        hiddenAsBillPayment: true
      };
    }

    // Update the bill transaction with payment info
    const bId = t.id || `${t.date}-${t.description}`;
    if (t.isBill && bId === billId) {
      const payments = t.payments || [];

      // Check if payment already exists for this occurrence
      const existingPaymentIndex = payments.findIndex(p => p.occurrenceDate === occurrenceDate);

      const newPayment: BillPayment = {
        occurrenceDate,
        transactionDate: transaction.date,
        transactionAmount: transaction.amount,
        transactionDescription: transaction.description,
        manuallyMarked: true
      };

      const updatedPayments = [...payments];
      if (existingPaymentIndex >= 0) {
        updatedPayments[existingPaymentIndex] = newPayment;
      } else {
        updatedPayments.push(newPayment);
      }

      return {
        ...t,
        payments: updatedPayments
      };
    }

    return t;
  });
}

/**
 * Unmatch a transaction from a bill
 */
export function unmatchTransactionFromBill(
  transactions: Transaction[],
  transactionId: string
): Transaction[] {
  // Find the transaction to get its matched bill info
  const transaction = transactions.find(t => {
    const tId = t.id || `${t.date}-${t.description}`;
    return tId === transactionId;
  });

  if (!transaction || !transaction.matchedToBillId) {
    return transactions; // Nothing to unmatch
  }

  const billId = transaction.matchedToBillId;

  return transactions.map(t => {
    const tId = t.id || `${t.date}-${t.description}`;

    // Remove match from the transaction
    if (tId === transactionId) {
      const { matchedToBillId, hiddenAsBillPayment, ...rest } = t;
      return rest;
    }

    // Remove payment from the bill
    const bId = t.id || `${t.date}-${t.description}`;
    if (t.isBill && bId === billId && t.payments) {
      // Find and remove the payment that references this transaction
      const updatedPayments = t.payments.filter(p => p.transactionDate !== transaction.date);

      return {
        ...t,
        payments: updatedPayments.length > 0 ? updatedPayments : undefined
      };
    }

    return t;
  });
}
