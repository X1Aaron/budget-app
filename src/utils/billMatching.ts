import type { Transaction, Bill, BillPayment, BillMatchingSettings } from '../types';

export interface BillOccurrence {
  billId: string;
  billName: string;
  billAmount: number;
  occurrenceDate: string; // YYYY-MM-DD
  dueDay: number;
  category: string;
  sourceDescription?: string;
  payment?: BillPayment;
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
 */
export function generateBillOccurrences(
  bills: Bill[],
  year: number,
  month: number
): BillOccurrence[] {
  const occurrences: BillOccurrence[] = [];

  bills.forEach(bill => {
    const [billYear, billMonth, billDay] = bill.dueDate.split('-').map(Number);
    const startDate = new Date(billYear, billMonth - 1, billDay);

    if (bill.frequency === 'one-time') {
      if (billYear === year && billMonth - 1 === month) {
        const payment = getPaymentForOccurrence(bill, bill.dueDate);
        occurrences.push({
          billId: bill.id,
          billName: bill.name,
          billAmount: bill.amount,
          occurrenceDate: bill.dueDate,
          dueDay: billDay,
          category: bill.category,
          sourceDescription: bill.sourceDescription,
          payment
        });
      }
    } else if (bill.frequency === 'monthly') {
      // Check if this month should have an occurrence
      const occurrenceDate = new Date(year, month, billDay);
      if (occurrenceDate >= startDate) {
        const occurrenceDateStr = formatDate(occurrenceDate);
        const payment = getPaymentForOccurrence(bill, occurrenceDateStr);
        occurrences.push({
          billId: bill.id,
          billName: bill.name,
          billAmount: bill.amount,
          occurrenceDate: occurrenceDateStr,
          dueDay: billDay,
          category: bill.category,
          sourceDescription: bill.sourceDescription,
          payment
        });
      }
    } else if (bill.frequency === 'quarterly') {
      const monthsSinceStart = (year - billYear) * 12 + (month - (billMonth - 1));
      if (monthsSinceStart >= 0 && monthsSinceStart % 3 === 0) {
        const occurrenceDate = new Date(year, month, billDay);
        const occurrenceDateStr = formatDate(occurrenceDate);
        const payment = getPaymentForOccurrence(bill, occurrenceDateStr);
        occurrences.push({
          billId: bill.id,
          billName: bill.name,
          billAmount: bill.amount,
          occurrenceDate: occurrenceDateStr,
          dueDay: billDay,
          category: bill.category,
          sourceDescription: bill.sourceDescription,
          payment
        });
      }
    } else if (bill.frequency === 'yearly') {
      if (billMonth - 1 === month && year >= billYear) {
        const occurrenceDate = new Date(year, month, billDay);
        const occurrenceDateStr = formatDate(occurrenceDate);
        const payment = getPaymentForOccurrence(bill, occurrenceDateStr);
        occurrences.push({
          billId: bill.id,
          billName: bill.name,
          billAmount: bill.amount,
          occurrenceDate: occurrenceDateStr,
          dueDay: billDay,
          category: bill.category,
          sourceDescription: bill.sourceDescription,
          payment
        });
      }
    } else if (bill.frequency === 'weekly') {
      const weekMs = 7 * 24 * 60 * 60 * 1000;
      let currentDate = new Date(startDate);
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);

      while (currentDate <= monthEnd) {
        if (currentDate >= monthStart && currentDate >= startDate) {
          const occurrenceDateStr = formatDate(currentDate);
          const payment = getPaymentForOccurrence(bill, occurrenceDateStr);
          occurrences.push({
            billId: bill.id,
            billName: bill.name,
            billAmount: bill.amount,
            occurrenceDate: occurrenceDateStr,
            dueDay: currentDate.getDate(),
            category: bill.category,
            sourceDescription: bill.sourceDescription,
            payment
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
function getPaymentForOccurrence(bill: Bill, occurrenceDate: string): BillPayment | undefined {
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
 * Update bills with automatic payment matching
 */
export function updateBillsWithTransactionMatches(
  bills: Bill[],
  transactions: Transaction[],
  year: number,
  month: number,
  settings: BillMatchingSettings
): Bill[] {
  const billOccurrences = generateBillOccurrences(bills, year, month);

  // Find all transaction matches
  const matches: TransactionBillMatch[] = transactions
    .map((t, i) => matchTransactionToBill(t, i, billOccurrences, settings))
    .filter(m => m.matchedBill !== null && m.matchScore >= settings.minimumScore); // Use minimum score from settings

  // Update bills with payment info
  const updatedBills = bills.map(bill => {
    const billMatches = matches.filter(m => m.matchedBill?.billId === bill.id);

    if (billMatches.length === 0) return bill;

    // Initialize payments array if needed
    const payments = bill.payments || [];

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
      ...bill,
      payments
    };
  });

  return updatedBills;
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
