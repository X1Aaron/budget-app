import type { Transaction } from '../types';

// Demo merchant data with realistic descriptions and categories
const demoTransactions = [
  // Groceries
  { description: 'WHOLE FOODS MARKET #12345', category: 'Groceries', amountRange: [50, 150] },
  { description: 'TRADER JOES #456', category: 'Groceries', amountRange: [30, 80] },
  { description: 'SAFEWAY STORE 1234', category: 'Groceries', amountRange: [40, 120] },
  { description: 'COSTCO WHOLESALE #789', category: 'Groceries', amountRange: [100, 300] },
  { description: 'TARGET STORE T-2345', category: 'Groceries', amountRange: [25, 75] },

  // Dining
  { description: 'STARBUCKS STORE 12345', category: 'Dining Out', amountRange: [5, 15] },
  { description: 'CHIPOTLE MEXICAN GRILL', category: 'Dining Out', amountRange: [10, 25] },
  { description: 'PANERA BREAD #1234', category: 'Dining Out', amountRange: [12, 30] },
  { description: 'SUBWAY 12345', category: 'Dining Out', amountRange: [8, 15] },
  { description: 'OLIVE GARDEN #456', category: 'Dining Out', amountRange: [30, 60] },
  { description: 'PIZZA HUT 12345', category: 'Dining Out', amountRange: [15, 35] },
  { description: 'MCDONALDS F12345', category: 'Dining Out', amountRange: [8, 20] },
  { description: 'TACO BELL #12345', category: 'Dining Out', amountRange: [10, 20] },

  // Transportation
  { description: 'SHELL OIL 12345678', category: 'Transportation', amountRange: [40, 80] },
  { description: 'CHEVRON 12345678', category: 'Transportation', amountRange: [35, 75] },
  { description: 'UBER TRIP HELP.UBER.COM', category: 'Transportation', amountRange: [15, 40] },
  { description: 'LYFT RIDE', category: 'Transportation', amountRange: [12, 35] },
  { description: 'EXXONMOBIL 12345', category: 'Transportation', amountRange: [45, 85] },

  // Entertainment
  { description: 'NETFLIX.COM', category: 'Entertainment', amountRange: [15, 20] },
  { description: 'SPOTIFY USA', category: 'Entertainment', amountRange: [10, 15] },
  { description: 'AMAZON PRIME VIDEO', category: 'Entertainment', amountRange: [8, 15] },
  { description: 'AMC THEATRES #12345', category: 'Entertainment', amountRange: [15, 50] },
  { description: 'STEAM GAMES', category: 'Entertainment', amountRange: [20, 60] },
  { description: 'APPLE.COM/BILL', category: 'Entertainment', amountRange: [5, 30] },

  // Shopping
  { description: 'AMAZON.COM*123456789', category: 'Shopping', amountRange: [20, 150] },
  { description: 'AMAZON MARKETPLACE', category: 'Shopping', amountRange: [15, 100] },
  { description: 'WAL-MART #1234', category: 'Shopping', amountRange: [30, 120] },
  { description: 'BEST BUY STORE #1234', category: 'Shopping', amountRange: [50, 300] },
  { description: 'HOME DEPOT #1234', category: 'Shopping', amountRange: [40, 200] },
  { description: 'MACYS #1234', category: 'Shopping', amountRange: [30, 150] },

  // Utilities
  { description: 'PG&E UTILITY PAYMENT', category: 'Utilities', amountRange: [80, 150] },
  { description: 'COMCAST CABLE COMM', category: 'Utilities', amountRange: [60, 120] },
  { description: 'AT&T WIRELESS', category: 'Utilities', amountRange: [50, 100] },
  { description: 'VERIZON WIRELESS', category: 'Utilities', amountRange: [60, 110] },

  // Healthcare
  { description: 'WALGREENS #12345', category: 'Healthcare', amountRange: [10, 50] },
  { description: 'CVS/PHARMACY #12345', category: 'Healthcare', amountRange: [15, 60] },
  { description: 'KAISER PERMANENTE', category: 'Healthcare', amountRange: [20, 100] },

  // Income (negative amounts)
  { description: 'PAYROLL DEPOSIT - ACME CORP', category: 'Income', amountRange: [-3000, -2500] },
  { description: 'DIRECT DEPOSIT PAYROLL', category: 'Income', amountRange: [-3200, -2800] },
];

function getRandomAmount(range: [number, number]): number {
  const [min, max] = range;
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function getRandomDate(year: number, month: number): string {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const day = Math.floor(Math.random() * daysInMonth) + 1;
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function generateDemoData(): Transaction[] {
  const transactions: Transaction[] = [];
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  // Generate data for the past 12 months
  for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
    const date = new Date(currentYear, currentDate.getMonth() - monthOffset, 1);
    const year = date.getFullYear();
    const month = date.getMonth();

    // Generate 30-60 transactions per month
    const transactionCount = Math.floor(Math.random() * 30) + 30;

    for (let i = 0; i < transactionCount; i++) {
      const template = demoTransactions[Math.floor(Math.random() * demoTransactions.length)];
      const amount = getRandomAmount(template.amountRange);

      transactions.push({
        date: getRandomDate(year, month),
        description: template.description,
        amount: amount,
        category: template.category,
        merchantName: template.description.split(' ')[0],
        memo: '',
        autoCategorized: false
      });
    }

    // Add consistent bills every month
    // Rent/Mortgage
    transactions.push({
      date: getRandomDate(year, month),
      description: 'PROPERTY MANAGEMENT RENT',
      amount: 1500,
      category: 'Housing',
      merchantName: 'Property Management',
      memo: 'Monthly rent',
      autoCategorized: false
    });

    // Internet
    transactions.push({
      date: getRandomDate(year, month),
      description: 'COMCAST INTERNET',
      amount: 79.99,
      category: 'Utilities',
      merchantName: 'Comcast',
      memo: '',
      autoCategorized: false
    });

    // Phone
    transactions.push({
      date: getRandomDate(year, month),
      description: 'VERIZON WIRELESS',
      amount: 85,
      category: 'Utilities',
      merchantName: 'Verizon',
      memo: '',
      autoCategorized: false
    });

    // Paycheck (twice a month)
    transactions.push({
      date: `${year}-${String(month + 1).padStart(2, '0')}-15`,
      description: 'PAYROLL DEPOSIT - ACME CORP',
      amount: -2800,
      category: 'Income',
      merchantName: 'ACME Corp',
      memo: 'Bi-weekly paycheck',
      autoCategorized: false
    });

    transactions.push({
      date: `${year}-${String(month + 1).padStart(2, '0')}-${month === 1 ? '28' : '30'}`,
      description: 'PAYROLL DEPOSIT - ACME CORP',
      amount: -2800,
      category: 'Income',
      merchantName: 'ACME Corp',
      memo: 'Bi-weekly paycheck',
      autoCategorized: false
    });
  }

  // Sort by date descending
  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return transactions;
}
