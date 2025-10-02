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
  { id: 'income', name: 'Income', color: '#10b981', type: 'income', keywords: ['salary', 'paycheck', 'wage', 'income', 'bonus', 'refund', 'direct dep'], budgeted: 0, needWant: 'need' },

  // Food categories
  { id: 'groceries', name: 'Groceries', color: '#f59e0b', type: 'expense', keywords: ['grocery', 'whole foods', 'trader joes', 'safeway', 'kroger', 'publix', 'albertsons', 'food lion', 'wegmans', 'costco', 'sams club'], budgeted: 0, needWant: 'need' },
  { id: 'dining', name: 'Dining Out', color: '#fb923c', type: 'expense', keywords: ['restaurant', 'cafe', 'coffee', 'dinner', 'lunch', 'breakfast', 'uber eats', 'doordash', 'grubhub', 'starbucks', 'dunkin', 'mcdonalds', 'chipotle', 'pizza', 'taco bell', 'subway'], budgeted: 0, needWant: 'want' },

  // Housing & utilities
  { id: 'housing', name: 'Housing', color: '#8b5cf6', type: 'expense', keywords: ['rent', 'mortgage', 'property management', 'hoa'], budgeted: 0, needWant: 'need' },
  { id: 'utilities', name: 'Utilities', color: '#7c3aed', type: 'expense', keywords: ['utilities', 'electric', 'electricity', 'water', 'gas', 'pg&e', 'comcast', 'internet', 'cable', 'city water'], budgeted: 0, needWant: 'need' },

  // Transportation
  { id: 'gas', name: 'Gas & Fuel', color: '#3b82f6', type: 'expense', keywords: ['gas', 'fuel', 'shell', 'chevron', 'exxon', 'bp', 'mobil', 'texaco'], budgeted: 0, needWant: 'need' },
  { id: 'auto', name: 'Auto & Vehicle', color: '#2563eb', type: 'expense', keywords: ['auto', 'vehicle', 'car wash', 'oil change', 'repair', 'maintenance', 'mechanic', 'tire', 'dmv', 'registration'], budgeted: 0, needWant: 'need' },
  { id: 'rideshare', name: 'Rideshare & Transit', color: '#1d4ed8', type: 'expense', keywords: ['uber', 'lyft', 'taxi', 'parking', 'transit', 'bus', 'train', 'metro'], budgeted: 0, needWant: 'want' },

  // Shopping categories
  { id: 'shopping', name: 'General Shopping', color: '#ec4899', type: 'expense', keywords: ['amazon', 'target', 'walmart', 'store', 'shopping', 'retail', 'ebay', 'etsy'], budgeted: 0, needWant: 'want' },
  { id: 'clothing', name: 'Clothing', color: '#db2777', type: 'expense', keywords: ['clothing', 'clothes', 'shoes', 'fashion', 'apparel', 'nike', 'adidas', 'h&m', 'zara', 'gap', 'old navy', 'shein'], budgeted: 0, needWant: 'want' },
  { id: 'electronics', name: 'Electronics', color: '#be185d', type: 'expense', keywords: ['electronics', 'best buy', 'apple store', 'computer', 'phone', 'tech', 'gadget'], budgeted: 0, needWant: 'want' },
  { id: 'home', name: 'Home & Garden', color: '#9f1239', type: 'expense', keywords: ['home depot', 'lowes', 'ikea', 'furniture', 'home improvement', 'garden', 'hardware', 'decoration', 'bed bath'], budgeted: 0, needWant: 'want' },

  // Entertainment & subscriptions
  { id: 'entertainment', name: 'Entertainment', color: '#ef4444', type: 'expense', keywords: ['movie', 'theatre', 'amc', 'concert', 'ticket', 'event', 'show'], budgeted: 0, needWant: 'want' },
  { id: 'subscriptions', name: 'Subscriptions', color: '#dc2626', type: 'expense', keywords: ['netflix', 'spotify', 'hulu', 'disney', 'hbo', 'amazon prime', 'subscription', 'membership', 'patreon', 'audible', 'apple music', 'youtube premium'], budgeted: 0, needWant: 'want' },
  { id: 'gaming', name: 'Gaming', color: '#b91c1c', type: 'expense', keywords: ['gaming', 'game', 'steam', 'playstation', 'xbox', 'nintendo', 'twitch'], budgeted: 0, needWant: 'want' },

  // Health & wellness
  { id: 'healthcare', name: 'Healthcare', color: '#06b6d4', type: 'expense', keywords: ['doctor', 'hospital', 'pharmacy', 'medical', 'health', 'dental', 'prescription', 'medicine', 'walgreens', 'cvs', 'clinic'], budgeted: 0, needWant: 'need' },
  { id: 'fitness', name: 'Fitness & Gym', color: '#0891b2', type: 'expense', keywords: ['gym', 'fitness', 'planet fitness', 'la fitness', 'yoga', 'workout', 'trainer', 'athletic'], budgeted: 0, needWant: 'want' },
  { id: 'personal', name: 'Personal Care', color: '#a855f7', type: 'expense', keywords: ['haircut', 'salon', 'spa', 'barber', 'beauty', 'cosmetic', 'sephora', 'ulta', 'nail'], budgeted: 0, needWant: 'want' },

  // Financial
  { id: 'insurance', name: 'Insurance', color: '#0ea5e9', type: 'expense', keywords: ['insurance', 'geico', 'state farm', 'allstate', 'progressive', 'policy'], budgeted: 0, needWant: 'need' },
  { id: 'debt', name: 'Debt Payments', color: '#0284c7', type: 'expense', keywords: ['loan', 'credit card payment', 'student loan', 'mohela', 'navient', 'debt', 'payment', 'chase payment'], budgeted: 0, needWant: 'need' },
  { id: 'savings', name: 'Savings & Investments', color: '#059669', type: 'expense', keywords: ['savings', 'investment', '401k', 'ira', 'transfer', 'robinhood', 'fidelity', 'vanguard'], budgeted: 0, needWant: 'need' },

  // Bills & services
  { id: 'phone', name: 'Phone', color: '#f97316', type: 'expense', keywords: ['phone', 'mobile', 'verizon', 'att', 't-mobile', 'sprint', 'cell'], budgeted: 0, needWant: 'need' },
  { id: 'fees', name: 'Bank Fees', color: '#ea580c', type: 'expense', keywords: ['fee', 'bank fee', 'atm', 'overdraft', 'service charge'], budgeted: 0, needWant: 'need' },
  { id: 'services', name: 'Professional Services', color: '#c2410c', type: 'expense', keywords: ['service', 'lawyer', 'accountant', 'tax', 'legal', 'consulting'], budgeted: 0, needWant: 'need' },

  // Lifestyle
  { id: 'travel', name: 'Travel & Vacation', color: '#14b8a6', type: 'expense', keywords: ['hotel', 'flight', 'travel', 'vacation', 'airbnb', 'airline', 'resort', 'trip'], budgeted: 0, needWant: 'want' },
  { id: 'pets', name: 'Pets', color: '#0d9488', type: 'expense', keywords: ['pet', 'vet', 'veterinary', 'petco', 'petsmart', 'dog', 'cat', 'animal'], budgeted: 0, needWant: 'want' },
  { id: 'gifts', name: 'Gifts & Donations', color: '#f472b6', type: 'expense', keywords: ['gift', 'donation', 'charity', 'present', 'giving', 'contribution'], budgeted: 0, needWant: 'want' },
  { id: 'education', name: 'Education', color: '#14b8a6', type: 'expense', keywords: ['tuition', 'school', 'education', 'course', 'book', 'learning', 'class', 'training'], budgeted: 0, needWant: 'need' },

  { id: 'uncategorized', name: 'Uncategorized', color: '#6b7280', type: 'both', keywords: [], budgeted: 0, needWant: null }
];

