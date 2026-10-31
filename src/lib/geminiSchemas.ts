import { z } from 'zod';

export const CategoryEnum = z.enum([
  'groceries',
  'dairy',
  'vegetables',
  'education',
  'medical',
  'utilities',
  'temple',
  'clothing',
  'snacks',
  'transport',
  'other',
]);

// 1. Parse Expense Output Schema
export const ParsedExpenseItemSchema = z.object({
  category: CategoryEnum,
  amount: z.number().positive(),
  note: z.string().min(1),
});

export const ParseExpenseResponseSchema = z.object({
  expenses: z.array(ParsedExpenseItemSchema).min(1),
});

// 2. Scan Bill Output Schema
export const BillScannedItemSchema = z.object({
  name: z.string(),
  price: z.number().nonnegative(),
  category: CategoryEnum.optional(),
});

export const ScanBillResponseSchema = z.object({
  merchant: z.string(),
  date: z.string(),
  total: z.number().nonnegative(),
  items: z.array(BillScannedItemSchema),
  suggestedCategory: CategoryEnum,
});

// 3. Scam Check Output Schema
export const ScamCheckResponseSchema = z.object({
  verdict: z.enum(['safe', 'suspicious', 'scam']),
  confidence: z.number().min(0).max(100),
  reasons: z.array(z.string()).min(1),
  what_to_do: z.array(z.string()).min(1),
  summary_tamil: z.string().optional(),
  summary_english: z.string().optional(),
});

// 4. Insights Output Schema
export const MonthlyInsightsResponseSchema = z.object({
  summary: z.string(),
  insights: z.array(z.string()),
  savingTip: z.string(),
  budgetForecast: z.object({
    predictedSpent: z.number(),
    status: z.enum(['on_track', 'risk_of_overspend']),
  }),
});

// 5. Voice Expense Input & Output Schemas (Audio Fallback)
export const VoiceExpenseRequestSchema = z.object({
  audioBase64: z.string().min(1, 'Audio base64 is required'),
  mimeType: z.literal('audio/wav'),
  lang: z.enum(['ta', 'en']).default('ta'),
});
export type VoiceExpenseRequest = z.infer<typeof VoiceExpenseRequestSchema>;

export const VoiceExpenseItemSchema = z.object({
  item: z.string(),
  amount: z.number().positive(),
  category: CategoryEnum,
  confidence: z.number().min(0).max(1),
});
export type VoiceExpenseItem = z.infer<typeof VoiceExpenseItemSchema>;

export const VoiceExpenseResponseSchema = z.object({
  transcript: z.string(),
  language: z.enum(['ta', 'en', 'mixed']),
  expenses: z.array(VoiceExpenseItemSchema),
  needsClarification: z.boolean(),
  clarificationQuestion: z.string().optional(),
});
export type VoiceExpenseResponse = z.infer<typeof VoiceExpenseResponseSchema>;

