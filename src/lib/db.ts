import Dexie, { type Table } from 'dexie';
import {
  ExpenseItem,
  KidProfile,
  KidGoal,
  KidTask,
  MonthlyInsightsResult,
} from '../types';
import { INITIAL_EXPENSES } from './mockData';

export interface AppSetting {
  key: string;
  value: string;
}

export interface CachedInsight {
  monthKey: string;
  data: MonthlyInsightsResult;
  cachedAt: number;
}

export class ChocobiAmmaDB extends Dexie {
  expenses!: Table<ExpenseItem, string>;
  settings!: Table<AppSetting, string>;
  kids!: Table<KidProfile, string>;
  goals!: Table<KidGoal, string>;
  tasks!: Table<KidTask, string>;
  insightsCache!: Table<CachedInsight, string>;

  constructor() {
    super('ChocobiAmmaDB');

    this.version(1).stores({
      expenses: 'id, category, amount, date, isVoice, createdAt',
      settings: 'key',
      kids: 'id, name, createdAt',
      goals: 'id, kidId, completed, createdAt',
      tasks: 'id, kidId, status, createdAt',
      insightsCache: 'monthKey, cachedAt',
    });
  }
}

export const db = new ChocobiAmmaDB();

// Seed initial data if fresh installation
export async function seedInitialDatabaseIfEmpty() {
  const expenseCount = await db.expenses.count();
  if (expenseCount === 0) {
    // Add default initial expenses
    await db.expenses.bulkAdd(
      INITIAL_EXPENSES.map((e, idx) => ({
        ...e,
        createdAt: Date.now() - (INITIAL_EXPENSES.length - idx) * 86400000,
      }))
    );
  }

  // Seed default kids if none
  const kidCount = await db.kids.count();
  if (kidCount === 0) {
    const kid1: KidProfile = {
      id: 'kid-1',
      name: 'ஆகாஷ் (Akash)',
      avatar: '👦',
      totalPoints: 620,
      createdAt: Date.now() - 30 * 86400000,
    };
    const kid2: KidProfile = {
      id: 'kid-2',
      name: 'அனுஷ்கா (Anushka)',
      avatar: '👧',
      totalPoints: 2400,
      createdAt: Date.now() - 30 * 86400000,
    };

    await db.kids.bulkAdd([kid1, kid2]);

    // Seed goals for kids
    await db.goals.bulkAdd([
      {
        id: 'goal-1',
        kidId: 'kid-1',
        title: 'பள்ளி புத்தகப் பை (School Bag)',
        targetAmount: 800,
        savedAmount: 620,
        reward: 'சோகோபி பிஸ்கட் & வாழ்த்து அட்டை 🍪',
        completed: false,
        createdAt: Date.now() - 15 * 86400000,
      },
      {
        id: 'goal-2',
        kidId: 'kid-2',
        title: 'பிறந்தநாள் மிதிவண்டி (Birthday Bicycle)',
        targetAmount: 3500,
        savedAmount: 2400,
        reward: 'பார்க் சுற்றுலா & ஐஸ்கிரீம் 🍦',
        completed: false,
        createdAt: Date.now() - 20 * 86400000,
      },
    ]);

    // Seed sample chores / tasks
    await db.tasks.bulkAdd([
      {
        id: 'task-1',
        kidId: 'kid-1',
        title: 'படிக்கும் மேசையை சுத்தம் செய்தல் (Clean Study Table)',
        points: 40,
        status: 'approved',
        createdAt: Date.now() - 2 * 86400000,
      },
      {
        id: 'task-2',
        kidId: 'kid-1',
        title: 'செடிகளுக்கு தண்ணீர் ஊற்றுதல் (Water Plants)',
        points: 30,
        status: 'pending',
        createdAt: Date.now() - 1 * 86400000,
      },
      {
        id: 'task-3',
        kidId: 'kid-2',
        title: 'துணிகளை மடிக்க உதவுதல் (Help Fold Clothes)',
        points: 50,
        status: 'pending',
        createdAt: Date.now() - 1 * 86400000,
      },
    ]);
  }

  // Seed default budget setting if not present
  const budgetSetting = await db.settings.get('monthly_budget');
  if (!budgetSetting) {
    await db.settings.put({ key: 'monthly_budget', value: '35000' });
  }
}

