import { FC } from 'react';

interface MonthYearSelectorProps {
  selectedYear: number;
  selectedMonth: number;
  onDateChange: (year: number, month: number) => void;
}

declare const MonthYearSelector: FC<MonthYearSelectorProps>;
export default MonthYearSelector;
