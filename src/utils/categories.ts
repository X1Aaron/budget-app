import { Category } from '../types';

// Generate a merchant name from a raw transaction description
export const generateMerchantName = (description: string): string => {
  if (!description) return '';

  let friendly = description.trim();

  // Remove common prefixes
  friendly = friendly.replace(/^(PURCHASE AUTHORIZED ON |DEBIT CARD PURCHASE - |VISA PURCHASE - |CARD PURCHASE - )/i, '');

  // Remove date patterns (MM/DD, YYYY-MM-DD, etc)
  friendly = friendly.replace(/\b\d{1,4}[-/]\d{1,2}[-/]\d{1,4}\b/g, '');

  // Remove transaction IDs and reference numbers
  friendly = friendly.replace(/\b[A-Z0-9]{10,}\b/g, '');
  friendly = friendly.replace(/#\d+/g, '');
  friendly = friendly.replace(/\*\d+/g, '');

  // Remove location codes like "US*" or state abbreviations
  friendly = friendly.replace(/\b[A-Z]{2}\*/g, '');

  // Common merchant name cleanups
  const merchantPatterns: Array<{ pattern: RegExp; replacement: string }> = [
    { pattern: /AMZN MKTP/i, replacement: 'Amazon' },
    { pattern: /AMAZON\.COM/i, replacement: 'Amazon' },
    { pattern: /WM SUPERCENTER/i, replacement: 'Walmart' },
    { pattern: /WALMART\.COM/i, replacement: 'Walmart' },
    { pattern: /TARGET\.COM/i, replacement: 'Target' },
    { pattern: /COSTCO WHSE/i, replacement: 'Costco' },
    { pattern: /SHELL OIL/i, replacement: 'Shell' },
    { pattern: /CHEVRON/i, replacement: 'Chevron' },
    { pattern: /STARBUCKS/i, replacement: 'Starbucks' },
    { pattern: /MCDONALD'S/i, replacement: 'McDonald\'s' },
    { pattern: /SQ \*/i, replacement: '' },
    { pattern: /TST\* /i, replacement: '' },
    { pattern: /PAYPAL \*/i, replacement: 'PayPal - ' }
  ];

  for (const { pattern, replacement } of merchantPatterns) {
    friendly = friendly.replace(pattern, replacement);
  }

  // Remove extra whitespace
  friendly = friendly.replace(/\s+/g, ' ').trim();

  // Remove trailing dashes or slashes
  friendly = friendly.replace(/[-/\s]+$/, '');

  // Capitalize properly
  friendly = friendly.split(' ')
    .map(word => {
      if (word.length <= 2) return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');

  return friendly || description;
};

interface CategoryWithKeywords extends Category {
  type?: 'income' | 'expense' | 'both';
  keywords?: string[];
  needWant?: 'need' | 'want' | null;
  budgeted?: number;
}

export const DEFAULT_CATEGORIES: CategoryWithKeywords[] = [
  { id: 'income', name: 'Income', color: '#10b981', type: 'income', keywords: ['salary', 'paycheck', 'wage', 'income', 'bonus', 'refund'], budgeted: 0, needWant: 'need' },
  { id: 'food', name: 'Food & Dining', color: '#f59e0b', type: 'expense', keywords: ['grocery', 'restaurant', 'food', 'cafe', 'coffee', 'dinner', 'lunch', 'breakfast', 'uber eats', 'doordash', 'grubhub'], budgeted: 0, needWant: 'need' },
  { id: 'housing', name: 'Housing', color: '#8b5cf6', type: 'expense', keywords: ['rent', 'mortgage', 'property', 'utilities', 'electricity', 'water', 'gas', 'internet', 'cable'], budgeted: 0, needWant: 'need' },
  { id: 'transportation', name: 'Transportation', color: '#3b82f6', type: 'expense', keywords: ['gas', 'fuel', 'uber', 'lyft', 'taxi', 'parking', 'transit', 'bus', 'train', 'car', 'auto'], budgeted: 0, needWant: 'need' },
  { id: 'shopping', name: 'Shopping', color: '#ec4899', type: 'expense', keywords: ['amazon', 'store', 'shopping', 'retail', 'clothing', 'clothes', 'shoes'], budgeted: 0, needWant: 'want' },
  { id: 'entertainment', name: 'Entertainment', color: '#ef4444', type: 'expense', keywords: ['movie', 'netflix', 'spotify', 'hulu', 'disney', 'gaming', 'game', 'entertainment', 'concert', 'ticket'], budgeted: 0, needWant: 'want' },
  { id: 'healthcare', name: 'Healthcare', color: '#06b6d4', type: 'expense', keywords: ['doctor', 'hospital', 'pharmacy', 'medical', 'health', 'dental', 'prescription', 'medicine'], budgeted: 0, needWant: 'need' },
  { id: 'personal', name: 'Personal Care', color: '#a855f7', type: 'expense', keywords: ['haircut', 'salon', 'spa', 'gym', 'fitness', 'personal'], budgeted: 0, needWant: 'want' },
  { id: 'education', name: 'Education', color: '#14b8a6', type: 'expense', keywords: ['tuition', 'school', 'education', 'course', 'book', 'learning'], budgeted: 0, needWant: 'need' },
  { id: 'bills', name: 'Bills & Fees', color: '#f97316', type: 'expense', keywords: ['bill', 'fee', 'subscription', 'insurance', 'phone', 'membership'], budgeted: 0, needWant: 'need' },
  { id: 'uncategorized', name: 'Uncategorized', color: '#6b7280', type: 'both', keywords: [], budgeted: 0, needWant: null }
];

interface AutoCategorizeResult {
  category: string;
  wasAutoCategorized: boolean;
}

export const autoCategorize = (
  description: string,
  amount: number,
  existingCategory: string | undefined,
  categories: CategoryWithKeywords[] = DEFAULT_CATEGORIES
): AutoCategorizeResult => {
  // If already has a valid category, keep it and mark as not auto-categorized
  if (existingCategory && existingCategory !== 'Uncategorized') {
    return { category: existingCategory, wasAutoCategorized: false };
  }

  // Check keyword matching
  const desc = description.toLowerCase();

  for (const category of categories) {
    if (category.id === 'uncategorized') continue;

    if (category.type === 'income' && amount > 0) {
      for (const keyword of category.keywords || []) {
        if (desc.includes(keyword.toLowerCase())) {
          return { category: category.name, wasAutoCategorized: true };
        }
      }
    } else if (category.type === 'expense' && amount < 0) {
      for (const keyword of category.keywords || []) {
        if (desc.includes(keyword.toLowerCase())) {
          return { category: category.name, wasAutoCategorized: true };
        }
      }
    } else if (category.type === 'both') {
      for (const keyword of category.keywords || []) {
        if (desc.includes(keyword.toLowerCase())) {
          return { category: category.name, wasAutoCategorized: true };
        }
      }
    }
  }

  // Default: positive amounts are Income, negative amounts are Uncategorized
  if (amount > 0) {
    return { category: 'Income', wasAutoCategorized: true };
  }

  return { category: 'Uncategorized', wasAutoCategorized: false };
};

export const getCategoryColor = (categoryName: string, categories: Category[] = DEFAULT_CATEGORIES): string => {
  const category = categories.find(cat => cat.name === categoryName);
  return category ? category.color : '#6b7280';
};
