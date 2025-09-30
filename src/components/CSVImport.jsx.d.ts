import { FC } from 'react';
import type { Transaction } from '../types';

interface CSVImportProps {
  onImport: (transactions: Transaction[], existingTransactions?: Transaction[]) => void;
}

declare const CSVImport: FC<CSVImportProps>;
export default CSVImport;
