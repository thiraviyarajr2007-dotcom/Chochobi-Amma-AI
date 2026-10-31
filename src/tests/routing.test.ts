import { describe, it, expect, beforeEach } from 'vitest';
import taJson from '../i18n/ta.json';
import enJson from '../i18n/en.json';

// In-memory web storage polyfill for Vitest Node runner
class MemoryStorage {
  private store: Record<string, string> = {};
  getItem(key: string) {
    return this.store[key] ?? null;
  }
  setItem(key: string, val: string) {
    this.store[key] = String(val);
  }
  removeItem(key: string) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = new MemoryStorage();
}
if (typeof globalThis.sessionStorage === 'undefined') {
  (globalThis as any).sessionStorage = new MemoryStorage();
}

import {
  calculateBudgetStatus,
  detectExpenseSpikes,
  detectRecurringExpenses,
} from '../lib/budgetAnalytics';
import {
  recordFailedPinAttempt,
  resetLockoutState,
  getLockoutStatus,
} from '../lib/security';
import { ExpenseItem } from '../types';

describe('1. i18n Key Parity Check', () => {
  it('should have exact 100% key parity between Tamil (ta.json) and English (en.json)', () => {
    function getAllKeys(obj: Record<string, any>, prefix = ''): string[] {
      return Object.keys(obj).reduce((res: string[], el) => {
        const name = prefix ? `${prefix}.${el}` : el;
        if (typeof obj[el] === 'object' && obj[el] !== null && !Array.isArray(obj[el])) {
          res.push(...getAllKeys(obj[el], name));
        } else {
          res.push(name);
        }
        return res;
      }, []);
    }

    const taKeys = getAllKeys(taJson).sort();
    const enKeys = getAllKeys(enJson).sort();

    const missingInEn = taKeys.filter((k) => !enKeys.includes(k));
    const missingInTa = enKeys.filter((k) => !taKeys.includes(k));

    expect(missingInEn).toEqual([]);
    expect(missingInTa).toEqual([]);
    expect(taKeys.length).toBe(enKeys.length);
    expect(taKeys.length).toBeGreaterThan(150);
  });
});

describe('2. Security Lockout & Escalating Cooldowns', () => {
  beforeEach(() => {
    resetLockoutState();
    localStorage.clear();
  });

  it('should not lock out on fewer than 5 failed attempts', () => {
    recordFailedPinAttempt();
    recordFailedPinAttempt();
    recordFailedPinAttempt();
    recordFailedPinAttempt();

    const status = getLockoutStatus();
    expect(status.isLocked).toBe(false);
    expect(status.remainingSeconds).toBe(0);
  });

  it('should trigger 30-second cooldown on 5 failed attempts', () => {
    for (let i = 0; i < 5; i++) {
      recordFailedPinAttempt();
    }

    const status = getLockoutStatus();
    expect(status.isLocked).toBe(true);
    expect(status.remainingSeconds).toBeGreaterThan(0);
    expect(status.remainingSeconds).toBeLessThanOrEqual(30);
  });

  it('should reset lockout state upon successful unlock', () => {
    for (let i = 0; i < 5; i++) {
      recordFailedPinAttempt();
    }
    expect(getLockoutStatus().isLocked).toBe(true);

    resetLockoutState();
    expect(getLockoutStatus().isLocked).toBe(false);
    expect(getLockoutStatus().failedAttempts).toBe(0);
  });
});

describe('3. Budget Analytics & Guard Logic', () => {
  const dummyExpenses: ExpenseItem[] = [
    {
      id: '1',
      amount: 5000,
      category: 'groceries',
      note: 'Supermarket',
      date: new Date().toISOString().slice(0, 10),
    },
    {
      id: '2',
      amount: 15000,
      category: 'utilities',
      note: 'EB Bill',
      date: new Date().toISOString().slice(0, 10),
    },
  ];

  it('should calculate budget status accurately', () => {
    const status = calculateBudgetStatus(dummyExpenses, 25000);
    expect(status.spent).toBe(20000);
    expect(status.totalBudget).toBe(25000);
    expect(status.remaining).toBe(5000);
    expect(status.percentageUsed).toBe(80);
    expect(status.warningLevel).toBe('caution');
  });

  it('should flag exceeded warning level when spending >= 100%', () => {
    const status = calculateBudgetStatus(dummyExpenses, 18000);
    expect(status.spent).toBe(20000);
    expect(status.percentageUsed).toBeGreaterThan(100);
    expect(status.warningLevel).toBe('exceeded');
  });

  it('should flag normal when spending < 80%', () => {
    const status = calculateBudgetStatus(dummyExpenses, 30000);
    expect(status.percentageUsed).toBe(67);
    expect(status.warningLevel).toBe('normal');
  });
});

describe('4. Redirection & Session Storage returnTo logic', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('should store and restore returnTo deep link', () => {
    const RETURN_TO_KEY = 'chocobi_return_to';
    sessionStorage.setItem(RETURN_TO_KEY, '/expenses/exp-123');

    const retrieved = sessionStorage.getItem(RETURN_TO_KEY);
    expect(retrieved).toBe('/expenses/exp-123');

    sessionStorage.removeItem(RETURN_TO_KEY);
    expect(sessionStorage.getItem(RETURN_TO_KEY)).toBeNull();
  });
});
