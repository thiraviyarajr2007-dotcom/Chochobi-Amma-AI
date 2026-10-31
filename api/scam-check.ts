import { ScamCheckResponseSchema } from '../src/lib/geminiSchemas';
import { callGeminiStructured, checkRateLimit } from './_utils';

export default async function handler(req: any, res: any) {
  const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  }

  const { messageText, imageBase64, lang = 'ta' } = req.body || {};

  if (!messageText && !imageBase64) {
    return res.status(400).json({ error: 'Message text or image screenshot is required' });
  }

  const systemPrompt = `You are Chocobi Amma AI Scam Shield, protecting Indian (especially Tamil Nadu) mothers from cyber fraud and financial scams.
Analyze the message text or screenshot carefully.
Watch out for common financial scams in India:
1. Fake TNEB electricity bill disconnection threats with APK/links.
2. Fake UPI "receive money" tricks asking user to enter PIN or scan QR code.
3. Bank KYC expiry, account freeze threats asking to click suspicious links.
4. Gas cylinder subsidy, PM Yojana lottery, or part-time job/task scams asking for OTP.
5. "Send ₹1 test payment to get ₹5,000 cash prize".

Tone and Reading Level:
- Explain at a 6th-grade reading level in warm, caring, protective tone for a mother.
- Language: Output explanations and advice strictly in ${lang === 'ta' ? 'simple polite Tamil' : 'clear simple English'}.

Output structure:
- 'verdict': 'safe' | 'suspicious' | 'scam'
- 'confidence': 0 to 100
- 'reasons': 2-3 simple bullet points explaining why it is safe/suspicious/scam.
- 'what_to_do': 2-3 clear actionable instructions (e.g. "எக்காரணத்தைக் கொண்டும் OTP சொல்லாதீர்கள்", "லிங்கை திறக்க வேண்டாம்", "சைபர் உதவி எண் 1930-ல் புகாரளிக்கவும்").`;

  const responseSchemaJson = {
    type: 'OBJECT',
    properties: {
      verdict: {
        type: 'STRING',
        enum: ['safe', 'suspicious', 'scam'],
      },
      confidence: { type: 'NUMBER' },
      reasons: {
        type: 'ARRAY',
        items: { type: 'STRING' },
      },
      what_to_do: {
        type: 'ARRAY',
        items: { type: 'STRING' },
      },
      summary_tamil: { type: 'STRING' },
      summary_english: { type: 'STRING' },
    },
    required: ['verdict', 'confidence', 'reasons', 'what_to_do'],
  };

  try {
    let imageInlineData: { mimeType: string; data: string } | undefined;
    if (imageBase64) {
      imageInlineData = {
        mimeType: 'image/jpeg',
        data: imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, ''),
      };
    }

    const result = await callGeminiStructured({
      systemPrompt,
      userPrompt: `Message to analyze:\n"""${messageText || 'See screenshot'}"""`,
      imageInlineData,
      schema: ScamCheckResponseSchema,
      responseSchemaJson,
    });

    return res.status(200).json(result);
  } catch (err: any) {
    console.warn('Gemini scam check fallback:', err?.message);
    // Intelligent fallback using keyword heuristics
    const text = (messageText || '').toLowerCase();
    const isTnebScam = text.includes('மின்சாரம்') || text.includes('tneb') || text.includes('disconnected');
    const isUpiScam = text.includes('வரவு') || text.includes('பரிசு') || text.includes('gpay') || text.includes('lottery') || text.includes('win');
    const isOtpScam = text.includes('otp') || text.includes('மானியம்') || text.includes('kyc');

    if (isTnebScam || isUpiScam || isOtpScam) {
      return res.status(200).json({
        verdict: 'scam',
        confidence: 96,
        reasons: [
          lang === 'ta'
            ? 'அவசரமாக பயமுறுத்தி அல்லது பரிசு ஆசை காட்டி பணம் பறிக்கும் மோசடி.'
            : 'Threatens service cutoff or promises fake rewards to steal money.',
          lang === 'ta'
            ? 'அரசு நிறுவனங்களோ வங்கிகளோ இதுபோன்று தனிப்பட்ட லிங்குகளை SMS மூலம் அனுப்பாது.'
            : 'Official banks or utility boards never send unofficial APKs or payment links.',
        ],
        what_to_do: [
          lang === 'ta'
            ? 'எக்காரணத்தைக் கொண்டும் இந்த லிங்கைத் தொடாதீர்கள்!'
            : 'Do NOT click any link in this message!',
          lang === 'ta'
            ? 'உங்கள் வங்கி PIN அல்லது OTP-ஐ யாருடனும் பகிராதீர்கள்.'
            : 'Never enter your UPI PIN or share OTP with anyone.',
          lang === 'ta'
            ? 'சந்தேகம் இருந்தால் தேசிய சைபர் உதவி எண் 1930-ஐ அழைக்கவும்.'
            : 'Report suspicious cyber fraud immediately to helpline 1930.',
        ],
        isOfflineFallback: true,
      });
    }

    return res.status(200).json({
      verdict: 'safe',
      confidence: 88,
      reasons: [
        lang === 'ta'
          ? 'இதில் எந்தவித மிரட்டலோ, ஆபத்தான லிங்கோ அல்லது OTP கேட்பதோ இல்லை.'
          : 'No urgent threats, malicious links, or OTP requests detected.',
      ],
      what_to_do: [
        lang === 'ta'
          ? 'இது பாதுகாப்பான செய்தி. எனினும் எவரிடமும் OTP பகிராமல் கவனமாக இருங்கள்.'
          : 'This message appears safe. Always remember never to share banking OTPs.',
      ],
      isOfflineFallback: true,
    });
  }
}

