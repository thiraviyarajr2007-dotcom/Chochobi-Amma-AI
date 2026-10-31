import { describe, it, expect, beforeEach } from 'vitest';
import {
  hashPinWithSalt,
  generateSalt,
  calculateLockoutDuration,
} from '../lib/security';
import {
  parseExpensesOffline,
  detectCategoryFromText,
} from '../lib/offlineParser';
import {
  calculateBudgetStatus,
  detectRecurringExpenses,
  detectExpenseSpikes,
} from '../lib/budgetAnalytics';
import {
  ParseExpenseResponseSchema,
  ScamCheckResponseSchema,
  MonthlyInsightsResponseSchema,
} from '../lib/geminiSchemas';
import { ExpenseItem } from '../types';

describe('1. PIN Security & Lockout Logic', () => {
  it('generates a 32-character hex salt (16 bytes)', () => {
    const salt = generateSalt();
    expect(salt).toHaveLength(32);
    expect(/^[0-9a-f]+$/i.test(salt)).toBe(true);
  });

  it('hashes PIN with salt and verifies matching vs non-matching PIN', async () => {
    const salt = generateSalt();
    const hash = await hashPinWithSalt('1234', salt);

    expect(hash).toHaveLength(64); // SHA-256 produces 64 hex characters

    // Matching pin produces identical hash
    const matchHash = await hashPinWithSalt('1234', salt);
    expect(matchHash).toBe(hash);

    // Non-matching pin produces different hash
    const wrongHash = await hashPinWithSalt('5678', salt);
    expect(wrongHash).not.toBe(hash);
  });

  it('calculates escalating lockout durations', () => {
    // Under 5 attempts: no lockout
    expect(calculateLockoutDuration(0)).toBe(0);
    expect(calculateLockoutDuration(4)).toBe(0);

    // 5 attempts: 30 seconds
    expect(calculateLockoutDuration(5)).toBe(30);
    expect(calculateLockoutDuration(7)).toBe(30);

    // 10 attempts: 60 seconds (escalated)
    expect(calculateLockoutDuration(10)).toBe(60);

    // 15 attempts: 120 seconds
    expect(calculateLockoutDuration(15)).toBe(120);
  });
});

describe('2. Offline Fallback Parser', () => {
  it('parses multi-expense Tamil transcript: "இன்னைக்கு காய்கறி 250 ரூபாய், ஆட்டோ 80"', () => {
    const transcript = 'இன்னைக்கு காய்கறி 250 ரூபாய், ஆட்டோ 80';
    const items = parseExpensesOffline(transcript);

    expect(items).toHaveLength(2);

    expect(items[0].amount).toBe(250);
    expect(items[0].category).toBe('vegetables');

    expect(items[1].amount).toBe(80);
    expect(items[1].category).toBe('transport');
  });

  it('parses single item with currency symbol: "ஆவின் பால் ₹68"', () => {
    const items = parseExpensesOffline('ஆவின் பால் ₹68');
    expect(items).toHaveLength(1);
    expect(items[0].amount).toBe(68);
    expect(items[0].category).toBe('dairy');
  });

  it('parses English transcript: "Supermarket groceries 1200, pharmacy 450"', () => {
    const items = parseExpensesOffline('Supermarket groceries 1200, pharmacy 450');
    expect(items).toHaveLength(2);
    expect(items[0].amount).toBe(1200);
    expect(items[0].category).toBe('groceries');
    expect(items[1].amount).toBe(450);
    expect(items[1].category).toBe('medical');
  });

  it('handles empty or blank transcripts without throwing', () => {
    expect(parseExpensesOffline('')).toEqual([]);
    expect(parseExpensesOffline('   ')).toEqual([]);
    expect(parseExpensesOffline('வணக்கம் அம்மா')).toEqual([]);
  });

  it('detects correct Indian household categories', () => {
    expect(detectCategoryFromText('TNEB மின்சாரக் கட்டணம்')).toBe('utilities');
    expect(detectCategoryFromText('பள்ளி கட்டணம் மற்றும் நோட்டு')).toBe('education');
    expect(detectCategoryFromText('கோவில் பூ மற்றும் அர்ச்சனை')).toBe('temple');
    expect(detectCategoryFromText('டீ மற்றும் பிஸ்கட்')).toBe('snacks');
  });
});

