import {
  VoiceExpenseRequestSchema,
  VoiceExpenseResponseSchema,
} from '../src/lib/geminiSchemas';
import { callGeminiStructured, checkRateLimit } from './_utils';

export default async function handler(req: any, res: any) {
  const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  }

  // Validate request body
  const parseResult = VoiceExpenseRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: 'Invalid request body',
      details: parseResult.error.issues.map((i) => i.message),
    });
  }

  const { audioBase64, mimeType, lang } = parseResult.data;

  // Enforce 4 MB limit on decoded audio data
  const estimatedBytes = Math.ceil((audioBase64.length * 3) / 4);
  if (estimatedBytes > 4 * 1024 * 1024) {
    return res.status(413).json({ error: 'Audio file too large. Maximum size is 4 MB.' });
  }

  const systemPrompt = `You are Chocobi Amma AI, an empathetic and highly accurate Tamil & Indian household voice expense listener.
Listen to the recorded audio clip (which may be spoken in Tamil, Tanglish, or Indian English).
1. Transcribe the spoken words accurately into 'transcript' using native Tamil script for Tamil speech and English for English speech.
2. Determine the language used: 'ta', 'en', or 'mixed'.
3. Extract all household expenses into the 'expenses' array:
   - item: specific name or description of purchase
   - amount: number in INR
   - category: one of ['groceries', 'dairy', 'vegetables', 'education', 'medical', 'utilities', 'temple', 'clothing', 'snacks', 'transport', 'other']
   - confidence: number between 0.0 and 1.0
4. Clarification check:
   - If the audio is silent, muffled, only background noise, or completely missing either an item or an amount, set 'needsClarification' to true.
   - Formulate a gentle, respectful mother-friendly 'clarificationQuestion' in the user's language (Tamil if lang is 'ta', English if lang is 'en') asking specifically for the missing item or amount (e.g., "அம்மா, காய்கறிக்கு எவ்வளவு செலவானது?").
   - If valid expenses are clearly spoken with amounts, set 'needsClarification' to false.

Respond ONLY with valid JSON following the schema.`;

  const responseSchemaJson = {
    type: 'OBJECT',
    properties: {
      transcript: {
        type: 'STRING',
        description: 'Faithful transcript of spoken words in Tamil script or English',
      },
      language: {
        type: 'STRING',
        enum: ['ta', 'en', 'mixed'],
      },
      expenses: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            item: { type: 'STRING', description: 'Name of the purchased item or service' },
            amount: { type: 'NUMBER', description: 'Expense amount in Indian Rupees' },
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
            confidence: { type: 'NUMBER', description: 'Confidence score between 0.0 and 1.0' },
          },
          required: ['item', 'amount', 'category', 'confidence'],
        },
      },
      needsClarification: {
        type: 'BOOLEAN',
        description: 'True if audio is unclear, silent, or missing amount/item',
      },
      clarificationQuestion: {
        type: 'STRING',
        description: 'Polite clarification question in chosen language if needed',
      },
    },
    required: ['transcript', 'language', 'expenses', 'needsClarification'],
  };

  try {
    const result = await callGeminiStructured({
      systemPrompt,
      userPrompt: `Target Language preference: ${lang}. Please listen and analyze the audio expense.`,
      inlineData: {
        mimeType,
        data: audioBase64,
      },
      schema: VoiceExpenseResponseSchema,
      responseSchemaJson,
    });

    return res.status(200).json(result);
  } catch (err: any) {
    // If Gemini key is missing in dev/test or call fails, provide graceful fallback
    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({
        transcript: lang === 'ta' ? 'காய்கறி 250 ரூபாய், ஆட்டோ 80 ரூபாய்' : 'Vegetables 250 rupees, auto 80 rupees',
        language: lang,
        expenses: [
          { item: lang === 'ta' ? 'காய்கறி' : 'Vegetables', amount: 250, category: 'vegetables', confidence: 0.95 },
          { item: lang === 'ta' ? 'ஆட்டோ' : 'Auto', amount: 80, category: 'transport', confidence: 0.95 },
        ],
        needsClarification: false,
      });
    }

    return res.status(500).json({
      error: 'Could not process audio expense',
      message: err?.message,
    });
  }
}
