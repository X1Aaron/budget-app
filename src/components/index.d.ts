// Type declarations for components
import { FC } from 'react';
import type {
  Transaction,
  Category,
  Bill,
  MonthlyBudget,
  StartingBalance,
  MerchantMapping,
  CategoryMapping,
  ActiveSection
} from '../types';

export const Overview: FC<{
  transactions: Transaction[];
  categories: Category[];
  bills: Bill[];
  selectedYear: number;
  selectedMonth: number;
  monthlyBudgets: MonthlyBudget;
  startingBalances: StartingBalance;
  onDateChange: (year: number, month: number) => void;
  onUpdateBudget: (year: number, month: number, budget: number) => void;
}>;

export const Spending: FC<{
  transactions: Transaction[];
  categories: Category[];
  selectedYear: number;
  selectedMonth: number;
  onDateChange: (year: number, month: number) => void;
  onUpdateTransaction: (index: number, updatedTransaction: Transaction, updateAllMatching?: boolean) => void;
  startingBalances: StartingBalance;
  onUpdateStartingBalance: (year: number, month: number, balance: number) => void;
}>;

export const Bills: FC<{
  bills: Bill[];
  onUpdateBills: (bills: Bill[]) => void;
  selectedYear: number;
  selectedMonth: number;
  onDateChange: (year: number, month: number) => void;
  categories: Category[];
}>;

export const CSVImport: FC<{
  onImport: (transactions: Transaction[], existingTransactions?: Transaction[]) => void;
}>;

export const CategorySettings: FC<{
  categories: Category[];
  onUpdateCategories: (categories: Category[]) => void;
  transactions: Transaction[];
  onUpdateTransactions: (transactions: Transaction[]) => void;
  selectedYear: number;
  selectedMonth: number;
}>;

export const AutoCategorization: FC<{
  merchantMappings: MerchantMapping;
  categoryMappings: CategoryMapping;
  onDeleteMerchantMapping: (description: string) => void;
  onDeleteCategoryMapping: (description: string) => void;
}>;

export const ExportButton: FC<{
  activeSection: ActiveSection;
  transactions: Transaction[];
  categories: Category[];
  merchantMappings: MerchantMapping;
  categoryMappings: CategoryMapping;
  bills: Bill[];
}>;

export const ImportButton: FC<{
  activeSection: ActiveSection;
  onImportTransactions: (transactions: Transaction[]) => void;
  onImportCategories: (categories: Category[]) => void;
  onImportRules: (merchantMappings: MerchantMapping, categoryMappings: CategoryMapping) => void;
  onImportBills: (bills: Bill[]) => void;
}>;

export const MonthYearSelector: FC<{
  selectedYear: number;
  selectedMonth: number;
  onDateChange: (year: number, month: number) => void;
}>;

export const BudgetDashboard: FC<{
  transactions: Transaction[];
  categories: Category[];
  onUpdateTransaction: (index: number, updatedTransaction: Transaction) => void;
}>;

export const CategoryPieChart: FC<{
  transactions: Transaction[];
  categories: Category[];
}>;

export const CategoryManager: FC<{
  categories: Category[];
  onUpdateCategories: (categories: Category[]) => void;
}>;