describe('3. Zod Schemas Validation (Gemini Output)', () => {
  it('validates structured expense parse output', () => {
    const valid = {
      expenses: [
        { category: 'groceries', amount: 450, note: 'சரவணா ஸ்டோர்ஸ்' },
        { category: 'dairy', amount: 68, note: 'ஆவின் பால்' },
      ],
    };
    expect(() => ParseExpenseResponseSchema.parse(valid)).not.toThrow();
  });

  it('rejects invalid category or negative amount in expense schema', () => {
    const invalidCategory = {
      expenses: [{ category: 'crypto_gambling', amount: 100, note: 'invalid' }],
    };
    expect(() => ParseExpenseResponseSchema.parse(invalidCategory)).toThrow();

    const negativeAmount = {
      expenses: [{ category: 'groceries', amount: -50, note: 'negative' }],
    };
    expect(() => ParseExpenseResponseSchema.parse(negativeAmount)).toThrow();
  });

  it('validates scam check schema with valid verdicts', () => {
    const validScam = {
      verdict: 'scam',
      confidence: 98,
      reasons: ['Fake TNEB electricity link detected', 'Demands urgent action'],
      what_to_do: ['Do NOT click link', 'Never share OTP'],
    };
    expect(() => ScamCheckResponseSchema.parse(validScam)).not.toThrow();

    const invalidVerdict = {
      verdict: 'maybe_danger',
      confidence: 50,
      reasons: ['reason'],
      what_to_do: ['step'],
    };
    expect(() => ScamCheckResponseSchema.parse(invalidVerdict)).toThrow();
  });

  it('validates monthly insights response schema', () => {
    const validInsights = {
      summary: 'அற்புதம் அம்மா! உங்கள் வீட்டு பட்ஜெட் அருமையாக உள்ளது.',
      insights: ['மளிகை செலவு கட்டுக்குள் உள்ளது', 'மின்சாரக் கட்டணம் மிச்சம்'],
      savingTip: 'வாராந்திர மளிகையை மொத்தமாக வாங்கவும்.',
      budgetForecast: {
        predictedSpent: 24500,
        status: 'on_track',
      },
    };
    expect(() => MonthlyInsightsResponseSchema.parse(validInsights)).not.toThrow();
  });
});

describe('4. Budget & Analytics Calculations', () => {
  const mockExpenses: ExpenseItem[] = [
    { id: '1', category: 'groceries', amount: 10000, note: 'Rice', date: '2026-10-05' },
    { id: '2', category: 'dairy', amount: 2000, note: 'Milk', date: '2026-10-10' },
    { id: '3', category: 'utilities', amount: 4000, note: 'EB', date: '2026-10-15' },
  ];

  it('computes budget status and normal warning level when spent < 80%', () => {
    const status = calculateBudgetStatus(mockExpenses, 30000, '2026-10');
    expect(status.spent).toBe(16000);
    expect(status.remaining).toBe(14000);
    expect(status.percentageUsed).toBe(53);
    expect(status.warningLevel).toBe('normal');
  });

  it('triggers caution warning level when spent is between 80% and 99%', () => {
    const highExpenses: ExpenseItem[] = [
      { id: '1', category: 'groceries', amount: 25000, note: 'Bulk', date: '2026-10-05' },
    ];
    const status = calculateBudgetStatus(highExpenses, 30000, '2026-10');
    expect(status.percentageUsed).toBe(83);
    expect(status.warningLevel).toBe('caution');
  });

  it('triggers exceeded warning level when spent is 100% or greater', () => {
    const exceededExpenses: ExpenseItem[] = [
      { id: '1', category: 'groceries', amount: 32000, note: 'Bulk', date: '2026-10-05' },
    ];
    const status = calculateBudgetStatus(exceededExpenses, 30000, '2026-10');
    expect(status.percentageUsed).toBe(107);
    expect(status.warningLevel).toBe('exceeded');
  });

  it('detects recurring expenses based on historical repetition', () => {
    const recurringData: ExpenseItem[] = [
      { id: '1', category: 'dairy', amount: 60, note: 'ஆவின் பசும்பால்', date: '2026-10-01' },
      { id: '2', category: 'dairy', amount: 60, note: 'ஆவின் பசும்பால்', date: '2026-10-02' },
      { id: '3', category: 'dairy', amount: 60, note: 'ஆவின் பசும்பால்', date: '2026-10-03' },
    ];
    const recurring = detectRecurringExpenses(recurringData);
    expect(recurring.length).toBeGreaterThan(0);
    expect(recurring[0].category).toBe('dairy');
    expect(recurring[0].estimatedAmount).toBe(60);
  });

  it('detects spending spikes comparing current month vs previous month', () => {
    const spikeData: ExpenseItem[] = [
      // Previous month (2026-09)
      { id: '1', category: 'groceries', amount: 2000, note: 'Grocery Sep', date: '2026-09-10' },
      // Current month (2026-10): Increased by 150% (from 2000 to 5000)
      { id: '2', category: 'groceries', amount: 5000, note: 'Grocery Oct', date: '2026-10-10' },
    ];

    const spikes = detectExpenseSpikes(spikeData, '2026-10');
    expect(spikes.length).toBe(1);
    expect(spikes[0].category).toBe('groceries');
    expect(spikes[0].percentageIncrease).toBe(150);
  });
});

