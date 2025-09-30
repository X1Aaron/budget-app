import { FC } from 'react';
import type { Transaction, Category, MerchantMapping, CategoryMapping, Bill, ActiveSection } from '../types';

interface ImportButtonProps {
  activeSection: ActiveSection;
  onImportTransactions: (transactions: Transaction[]) => void;
  onImportCategories: (categories: Category[]) => void;
  onImportRules: (merchantMappings: MerchantMapping, categoryMappings: CategoryMapping) => void;
  onImportBills: (bills: Bill[]) => void;
}

declare const ImportButton: FC<ImportButtonProps>;
export default ImportButton;
