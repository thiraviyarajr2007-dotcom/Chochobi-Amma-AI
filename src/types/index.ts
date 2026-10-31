export type Language = 'ta' | 'en';

export type MascotMood = 'happy' | 'thinking' | 'alert' | 'celebrate';

export type ExpenseCategory =
  | 'groceries'
  | 'dairy'
  | 'vegetables'
  | 'education'
  | 'medical'
  | 'utilities'
  | 'temple'
  | 'clothing'
  | 'snacks'
  | 'transport'
  | 'other';

export interface ExpenseItem {
  id: string;
  amount: number;
  category: ExpenseCategory;
  note: string;
  date: string; // YYYY-MM-DD
  time?: string;
  receiptImg?: string;
  isVoice?: boolean;
  createdAt?: number;
}

export interface KidProfile {
  id: string;
  name: string;
  avatar: string; // emoji e.g. 👦, 👧, 🦁, 🌸
  totalPoints: number;
  createdAt: number;
}

export interface SavingGoal {
  id: string;
  titleKey?: string;
  descKey?: string;
  targetAmount: number;
  savedAmount: number;
  rewardKey?: string;
  kidName?: string;
  emoji?: string;
}

export type KidGoal = SavingGoal & {
  kidId: string;
  title: string;
  reward: string;
  completed: boolean;
  createdAt: number;
};

export interface KidTask {
  id: string;
  kidId: string;
  title: string;
  points: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
}

export type ScamStatus = 'safe' | 'suspicious' | 'scam';

export interface ScamResult {
  status: ScamStatus;
  score: number; // 0-100
  titleKey: string;
  explanationKey: string;
  warningPoints: string[];
  reasons?: string[];
  what_to_do?: string[];
}

export interface BillScannedLine {
  name: string;
  price: number;
  category?: ExpenseCategory;
}

export interface BillScanResult {
  merchant: string;
  date: string;
  total: number;
  items: BillScannedLine[];
  suggestedCategory: ExpenseCategory;
}

export interface RecurringExpenseSuggestion {
  category: ExpenseCategory;
  note: string;
  estimatedAmount: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  confidence: number;
  lastSeenDate: string;
}

export interface ExpenseSpike {
  category: ExpenseCategory;
  percentageIncrease: number;
  previousAmount: number;
  currentAmount: number;
  message: string;
}

export interface MonthlyInsightsResult {
  summary: string;
  insights: string[];
  savingTip: string;
  budgetForecast: {
    predictedSpent: number;
    status: 'on_track' | 'risk_of_overspend';
  };
  spikes: ExpenseSpike[];
}

export type ActiveTab =
  | 'splash'
  | 'lock'
  | 'home'
  | 'addExpense'
  | 'expenses'
  | 'scamShield'
  | 'quest'
  | 'insights'
  | 'settings'
  | 'design';
