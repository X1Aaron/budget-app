import type { Transaction } from '../types';

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
  { description: 'WHOLE FOODS MARKET #12345', category: 'Groceries', amountRange: [60, 90], frequency: 'weekly', preferredDays: [6, 0] },
  { description: 'TRADER JOES #456', category: 'Groceries', amountRange: [40, 60], frequency: 'weekly', preferredDays: [6, 0] },
  { description: 'SAFEWAY STORE 1234', category: 'Groceries', amountRange: [50, 80], frequency: 'weekly', preferredDays: [6, 0] },
  { description: 'COSTCO WHOLESALE #789', category: 'Groceries', amountRange: [80, 120], frequency: 'biweekly', preferredDays: [6, 0] },

  // Coffee & quick meals on weekdays - more frequent
  { description: 'STARBUCKS STORE 12345', category: 'Dining Out', amountRange: [5, 12], frequency: 'weekly', preferredDays: [1, 2, 3, 4, 5] },
  { description: 'DUNKIN DONUTS #789', category: 'Dining Out', amountRange: [4, 10], frequency: 'weekly', preferredDays: [1, 2, 3, 4, 5] },
  { description: 'PEETS COFFEE', category: 'Dining Out', amountRange: [5, 11], frequency: 'occasional', preferredDays: [1, 2, 3, 4, 5] },

  // Dining out - more frequent eating out
  { description: 'CHIPOTLE MEXICAN GRILL', category: 'Dining Out', amountRange: [12, 18], frequency: 'weekly', preferredDays: [1, 2, 3, 4, 5] },
  { description: 'PANERA BREAD #1234', category: 'Dining Out', amountRange: [10, 15], frequency: 'weekly', preferredDays: [6, 0] },
  { description: 'SUBWAY 12345', category: 'Dining Out', amountRange: [8, 12], frequency: 'occasional', preferredDays: [1, 2, 3, 4, 5] },
  { description: 'PIZZA HUT 12345', category: 'Dining Out', amountRange: [20, 30], frequency: 'weekly', preferredDays: [5, 6] },
  { description: 'OLIVE GARDEN #456', category: 'Dining Out', amountRange: [35, 55], frequency: 'occasional', preferredDays: [5, 6, 0] },
  { description: 'MCDONALDS F12345', category: 'Dining Out', amountRange: [8, 12], frequency: 'weekly', preferredDays: [1, 2, 3, 4, 5] },
  { description: 'TACO BELL #456', category: 'Dining Out', amountRange: [7, 13], frequency: 'occasional', preferredDays: [1, 2, 3, 4, 5] },
  { description: 'DOORDASH*VARIOUS', category: 'Dining Out', amountRange: [25, 45], frequency: 'weekly', preferredDays: [1, 2, 3, 4, 5, 6, 0] },
  { description: 'UBER EATS', category: 'Dining Out', amountRange: [20, 40], frequency: 'occasional', preferredDays: [1, 2, 3, 4, 5, 6, 0] },

  // Gas - weekly fillups
  { description: 'SHELL OIL 12345678', category: 'Gas & Fuel', amountRange: [45, 65], frequency: 'weekly' },
  { description: 'CHEVRON 12345678', category: 'Gas & Fuel', amountRange: [45, 65], frequency: 'weekly' },
  { description: 'EXXONMOBIL 12345', category: 'Gas & Fuel', amountRange: [40, 60], frequency: 'weekly' },

  // Monthly subscriptions - realistic subscription creep
  { description: 'NETFLIX.COM', category: 'Subscriptions', amountRange: [22.99, 22.99], frequency: 'monthly' },
  { description: 'SPOTIFY USA', category: 'Subscriptions', amountRange: [11.99, 11.99], frequency: 'monthly' },
  { description: 'HULU SUBSCRIPTION', category: 'Subscriptions', amountRange: [17.99, 17.99], frequency: 'monthly' },
  { description: 'AMAZON PRIME', category: 'Subscriptions', amountRange: [14.99, 14.99], frequency: 'monthly' },
  { description: 'DISNEY PLUS', category: 'Subscriptions', amountRange: [10.99, 10.99], frequency: 'monthly' },
  { description: 'HBO MAX', category: 'Subscriptions', amountRange: [15.99, 15.99], frequency: 'monthly' },
  { description: 'PATREON MEMBERSHIP', category: 'Subscriptions', amountRange: [5, 15], frequency: 'monthly' },
  { description: 'AUDIBLE MEMBERSHIP', category: 'Subscriptions', amountRange: [14.95, 14.95], frequency: 'monthly' },
  { description: 'ICLOUD STORAGE', category: 'Subscriptions', amountRange: [2.99, 2.99], frequency: 'monthly' },

  // Occasional entertainment
  { description: 'AMC THEATRES #12345', category: 'Entertainment', amountRange: [25, 40], frequency: 'occasional', preferredDays: [5, 6, 0] },
  { description: 'STEAM GAMES', category: 'Gaming', amountRange: [20, 60], frequency: 'occasional' },

  // Shopping - more frequent purchases
  { description: 'AMAZON.COM*123456789', category: 'General Shopping', amountRange: [25, 80], frequency: 'weekly' },
  { description: 'TARGET STORE T-2345', category: 'General Shopping', amountRange: [30, 60], frequency: 'weekly', preferredDays: [6, 0] },
  { description: 'WAL-MART #1234', category: 'General Shopping', amountRange: [25, 50], frequency: 'occasional' },
  { description: 'BEST BUY #12345', category: 'Electronics', amountRange: [40, 150], frequency: 'occasional' },
  { description: 'ETSY.COM', category: 'General Shopping', amountRange: [15, 45], frequency: 'occasional' },
  { description: 'SHEIN.COM', category: 'Clothing', amountRange: [20, 60], frequency: 'occasional' },

  // Healthcare - occasional
  { description: 'WALGREENS #12345', category: 'Healthcare', amountRange: [15, 30], frequency: 'occasional' },
  { description: 'CVS/PHARMACY #12345', category: 'Healthcare', amountRange: [20, 40], frequency: 'occasional' },

  // Personal Care & Fitness
  { description: 'SUPERCUTS #456', category: 'Personal Care', amountRange: [20, 35], frequency: 'occasional' },
  { description: 'ULTA BEAUTY', category: 'Personal Care', amountRange: [25, 60], frequency: 'occasional' },
  { description: 'SEPHORA', category: 'Personal Care', amountRange: [30, 80], frequency: 'occasional' },
  { description: 'PLANET FITNESS', category: 'Fitness & Gym', amountRange: [24.99, 24.99], frequency: 'monthly' },
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

    // Track transaction count for this month to determine which to leave uncategorized
    let monthTransactionCount = 0;

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

          monthTransactionCount++;
          // 90% categorized, 10% uncategorized
          const shouldCategorize = Math.random() < 0.9;

          transactions.push({
            date: transactionDate,
            description: template.description,
            amount: -amount,
            ...(shouldCategorize && { category: template.category })
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

        monthTransactionCount++;
        // 90% categorized, 10% uncategorized
        const shouldCategorize = Math.random() < 0.9;

        transactions.push({
          date: transactionDate,
          description: template.description,
          amount: -amount,
          ...(shouldCategorize && { category: template.category })
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

          monthTransactionCount++;
          // 90% categorized, 10% uncategorized
          const shouldCategorize = Math.random() < 0.9;

          transactions.push({
            date: transactionDate,
            description: template.description,
            amount: -amount,
            ...(shouldCategorize && { category: template.category })
          });
        }
      }
    });

    // Add consistent bills every month
    // Rent/Mortgage - $2100/month on 1st (35% of income)
    monthTransactionCount++;
    transactions.push({
      date: `${year}-${String(month + 1).padStart(2, '0')}-01`,
      description: 'PROPERTY MANAGEMENT RENT',
      amount: -2100,
      category: 'Housing'  // Bills are always categorized
    });

    // Internet - $70/month
    monthTransactionCount++;
    transactions.push({
      date: getDateOnDay(year, month, 5, 1), // First Friday
      description: 'COMCAST INTERNET',
      amount: -70,
      category: 'Utilities'  // Bills are always categorized
    });

    // Phone - $55/month
    monthTransactionCount++;
    transactions.push({
      date: getDateOnDay(year, month, 3, 2), // Second Wednesday
      description: 'VERIZON WIRELESS',
      amount: -55,
      category: 'Phone'  // Bills are always categorized
    });

    // Electric - varies by month ($60-120) - simulates seasonal variation
    const electricAmount = month >= 5 && month <= 8
      ? getRandomAmount([90, 120])  // Summer AC usage
      : getRandomAmount([60, 90]);   // Other months
    monthTransactionCount++;
    transactions.push({
      date: getDateOnDay(year, month, 2, 2), // Second Tuesday
      description: 'PG&E ELECTRIC',
      amount: -electricAmount,
      category: 'Utilities'  // Bills are always categorized
    });

    // Water - $45/month
    monthTransactionCount++;
    transactions.push({
      date: getDateOnDay(year, month, 4, 3), // Third Thursday
      description: 'CITY WATER UTILITY',
      amount: -45,
      category: 'Utilities'  // Bills are always categorized
    });

    // Car Insurance - $120/month
    monthTransactionCount++;
    transactions.push({
      date: `${year}-${String(month + 1).padStart(2, '0')}-15`,
      description: 'GEICO AUTO INSURANCE',
      amount: -120,
      category: 'Insurance'  // Bills are always categorized
    });

    // Student Loan - $285/month
    monthTransactionCount++;
    transactions.push({
      date: `${year}-${String(month + 1).padStart(2, '0')}-10`,
      description: 'MOHELA STUDENT LOAN',
      amount: -285,
      category: 'Debt Payments'  // Bills are always categorized
    });

    // Credit Card Payment - $150-300/month (varies)
    const ccPayment = getRandomAmount([150, 300]);
    monthTransactionCount++;
    transactions.push({
      date: `${year}-${String(month + 1).padStart(2, '0')}-20`,
      description: 'CHASE CREDIT CARD PAYMENT',
      amount: -ccPayment,
      category: 'Debt Payments'  // Bills are always categorized
    });

    // Weekly paychecks on Fridays - $1500/week
    const fridays = getAllFridaysInMonth(year, month);
    fridays.forEach(friday => {
      monthTransactionCount++;
      transactions.push({
        date: friday,
        description: 'DIRECT DEP - TECHSYSTEMS INC',
        amount: 1500,
        ...(Math.random() < 0.9 && { category: 'Income' })
      });
    });
  }

  // Sort by date descending
  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return transactions;
}
