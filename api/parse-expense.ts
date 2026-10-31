import { ParseExpenseResponseSchema } from '../src/lib/geminiSchemas';
import { parseExpensesOffline } from '../src/lib/offlineParser';
import { callGeminiStructured, checkRateLimit } from './_utils';

export default async function handler(req: any, res: any) {
  const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  }

  const { transcript, lang = 'ta' } = req.body || {};

  if (!transcript || typeof transcript !== 'string') {
    return res.status(400).json({ error: 'Transcript is required' });
  }

  if (transcript.length > 2000) {
    return res.status(400).json({ error: 'Transcript too long (max 2000 characters)' });
  }

  const systemPrompt = `You are Chocobi Amma AI, an expert Tamil and Indian household expense parser.
Analyze speech or text transcript and extract all distinct expenses into structured JSON.
Understand Tamil, Tanglish (Tamil written in English script), and Indian English.
Currency markers may include ₹, ரூ, ரூபாய், Rs, INR, rupees, or standalone numbers.
Standard Indian household categories:
- 'groceries' (மளிகை, provisions, supermarket, rice, dal, oil)
- 'dairy' (பால், curd, aavin, milk)
- 'vegetables' (காய்கறி, veggies, tomato, onion, fruits)
- 'medical' (மருந்து, pharmacy, doctor, tablets)
- 'utilities' (TNEB, EB bill, electricity, gas cylinder, recharge, wifi)
- 'transport' (auto, bus, petrol, diesel, train, ola)
- 'education' (school fees, books, notebooks, tuition)
- 'temple' (temple, flowers, pooja, donation)
- 'clothing' (saree, tailoring, dress, clothes)
- 'snacks' (tea, coffee, biscuits, bakery, snacks)
- 'other' (gold chit, maintenance, other)

Respond ONLY with valid JSON following the schema.`;

  const responseSchemaJson = {
    type: 'OBJECT',
    properties: {
      expenses: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            category: {
              type: 'STRING',
              enum: [
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
              ],
            },
            amount: { type: 'NUMBER' },
            note: { type: 'STRING' },
          },
          required: ['category', 'amount', 'note'],
        },
      },
    },
    required: ['expenses'],
  };

  try {
    const result = await callGeminiStructured({
      systemPrompt,
      userPrompt: `Language: ${lang}\nTranscript: "${transcript}"`,
      schema: ParseExpenseResponseSchema,
      responseSchemaJson,
    });

    return res.status(200).json(result);
  } catch (err: any) {
    console.warn('Gemini expense parse fallback triggered:', err?.message);
    // Offline / Fallback Regex Parser
    const fallbackItems = parseExpensesOffline(transcript);
    if (fallbackItems.length > 0) {
      return res.status(200).json({ expenses: fallbackItems, isOfflineFallback: true });
    }
    return res.status(500).json({
      error: 'Could not parse expense details',
      message: err?.message,
    });
  }
}

