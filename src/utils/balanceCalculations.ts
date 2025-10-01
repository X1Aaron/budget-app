import type { Transaction } from '../types';

/**
 * Calculates the starting balance for a specific month based on the account's
 * initial starting balance and all transactions up to that month.
 *
 * @param accountStartingBalance - The initial account balance when tracking started
 * @param transactions - All transactions
 * @param targetYear - The year to calculate the starting balance for
 * @param targetMonth - The month (0-11) to calculate the starting balance for
 * @returns The starting balance for the target month
 */
export function calculateMonthStartingBalance(
  accountStartingBalance: number,
  transactions: Transaction[],
  targetYear: number,
  targetMonth: number
): number {
  // Get the earliest transaction date
  if (transactions.length === 0) {
    return accountStartingBalance;
  }

  const sortedTransactions = [...transactions].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const firstTransactionDate = new Date(sortedTransactions[0].date);
  const targetDate = new Date(targetYear, targetMonth, 1);

  // If the target month is before or same as the first transaction, return the account starting balance
  if (targetDate <= new Date(firstTransactionDate.getFullYear(), firstTransactionDate.getMonth(), 1)) {
    return accountStartingBalance;
  }

  // Sum all transactions before the target month
  let balance = accountStartingBalance;

  for (const transaction of sortedTransactions) {
    const txDate = new Date(transaction.date);
    const txYear = txDate.getFullYear();
    const txMonth = txDate.getMonth();

    // If this transaction is before the target month, add it to the balance
    if (txYear < targetYear || (txYear === targetYear && txMonth < targetMonth)) {
      balance += transaction.amount;
    } else {
      // We've reached transactions in or after the target month, so stop
      break;
    }
  }

  return balance;
}
