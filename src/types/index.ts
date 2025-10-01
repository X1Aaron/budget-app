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
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: number; // day of month
  category: string;
  isRecurring: boolean;
  frequency?: 'monthly' | 'quarterly' | 'yearly';
  notes?: string;
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

// Export/Import types
export interface ExportData {
  transactions?: Transaction[];
  categories?: Category[];
  rules?: {
    merchantMappings: MerchantMapping;
    categoryMappings: CategoryMapping;
  };
  bills?: Bill[];
}
