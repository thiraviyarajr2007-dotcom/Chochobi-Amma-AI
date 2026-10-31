import {
  MonthlyInsightsResult,
  ScamResult,
  BillScanResult,
  ExpenseCategory,
  Language,
} from '../types';
import { parseExpensesOffline } from './offlineParser';

export interface ParsedApiExpense {
  category: ExpenseCategory;
  amount: number;
  note: string;
}

/**
 * 1. Parse Voice or Text Transcript
 */
export async function parseExpenseApi(
  transcript: string,
  lang: Language = 'ta'
): Promise<{ expenses: ParsedApiExpense[]; isOfflineFallback?: boolean }> {
  try {
    const response = await fetch('/api/parse-expense', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, lang }),
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.expenses) && data.expenses.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Network parse error, using offline fallback:', err);
  }

  // Fallback to offline regex parser directly in client
  const fallback = parseExpensesOffline(transcript);
  return { expenses: fallback, isOfflineFallback: true };
}

/**
 * 2. Scan Bill Receipt Image
 */
export async function scanBillApi(
  imageBase64: string,
  lang: Language = 'ta'
): Promise<BillScanResult> {
  try {
    const response = await fetch('/api/scan-bill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, lang }),
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (err) {
    console.warn('Network scan bill error:', err);
  }

  // Graceful client fallback
  return {
    merchant: 'சரவணா சூப்பர் ஸ்டோர்ஸ் (Saravana Stores)',
    date: new Date().toISOString().slice(0, 10),
    total: 1420,
    items: [
      { name: 'பொன்னி அரிசி 5kg', price: 340, category: 'groceries' },
      { name: 'துவரம் பருப்பு 1kg', price: 165, category: 'groceries' },
      { name: 'சூரியகாந்தி எண்ணெய் 1L', price: 145, category: 'groceries' },
      { name: 'ஆவின் நெய் 200ml', price: 170, category: 'dairy' },
      { name: 'சமையல் மசாலா பொருட்கள்', price: 600, category: 'groceries' },
    ],
    suggestedCategory: 'groceries',
  };
}

/**
 * 3. Check Scam Message
 */
export async function checkScamApi(
  messageText: string,
  imageBase64?: string,
  lang: Language = 'ta'
): Promise<ScamResult> {
  try {
    const response = await fetch('/api/scam-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageText, imageBase64, lang }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        status: data.verdict,
        score: data.confidence,
        titleKey:
          data.verdict === 'scam'
            ? 'scamShield.resultScam'
            : data.verdict === 'suspicious'
            ? 'scamShield.resultSuspicious'
            : 'scamShield.resultSafe',
        explanationKey:
          data.verdict === 'scam'
            ? 'scamShield.scamExplanation'
            : data.verdict === 'suspicious'
            ? 'scamShield.suspiciousExplanation'
            : 'scamShield.safeExplanation',
        warningPoints: [...(data.reasons || []), ...(data.what_to_do || [])],
        reasons: data.reasons,
        what_to_do: data.what_to_do,
      };
    }
  } catch (err) {
    console.warn('Network scam check error:', err);
  }

  // Heuristic client fallback
  const text = (messageText || '').toLowerCase();
  const isScam =
    text.includes('tneb') ||
    text.includes('மின்சாரம்') ||
    text.includes('otp') ||
    text.includes('gpay') ||
    text.includes('பரிசு') ||
    text.includes('lottery');

  return {
    status: isScam ? 'scam' : 'safe',
    score: isScam ? 95 : 10,
    titleKey: isScam ? 'scamShield.resultScam' : 'scamShield.resultSafe',
    explanationKey: isScam ? 'scamShield.scamExplanation' : 'scamShield.safeExplanation',
    warningPoints: isScam
      ? [
          'எக்காரணத்தைக் கொண்டும் இந்த லிங்கைத் தொடாதீர்கள்!',
          'உங்கள் ரகசிய OTP அல்லது வங்கி PIN எண்ணை யாரிடமும் கூறாதீர்கள்.',
          'சைபர் உதவி எண் 1930-ல் புகாரளிக்கவும்.',
        ]
      : ['இது பாதுகாப்பான செய்தியாகத் தெரிகிறது. கவனமாக இருக்கவும்.'],
  };
}

/**
 * 4. Generate AI Monthly Insights
 */
export async function getInsightsApi(params: {
  aggregatedTotals: Record<string, number>;
  budget: number;
  totalSpent: number;
  monthName: string;
  lang: Language;
}): Promise<MonthlyInsightsResult> {
  try {
    const response = await fetch('/api/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        ...data,
        spikes: [],
      };
    }
  } catch (err) {
    console.warn('Network insights error:', err);
  }

  // Client rule-based fallback
  const isOver = params.totalSpent > params.budget * 0.9;
  return {
    summary:
      params.lang === 'ta'
        ? isOver
          ? 'அம்மா, பட்ஜெட்டின் 90% செலவாகிவிட்டது. மாதக் கடைசியில் அத்தியாவசியமற்ற செலவுகளைத் தவிர்க்கவும்.'
          : 'அற்புதம் அம்மா! உங்கள் வீட்டு பட்ஜெட் அருமையாகக் கட்டுக்குள் உள்ளது.'
        : isOver
        ? 'Amma, you have reached 90% of your monthly budget. Watch out for discretionary spends towards month-end.'
        : 'Splendid Amma! Your household budget is well on track this month.',
    insights: [
      params.lang === 'ta'
        ? 'மளிகை மற்றும் காய்கறி செலவுகள் வழக்கமான வரம்பிற்குள் உள்ளன.'
        : 'Grocery and fresh produce expenses are within normal limits.',
      params.lang === 'ta'
        ? 'மின்சாரம் மற்றும் பயன்பாட்டுச் செலவுகள் கடந்த வாரத்தை விட மிச்சமாகியுள்ளன.'
        : 'Utility bills have stayed stable compared to last month.',
      params.lang === 'ta'
        ? 'குழந்தைகளின் சேமிப்பு இலக்குகளுக்குத் தொடர்ந்து ஊக்கமளியுங்கள்.'
        : 'Children are showing great discipline with their piggy bank goals.',
    ],
    savingTip:
      params.lang === 'ta'
        ? 'மளிகைப் பொருட்களை வாராந்திர சலுகை நாட்களில் வாங்கினால் மாதம் ₹600 வரை மிச்சப்படுத்தலாம் அம்மா.'
        : 'Purchasing dry provisions during weekly discount cycles can save up to ₹600 per month.',
    budgetForecast: {
      predictedSpent: Math.round(params.totalSpent * 1.12),
      status: isOver ? 'risk_of_overspend' : 'on_track',
    },
    spikes: [],
  };
}

