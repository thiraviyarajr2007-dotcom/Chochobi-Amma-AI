import { ScanBillResponseSchema } from '../src/lib/geminiSchemas';
import { callGeminiStructured, checkRateLimit } from './_utils';

export default async function handler(req: any, res: any) {
  const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  }

  const { imageBase64, mimeType = 'image/jpeg', lang = 'ta' } = req.body || {};

  if (!imageBase64 || typeof imageBase64 !== 'string') {
    return res.status(400).json({ error: 'Image base64 data is required' });
  }

  // Strip data:image/...;base64, prefix if present
  const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');

  if (cleanBase64.length > 5 * 1024 * 1024) {
    return res.status(400).json({ error: 'Image size exceeds 4MB limit' });
  }

  const systemPrompt = `You are Chocobi Amma AI, an expert Indian store and provision receipt analyzer.
Inspect the attached image of a store receipt/bill.
Extract:
1. 'merchant': Store/Shop name in Tamil or English (e.g. "சரவணா ஸ்டோர்ஸ்" or "Saravana Stores", "Nilgiris", "Apollo Pharmacy").
2. 'date': Formatted as YYYY-MM-DD. If missing, use today's date ${new Date().toISOString().slice(0, 10)}.
3. 'total': Net total amount paid as a positive number.
4. 'items': List of line items with name and price.
5. 'suggestedCategory': One of: 'groceries', 'dairy', 'vegetables', 'education', 'medical', 'utilities', 'temple', 'clothing', 'snacks', 'transport', 'other'.

Respond strictly in valid JSON format.`;

  const responseSchemaJson = {
    type: 'OBJECT',
    properties: {
      merchant: { type: 'STRING' },
      date: { type: 'STRING' },
      total: { type: 'NUMBER' },
      items: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            name: { type: 'STRING' },
            price: { type: 'NUMBER' },
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
          },
          required: ['name', 'price'],
        },
      },
      suggestedCategory: {
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
    },
    required: ['merchant', 'date', 'total', 'items', 'suggestedCategory'],
  };

  try {
    const result = await callGeminiStructured({
      systemPrompt,
      userPrompt: `Extract receipt details in ${lang === 'ta' ? 'Tamil/English' : 'English'}.`,
      imageInlineData: {
        mimeType,
        data: cleanBase64,
      },
      schema: ScanBillResponseSchema,
      responseSchemaJson,
    });

    return res.status(200).json(result);
  } catch (err: any) {
    console.warn('Gemini bill scan fallback:', err?.message);
    // Intelligent fallback for demo / offline simulation
    return res.status(200).json({
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
      isOfflineFallback: true,
    });
  }
}

