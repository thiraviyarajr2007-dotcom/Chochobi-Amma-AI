import { MonthlyInsightsResponseSchema } from '../src/lib/geminiSchemas';
import { callGeminiStructured, checkRateLimit } from './_utils';

export default async function handler(req: any, res: any) {
  const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  }

  const {
    aggregatedTotals = {},
    budget = 35000,
    totalSpent = 0,
    monthName = 'This Month',
    lang = 'ta',
    userQuestion,
  } = req.body || {};

  // If this is an "Ask Amma AI" question from the mom:
  if (userQuestion && typeof userQuestion === 'string') {
    const questionPrompt = `You are Chocobi Amma AI, a warm, caring, encouraging finance advisor for a Tamil mother.
Context of the family's finances this month:
- Monthly Budget: ₹${budget}
- Total Spent so far: ₹${totalSpent}
- Category Breakdown: ${JSON.stringify(aggregatedTotals)}

Mother's Question: "${userQuestion}"

Answer in 2-3 short, warm, polite, reassuring sentences in ${lang === 'ta' ? 'Tamil' : 'English'}. Include exact ₹ figures when relevant.`;

    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    if (apiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: questionPrompt }] }],
              generationConfig: { temperature: 0.3 },
            }),
            signal: AbortSignal.timeout(15000),
          }
        );
        const data = (await response.json()) as any;
        const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (answer) {
          return res.status(200).json({ answer: answer.trim() });
        }
      } catch (err) {
        console.warn('Ask Amma Gemini fallback:', err);
      }
    }

    // Local deterministic Q&A fallback
    const qLower = userQuestion.toLowerCase();
    let fallbackAns = '';
    if (qLower.includes('செலவு') || qLower.includes('spent') || qLower.includes('total')) {
      fallbackAns =
        lang === 'ta'
          ? `அம்மா, இந்த மாதம் இதுவரை மொத்தம் ₹${totalSpent.toLocaleString('en-IN')} செலவாகியுள்ளது. பட்ஜெட்டில் மீதம் ₹${Math.max(0, budget - totalSpent).toLocaleString('en-IN')} பத்திரமாக உள்ளது.`
          : `Amma, you have spent ₹${totalSpent.toLocaleString('en-IN')} so far this month. You still have ₹${Math.max(0, budget - totalSpent).toLocaleString('en-IN')} remaining in your budget.`;
    } else {
      fallbackAns =
        lang === 'ta'
          ? `அம்மா, உங்கள் பட்ஜெட் ₹${budget.toLocaleString('en-IN')}-ல் தற்போது ₹${totalSpent.toLocaleString('en-IN')} செலவாகியுள்ளது. குடும்பச் செலவுகள் கட்டுப்பாட்டுக்குள் உள்ளன!`
          : `Amma, from your ₹${budget.toLocaleString('en-IN')} budget, ₹${totalSpent.toLocaleString('en-IN')} is spent so far. Your family expenses are well managed!`;
    }
    return res.status(200).json({ answer: fallbackAns });
  }

  // Monthly Insights Generation
  const systemPrompt = `You are Chocobi Amma AI, an empathetic personal finance advisor for a Tamil homemaker mother.
You are given aggregated monthly category totals only (no private item notes).
Generate:
1. 'summary': A 1-2 sentence warm, encouraging summary praising her budget discipline or gently noting caution.
2. 'insights': Exactly 3 simple bullet points highlighting spending trends.
3. 'savingTip': 1 actionable, realistic household saving tip (e.g. bulk buying, EB daytime saving, snack budget).
4. 'budgetForecast': Estimated total spent by end of month and status ('on_track' if <= budget, 'risk_of_overspend' if > budget).

Language: All text must be in ${lang === 'ta' ? 'warm polite Tamil' : 'clear simple English'}.`;

  const responseSchemaJson = {
    type: 'OBJECT',
    properties: {
      summary: { type: 'STRING' },
      insights: {
        type: 'ARRAY',
        items: { type: 'STRING' },
      },
      savingTip: { type: 'STRING' },
      budgetForecast: {
        type: 'OBJECT',
        properties: {
          predictedSpent: { type: 'NUMBER' },
          status: { type: 'STRING', enum: ['on_track', 'risk_of_overspend'] },
        },
        required: ['predictedSpent', 'status'],
      },
    },
    required: ['summary', 'insights', 'savingTip', 'budgetForecast'],
  };

  try {
    const result = await callGeminiStructured({
      systemPrompt,
      userPrompt: `Month: ${monthName}\nMonthly Budget: ₹${budget}\nTotal Spent: ₹${totalSpent}\nCategory Totals: ${JSON.stringify(aggregatedTotals)}`,
      schema: MonthlyInsightsResponseSchema,
      responseSchemaJson,
    });

    return res.status(200).json(result);
  } catch (err: any) {
    console.warn('Gemini insights fallback:', err?.message);
    // Intelligent rule-based fallback
    const isOver = totalSpent > budget * 0.9;
    return res.status(200).json({
      summary:
        lang === 'ta'
          ? isOver
            ? 'அம்மா, பட்ஜெட்டின் 90% செலவாகிவிட்டது. மாதக் கடைசியில் அத்தியாவசியமற்ற செலவுகளைத் தவிர்க்கவும்.'
            : 'அற்புதம் அம்மா! உங்கள் வீட்டு பட்ஜெட் அருமையாகக் கட்டுக்குள் உள்ளது.'
          : isOver
          ? 'Amma, you have reached 90% of your monthly budget. Watch out for discretionary spends towards month-end.'
          : 'Splendid Amma! Your household budget is well on track this month.',
      insights: [
        lang === 'ta'
          ? 'மளிகை மற்றும் காய்கறி செலவுகள் வழக்கமான வரம்பிற்குள் உள்ளன.'
          : 'Grocery and fresh produce expenses are within normal limits.',
        lang === 'ta'
          ? 'மின்சாரம் மற்றும் பயன்பாட்டுச் செலவுகள் கடந்த வாரத்தை விட மிச்சமாகியுள்ளன.'
          : 'Utility bills have stayed stable compared to last month.',
        lang === 'ta'
          ? 'குழந்தைகளின் சேமிப்பு இலக்குகளுக்குத் தொடர்ந்து ஊக்கமளியுங்கள்.'
          : 'Children are showing great discipline with their piggy bank goals.',
      ],
      savingTip:
        lang === 'ta'
          ? 'மளிகைப் பொருட்களை வாராந்திர சலுகை நாட்களில் வாங்கினால் மாதம் ₹600 வரை மிச்சப்படுத்தலாம் அம்மா.'
          : 'Purchasing dry provisions during weekly discount cycles can save up to ₹600 per month.',
      budgetForecast: {
        predictedSpent: Math.round(totalSpent * 1.15),
        status: isOver ? 'risk_of_overspend' : 'on_track',
      },
      isOfflineFallback: true,
    });
  }
}
