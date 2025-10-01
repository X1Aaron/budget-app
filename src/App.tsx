import { useState, useEffect } from 'react';
import './App.css';
import Overview from './components/Overview.jsx';
import Spending from './components/Spending.jsx';
import Bills from './components/Bills.jsx';
import CSVImport from './components/CSVImport.jsx';
import CategorySettings from './components/CategorySettings.jsx';
import AutoCategorization from './components/AutoCategorization.jsx';
import ExportButton from './components/ExportButton.jsx';
import ImportButton from './components/ImportButton.jsx';
import MonthYearSelector from './components/MonthYearSelector.jsx';
import { DEFAULT_CATEGORIES, autoCategorize, generateMerchantName } from './utils/categories';
import { generateDemoData, generateDemoBills } from './utils/demoData';
import type {
  Transaction,
  Category,
  Bill,
  MonthlyBudget,
  MerchantMapping,
  CategoryMapping,
  ActiveSection
} from './types';

function App() {
  const [activeSection, setActiveSection] = useState<ActiveSection>('overview');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [monthlyBudgets, setMonthlyBudgets] = useState<MonthlyBudget>(() => {
    const saved = localStorage.getItem('monthlyBudgets');
    return saved ? JSON.parse(saved) : {};
  });
  const [bills, setBills] = useState<Bill[]>(() => {
    const saved = localStorage.getItem('bills');
    return saved ? JSON.parse(saved) : [];
  });

  const handleUpdateBills = (updatedBills: Bill[]) => {
    console.log('handleUpdateBills called with:', updatedBills);
    setBills(updatedBills);
  };

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

  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('accountStartingBalance', JSON.stringify(accountStartingBalance));
  }, [accountStartingBalance]);

  useEffect(() => {
    localStorage.setItem('bills', JSON.stringify(bills));
  }, [bills]);

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
      const result = autoCategorize(t.description, t.amount, t.category, categories);
      return {
        ...t,
        category: result.category,
        autoCategorized: result.wasAutoCategorized,
        merchantName: t.merchantName || t.friendlyName || generateMerchantName(t.description),
        memo: t.memo || ''
      };
    });
    setTransactions(categorizedTransactions);
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

  const handleImportTransactions = (importedTransactions: Transaction[]) => {
    // Check for duplicate transactions
    const duplicates: Transaction[] = [];
    const newTransactions: Transaction[] = [];

    importedTransactions.forEach(imported => {
      const isDuplicate = transactions.some(existing =>
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
    setTransactions(categorizedTransactions);
  };

  const handleImportCategories = (importedCategories: Category[]) => {
    // Merge imported categories with existing ones, avoiding duplicates by name
    const existingNames = new Set(categories.map(c => c.name.toLowerCase()));
    const newCategories = importedCategories.filter(
      c => !existingNames.has(c.name.toLowerCase())
    );
    setCategories([...categories, ...newCategories]);
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

  const handleImportRules = (importedMerchantMappings: MerchantMapping, importedCategoryMappings: CategoryMapping) => {
    setMerchantMappings(prev => ({
      ...prev,
      ...importedMerchantMappings
    }));
    setCategoryMappings(prev => ({
      ...prev,
      ...importedCategoryMappings
    }));
    alert('Rules imported successfully!');
  };

  const handleImportDemoData = () => {
    if (confirm('This will replace all existing transactions and bills with demo data. Are you sure?')) {
      const demoTransactions = generateDemoData();
      const demoBills = generateDemoBills();

      setTransactions(demoTransactions);
      setBills(demoBills);
      setAccountStartingBalance(5000);

      // Set all category budgets to $500 for demo data
      const updatedCategories = categories.map(cat => ({
        ...cat,
        budgeted: 500
      }));
      setCategories(updatedCategories);

      // Use setTimeout to ensure the alert shows after React has committed all state updates
      setTimeout(() => {
        alert(`Successfully imported ${demoTransactions.length} demo transactions and ${demoBills.length} demo bills for the past 12 months!`);
      }, 0);
    }
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
              <ImportButton
                activeSection={activeSection}
                onImportTransactions={handleImportTransactions}
                onImportCategories={handleImportCategories}
                onImportRules={handleImportRules}
                onImportBills={(importedBills: Bill[]) => setBills(importedBills)}
              />
              <ExportButton
                activeSection={activeSection}
                transactions={transactions}
                categories={categories}
                merchantMappings={merchantMappings}
                categoryMappings={categoryMappings}
                bills={bills}
              />
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
            Spending
          </button>
          <button
            className={'nav-btn' + (activeSection === 'bills' ? ' active' : '')}
            onClick={() => setActiveSection('bills')}
          >
            Bills
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
            bills={bills}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            monthlyBudgets={monthlyBudgets}
            accountStartingBalance={accountStartingBalance}
            onDateChange={handleDateChange}
            onUpdateBudget={handleUpdateBudget}
          />
        ) : activeSection === 'spending' ? (
          <Spending
            transactions={transactions}
            categories={categories}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onDateChange={handleDateChange}
            onUpdateTransaction={handleUpdateTransaction}
            accountStartingBalance={accountStartingBalance}
          />
        ) : activeSection === 'bills' ? (
          <Bills
            bills={bills}
            onUpdateBills={handleUpdateBills}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onDateChange={handleDateChange}
            categories={categories}
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
              <div className="settings-buttons">
                <input
                  type="number"
                  step="0.01"
                  value={accountStartingBalance}
                  onChange={(e) => handleUpdateAccountStartingBalance(parseFloat(e.target.value) || 0)}
                  placeholder="Enter account starting balance"
                  className="account-balance-input"
                />
                <p className="settings-description">
                  This is your account balance when you started tracking. Monthly balances will be calculated automatically.
                </p>
              </div>
            </div>
            <div className="settings-group">
              <h3>Import CSV</h3>
              <div className="settings-buttons">
                <CSVImport onImport={handleImport} />
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
