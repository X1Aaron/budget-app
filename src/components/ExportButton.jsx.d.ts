import { FC } from 'react';
import type { Transaction, Category, MerchantMapping, CategoryMapping, Bill, ActiveSection } from '../types';

interface ExportButtonProps {
  activeSection: ActiveSection;
  transactions: Transaction[];
  categories: Category[];
  merchantMappings: MerchantMapping;
  categoryMappings: CategoryMapping;
  bills: Bill[];
}

declare const ExportButton: FC<ExportButtonProps>;
export default ExportButton;
