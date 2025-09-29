export const DEFAULT_CATEGORIES = [
  { id: 'income', name: 'Income', color: '#10b981', type: 'income', keywords: ['salary', 'paycheck', 'wage', 'income', 'bonus', 'refund'] },
  { id: 'food', name: 'Food & Dining', color: '#f59e0b', type: 'expense', keywords: ['grocery', 'restaurant', 'food', 'cafe', 'coffee', 'dinner', 'lunch', 'breakfast', 'uber eats', 'doordash', 'grubhub'] },
  { id: 'housing', name: 'Housing', color: '#8b5cf6', type: 'expense', keywords: ['rent', 'mortgage', 'property', 'utilities', 'electricity', 'water', 'gas', 'internet', 'cable'] },
  { id: 'transportation', name: 'Transportation', color: '#3b82f6', type: 'expense', keywords: ['gas', 'fuel', 'uber', 'lyft', 'taxi', 'parking', 'transit', 'bus', 'train', 'car', 'auto'] },
  { id: 'shopping', name: 'Shopping', color: '#ec4899', type: 'expense', keywords: ['amazon', 'store', 'shopping', 'retail', 'clothing', 'clothes', 'shoes'] },
  { id: 'entertainment', name: 'Entertainment', color: '#ef4444', type: 'expense', keywords: ['movie', 'netflix', 'spotify', 'hulu', 'disney', 'gaming', 'game', 'entertainment', 'concert', 'ticket'] },
  { id: 'healthcare', name: 'Healthcare', color: '#06b6d4', type: 'expense', keywords: ['doctor', 'hospital', 'pharmacy', 'medical', 'health', 'dental', 'prescription', 'medicine'] },
  { id: 'personal', name: 'Personal Care', color: '#a855f7', type: 'expense', keywords: ['haircut', 'salon', 'spa', 'gym', 'fitness', 'personal'] },
  { id: 'education', name: 'Education', color: '#14b8a6', type: 'expense', keywords: ['tuition', 'school', 'education', 'course', 'book', 'learning'] },
  { id: 'bills', name: 'Bills & Fees', color: '#f97316', type: 'expense', keywords: ['bill', 'fee', 'subscription', 'insurance', 'phone', 'membership'] },
  { id: 'uncategorized', name: 'Uncategorized', color: '#6b7280', type: 'both', keywords: [] }
]

export const autoCategorize = (description, amount, existingCategory) => {
  if (existingCategory && existingCategory !== 'Uncategorized') {
    return existingCategory
  }

  const desc = description.toLowerCase()
  
  for (const category of DEFAULT_CATEGORIES) {
    if (category.id === 'uncategorized') continue
    
    if (category.type === 'income' && amount > 0) {
      for (const keyword of category.keywords) {
        if (desc.includes(keyword)) {
          return category.name
        }
      }
    } else if (category.type === 'expense' && amount < 0) {
      for (const keyword of category.keywords) {
        if (desc.includes(keyword)) {
          return category.name
        }
      }
    }
  }
  
  return 'Uncategorized'
}

export const getCategoryColor = (categoryName, categories = DEFAULT_CATEGORIES) => {
  const category = categories.find(cat => cat.name === categoryName)
  return category ? category.color : '#6b7280'
}
