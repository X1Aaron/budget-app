import { FC } from 'react';
import type { Bill, Category } from '../types';

interface BillsProps {
  bills: Bill[];
  onUpdateBills: (bills: Bill[]) => void;
  selectedYear: number;
  selectedMonth: number;
  onDateChange: (year: number, month: number) => void;
  categories: Category[];
}

declare const Bills: FC<BillsProps>;
export default Bills;