interface AutoCategorizeResult {
  category: string;
  wasAutoCategorized: boolean;
  matchType?: 'exact' | 'keyword' | 'default' | 'manual';
  matchedKeyword?: string;
}

export const autoCategorize = (
  description: string,
  amount: number,
  existingCategory: string | undefined,
  categories: CategoryWithKeywords[] = DEFAULT_CATEGORIES,
  categoryMappings: { [description: string]: string } = {},
  disabledKeywords: { [category: string]: string[] } = {}
): AutoCategorizeResult => {
  // If already has a valid category, keep it and mark as not auto-categorized
  if (existingCategory && existingCategory !== 'Uncategorized') {
    return { category: existingCategory, wasAutoCategorized: false, matchType: 'manual' };
  }

  // Priority 1: Check exact match rules (from manual categorization)
  if (categoryMappings[description]) {
    return {
      category: categoryMappings[description],
      wasAutoCategorized: true,
      matchType: 'exact'
    };
  }

  // Priority 2: Check keyword matching
  const desc = description.toLowerCase();

  for (const category of categories) {
    if (category.id === 'uncategorized') continue;

    const disabledCategoryKeywords = disabledKeywords[category.name] || [];

    if (category.type === 'income' && amount > 0) {
      for (const keyword of category.keywords || []) {
        if (!disabledCategoryKeywords.includes(keyword) && desc.includes(keyword.toLowerCase())) {
          return { category: category.name, wasAutoCategorized: true, matchType: 'keyword', matchedKeyword: keyword };
        }
      }
    } else if (category.type === 'expense' && amount < 0) {
      for (const keyword of category.keywords || []) {
        if (!disabledCategoryKeywords.includes(keyword) && desc.includes(keyword.toLowerCase())) {
          return { category: category.name, wasAutoCategorized: true, matchType: 'keyword', matchedKeyword: keyword };
        }
      }
    } else if (category.type === 'both') {
      for (const keyword of category.keywords || []) {
        if (!disabledCategoryKeywords.includes(keyword) && desc.includes(keyword.toLowerCase())) {
          return { category: category.name, wasAutoCategorized: true, matchType: 'keyword', matchedKeyword: keyword };
        }
      }
    }
  }

  // Priority 3: Default fallback
  if (amount > 0) {
    return { category: 'Income', wasAutoCategorized: true, matchType: 'default' };
  }

  return { category: 'Uncategorized', wasAutoCategorized: false, matchType: 'default' };
};

export const getCategoryColor = (categoryName: string, categories: Category[] = DEFAULT_CATEGORIES): string => {
  const category = categories.find(cat => cat.name === categoryName);
  return category ? category.color : '#6b7280';
};
