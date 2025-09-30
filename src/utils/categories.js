export const DEFAULT_CATEGORIES = [
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
]

export const autoCategorize = (description, amount, existingCategory, categories = DEFAULT_CATEGORIES) => {
  // If already has a valid category, keep it and mark as not auto-categorized
  if (existingCategory && existingCategory !== 'Uncategorized') {
    return { category: existingCategory, wasAutoCategorized: false }
  }

  // Check keyword matching
  const desc = description.toLowerCase()

  for (const category of categories) {
    if (category.id === 'uncategorized') continue

    if (category.type === 'income' && amount > 0) {
      for (const keyword of category.keywords || []) {
        if (desc.includes(keyword.toLowerCase())) {
          return { category: category.name, wasAutoCategorized: true }
        }
      }
    } else if (category.type === 'expense' && amount < 0) {
      for (const keyword of category.keywords || []) {
        if (desc.includes(keyword.toLowerCase())) {
          return { category: category.name, wasAutoCategorized: true }
        }
      }
    } else if (category.type === 'both') {
      for (const keyword of category.keywords || []) {
        if (desc.includes(keyword.toLowerCase())) {
          return { category: category.name, wasAutoCategorized: true }
        }
      }
    }
  }

  // Default: positive amounts are Income, negative amounts are Uncategorized
  if (amount > 0) {
    return { category: 'Income', wasAutoCategorized: true }
  }

  return { category: 'Uncategorized', wasAutoCategorized: false }
}

export const getCategoryColor = (categoryName, categories = DEFAULT_CATEGORIES) => {
  const category = categories.find(cat => cat.name === categoryName)
  return category ? category.color : '#6b7280'
}
