import type { Transaction, Bill } from '../types';

// Demo merchant data with realistic descriptions, categories, and frequency patterns
interface TransactionTemplate {
  description: string;
  category: string;
  amountRange: [number, number];
  frequency?: 'weekly' | 'biweekly' | 'monthly' | 'occasional';
  preferredDays?: number[]; // 0 = Sunday, 6 = Saturday
}

const demoTransactions: TransactionTemplate[] = [
  // Groceries - weekly shopping on weekends
  { description: 'WHOLE FOODS MARKET #12345', category: 'Food & Dining', amountRange: [60, 90], frequency: 'weekly', preferredDays: [6, 0] },
  { description: 'TRADER JOES #456', category: 'Food & Dining', amountRange: [40, 60], frequency: 'weekly', preferredDays: [6, 0] },
  { description: 'SAFEWAY STORE 1234', category: 'Food & Dining', amountRange: [50, 80], frequency: 'weekly', preferredDays: [6, 0] },
  { description: 'COSTCO WHOLESALE #789', category: 'Food & Dining', amountRange: [80, 120], frequency: 'biweekly', preferredDays: [6, 0] },

  // Coffee & quick meals on weekdays
  { description: 'STARBUCKS STORE 12345', category: 'Food & Dining', amountRange: [5, 12], frequency: 'occasional', preferredDays: [1, 2, 3, 4, 5] },
  { description: 'DUNKIN DONUTS #789', category: 'Food & Dining', amountRange: [4, 10], frequency: 'occasional', preferredDays: [1, 2, 3, 4, 5] },

  // Dining out - weekend restaurants
  { description: 'CHIPOTLE MEXICAN GRILL', category: 'Food & Dining', amountRange: [12, 18], frequency: 'occasional', preferredDays: [1, 2, 3, 4, 5] },
  { description: 'PANERA BREAD #1234', category: 'Food & Dining', amountRange: [10, 15], frequency: 'occasional', preferredDays: [6, 0] },
  { description: 'SUBWAY 12345', category: 'Food & Dining', amountRange: [8, 12], frequency: 'occasional', preferredDays: [1, 2, 3, 4, 5] },
  { description: 'PIZZA HUT 12345', category: 'Food & Dining', amountRange: [20, 30], frequency: 'occasional', preferredDays: [5, 6] },
  { description: 'OLIVE GARDEN #456', category: 'Food & Dining', amountRange: [35, 55], frequency: 'occasional', preferredDays: [5, 6, 0] },
  { description: 'MCDONALDS F12345', category: 'Food & Dining', amountRange: [8, 12], frequency: 'occasional', preferredDays: [1, 2, 3, 4, 5] },

  // Gas - weekly fillups
  { description: 'SHELL OIL 12345678', category: 'Transportation', amountRange: [45, 65], frequency: 'weekly' },
  { description: 'CHEVRON 12345678', category: 'Transportation', amountRange: [45, 65], frequency: 'weekly' },
  { description: 'EXXONMOBIL 12345', category: 'Transportation', amountRange: [40, 60], frequency: 'weekly' },

  // Monthly subscriptions
  { description: 'NETFLIX.COM', category: 'Entertainment', amountRange: [15.49, 15.49], frequency: 'monthly' },
  { description: 'SPOTIFY USA', category: 'Entertainment', amountRange: [10.99, 10.99], frequency: 'monthly' },
  { description: 'DISNEY+ SUBSCRIPTION', category: 'Entertainment', amountRange: [7.99, 7.99], frequency: 'monthly' },
  { description: 'YOUTUBE PREMIUM', category: 'Entertainment', amountRange: [11.99, 11.99], frequency: 'monthly' },

  // Occasional entertainment
  { description: 'AMC THEATRES #12345', category: 'Entertainment', amountRange: [25, 40], frequency: 'occasional', preferredDays: [5, 6, 0] },
  { description: 'STEAM GAMES', category: 'Entertainment', amountRange: [20, 60], frequency: 'occasional' },

  // Shopping - occasional purchases
  { description: 'AMAZON.COM*123456789', category: 'Shopping', amountRange: [25, 80], frequency: 'occasional' },
  { description: 'TARGET STORE T-2345', category: 'Shopping', amountRange: [30, 60], frequency: 'occasional', preferredDays: [6, 0] },
  { description: 'WAL-MART #1234', category: 'Shopping', amountRange: [25, 50], frequency: 'occasional' },
  { description: 'BEST BUY #12345', category: 'Shopping', amountRange: [40, 150], frequency: 'occasional' },

  // Healthcare - occasional
  { description: 'WALGREENS #12345', category: 'Healthcare', amountRange: [15, 30], frequency: 'occasional' },
  { description: 'CVS/PHARMACY #12345', category: 'Healthcare', amountRange: [20, 40], frequency: 'occasional' },

  // Personal Care
  { description: 'PLANET FITNESS', category: 'Personal Care', amountRange: [10, 10], frequency: 'monthly' },
  { description: 'SUPERCUTS #456', category: 'Personal Care', amountRange: [20, 35], frequency: 'occasional' },
  { description: 'ULTA BEAUTY', category: 'Personal Care', amountRange: [25, 60], frequency: 'occasional' },
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

function getDateOnDay(year: number, month: number, dayOfWeek: number, weekNumber: number = 1): string {
  const firstDay = new Date(year, month, 1);
  const firstDayOfWeek = firstDay.getDay();

  // Calculate days until target day of week
  let daysUntilTarget = (dayOfWeek - firstDayOfWeek + 7) % 7;

  // Add weeks
  daysUntilTarget += (weekNumber - 1) * 7;

  const targetDate = new Date(year, month, 1 + daysUntilTarget);

  // Make sure we're still in the same month
  if (targetDate.getMonth() !== month) {
    return getRandomDate(year, month);
  }

  return `${year}-${String(month + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
}

function getAllFridaysInMonth(year: number, month: number): string[] {
  const fridays: string[] = [];
  const date = new Date(year, month, 1);

  // Find the first Friday
  while (date.getDay() !== 5) {
    date.setDate(date.getDate() + 1);
  }

  // Collect all Fridays in the month
  while (date.getMonth() === month) {
    fridays.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
    date.setDate(date.getDate() + 7);
  }

  return fridays;
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

    // Track which week we're on for biweekly transactions
    let biweeklyCounter = monthOffset % 2;

    // Process each transaction template based on frequency
    demoTransactions.forEach(template => {
      if (template.frequency === 'weekly') {
        // Add 4-5 times per month (once per week)
        const weeksInMonth = 4;
        for (let week = 0; week < weeksInMonth; week++) {
          const amount = getRandomAmount(template.amountRange);
          let transactionDate: string;

          if (template.preferredDays && template.preferredDays.length > 0) {
            // Pick a random preferred day
            const dayOfWeek = template.preferredDays[Math.floor(Math.random() * template.preferredDays.length)];
            transactionDate = getDateOnDay(year, month, dayOfWeek, week + 1);
          } else {
            transactionDate = getRandomDate(year, month);
          }

          transactions.push({
            date: transactionDate,
            description: template.description,
            amount: -amount,
            category: template.category,
            merchantName: template.description.split(' ')[0],
            memo: '',
            autoCategorized: false
          });
        }
      } else if (template.frequency === 'biweekly') {
        // Add 2 times per month
        if (biweeklyCounter === 0) {
          for (let i = 0; i < 2; i++) {
            const amount = getRandomAmount(template.amountRange);
            let transactionDate: string;

            if (template.preferredDays && template.preferredDays.length > 0) {
              const dayOfWeek = template.preferredDays[Math.floor(Math.random() * template.preferredDays.length)];
              transactionDate = getDateOnDay(year, month, dayOfWeek, i * 2 + 1);
            } else {
              transactionDate = getRandomDate(year, month);
            }

            transactions.push({
              date: transactionDate,
              description: template.description,
              amount: -amount,
              category: template.category,
              merchantName: template.description.split(' ')[0],
              memo: '',
              autoCategorized: false
            });
          }
        }
      } else if (template.frequency === 'monthly') {
        // Add once per month
        const amount = getRandomAmount(template.amountRange);
        const transactionDate = getRandomDate(year, month);

        transactions.push({
          date: transactionDate,
          description: template.description,
          amount: -amount,
          category: template.category,
          merchantName: template.description.split(' ')[0],
          memo: '',
          autoCategorized: false
        });
      } else if (template.frequency === 'occasional') {
        // Add 0-3 times per month randomly
        const occurrences = Math.floor(Math.random() * 4); // 0, 1, 2, or 3
        for (let i = 0; i < occurrences; i++) {
          const amount = getRandomAmount(template.amountRange);
          let transactionDate: string;

          if (template.preferredDays && template.preferredDays.length > 0) {
            const dayOfWeek = template.preferredDays[Math.floor(Math.random() * template.preferredDays.length)];
            const weekNumber = Math.floor(Math.random() * 4) + 1;
            transactionDate = getDateOnDay(year, month, dayOfWeek, weekNumber);
          } else {
            transactionDate = getRandomDate(year, month);
          }

          transactions.push({
            date: transactionDate,
            description: template.description,
            amount: -amount,
            category: template.category,
            merchantName: template.description.split(' ')[0],
            memo: '',
            autoCategorized: false
          });
        }
      }
    });

    // Add consistent bills every month
    // Rent/Mortgage - $1400/month on 1st
    transactions.push({
      date: `${year}-${String(month + 1).padStart(2, '0')}-01`,
      description: 'PROPERTY MANAGEMENT RENT',
      amount: -1400,
      category: 'Housing',
      merchantName: 'Property Management',
      memo: 'Monthly rent',
      autoCategorized: false
    });

    // Internet - $70/month
    transactions.push({
      date: getDateOnDay(year, month, 5, 1), // First Friday
      description: 'COMCAST INTERNET',
      amount: -70,
      category: 'Bills & Fees',
      merchantName: 'Comcast',
      memo: '',
      autoCategorized: false
    });

    // Phone - $55/month
    transactions.push({
      date: getDateOnDay(year, month, 3, 2), // Second Wednesday
      description: 'VERIZON WIRELESS',
      amount: -55,
      category: 'Bills & Fees',
      merchantName: 'Verizon',
      memo: '',
      autoCategorized: false
    });

    // Electric - varies by month ($60-120) - simulates seasonal variation
    const electricAmount = month >= 5 && month <= 8
      ? getRandomAmount([90, 120])  // Summer AC usage
      : getRandomAmount([60, 90]);   // Other months
    transactions.push({
      date: getDateOnDay(year, month, 2, 2), // Second Tuesday
      description: 'PG&E ELECTRIC',
      amount: -electricAmount,
      category: 'Bills & Fees',
      merchantName: 'PG&E',
      memo: '',
      autoCategorized: false
    });

    // Water - $45/month
    transactions.push({
      date: getDateOnDay(year, month, 4, 3), // Third Thursday
      description: 'CITY WATER UTILITY',
      amount: -45,
      category: 'Housing',
      merchantName: 'City Water',
      memo: '',
      autoCategorized: false
    });

    // Car Insurance - $120/month
    transactions.push({
      date: `${year}-${String(month + 1).padStart(2, '0')}-15`,
      description: 'GEICO AUTO INSURANCE',
      amount: -120,
      category: 'Transportation',
      merchantName: 'GEICO',
      memo: '',
      autoCategorized: false
    });

    // Weekly paychecks on Fridays - $1500/week
    const fridays = getAllFridaysInMonth(year, month);
    fridays.forEach(friday => {
      transactions.push({
        date: friday,
        description: 'PAYROLL DEPOSIT - ACME CORP',
        amount: 1500,
        category: 'Income',
        merchantName: 'ACME Corp',
        memo: 'Weekly paycheck',
        autoCategorized: false
      });
    });
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
