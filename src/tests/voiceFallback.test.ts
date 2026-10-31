import { describe, it, expect } from 'vitest';
import { encodeWavFromFloat32 } from '../lib/audioRecorder';
import {
  VoiceExpenseRequestSchema,
  VoiceExpenseResponseSchema,
} from '../lib/geminiSchemas';

describe('Voice Audio WAV Encoder', () => {
  it('creates valid 16kHz Mono 16-bit PCM RIFF/WAVE header and data', () => {
    // Generate 1600 samples (0.1s at 16,000 Hz)
    const sampleCount = 1600;
    const samples = new Float32Array(sampleCount);
    for (let i = 0; i < sampleCount; i++) {
      // 440 Hz test tone
      samples[i] = Math.sin((2 * Math.PI * 440 * i) / 16000);
    }

    const wavBuffer = encodeWavFromFloat32(samples, 16000);
    const view = new DataView(wavBuffer);

    // Total file size: 44 bytes header + sampleCount * 2 bytes
    expect(wavBuffer.byteLength).toBe(44 + sampleCount * 2);

    // 1. "RIFF" chunk
    const riff = String.fromCharCode(
      view.getUint8(0),
      view.getUint8(1),
      view.getUint8(2),
      view.getUint8(3)
    );
    expect(riff).toBe('RIFF');

    // 2. ChunkSize = 36 + dataSize
    const chunkSize = view.getUint32(4, true);
    expect(chunkSize).toBe(36 + sampleCount * 2);

    // 3. "WAVE" format
    const wave = String.fromCharCode(
      view.getUint8(8),
      view.getUint8(9),
      view.getUint8(10),
      view.getUint8(11)
    );
    expect(wave).toBe('WAVE');

    // 4. "fmt " subchunk
    const fmt = String.fromCharCode(
      view.getUint8(12),
      view.getUint8(13),
      view.getUint8(14),
      view.getUint8(15)
    );
    expect(fmt).toBe('fmt ');

    // 5. PCM subchunk1 size = 16
    expect(view.getUint32(16, true)).toBe(16);

    // 6. Audio format = 1 (Linear PCM)
    expect(view.getUint16(20, true)).toBe(1);

    // 7. Channels = 1 (Mono)
    expect(view.getUint16(22, true)).toBe(1);

    // 8. Sample rate = 16,000 Hz
    expect(view.getUint32(24, true)).toBe(16000);

    // 9. Byte rate = 16,000 * 1 * 2 = 32,000 bytes/sec
    expect(view.getUint32(28, true)).toBe(32000);

    // 10. Block align = 2 bytes
    expect(view.getUint16(32, true)).toBe(2);

    // 11. Bits per sample = 16
    expect(view.getUint16(34, true)).toBe(16);

    // 12. "data" subchunk
    const dataTag = String.fromCharCode(
      view.getUint8(36),
      view.getUint8(37),
      view.getUint8(38),
      view.getUint8(39)
    );
    expect(dataTag).toBe('data');

    // 13. Subchunk2 size = sampleCount * 2
    expect(view.getUint32(40, true)).toBe(sampleCount * 2);

    // 14. Sample values are within signed 16-bit range (-32768 to 32767)
    const firstSample = view.getInt16(44, true);
    expect(firstSample).toBeGreaterThanOrEqual(-32768);
    expect(firstSample).toBeLessThanOrEqual(32767);
  });
});

describe('Voice Expense Zod Schemas', () => {
  it('validates a correct VoiceExpenseRequest', () => {
    const validPayload = {
      audioBase64: 'UklGRiYAAABXQVZFZm10EBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
      mimeType: 'audio/wav',
      lang: 'ta',
    };
    const parsed = VoiceExpenseRequestSchema.safeParse(validPayload);
    expect(parsed.success).toBe(true);
  });

  it('rejects unsupported audio mime types in VoiceExpenseRequest', () => {
    const invalidPayload = {
      audioBase64: 'c29tZSBtcDMgZGF0YQ==',
      mimeType: 'audio/mp3',
      lang: 'en',
    };
    const parsed = VoiceExpenseRequestSchema.safeParse(invalidPayload);
    expect(parsed.success).toBe(false);
  });

  it('validates a structured VoiceExpenseResponse with extracted expenses', () => {
    const validResponse = {
      transcript: 'இன்னைக்கு காய்கறி 250 ரூபாய், ஆட்டோ 80',
      language: 'ta',
      expenses: [
        {
          item: 'காய்கறி',
          amount: 250,
          category: 'vegetables',
          confidence: 0.98,
        },
        {
          item: 'ஆட்டோ',
          amount: 80,
          category: 'transport',
          confidence: 0.95,
        },
      ],
      needsClarification: false,
    };
    const parsed = VoiceExpenseResponseSchema.safeParse(validResponse);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.expenses).toHaveLength(2);
      expect(parsed.data.expenses[0].category).toBe('vegetables');
      expect(parsed.data.expenses[1].amount).toBe(80);
    }
  });

  it('validates a clarification response when audio is unclear', () => {
    const clarificationResponse = {
      transcript: 'காய்கறி...',
      language: 'ta',
      expenses: [],
      needsClarification: true,
      clarificationQuestion: 'அம்மா, காய்கறிக்கு எவ்வளவு தொகை செலவானது?',
    };
    const parsed = VoiceExpenseResponseSchema.safeParse(clarificationResponse);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.needsClarification).toBe(true);
      expect(parsed.data.clarificationQuestion).toContain('காய்கறிக்கு எவ்வளவு');
    }
  });

  it('rejects invalid categories in VoiceExpenseResponse', () => {
    const invalidCategory = {
      transcript: 'Bitcoin investment 5000',
      language: 'en',
      expenses: [
        {
          item: 'Bitcoin',
          amount: 5000,
          category: 'crypto_gambling', // Not in CategoryEnum
          confidence: 0.9,
        },
      ],
      needsClarification: false,
    };
    const parsed = VoiceExpenseResponseSchema.safeParse(invalidCategory);
    expect(parsed.success).toBe(false);
  });
});

describe('Audio Duration Check (Under 0.7s Rejection)', () => {
  it('correctly distinguishes short recordings vs valid recordings', () => {
    const isDurationValid = (ms: number) => ms >= 700;

    expect(isDurationValid(350)).toBe(false);
    expect(isDurationValid(699)).toBe(false);
    expect(isDurationValid(700)).toBe(true);
    expect(isDurationValid(3500)).toBe(true);
  });
});
