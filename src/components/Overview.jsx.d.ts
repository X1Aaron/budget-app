import { FC } from 'react';
import type { Transaction, Category, Bill, MonthlyBudget, StartingBalance } from '../types';

interface OverviewProps {
  transactions: Transaction[];
  categories: Category[];
  bills: Bill[];
  selectedYear: number;
  selectedMonth: number;
  monthlyBudgets: MonthlyBudget;
  startingBalances: StartingBalance;
  onDateChange: (year: number, month: number) => void;
  onUpdateBudget: (year: number, month: number, budget: number) => void;
}

declare const Overview: FC<OverviewProps>;
export default Overview;
