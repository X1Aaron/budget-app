import { FC } from 'react';
import type { Transaction, Category, StartingBalance } from '../types';

interface SpendingProps {
  transactions: Transaction[];
  categories: Category[];
  selectedYear: number;
  selectedMonth: number;
  onDateChange: (year: number, month: number) => void;
  onUpdateTransaction: (index: number, updatedTransaction: Transaction, updateAllMatching?: boolean) => void;
  startingBalances: StartingBalance;
  onUpdateStartingBalance: (year: number, month: number, balance: number) => void;
}

declare const Spending: FC<SpendingProps>;
export default Spending;
