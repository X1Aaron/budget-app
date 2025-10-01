// Core data types for the budget application

export interface Category {
  id: string;
  name: string;
  color: string;
  isIncome?: boolean;
}

export interface Transaction {
  date: string;
  description: string;
  amount: number;
  category: string;
  autoCategorized?: boolean;
  merchantName?: string;
  friendlyName?: string;
  memo?: string;
  needWant?: 'need' | 'want';
  isBill?: boolean;
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
  | 'overview'
  | 'spending'
  | 'bills'
  | 'categories'
  | 'auto-categorization'
  | 'settings';
