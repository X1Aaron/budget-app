import { useState, useEffect } from 'react';
import './App.css';
import { Overview } from './components/features/overview';
import { Spending } from './components/features/transactions';
import { Bills, SpendingAndBills } from './components/features/bills';
import { CategorySettings, AutoCategorization } from './components/features/categories';
import { MonthYearSelector } from './components/ui/forms';
import { DEFAULT_CATEGORIES, autoCategorize, generateMerchantName } from './utils/categories';
import { generateDemoData } from './utils/demoData';
import { updateBillsWithTransactionMatches } from './utils/billMatching';
import { useTheme } from './contexts/ThemeContext';
import type {
  Transaction,
  Category,
  MonthlyBudget,
  MerchantMapping,
  CategoryMapping,
  ActiveSection,
  BillMatchingSettings
} from './types';

function App() {
  const { theme, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<ActiveSection>('overview');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [monthlyBudgets, setMonthlyBudgets] = useState<MonthlyBudget>(() => {
    const saved = localStorage.getItem('monthlyBudgets');
    return saved ? JSON.parse(saved) : {};
  });
  // Bills are now stored as transactions with isBill = true
  // No separate bills state needed anymore

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });
  const [accountStartingBalance, setAccountStartingBalance] = useState<number>(() => {
    const saved = localStorage.getItem('accountStartingBalance');
    return saved ? JSON.parse(saved) : 0;
  });
  const [merchantMappings, setMerchantMappings] = useState<MerchantMapping>(() => {
    const saved = localStorage.getItem('merchantMappings');
    return saved ? JSON.parse(saved) : {};
  });
  const [categoryMappings, setCategoryMappings] = useState<CategoryMapping>(() => {
    const saved = localStorage.getItem('categoryMappings');
    return saved ? JSON.parse(saved) : {};
  });
  const [billMatchingSettings, setBillMatchingSettings] = useState<BillMatchingSettings>(() => {
    const saved = localStorage.getItem('billMatchingSettings');
    return saved ? JSON.parse(saved) : {
      amountTolerance: 5,
      dateWindowDays: 7,
      minimumScore: 60,
      requireDescriptionMatch: true,
      requireAmountMatch: true,
      requireDateWindow: true
    };
  });

  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('accountStartingBalance', JSON.stringify(accountStartingBalance));
  }, [accountStartingBalance]);

  useEffect(() => {
    localStorage.setItem('monthlyBudgets', JSON.stringify(monthlyBudgets));
  }, [monthlyBudgets]);

  useEffect(() => {
    localStorage.setItem('merchantMappings', JSON.stringify(merchantMappings));
  }, [merchantMappings]);

  useEffect(() => {
    localStorage.setItem('categoryMappings', JSON.stringify(categoryMappings));
  }, [categoryMappings]);

  useEffect(() => {
    localStorage.setItem('billMatchingSettings', JSON.stringify(billMatchingSettings));
  }, [billMatchingSettings]);

  useEffect(() => {
    const saved = localStorage.getItem('transactions');
    if (saved) {
      setTransactions(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (transactions.length > 0) {
      localStorage.setItem('transactions', JSON.stringify(transactions));
    }
  }, [transactions]);

  // Auto-match transactions to bills
  useEffect(() => {
    if (transactions.length > 0) {
      const billTransactions = transactions.filter(t => t.isBill);
      if (billTransactions.length > 0) {
        const updatedTransactions = updateBillsWithTransactionMatches(
          transactions,
          selectedYear,
          selectedMonth,
          billMatchingSettings
        );

        // Only update if there are actual changes
        const hasChanges = JSON.stringify(updatedTransactions) !== JSON.stringify(transactions);
        if (hasChanges) {
          setTransactions(updatedTransactions);
        }
      }
    }
  }, [transactions.length, selectedYear, selectedMonth, billMatchingSettings]); // Depend on transactions.length to avoid infinite loop

  const handleImport = (importedTransactions: Transaction[], existingTransactions: Transaction[] = transactions) => {
    // Check for duplicate transactions
    const duplicates: Transaction[] = [];
    const newTransactions: Transaction[] = [];

    importedTransactions.forEach(imported => {
      const isDuplicate = existingTransactions.some(existing =>
        existing.date === imported.date &&
        existing.description === imported.description &&
        existing.amount === imported.amount
      );

      if (isDuplicate) {
        duplicates.push(imported);
      } else {
        newTransactions.push(imported);
      }
    });

    if (duplicates.length > 0) {
      throw new Error(`Found ${duplicates.length} duplicate transaction${duplicates.length !== 1 ? 's' : ''} (same date, description, and amount). Import rejected to prevent duplicates.`);
    }

    const categorizedTransactions = newTransactions.map(t => {
      const result = autoCategorize(t.description, t.amount, t.category, categories);
      return {
        ...t,
        category: result.category,
        autoCategorized: result.wasAutoCategorized,
        merchantName: t.merchantName || t.friendlyName || generateMerchantName(t.description),
        memo: t.memo || ''
      };
    });
    setTransactions([...existingTransactions, ...categorizedTransactions]);
  };

  const handleUpdateTransaction = (index: number, updatedTransaction: Transaction, updateAllMatching: boolean = false) => {
    const newTransactions = [...transactions];
    const originalTransaction = transactions[index];

    // If updateAllMatching is true and merchantName was changed, update all transactions with same description
    if (updateAllMatching && updatedTransaction.merchantName !== originalTransaction.merchantName) {
      const originalDescription = originalTransaction.description;
      const newMerchantName = updatedTransaction.merchantName;

      // Save merchant mapping
      setMerchantMappings(prev => ({
        ...prev,
        [originalDescription]: newMerchantName || ''
      }));

      for (let i = 0; i < newTransactions.length; i++) {
        if (newTransactions[i].description === originalDescription) {
          newTransactions[i] = { ...newTransactions[i], merchantName: newMerchantName };
        }
      }
    } else {
      // Check if category was changed
      if (updatedTransaction.category !== originalTransaction.category) {
        const description = originalTransaction.description;

        // Save category mapping
        setCategoryMappings(prev => ({
          ...prev,
          [description]: updatedTransaction.category
        }));
      }

      newTransactions[index] = updatedTransaction;
    }

    setTransactions(newTransactions);
  };

  const handleDateChange = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
  };

  const handleUpdateBudget = (year: number, month: number, budget: number) => {
    const key = `${year}-${month}`;
    setMonthlyBudgets(prev => ({
      ...prev,
      [key]: budget
    }));
  };

  const handleUpdateAccountStartingBalance = (balance: number) => {
    setAccountStartingBalance(balance);
  };

  const handleDeleteMerchantMapping = (description: string) => {
    setMerchantMappings(prev => {
      const updated = { ...prev };
      delete updated[description];
      return updated;
    });
  };

  const handleDeleteCategoryMapping = (description: string) => {
    setCategoryMappings(prev => {
      const updated = { ...prev };
      delete updated[description];
      return updated;
    });
  };

  const handleImportDemoData = () => {
    const demoTransactions = generateDemoData();

    setTransactions(demoTransactions);  // Bills are now marked as isBill in transactions
    setAccountStartingBalance(5000);

    // Calculate average monthly expenses per category from demo data
    const categoryExpenses: { [category: string]: number[] } = {};

    demoTransactions.forEach(t => {
      if (t.amount < 0) { // Only expenses
        const category = t.category || 'Uncategorized';
        if (!categoryExpenses[category]) {
          categoryExpenses[category] = [];
        }
        categoryExpenses[category].push(Math.abs(t.amount));
      }
    });

    // Calculate total expenses per category and set realistic mixed budgets
    const categoryTotals: { [category: string]: number } = {};
    Object.keys(categoryExpenses).forEach(category => {
      categoryTotals[category] = categoryExpenses[category].reduce((sum, amount) => sum + amount, 0) / 12; // Average per month
    });

    // Define realistic budget strategies for each category type
    const budgetStrategies: { [category: string]: 'under' | 'on-target' | 'over' | 'tight' } = {
      'Food & Dining': 'tight',       // Slightly over budget on food/dining
      'Housing': 'on-target',         // Fixed costs, usually on target
      'Transportation': 'under',      // Good at staying under budget
      'Shopping': 'tight',            // Discretionary, slightly over
      'Bills & Fees': 'on-target',    // Fixed costs, predictable
      'Entertainment': 'on-target',   // Generally on target
      'Personal Care': 'under',       // Usually under budget
      'Healthcare': 'on-target',      // Unpredictable but averages out
      'Education': 'on-target',
      'Uncategorized': 'on-target'
    };

    const updatedCategories = categories.map(cat => {
      const avgExpense = categoryTotals[cat.name] || 0;
      if (avgExpense === 0) return { ...cat, budgeted: 0 };

      const strategy = budgetStrategies[cat.name] || 'on-target';
      let budgetPercent: number;

      switch (strategy) {
        case 'under':
          // Budget is 110-120% of actual (spending less than budgeted)
          budgetPercent = 1.1 + Math.random() * 0.1;
          break;
        case 'on-target':
          // Budget is 98-108% of actual (right on target)
          budgetPercent = 0.98 + Math.random() * 0.1;
          break;
        case 'tight':
          // Budget is 90-95% of actual (slightly over budget)
          budgetPercent = 0.9 + Math.random() * 0.05;
          break;
        case 'over':
          // Budget is 75-85% of actual (moderately over budget)
          budgetPercent = 0.75 + Math.random() * 0.1;
          break;
        default:
          budgetPercent = 1.0;
      }

      const budget = Math.round(avgExpense * budgetPercent);

      return {
        ...cat,
        budgeted: budget
      };
    });
    setCategories(updatedCategories);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-top">
          <h1>Budget Tracker</h1>
          <MonthYearSelector
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onDateChange={handleDateChange}
          />
          <div className="header-controls">
            <div className="header-actions">
              <button onClick={toggleTheme} className="theme-toggle" title="Toggle dark mode">
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
            </div>
          </div>
        </div>
        <nav className="app-nav">
          <button
            className={'nav-btn' + (activeSection === 'overview' ? ' active' : '')}
            onClick={() => setActiveSection('overview')}
          >
            Overview
          </button>
          <button
            className={'nav-btn' + (activeSection === 'spending' ? ' active' : '')}
            onClick={() => setActiveSection('spending')}
          >
            Spending & Bills
          </button>
          <button
            className={'nav-btn' + (activeSection === 'categories' ? ' active' : '')}
            onClick={() => setActiveSection('categories')}
          >
            Categories
          </button>
          <button
            className={'nav-btn' + (activeSection === 'auto-categorization' ? ' active' : '')}
            onClick={() => setActiveSection('auto-categorization')}
          >
            Auto Categorization
          </button>
          <button
            className={'nav-btn' + (activeSection === 'settings' ? ' active' : '')}
            onClick={() => setActiveSection('settings')}
          >
            Settings
          </button>
        </nav>
      </header>
      <main className="app-main">
        {activeSection === 'overview' ? (
          <Overview
            transactions={transactions}
            categories={categories}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            monthlyBudgets={monthlyBudgets}
            accountStartingBalance={accountStartingBalance}
            onDateChange={handleDateChange}
            onUpdateBudget={handleUpdateBudget}
          />
        ) : activeSection === 'spending' ? (
          <SpendingAndBills
            transactions={transactions}
            categories={categories}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onDateChange={handleDateChange}
            onUpdateTransaction={handleUpdateTransaction}
            accountStartingBalance={accountStartingBalance}
            onUpdateTransactions={setTransactions}
          />
        ) : activeSection === 'categories' ? (
          <div className="categories-section">
            <h2>Categories</h2>
            <CategorySettings
              categories={categories}
              onUpdateCategories={setCategories}
              transactions={transactions}
              onUpdateTransactions={setTransactions}
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
            />
          </div>
        ) : activeSection === 'auto-categorization' ? (
          <AutoCategorization
            merchantMappings={merchantMappings}
            categoryMappings={categoryMappings}
            onDeleteMerchantMapping={handleDeleteMerchantMapping}
            onDeleteCategoryMapping={handleDeleteCategoryMapping}
          />
        ) : (
          <div className="settings-section">
            <h2>Settings</h2>
            <div className="settings-group">
              <h3>Account Starting Balance</h3>
              <input
                type="number"
                step="0.01"
                value={accountStartingBalance}
                onChange={(e) => handleUpdateAccountStartingBalance(parseFloat(e.target.value) || 0)}
                placeholder="Enter starting balance"
                className="account-balance-input"
              />
              <p className="settings-description">
                Your account balance when you started tracking. Monthly balances are calculated automatically.
              </p>
            </div>
            <div className="settings-group">
              <h3>Bill Matching Criteria</h3>
              <p className="settings-description">
                Configure how transactions are automatically matched to bills. Changes apply immediately to all bill matching.
              </p>
              <div className="settings-buttons">
                <div className="bill-matching-settings">
                  <div className="setting-row">
                    <label>Amount Tolerance ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={billMatchingSettings.amountTolerance}
                      onChange={(e) => setBillMatchingSettings({
                        ...billMatchingSettings,
                        amountTolerance: parseFloat(e.target.value) || 0
                      })}
                      className="setting-input"
                    />
                    <p className="setting-help">How much the transaction amount can differ from the bill amount. Lower values = stricter matching, higher values = more flexible.</p>
                  </div>

                  <div className="setting-row">
                    <label>Date Window (Days)</label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={billMatchingSettings.dateWindowDays}
                      onChange={(e) => setBillMatchingSettings({
                        ...billMatchingSettings,
                        dateWindowDays: parseInt(e.target.value) || 0
                      })}
                      className="setting-input"
                    />
                    <p className="setting-help">How many days before or after the due date to look for matching transactions. Smaller window = stricter, larger window = more flexible.</p>
                  </div>

                  <div className="setting-row">
                    <label>Minimum Match Score (0-100)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={billMatchingSettings.minimumScore}
                      onChange={(e) => setBillMatchingSettings({
                        ...billMatchingSettings,
                        minimumScore: parseInt(e.target.value) || 0
                      })}
                      className="setting-input"
                    />
                    <p className="setting-help">Controls overall match quality threshold. Higher scores = very strict (excellent matches only), lower scores = more lenient. Recommended: 60-80.</p>
                  </div>

                  <div className="setting-row checkbox-row">
                    <label>
                      <input
                        type="checkbox"
                        checked={billMatchingSettings.requireDescriptionMatch}
                        onChange={(e) => setBillMatchingSettings({
                          ...billMatchingSettings,
                          requireDescriptionMatch: e.target.checked
                        })}
                      />
                      Require Description Match
                    </label>
                    <p className="setting-help">Transaction description must match bill name. Unchecked = allows matching by amount and date alone (not recommended).</p>
                  </div>

                  <div className="setting-row checkbox-row">
                    <label>
                      <input
                        type="checkbox"
                        checked={billMatchingSettings.requireAmountMatch}
                        onChange={(e) => setBillMatchingSettings({
                          ...billMatchingSettings,
                          requireAmountMatch: e.target.checked
                        })}
                      />
                      Require Amount Match
                    </label>
                    <p className="setting-help">Transaction amount must be within tolerance. Unchecked = matches even if amounts differ significantly.</p>
                  </div>

                  <div className="setting-row checkbox-row">
                    <label>
                      <input
                        type="checkbox"
                        checked={billMatchingSettings.requireDateWindow}
                        onChange={(e) => setBillMatchingSettings({
                          ...billMatchingSettings,
                          requireDateWindow: e.target.checked
                        })}
                      />
                      Require Date Window
                    </label>
                    <p className="setting-help">Transaction must be within date window of due date. Unchecked = matches transactions from any date.</p>
                  </div>
                </div>
                <div className="settings-impact-note">
                  <strong>Impact:</strong> Stricter settings (higher score, smaller tolerance, all requirements checked) reduce false matches but may miss legitimate payments. Looser settings increase automatic matching but may incorrectly mark bills as paid.
                </div>
              </div>
            </div>

            <div className="settings-group">
              <h3>Demo Data</h3>
              <div className="settings-buttons">
                <button className="demo-data-btn" onClick={handleImportDemoData}>
                  Import Demo Data
                </button>
                <p className="settings-description">
                  Import sample transaction data for the past 12 months to explore the app's features.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
