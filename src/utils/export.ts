import { Transaction, Category, Bill, MerchantMapping, CategoryMapping } from '../types';

// Export transactions to CSV
export const exportTransactionsToCSV = (transactions: Transaction[]): void => {
  if (transactions.length === 0) return;

  const headers = ['date', 'description', 'amount', 'category', 'merchantName', 'memo', 'autoCategorized'];
  const csvContent = [
    headers.join(','),
    ...transactions.map(t =>
      [t.date, `"${t.description}"`, t.amount, t.category, `"${t.merchantName || t.description}"`, `"${(t.memo || '').replace(/"/g, '""')}"`, t.autoCategorized || false].join(',')
    )
  ].join('\n');

  downloadFile(csvContent, 'transactions.csv', 'text/csv');
};

// Export transactions to JSON
export const exportTransactionsToJSON = (transactions: Transaction[]): void => {
  const jsonContent = JSON.stringify(transactions, null, 2);
  downloadFile(jsonContent, 'transactions.json', 'application/json');
};

// Export categories to JSON
export const exportCategoriesToJSON = (categories: Category[]): void => {
  const jsonContent = JSON.stringify(categories, null, 2);
  downloadFile(jsonContent, 'categories.json', 'application/json');
};

// Export categories to CSV
export const exportCategoriesToCSV = (categories: Category[]): void => {
  const headers = ['id', 'name', 'color', 'type', 'keywords', 'needWant', 'budgeted'];
  const csvContent = [
    headers.join(','),
    ...categories.map(cat =>
      [
        cat.id,
        `"${cat.name}"`,
        cat.color,
        (cat as any).type || 'expense',
        `"${((cat as any).keywords || []).join(', ')}"`,
        (cat as any).needWant || '',
        (cat as any).budgeted || 0
      ].join(',')
    )
  ].join('\n');

  downloadFile(csvContent, 'categories.csv', 'text/csv');
};

// Export auto-categorization rules to JSON
export const exportRulesToJSON = (rules: { merchantMappings: MerchantMapping; categoryMappings: CategoryMapping }): void => {
  const jsonContent = JSON.stringify(rules, null, 2);
  downloadFile(jsonContent, 'categorization-rules.json', 'application/json');
};

// Export bills to JSON
export const exportBillsToJSON = (bills: Bill[]): void => {
  const jsonContent = JSON.stringify(bills, null, 2);
  downloadFile(jsonContent, 'bills.json', 'application/json');
};

// Export bills to CSV
export const exportBillsToCSV = (bills: Bill[]): void => {
  if (bills.length === 0) return;

  const headers = ['id', 'name', 'amount', 'dueDate', 'frequency', 'category', 'notes'];
  const csvContent = [
    headers.join(','),
    ...bills.map(bill =>
      [
        bill.id,
        `"${bill.name}"`,
        bill.amount,
        bill.dueDate,
        bill.frequency || 'monthly',
        `"${bill.category || ''}"`,
        `"${(bill.notes || '').replace(/"/g, '""')}"`
      ].join(',')
    )
  ].join('\n');

  downloadFile(csvContent, 'bills.csv', 'text/csv');
};

// Helper function to trigger download
const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
