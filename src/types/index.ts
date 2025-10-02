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
  // Bill-related properties (when isBill is true)
  isBill?: boolean;
  billName?: string; // Display name for the bill
  billAmount?: number; // Expected bill amount (can differ from transaction amount)
  dueDate?: string; // YYYY-MM-DD format (first occurrence date for recurring)
  frequency?: 'monthly' | 'quarterly' | 'yearly' | 'weekly' | 'one-time';
  sourceDescription?: string; // Original transaction description that created this bill
  paidDates?: string[]; // Legacy format - array of YYYY-MM-DD dates
  payments?: BillPayment[]; // New format - detailed payment tracking
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
  id: string;
  name: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD format (first occurrence date)
  category: string;
  frequency?: 'monthly' | 'quarterly' | 'yearly' | 'weekly' | 'one-time';
  notes?: string;
  memo?: string;
  sourceDescription?: string; // Original transaction description that created this bill
  paidDates?: string[]; // Legacy format - array of YYYY-MM-DD dates
  payments?: BillPayment[]; // New format - detailed payment tracking
}

export interface MonthlyBudget {
  [key: string]: number; // key format: "YYYY-M"
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
  | 'reconciliation'
  | 'categories'
  | 'auto-categorization'
  | 'settings';

export interface BillMatchingSettings {
  amountTolerance: number; // Dollar amount tolerance for matching (e.g., 5 = within $5)
  dateWindowDays: number; // Number of days before/after due date to look for matches (e.g., 7 = within 7 days)
  minimumScore: number; // Minimum matching score (0-100) required for auto-match
  requireDescriptionMatch: boolean; // Must have description match
  requireAmountMatch: boolean; // Must have amount match (within tolerance)
  requireDateWindow: boolean; // Must be within date window
}
