import type { Transaction, Bill } from '../types';

// Demo merchant data with realistic descriptions and categories
const demoTransactions = [
  // Groceries - targeting ~$400-500/month (weekly shopping)
  { description: 'WHOLE FOODS MARKET #12345', category: 'Food & Dining', amountRange: [60, 90] },
  { description: 'TRADER JOES #456', category: 'Food & Dining', amountRange: [40, 60] },
  { description: 'SAFEWAY STORE 1234', category: 'Food & Dining', amountRange: [50, 80] },
  { description: 'COSTCO WHOLESALE #789', category: 'Food & Dining', amountRange: [80, 120] },

  // Dining - targeting ~$300/month
  { description: 'STARBUCKS STORE 12345', category: 'Food & Dining', amountRange: [5, 12] },
  { description: 'CHIPOTLE MEXICAN GRILL', category: 'Food & Dining', amountRange: [12, 18] },
  { description: 'PANERA BREAD #1234', category: 'Food & Dining', amountRange: [10, 15] },
  { description: 'SUBWAY 12345', category: 'Food & Dining', amountRange: [8, 12] },
  { description: 'PIZZA HUT 12345', category: 'Food & Dining', amountRange: [20, 30] },
  { description: 'MCDONALDS F12345', category: 'Food & Dining', amountRange: [8, 12] },

  // Transportation - targeting ~$250/month (gas)
  { description: 'SHELL OIL 12345678', category: 'Transportation', amountRange: [45, 65] },
  { description: 'CHEVRON 12345678', category: 'Transportation', amountRange: [45, 65] },
  { description: 'EXXONMOBIL 12345', category: 'Transportation', amountRange: [40, 60] },

  // Entertainment - targeting ~$100/month
  { description: 'NETFLIX.COM', category: 'Entertainment', amountRange: [15, 20] },
  { description: 'SPOTIFY USA', category: 'Entertainment', amountRange: [10, 15] },
  { description: 'AMC THEATRES #12345', category: 'Entertainment', amountRange: [25, 40] },
  { description: 'STEAM GAMES', category: 'Entertainment', amountRange: [20, 40] },

  // Shopping - targeting ~$200/month
  { description: 'AMAZON.COM*123456789', category: 'Shopping', amountRange: [25, 80] },
  { description: 'TARGET STORE T-2345', category: 'Shopping', amountRange: [30, 60] },
  { description: 'WAL-MART #1234', category: 'Shopping', amountRange: [25, 50] },

  // Healthcare - targeting ~$50/month
  { description: 'WALGREENS #12345', category: 'Healthcare', amountRange: [15, 30] },
  { description: 'CVS/PHARMACY #12345', category: 'Healthcare', amountRange: [20, 40] },

  // Income (positive amounts) - ~$1500/week = ~$6000/month for weekly paychecks
  { description: 'PAYROLL DEPOSIT - ACME CORP', category: 'Income', amountRange: [1400, 1600] },
  { description: 'DIRECT DEPOSIT PAYROLL', category: 'Income', amountRange: [1400, 1600] },
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

function getRandomDay(): number {
  return Math.floor(Math.random() * 28) + 1; // 1-28 to ensure valid for all months
}

// Demo bill templates
const demoBillTemplates = [
  { name: 'Electric Bill', category: 'Bills & Fees', amountRange: [80, 150], frequency: 'monthly' as const },
  { name: 'Water Bill', category: 'Bills & Fees', amountRange: [40, 80], frequency: 'monthly' as const },
  { name: 'Internet Service', category: 'Bills & Fees', amountRange: [60, 120], frequency: 'monthly' as const },
  { name: 'Phone Bill', category: 'Bills & Fees', amountRange: [50, 100], frequency: 'monthly' as const },
  { name: 'Gym Membership', category: 'Personal Care', amountRange: [30, 80], frequency: 'monthly' as const },
  { name: 'Streaming Service', category: 'Entertainment', amountRange: [10, 20], frequency: 'monthly' as const },
  { name: 'Car Insurance', category: 'Transportation', amountRange: [100, 200], frequency: 'monthly' as const },
  { name: 'Rent/Mortgage', category: 'Housing', amountRange: [1200, 2000], frequency: 'monthly' as const },
  { name: 'Cloud Storage', category: 'Shopping', amountRange: [5, 15], frequency: 'monthly' as const },
  { name: 'Credit Card Payment', category: 'Bills & Fees', amountRange: [100, 500], frequency: 'monthly' as const },
];

export function generateDemoData(): Transaction[] {
  const transactions: Transaction[] = [];
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  // Generate data for the past 12 months
  for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
    const date = new Date(currentYear, currentDate.getMonth() - monthOffset, 1);
    const year = date.getFullYear();
    const month = date.getMonth();

    // Generate 25-35 transactions per month
    const transactionCount = Math.floor(Math.random() * 10) + 25;

    for (let i = 0; i < transactionCount; i++) {
      const template = demoTransactions[Math.floor(Math.random() * demoTransactions.length)];
      const amount = getRandomAmount(template.amountRange);
      // Income is positive, expenses are negative
      const finalAmount = template.category === 'Income' ? amount : -amount;

      transactions.push({
        date: getRandomDate(year, month),
        description: template.description,
        amount: finalAmount,
        category: template.category,
        merchantName: template.description.split(' ')[0],
        memo: '',
        autoCategorized: false
      });
    }

    // Add consistent bills every month
    // Rent/Mortgage - $1400/month
    transactions.push({
      date: getRandomDate(year, month),
      description: 'PROPERTY MANAGEMENT RENT',
      amount: -1400,
      category: 'Housing',
      merchantName: 'Property Management',
      memo: 'Monthly rent',
      autoCategorized: false
    });

    // Internet - $70/month
    transactions.push({
      date: getRandomDate(year, month),
      description: 'COMCAST INTERNET',
      amount: -70,
      category: 'Bills & Fees',
      merchantName: 'Comcast',
      memo: '',
      autoCategorized: false
    });

    // Phone - $55/month
    transactions.push({
      date: getRandomDate(year, month),
      description: 'VERIZON WIRELESS',
      amount: -55,
      category: 'Bills & Fees',
      merchantName: 'Verizon',
      memo: '',
      autoCategorized: false
    });

    // Electric - $90/month
    transactions.push({
      date: getRandomDate(year, month),
      description: 'PG&E ELECTRIC',
      amount: -90,
      category: 'Bills & Fees',
      merchantName: 'PG&E',
      memo: '',
      autoCategorized: false
    });

    // Car Insurance - $120/month
    transactions.push({
      date: getRandomDate(year, month),
      description: 'GEICO AUTO INSURANCE',
      amount: -120,
      category: 'Transportation',
      merchantName: 'GEICO',
      memo: '',
      autoCategorized: false
    });

    // Weekly paychecks - $1500/week
    const weeksInMonth = Math.ceil(new Date(year, month + 1, 0).getDate() / 7);
    for (let week = 0; week < weeksInMonth; week++) {
      const weekDay = 7 + (week * 7); // Pay every Friday
      const payDay = Math.min(weekDay, new Date(year, month + 1, 0).getDate());

      transactions.push({
        date: `${year}-${String(month + 1).padStart(2, '0')}-${String(payDay).padStart(2, '0')}`,
        description: 'PAYROLL DEPOSIT - ACME CORP',
        amount: 1500,
        category: 'Income',
        merchantName: 'ACME Corp',
        memo: 'Weekly paycheck',
        autoCategorized: false
      });
    }
  }

  // Sort by date descending
  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return transactions;
}

export function generateDemoBills(): Bill[] {
  const bills: Bill[] = [];
  const currentDate = new Date();

  // Randomly select 5 bill templates
  const shuffled = [...demoBillTemplates].sort(() => 0.5 - Math.random());
  const selectedTemplates = shuffled.slice(0, 5);

  selectedTemplates.forEach((template, index) => {
    const amount = getRandomAmount(template.amountRange);
    const dueDay = getRandomDay();

    bills.push({
      id: `demo-bill-${Date.now()}-${index}`,
      name: template.name,
      amount: amount,
      dueDate: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}` as any,
      category: template.category,
      frequency: template.frequency,
      memo: 'Demo bill',
      paidDates: []
    } as any);
  });

  return bills;
}
