import { FC } from 'react';
import type { Category, Transaction } from '../types';

interface CategorySettingsProps {
  categories: Category[];
  onUpdateCategories: (categories: Category[]) => void;
  transactions: Transaction[];
  onUpdateTransactions: (transactions: Transaction[]) => void;
  selectedYear: number;
  selectedMonth: number;
}

declare const CategorySettings: FC<CategorySettingsProps>;
export default CategorySettings;
