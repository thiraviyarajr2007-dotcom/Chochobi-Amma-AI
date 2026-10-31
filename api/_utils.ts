import { z } from 'zod';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(ip: string, maxRequests = 40, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

export async function callGeminiStructured<T>(params: {
  systemPrompt: string;
  userPrompt: string;
  imageInlineData?: { mimeType: string; data: string };
  schema: z.ZodType<T>;
  responseSchemaJson: Record<string, unknown>;
}): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY_NOT_CONFIGURED');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const parts: Array<Record<string, unknown>> = [];
  if (params.imageInlineData) {
    parts.push({
      inlineData: params.imageInlineData,
    });
  }
  parts.push({
    text: `${params.systemPrompt}\n\nUser Input:\n${params.userPrompt}`,
  });

  const payload = {
    contents: [{ parts }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: params.responseSchemaJson,
      temperature: 0.1,
    },
  };

  // Attempt with 1 retry on invalid format
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API Error (${response.status}): ${errorText}`);
      }

      const data = (await response.json()) as any;
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error('Empty response received from Gemini');
      }

      const parsedJson = JSON.parse(rawText);
      const validated = params.schema.parse(parsedJson);
      return validated;
    } catch (err) {
      lastError = err;
      if (attempt === 0) {
        // Wait 250ms and retry once
        await new Promise((res) => setTimeout(res, 250));
      }
    }
  }

  throw lastError;
}
