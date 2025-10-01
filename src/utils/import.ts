import { Transaction, Category, Bill, MerchantMapping, CategoryMapping } from '../types';

// Parse CSV string into array of objects
const parseCSV = (csvText: string, expectedHeaders: string[]): Record<string, string>[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length === 0) {
    throw new Error('File is empty');
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

  // Validate headers
  const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
  if (missingHeaders.length > 0) {
    throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
  }

  const data: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '') continue;

    const values: string[] = [];
    let currentValue = '';
    let insideQuotes = false;

    for (let char of lines[i]) {
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    data.push(row);
  }

  return data;
};

// Import transactions from CSV
export const importTransactionsFromCSV = async (file: File): Promise<Transaction[]> => {
  const text = await file.text();
  const lines = text.trim().split('\n');

  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header row and one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));

  const dateIndex = headers.findIndex(h => h.includes('date'));
  const descIndex = headers.findIndex(h => h.includes('desc'));
  const amountIndex = headers.findIndex(h => h.includes('amount'));
  const categoryIndex = headers.findIndex(h => h.includes('category') || h.includes('cat'));
  const needWantIndex = headers.findIndex(h => h.includes('need') || h.includes('want'));
  const autoCategorizedIndex = headers.findIndex(h => h.includes('auto'));
  const merchantNameIndex = headers.findIndex(h => h.includes('merchant'));
  const friendlyNameIndex = headers.findIndex(h => h.includes('friendly') || (h.includes('name') && !h.includes('merchant')));
  const memoIndex = headers.findIndex(h => h.includes('memo') || h.includes('note'));

  if (dateIndex === -1 || descIndex === -1 || amountIndex === -1) {
    throw new Error('CSV must have columns for: date, description, and amount');
  }

  const transactions: Transaction[] = [];
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '') continue;

    const values: string[] = [];
    let currentValue = '';
    let insideQuotes = false;

    for (let char of lines[i]) {
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());

    const needWantValue = needWantIndex !== -1 ? values[needWantIndex] : undefined;
    const transaction: Transaction = {
      date: values[dateIndex] || '',
      description: values[descIndex] || '',
      amount: parseFloat(values[amountIndex] || '0'),
      category: categoryIndex !== -1 && values[categoryIndex] ? values[categoryIndex] : 'Uncategorized',
      needWant: needWantValue === 'need' || needWantValue === 'want' ? needWantValue : undefined,
      autoCategorized: autoCategorizedIndex !== -1 ? (values[autoCategorizedIndex] === 'true') : false,
      merchantName: merchantNameIndex !== -1 && values[merchantNameIndex] ? values[merchantNameIndex] : (friendlyNameIndex !== -1 && values[friendlyNameIndex] ? values[friendlyNameIndex] : (values[descIndex] || '')),
      memo: memoIndex !== -1 && values[memoIndex] ? values[memoIndex] : ''
    };

    if (!isNaN(transaction.amount) && transaction.date && transaction.description) {
      transactions.push(transaction);
    }
  }

  return transactions;
};

// Import transactions from JSON
export const importTransactionsFromJSON = async (file: File): Promise<Transaction[]> => {
  const text = await file.text();
  const data = JSON.parse(text);

  if (!Array.isArray(data)) {
    throw new Error('Invalid JSON format: expected an array of transactions');
  }

  return data
    .filter(t => t != null && typeof t === 'object')
    .map(t => ({
      date: t.date,
      description: t.description,
      amount: parseFloat(t.amount),
      category: t.category || 'Uncategorized',
      needWant: t.needWant || undefined,
      autoCategorized: t.autoCategorized || false,
      merchantName: t.merchantName || t.friendlyName || t.description,
      memo: t.memo || ''
    }));
};

// Import categories from CSV
export const importCategoriesFromCSV = async (file: File): Promise<Category[]> => {
  const text = await file.text();
  const data = parseCSV(text, ['name', 'color', 'type']);

  return data.map(row => ({
    id: row.id || String(Date.now() + Math.random()),
    name: row.name,
    color: row.color
  }));
};

// Import categories from JSON
export const importCategoriesFromJSON = async (file: File): Promise<Category[]> => {
  const text = await file.text();
  const data = JSON.parse(text);

  if (!Array.isArray(data)) {
    throw new Error('Invalid JSON format: expected an array of categories');
  }

  return data.map(cat => ({
    id: cat.id || String(Date.now() + Math.random()),
    name: cat.name,
    color: cat.color
  }));
};

// Import auto-categorization rules from JSON
export const importRulesFromJSON = async (file: File): Promise<{ merchantMappings: MerchantMapping; categoryMappings: CategoryMapping }> => {
  const text = await file.text();
  const data = JSON.parse(text);

  return {
    merchantMappings: data.merchantMappings || {},
    categoryMappings: data.categoryMappings || {}
  };
};

// Import bills from CSV
export const importBillsFromCSV = async (file: File): Promise<Bill[]> => {
  const text = await file.text();
  const data = parseCSV(text, ['name', 'amount', 'dueDate']);

  return data.map(row => ({
    id: row.id || String(Date.now() + Math.random()),
    name: row.name,
    amount: parseFloat(row.amount),
    dueDate: parseInt(row.dueDate),
    category: row.category || '',
    isRecurring: true,
    frequency: (row.frequency as 'monthly' | 'quarterly' | 'yearly') || 'monthly',
    notes: row.notes || ''
  }));
};

// Import bills from JSON
export const importBillsFromJSON = async (file: File): Promise<Bill[]> => {
  const text = await file.text();
  const data = JSON.parse(text);

  if (!Array.isArray(data)) {
    throw new Error('Invalid JSON format: expected an array of bills');
  }

  return data.map(bill => ({
    id: bill.id || String(Date.now() + Math.random()),
    name: bill.name,
    amount: parseFloat(bill.amount),
    dueDate: bill.dueDate,
    category: bill.category || '',
    isRecurring: bill.isRecurring !== undefined ? bill.isRecurring : true,
    frequency: bill.frequency || 'monthly',
    notes: bill.notes || ''
  }));
};
