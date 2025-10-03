import { useState, useEffect } from 'react';
import './App.css';
import { Dashboard } from './components/features/dashboard';
import { Bills } from './components/features/bills';
import { Income } from './components/features/income';
import { Transactions } from './components/features/transactions';
import { CategorySettings, AutoCategorization } from './components/features/categories';
import { MonthYearSelector } from './components/ui/forms';
import { DEFAULT_CATEGORIES, autoCategorize, generateMerchantName } from './utils/categories';
import { generateDemoData } from './utils/demoData';
import { useTheme } from './contexts/ThemeContext';
import type {
  Transaction,
  Bill,
  Category,
  MerchantMapping,
  CategoryMapping,
  ActiveSection,
  BillMatchingSettings,
  RecurringIncome
} from './types';

function App() {
  const { theme, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<ActiveSection>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bills, setBills] = useState<Bill[]>(() => {
    const saved = localStorage.getItem('bills');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());

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
  const [disabledKeywords, setDisabledKeywords] = useState<{ [category: string]: string[] }>(() => {
    const saved = localStorage.getItem('disabledKeywords');
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
  const [recurringIncomes, setRecurringIncomes] = useState<RecurringIncome[]>(() => {
    const saved = localStorage.getItem('recurringIncomes');
    return saved ? JSON.parse(saved) : [];
  });
  const [billConversionData, setBillConversionData] = useState<Transaction | null>(null);

  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('bills', JSON.stringify(bills));
  }, [bills]);

  useEffect(() => {
    localStorage.setItem('accountStartingBalance', JSON.stringify(accountStartingBalance));
  }, [accountStartingBalance]);

  useEffect(() => {
    localStorage.setItem('merchantMappings', JSON.stringify(merchantMappings));
  }, [merchantMappings]);

  useEffect(() => {
    localStorage.setItem('categoryMappings', JSON.stringify(categoryMappings));
  }, [categoryMappings]);

  useEffect(() => {
    localStorage.setItem('disabledKeywords', JSON.stringify(disabledKeywords));
  }, [disabledKeywords]);

  useEffect(() => {
    localStorage.setItem('billMatchingSettings', JSON.stringify(billMatchingSettings));
  }, [billMatchingSettings]);

  useEffect(() => {
    localStorage.setItem('recurringIncomes', JSON.stringify(recurringIncomes));
  }, [recurringIncomes]);

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
      const result = autoCategorize(t.description, t.amount, t.category, categories, categoryMappings, disabledKeywords);
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

        // Store rule details on the transaction
        updatedTransaction.categorizationRule = {
          type: 'exact',
          description: description
        };
      }

      newTransactions[index] = updatedTransaction;
    }

    setTransactions(newTransactions);
  };

  const handleDateChange = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
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

  const handleToggleKeyword = (category: string, keyword: string) => {
    setDisabledKeywords(prev => {
      const categoryKeywords = prev[category] || [];
      const isCurrentlyDisabled = categoryKeywords.includes(keyword);

      if (isCurrentlyDisabled) {
        // Re-enable the keyword
        return {
          ...prev,
          [category]: categoryKeywords.filter(k => k !== keyword)
        };
      } else {
        // Disable the keyword
        return {
          ...prev,
          [category]: [...categoryKeywords, keyword]
        };
      }
    });
  };

  const handleAddExactRule = (description: string, category: string, merchantName?: string) => {
    // Add to category mappings
    setCategoryMappings(prev => ({
      ...prev,
      [description]: category
    }));

    // Add to merchant mappings if provided
    if (merchantName) {
      setMerchantMappings(prev => ({
        ...prev,
        [description]: merchantName
      }));
    }
  };

  const handleAddKeywordToCategory = (categoryName: string, keyword: string) => {
    setCategories(prev => prev.map(cat => {
      if (cat.name === categoryName) {
        const keywords = cat.keywords || [];
        // Only add if not already present
        if (!keywords.includes(keyword)) {
          return {
            ...cat,
            keywords: [...keywords, keyword]
          };
        }
      }
      return cat;
    }));
  };

  const handleConvertTransactionToBill = (transactionId: string) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (transaction) {
      setBillConversionData(transaction);
      setActiveSection('bills');
    }
  };

  const handleImportDemoData = () => {
    const demoTransactions = generateDemoData();
    setTransactions(demoTransactions);
    setAccountStartingBalance(5000);

    // Create realistic bills for average American family
    const today = new Date();
    const demoBills: Bill[] = [
      {
        id: crypto.randomUUID(),
        date: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0],
        description: 'Rent/Mortgage',
        amount: -2100,
        category: 'Housing',
        isBill: true,
        billName: 'Rent/Mortgage',
        billAmount: 2100,
        dueDate: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0],
        frequency: 'monthly',
        payments: []
      },
      {
        id: crypto.randomUUID(),
        date: new Date(today.getFullYear(), today.getMonth(), 15).toISOString().split('T')[0],
        description: 'Car Insurance',
        amount: -120,
        category: 'Insurance',
        isBill: true,
        billName: 'Car Insurance',
        billAmount: 120,
        dueDate: new Date(today.getFullYear(), today.getMonth(), 15).toISOString().split('T')[0],
        frequency: 'monthly',
        payments: []
      },
      {
        id: crypto.randomUUID(),
        date: new Date(today.getFullYear(), today.getMonth(), 5).toISOString().split('T')[0],
        description: 'Internet',
        amount: -70,
        category: 'Utilities',
        isBill: true,
        billName: 'Internet',
        billAmount: 70,
        dueDate: new Date(today.getFullYear(), today.getMonth(), 5).toISOString().split('T')[0],
        frequency: 'monthly',
        payments: []
      },
      {
        id: crypto.randomUUID(),
        date: new Date(today.getFullYear(), today.getMonth(), 12).toISOString().split('T')[0],
        description: 'Electric Bill',
        amount: -95,
        category: 'Utilities',
        isBill: true,
        billName: 'Electric Bill',
        billAmount: 95,
        dueDate: new Date(today.getFullYear(), today.getMonth(), 12).toISOString().split('T')[0],
        frequency: 'monthly',
        payments: []
      },
      {
        id: crypto.randomUUID(),
        date: new Date(today.getFullYear(), today.getMonth(), 20).toISOString().split('T')[0],
        description: 'Water Bill',
        amount: -45,
        category: 'Utilities',
        isBill: true,
        billName: 'Water Bill',
        billAmount: 45,
        dueDate: new Date(today.getFullYear(), today.getMonth(), 20).toISOString().split('T')[0],
        frequency: 'monthly',
        payments: []
      },
      {
        id: crypto.randomUUID(),
        date: new Date(today.getFullYear(), today.getMonth(), 10).toISOString().split('T')[0],
        description: 'Phone Bill',
        amount: -55,
        category: 'Phone',
        isBill: true,
        billName: 'Phone Bill',
        billAmount: 55,
        dueDate: new Date(today.getFullYear(), today.getMonth(), 10).toISOString().split('T')[0],
        frequency: 'monthly',
        payments: []
      },
      {
        id: crypto.randomUUID(),
        date: new Date(today.getFullYear(), today.getMonth(), 10).toISOString().split('T')[0],
        description: 'Student Loan',
        amount: -285,
        category: 'Debt Payments',
        isBill: true,
        billName: 'Student Loan',
        billAmount: 285,
        dueDate: new Date(today.getFullYear(), today.getMonth(), 10).toISOString().split('T')[0],
        frequency: 'monthly',
        payments: []
      },
      {
        id: crypto.randomUUID(),
        date: new Date(today.getFullYear(), today.getMonth(), 20).toISOString().split('T')[0],
        description: 'Credit Card Payment',
        amount: -200,
        category: 'Debt Payments',
        isBill: true,
        billName: 'Credit Card Payment',
        billAmount: 200,
        dueDate: new Date(today.getFullYear(), today.getMonth(), 20).toISOString().split('T')[0],
        frequency: 'monthly',
        payments: []
      },
      {
        id: crypto.randomUUID(),
        date: new Date(today.getFullYear(), today.getMonth(), 8).toISOString().split('T')[0],
        description: 'Netflix',
        amount: -22.99,
        category: 'Subscriptions',
        isBill: true,
        billName: 'Netflix',
        billAmount: 22.99,
        dueDate: new Date(today.getFullYear(), today.getMonth(), 8).toISOString().split('T')[0],
        frequency: 'monthly',
        payments: []
      },
      {
        id: crypto.randomUUID(),
        date: new Date(today.getFullYear(), today.getMonth(), 12).toISOString().split('T')[0],
        description: 'Spotify',
        amount: -11.99,
        category: 'Subscriptions',
        isBill: true,
        billName: 'Spotify',
        billAmount: 11.99,
        dueDate: new Date(today.getFullYear(), today.getMonth(), 12).toISOString().split('T')[0],
        frequency: 'monthly',
        payments: []
      },
      {
        id: crypto.randomUUID(),
        date: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0],
        description: 'Gym Membership',
        amount: -24.99,
        category: 'Fitness & Gym',
        isBill: true,
        billName: 'Gym Membership',
        billAmount: 24.99,
        dueDate: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0],
        frequency: 'monthly',
        payments: []
      }
    ];

    setBills(demoBills);

    // Create realistic recurring income for average American family
    // Bi-weekly paychecks (every other Friday) - $1,500 per paycheck = ~$3,000/month
    const nextFriday = new Date(today);
    nextFriday.setDate(today.getDate() + ((5 - today.getDay() + 7) % 7));

    const demoIncomes: RecurringIncome[] = [
      {
        id: crypto.randomUUID(),
        name: 'Primary Income - Salary',
        amount: 1500,
        startDate: nextFriday.toISOString().split('T')[0],
        frequency: 'bi-weekly'
      }
    ];

    setRecurringIncomes(demoIncomes);

    // Set realistic category budgets based on demo data spending patterns
    // These are designed so some are over, some under, and some on target
    const demoCategoryBudgets: { [categoryName: string]: number } = {
      'Groceries': 700,           // Under budget (~$600/mo avg)
      'Dining Out': 400,           // Over budget (~$500/mo avg)
      'Gas & Fuel': 200,           // On target (~$200/mo avg)
      'Subscriptions': 120,        // On target (~$115/mo avg)
      'General Shopping': 200,     // Over budget (~$250/mo avg)
      'Housing': 2100,             // On target (~$2100/mo)
      'Utilities': 220,            // Slightly under (~$210/mo avg)
      'Phone': 55,                 // On target (~$55/mo)
      'Insurance': 120,            // On target (~$120/mo)
      'Healthcare': 80,            // Under budget (~$40/mo avg)
      'Personal Care': 100,        // Over budget (~$120/mo avg)
      'Entertainment': 40,         // Under budget (~$20/mo avg)
      'Fitness & Gym': 25,         // On target (~$25/mo)
      'Debt Payments': 500,        // Under budget (~$450/mo avg)
      'Electronics': 80,           // Under budget (~$50/mo avg)
      'Clothing': 60,              // Over budget (~$80/mo avg)
      'Gaming': 30,                // Under budget (~$20/mo avg)
      'Income': 0                  // Income category, no budget needed
    };

    // Update existing categories with budgets
    const updatedCategories = categories.map(cat => ({
      ...cat,
      budgeted: demoCategoryBudgets[cat.name] || 0
    }));

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
            className={'nav-btn' + (activeSection === 'dashboard' ? ' active' : '')}
            onClick={() => setActiveSection('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={'nav-btn' + (activeSection === 'transactions' ? ' active' : '')}
            onClick={() => setActiveSection('transactions')}
          >
            Transactions
          </button>
          <button
            className={'nav-btn' + (activeSection === 'bills' ? ' active' : '')}
            onClick={() => setActiveSection('bills')}
          >
            Bills
          </button>
          <button
            className={'nav-btn' + (activeSection === 'income' ? ' active' : '')}
            onClick={() => setActiveSection('income')}
          >
            Income
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
            Rules
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
        {activeSection === 'dashboard' ? (
          <Dashboard
            transactions={transactions}
            categories={categories}
            bills={bills}
            recurringIncomes={recurringIncomes}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            accountStartingBalance={accountStartingBalance}
            onDateChange={handleDateChange}
            onNavigate={setActiveSection}
            onImportDemoData={handleImportDemoData}
            onMarkBillPaid={(billId: string, dueDate: string) => {
              setBills(prev => prev.map(b => {
                if (b.id === billId) {
                  const paidDates = b.paidDates || [];
                  if (!paidDates.includes(dueDate)) {
                    return { ...b, paidDates: [...paidDates, dueDate] };
                  }
                }
                return b;
              }));
            }}
          />
        ) : activeSection === 'transactions' ? (
          <Transactions
            transactions={transactions}
            categories={categories}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onUpdateTransaction={handleUpdateTransaction}
            accountStartingBalance={accountStartingBalance}
            onUpdateTransactions={setTransactions}
            categoryMappings={categoryMappings}
            disabledKeywords={disabledKeywords}
            onConvertToBill={handleConvertTransactionToBill}
          />
        ) : activeSection === 'bills' ? (
          <Bills
            transactions={transactions}
            bills={bills}
            categories={categories}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onUpdateTransactions={setTransactions}
            onUpdateBills={setBills}
            billMatchingSettings={billMatchingSettings}
            conversionData={billConversionData}
            onConversionComplete={() => setBillConversionData(null)}
          />
        ) : activeSection === 'income' ? (
          <Income
            recurringIncomes={recurringIncomes}
            onUpdateRecurringIncomes={setRecurringIncomes}
            categories={categories}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
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
              categoryMappings={categoryMappings}
              disabledKeywords={disabledKeywords}
            />
          </div>
        ) : activeSection === 'auto-categorization' ? (
          <AutoCategorization
            merchantMappings={merchantMappings}
            categoryMappings={categoryMappings}
            onDeleteMerchantMapping={handleDeleteMerchantMapping}
            onDeleteCategoryMapping={handleDeleteCategoryMapping}
            categories={categories}
            disabledKeywords={disabledKeywords}
            onToggleKeyword={handleToggleKeyword}
            onAddExactRule={handleAddExactRule}
            onAddKeywordToCategory={handleAddKeywordToCategory}
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
              <h3>Data Backup & Restore</h3>
              <p className="settings-description">
                All data is stored locally in your browser. Export your data to create a backup, and import it to restore.
              </p>
              <div className="settings-buttons">
                <button className="export-data-btn" onClick={() => {
                  const exportData = {
                    version: '1.0',
                    exportDate: new Date().toISOString(),
                    data: {
                      transactions,
                      bills,
                      categories,
                      accountStartingBalance,
                      merchantMappings,
                      categoryMappings,
                      disabledKeywords,
                      billMatchingSettings,
                      recurringIncomes
                    }
                  };

                  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `budget-backup-${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}>
                  Export All Data
                </button>
                <label className="import-data-btn">
                  Import Data
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      const reader = new FileReader();
                      reader.onload = (event) => {
                        try {
                          const importedData = JSON.parse(event.target?.result as string);

                          if (!importedData.version || !importedData.data) {
                            alert('Invalid backup file format');
                            return;
                          }

                          if (!confirm('This will replace ALL your current data. Are you sure? This cannot be undone!')) {
                            return;
                          }

                          const data = importedData.data;

                          // Import all data
                          if (data.transactions) setTransactions(data.transactions);
                          if (data.bills) setBills(data.bills);
                          if (data.categories) setCategories(data.categories);
                          if (data.accountStartingBalance !== undefined) setAccountStartingBalance(data.accountStartingBalance);
                          if (data.merchantMappings) setMerchantMappings(data.merchantMappings);
                          if (data.categoryMappings) setCategoryMappings(data.categoryMappings);
                          if (data.disabledKeywords) setDisabledKeywords(data.disabledKeywords);
                          if (data.billMatchingSettings) setBillMatchingSettings(data.billMatchingSettings);
                          if (data.recurringIncomes) setRecurringIncomes(data.recurringIncomes);

                          alert(`Successfully imported data from backup created on ${new Date(importedData.exportDate).toLocaleDateString()}`);
                        } catch (error) {
                          alert('Error importing data: ' + (error as Error).message);
                        }
                      };
                      reader.readAsText(file);
                      // Reset input so same file can be selected again
                      e.target.value = '';
                    }}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
              <p className="settings-warning">
                ⚠️ Importing will replace ALL existing data. Export a backup first!
              </p>
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

            <div className="settings-group danger-zone">
              <h3>Danger Zone</h3>
              <p className="settings-description">
                Permanently delete all your data. This action cannot be undone!
              </p>
              <div className="settings-buttons">
                <button className="clear-data-btn" onClick={() => {
                  if (!confirm('⚠️ WARNING: This will permanently delete ALL your data including transactions, bills, categories, and settings. This action CANNOT be undone!\n\nAre you absolutely sure you want to continue?')) {
                    return;
                  }

                  // Double confirmation
                  if (!confirm('This is your last chance! Click OK to permanently delete everything, or Cancel to go back.')) {
                    return;
                  }

                  // Clear all state
                  setTransactions([]);
                  setBills([]);
                  setCategories(DEFAULT_CATEGORIES);
                  setAccountStartingBalance(0);
                  setMerchantMappings({});
                  setCategoryMappings({});
                  setDisabledKeywords({});
                  setBillMatchingSettings({
                    amountTolerance: 5,
                    dateWindowDays: 7,
                    minimumScore: 60,
                    requireDescriptionMatch: true,
                    requireAmountMatch: true,
                    requireDateWindow: true
                  });
                  setRecurringIncomes([]);

                  // Clear localStorage
                  localStorage.removeItem('transactions');
                  localStorage.removeItem('bills');
                  localStorage.removeItem('categories');
                  localStorage.removeItem('accountStartingBalance');
                  localStorage.removeItem('merchantMappings');
                  localStorage.removeItem('categoryMappings');
                  localStorage.removeItem('disabledKeywords');
                  localStorage.removeItem('billMatchingSettings');
                  localStorage.removeItem('recurringIncomes');

                  alert('All data has been cleared successfully.');
                }}>
                  Clear All Data
                </button>
              </div>
              <p className="settings-warning">
                ⚠️ This will permanently delete everything. Export a backup first if you want to keep your data!
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
