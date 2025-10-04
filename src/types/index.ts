// Core data types for the budget application

export interface Category {
  id: string;
  name: string;
  color: string;
  isIncome?: boolean;
}

export interface Transaction {
  id?: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  autoCategorized?: boolean;
  merchantName?: string;
  friendlyName?: string;
  memo?: string;
  needWant?: 'need' | 'want';
  // Matching properties (when transaction matched to a bill)
  matchedToBillId?: string; // ID of the bill this transaction paid
  hiddenAsBillPayment?: boolean; // Hide from main transaction list (shown when bill is expanded)
}

export interface BillPayment {
  occurrenceDate: string; // YYYY-MM-DD format
  transactionDate?: string; // Date of the transaction that paid this bill
  transactionAmount?: number; // Amount of the transaction
  transactionDescription?: string; // Description of the transaction
  manuallyMarked?: boolean; // True if manually marked, false if auto-matched
}

export interface Bill {
  id?: string;
  date: string; // For compatibility with Transaction format
  description: string; // For compatibility with Transaction format
  amount: number; // Negative value
  category: string;
  isBill: boolean; // Always true for bills
  billName: string; // Display name for the bill
  billAmount: number; // Expected bill amount (positive)
  dueDate: string; // YYYY-MM-DD format (first occurrence date)
  frequency: 'monthly' | 'quarterly' | 'yearly' | 'weekly' | 'one-time';
  memo?: string;
  sourceDescription?: string; // Original transaction description that created this bill
  paidDates?: string[]; // Legacy format - array of YYYY-MM-DD dates
  payments?: BillPayment[]; // New format - detailed payment tracking
}

export interface MerchantMapping {
  [description: string]: string; // description -> merchant name
}

export interface CategoryMapping {
  [description: string]: string; // description -> category name
}

export interface CategoryBreakdown {
  [category: string]: number;
}

export interface Summary {
  income: number;
  expenses: number;
  balance: number;
  categoryBreakdown: CategoryBreakdown;
}

export interface SortConfig {
  key: string | null;
  direction: 'asc' | 'desc';
}

export type ActiveSection =
  | 'dashboard'
  | 'spending'
  | 'bills'
  | 'income'
  | 'transactions'
  | 'reconciliation'
  | 'categories'
  | 'auto-categorization'
  | 'credit-cards'
  | 'settings';

export interface BillMatchingSettings {
  amountTolerance: number; // Dollar amount tolerance for matching (e.g., 5 = within $5)
  dateWindowDays: number; // Number of days before/after due date to look for matches (e.g., 7 = within 7 days)
  minimumScore: number; // Minimum matching score (0-100) required for auto-match
  requireDescriptionMatch: boolean; // Must have description match
  requireAmountMatch: boolean; // Must have amount match (within tolerance)
  requireDateWindow: boolean; // Must be within date window
}

export interface RecurringIncome {
  id: string;
  name: string; // e.g., "Paycheck - ABC Corp", "Freelance Income"
  amount: number; // Expected income amount (positive number)
  startDate: string; // YYYY-MM-DD format (first occurrence date)
  frequency: 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'yearly';
  category?: string; // Optional category (defaults to "Income")
  memo?: string; // Optional notes
}

export interface MonthlyPayment {
  year: number;
  month: number; // 1-12
  paid: boolean;
  datePaid?: string; // ISO date string when the payment was marked
  amountPaid?: number; // Actual amount paid for this month
}

export interface BalanceSnapshot {
  date: string; // ISO date string
  balance: number; // Balance at this point in time
}

export interface Reward {
  id: string;
  type: 'points' | 'cashback' | 'miles';
  amount: number;
  earnedDate: string; // ISO date string
  description?: string;
  redeemed?: boolean;
  redeemedDate?: string;
  redeemedValue?: number;
}

export interface CardBenefit {
  id: string;
  name: string; // e.g., "Airport Lounge Access", "Purchase Protection"
  description?: string;
  category?: 'insurance' | 'travel' | 'shopping' | 'dining' | 'entertainment' | 'other';
}

export interface CustomPayoffPlan {
  monthlyPayment: number;
  startDate: string; // ISO date string
  active: boolean;
}

export type CreditCardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'other';

export interface CreditCard {
  id: string;
  name: string; // e.g., "Chase Sapphire", "Capital One Venture"
  balance: number; // Current balance (positive number)
  interestRate: number; // APR as percentage (e.g., 18.99 for 18.99%)
  minimumPayment: number; // Minimum payment amount
  dueDate: string; // Day of month (1-31) when payment is due
  creditLimit?: number; // Optional credit limit
  memo?: string; // Optional notes

  // Payment tracking
  paymentHistory?: MonthlyPayment[]; // Track monthly payment status
  autopay?: boolean; // Is autopay enabled?
  autopayAmount?: 'minimum' | 'statement' | 'full' | number; // What amount is autopaid

  // Balance tracking
  balanceHistory?: BalanceSnapshot[]; // Track balance over time

  // Rewards tracking
  rewardsType?: 'points' | 'cashback' | 'miles'; // Type of rewards earned
  rewardsBalance?: number; // Current rewards balance
  rewardsHistory?: Reward[]; // Detailed rewards history

  // Fees and benefits
  annualFee?: number; // Annual fee amount
  annualFeeDate?: string; // Month-day format (MM-DD) when fee is charged
  lastAnnualFeeDate?: string; // ISO date of last annual fee charge
  benefits?: CardBenefit[]; // List of card benefits/perks

  // Payoff planning
  customPayoffPlan?: CustomPayoffPlan; // User's custom payoff plan

  // Visual customization
  color?: string; // Hex color for card theme
  icon?: string; // Icon identifier for card
  brand?: CreditCardBrand; // Credit card network brand
}