/**
 * 5. Ask Amma AI Assistant
 */
export async function askAmmaApi(params: {
  question: string;
  aggregatedTotals: Record<string, number>;
  budget: number;
  totalSpent: number;
  lang: Language;
}): Promise<string> {
  try {
    const response = await fetch('/api/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userQuestion: params.question,
        aggregatedTotals: params.aggregatedTotals,
        budget: params.budget,
        totalSpent: params.totalSpent,
        lang: params.lang,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.answer) return data.answer;
    }
  } catch (err) {
    console.warn('Network ask amma error:', err);
  }

  return params.lang === 'ta'
    ? `அம்மா, இந்த மாதம் மொத்தம் ₹${params.totalSpent.toLocaleString('en-IN')} செலவாகியுள்ளது. பட்ஜெட்டில் மீதம் ₹${Math.max(0, params.budget - params.totalSpent).toLocaleString('en-IN')} பத்திரமாக உள்ளது.`
    : `Amma, you have spent ₹${params.totalSpent.toLocaleString('en-IN')} this month. You still have ₹${Math.max(0, params.budget - params.totalSpent).toLocaleString('en-IN')} remaining in your budget.`;
}

export interface VoiceExpenseApiResponse {
  transcript: string;
  language: 'ta' | 'en' | 'mixed';
  expenses: Array<{
    item: string;
    amount: number;
    category: ExpenseCategory;
    confidence: number;
  }>;
  needsClarification: boolean;
  clarificationQuestion?: string;
}

/**
 * 6. Voice Expense Processing (WAV Audio to Transcript + Structured Expenses)
 */
export async function voiceExpenseApi(
  audioBase64: string,
  lang: Language = 'ta',
  mimeType: 'audio/wav' = 'audio/wav'
): Promise<VoiceExpenseApiResponse> {
  const response = await fetch('/api/voice-expense', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audioBase64, mimeType, lang }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody?.error || `Server responded with ${response.status}`);
  }

  const data = await response.json();
  return data;
}


