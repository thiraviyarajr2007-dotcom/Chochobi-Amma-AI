export default async function handler(req: any, res: any) {
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const hasKey = !!process.env.GEMINI_API_KEY;

  if (res && typeof res.status === 'function') {
    return res.status(200).json({
      status: 'ok',
      service: 'Chocobi Amma AI Gateway',
      geminiModel: model,
      geminiKeyConfigured: hasKey,
      timestamp: new Date().toISOString(),
    });
  }

  // Web Standard Response fallback
  return new Response(
    JSON.stringify({
      status: 'ok',
      service: 'Chocobi Amma AI Gateway',
      geminiModel: model,
      geminiKeyConfigured: hasKey,
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

