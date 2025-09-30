import { FC } from 'react';
import type { MerchantMapping, CategoryMapping } from '../types';

interface AutoCategorizationProps {
  merchantMappings: MerchantMapping;
  categoryMappings: CategoryMapping;
  onDeleteMerchantMapping: (description: string) => void;
  onDeleteCategoryMapping: (description: string) => void;
}

declare const AutoCategorization: FC<AutoCategorizationProps>;
export default AutoCategorization;
