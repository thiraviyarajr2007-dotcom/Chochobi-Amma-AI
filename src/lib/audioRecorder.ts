import { useState, useRef, useEffect, useCallback } from 'react';
import { parseExpenseApi, voiceExpenseApi, ParsedApiExpense } from './apiClient';
import { Language, ExpenseCategory } from '../types';

export interface RecordAudioResult {
  wavBlob: Blob;
  durationMs: number;
  base64: string;
}

/**
 * Encode raw Float32 mono PCM samples to standard 16-bit 16kHz PCM WAV format with 44-byte RIFF header.
 */
export function encodeWavFromFloat32(samples: Float32Array, sampleRate = 16000): ArrayBuffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF Chunk Descriptor
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true); // ChunkSize
  writeString(8, 'WAVE');

  // "fmt " Sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, byteRate, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, bitsPerSample, true); // BitsPerSample

  // "data" Sub-chunk
  writeString(36, 'data');
  view.setUint32(40, dataSize, true); // Subchunk2Size

  // Write PCM 16-bit audio samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    const int16 = s < 0 ? s * 0x8000 : s * 0x7fff;
    view.setInt16(offset, int16, true);
    offset += 2;
  }

  return buffer;
}

/**
 * Convert any browser recorded audio Blob to 16 kHz Mono 16-bit PCM WAV.
 */
export async function convertBlobTo16kMonoWav(rawBlob: Blob): Promise<Blob> {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error('Web Audio API (AudioContext) is not supported');
  }

  const audioCtx = new AudioContextClass();
  try {
    const arrayBuffer = await rawBlob.arrayBuffer();
    const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    const targetSampleRate = 16000;
    const targetLength = Math.max(1, Math.ceil(decodedBuffer.duration * targetSampleRate));

    const OfflineCtxClass = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
    let channelData: Float32Array;

    if (OfflineCtxClass) {
      const offlineCtx = new OfflineCtxClass(1, targetLength, targetSampleRate);
      const source = offlineCtx.createBufferSource();
      source.buffer = decodedBuffer;
      source.connect(offlineCtx.destination);
      source.start(0);
      const renderedBuffer = await offlineCtx.startRendering();
      channelData = renderedBuffer.getChannelData(0);
    } else {
      channelData = decodedBuffer.getChannelData(0);
    }

    const wavBuffer = encodeWavFromFloat32(channelData, targetSampleRate);
    return new Blob([wavBuffer], { type: 'audio/wav' });
  } finally {
    if (audioCtx.state !== 'closed') {
      await audioCtx.close().catch(() => {});
    }
  }
}

/**
 * Convert Blob to Base64 data string (without prefix).
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export type VoiceMode = 'browser' | 'cloud';
export type VoiceStatus = 'idle' | 'listening' | 'recording' | 'processing' | 'confirm' | 'error';

export interface UseVoiceInputOptions {
  lang: Language;
  onParsed?: (items: ParsedApiExpense[]) => void;
  onError?: (errMessage: string) => void;
}

export interface UseVoiceInputReturn {
  status: VoiceStatus;
  mode: VoiceMode;
  setMode: (mode: VoiceMode) => void;
  transcript: string;
  setTranscript: (text: string) => void;
  parsedExpenses: ParsedApiExpense[];
  setParsedExpenses: React.Dispatch<React.SetStateAction<ParsedApiExpense[]>>;
  error: string | null;
  audioLevel: number; // 0 to 100 for live waveform
  countdown: number; // 15 to 0 seconds
  needsClarification: boolean;
  clarificationQuestion: string | null;
  start: () => Promise<void>;
  stop: () => void;
  reset: () => void;
  isBrowserSupported: boolean;
}

/**
 * Robust Voice Input Hook:
 * Order of attempts:
 * 1) Web Speech API (ta-IN / en-IN) -> transcript -> /api/parse-expense
 * 2) If unsupported, network error, or empty result twice -> Recorder mode (MediaRecorder -> 16kHz WAV -> /api/voice-expense)
 * 3) If both fail -> friendly error + manual form fallback
 */
export function useVoiceInput({
  lang,
  onParsed,
  onError,
}: UseVoiceInputOptions): UseVoiceInputReturn {
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [mode, setModeState] = useState<VoiceMode>('browser');
  const [transcript, setTranscript] = useState('');
  const [parsedExpenses, setParsedExpenses] = useState<ParsedApiExpense[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [countdown, setCountdown] = useState<number>(15);
  const [needsClarification, setNeedsClarification] = useState(false);
  const [clarificationQuestion, setClarificationQuestion] = useState<string | null>(null);

  // Failure count for browser recognition
  const emptyResultCountRef = useRef(0);

  // References
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Check if browser speech recognition is supported
  const checkBrowserSpeechSupported = (): boolean => {
    if (typeof window === 'undefined') return false;
    const win = window as any;
    return !!(win.SpeechRecognition || win.webkitSpeechRecognition);
  };

  const isBrowserSupported = checkBrowserSpeechSupported();

  // Set initial mode based on browser support
  useEffect(() => {
    if (!isBrowserSupported) {
      setModeState('cloud');
    }
  }, [isBrowserSupported]);

  // Clean up all audio resources
  const cleanupRecording = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  const reset = useCallback(() => {
    cleanupRecording();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    setStatus('idle');
    setTranscript('');
    setParsedExpenses([]);
    setError(null);
    setNeedsClarification(false);
    setClarificationQuestion(null);
    setCountdown(15);
  }, [cleanupRecording]);

  // Set mode safely
  const setMode = useCallback(
    (newMode: VoiceMode) => {
      reset();
      setModeState(newMode);
    },
    [reset]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRecording();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, [cleanupRecording]);

  // Process WAV audio through /api/voice-expense
  const processRecordedAudio = async (rawBlob: Blob, durationMs: number) => {
    if (durationMs < 700) {
      setStatus('error');
      const msg =
        lang === 'ta'
          ? 'பதிவு மிகக் குறைவாக இருந்தது. அம்மா, சற்று நீண்ட நேரம் பேசவும்.'
          : 'Audio was too short. Please speak a little longer Amma.';
      setError(msg);
      onError?.(msg);
      return;
    }

    setStatus('processing');
    try {
      // Convert to 16kHz mono WAV
      const wavBlob = await convertBlobTo16kMonoWav(rawBlob);
      const base64 = await blobToBase64(wavBlob);

      const response = await voiceExpenseApi(base64, lang, 'audio/wav');

      if (response.transcript) {
        setTranscript(response.transcript);
      }

      if (response.needsClarification) {
        setNeedsClarification(true);
        setClarificationQuestion(
          response.clarificationQuestion ||
            (lang === 'ta'
              ? 'அம்மா, செலவான தொகை அல்லது பொருளின் பெயர் தெளிவாகக் கேட்கவில்லை.'
              : 'Amma, could you clarify the item or the amount spent?')
        );
        setStatus('confirm');
        return;
      }

      if (response.expenses && response.expenses.length > 0) {
        const mapped: ParsedApiExpense[] = response.expenses.map((e) => ({
          category: (e.category as ExpenseCategory) || 'other',
          amount: e.amount,
          note: e.item,
        }));
        setParsedExpenses(mapped);
        setStatus('confirm');
        onParsed?.(mapped);
      } else {
        setStatus('error');
        const msg =
          lang === 'ta'
            ? 'செலவுத் தகவல் கண்டறியப்படவில்லை. மீண்டும் சொல்லவும் அம்மா.'
            : 'No expense items detected. Please try speaking again Amma.';
        setError(msg);
        onError?.(msg);
      }
    } catch (err: any) {
      setStatus('error');
      const msg =
        err?.message ||
        (lang === 'ta'
          ? 'குரல் பதிவு செயலாக்கத்தில் பிழை ஏற்பட்டது.'
          : 'Error processing recorded audio.');
      setError(msg);
      onError?.(msg);
    }
  };

  // Start MediaRecorder (Cloud / Fallback mode)
  const startRecordingAudio = async () => {
    cleanupRecording();
    setError(null);
    setTranscript('');
    setNeedsClarification(false);
    setClarificationQuestion(null);
    setCountdown(15);
    recordedChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      mediaStreamRef.current = stream;

      // AudioContext level analyzer for real-time waveform
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const audioCtx = new AudioContextClass();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateLevel = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          // Scale to 0-100
          setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
          animationFrameRef.current = requestAnimationFrame(updateLevel);
        };
        updateLevel();
      }

      // Check supported MIME types for MediaRecorder
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        }
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const durationMs = Date.now() - startTimeRef.current;
        cleanupRecording();
        const rawBlob = new Blob(recordedChunksRef.current, { type: mimeType });
        await processRecordedAudio(rawBlob, durationMs);
      };

      startTimeRef.current = Date.now();
      recorder.start(250);
      setStatus('recording');

      // 15 seconds countdown timer
      let remaining = 15;
      countdownTimerRef.current = setInterval(() => {
        remaining -= 1;
        setCountdown(remaining);
        if (remaining <= 0) {
          stop();
        }
      }, 1000);
    } catch (err: any) {
      cleanupRecording();
      setStatus('error');
      const isDenied =
        err?.name === 'NotAllowedError' ||
        err?.name === 'PermissionDeniedError' ||
        err?.message?.includes('denied');
      const msg = isDenied
        ? lang === 'ta'
          ? 'மைக்ரோஃபோன் அனுமதி மறுக்கப்பட்டுள்ளது. உலாவி அமைப்புகளில் மைக்கை அனுமதிக்கவும் அம்மா.'
          : 'Microphone permission was denied. Please allow mic access in your browser settings Amma.'
        : lang === 'ta'
        ? 'மைக்ரோஃபோனைத் தொடங்க முடியவில்லை. தயவுசெய்து தட்டச்சு செய்து சேர்க்கவும்.'
        : 'Could not access microphone. Please try typing manually.';
      setError(msg);
      onError?.(msg);
    }
  };

  // Start Browser Web Speech API
  const startBrowserSpeech = () => {
    setError(null);
    setTranscript('');
    setNeedsClarification(false);
    setClarificationQuestion(null);

    const win = window as any;
    const SpeechClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechClass) {
      // Auto-fallback to cloud recorder mode
      setModeState('cloud');
      startRecordingAudio();
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechClass();
      recognitionRef.current = recognition;
      recognition.lang = lang === 'ta' ? 'ta-IN' : 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = true;

      let finalRecognized = '';

      recognition.onstart = () => {
        setStatus('listening');
      };

      recognition.onresult = (event: any) => {
        let currentText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        finalRecognized = currentText;
        setTranscript(currentText);
      };

      recognition.onerror = (event: any) => {
        console.warn('Browser SpeechRecognition error:', event.error);
        const errType = event.error;

        // Certain errors automatically trigger cloud fallback
        if (
          errType === 'network' ||
          errType === 'service-not-allowed' ||
          errType === 'language-not-supported'
        ) {
          setModeState('cloud');
          startRecordingAudio();
          return;
        }

        if (errType === 'no-speech') {
          emptyResultCountRef.current += 1;
          if (emptyResultCountRef.current >= 2) {
            // After 2 empty results, fallback to cloud recorder mode
            setModeState('cloud');
            startRecordingAudio();
            return;
          }
        }

        setStatus('error');
        const msg =
          errType === 'not-allowed'
            ? lang === 'ta'
              ? 'மைக்ரோஃபோன் அனுமதி மறுக்கப்பட்டுள்ளது. உலாவி அமைப்புகளில் மைக்கை அனுமதிக்கவும் அம்மா.'
              : 'Microphone permission was denied. Please allow mic access in browser settings Amma.'
            : lang === 'ta'
            ? 'குரல் கேட்கவில்லை அம்மா. மைக்கைத் தொட்டு மீண்டும் சொல்லுங்கள்.'
            : 'No speech heard Amma. Please tap mic and try again.';
        setError(msg);
        onError?.(msg);
      };

      recognition.onend = async () => {
        if (finalRecognized.trim()) {
          emptyResultCountRef.current = 0;
          setStatus('processing');
          try {
            const result = await parseExpenseApi(finalRecognized.trim(), lang);
            if (result.expenses && result.expenses.length > 0) {
              setParsedExpenses(result.expenses);
              setStatus('confirm');
              onParsed?.(result.expenses);
            } else {
              emptyResultCountRef.current += 1;
              if (emptyResultCountRef.current >= 2) {
                setModeState('cloud');
                startRecordingAudio();
                return;
              }
              setStatus('error');
              const msg =
                lang === 'ta'
                  ? 'செலவுப் பொருட்கள் கண்டறியப்படவில்லை. மீண்டும் முயற்சிக்கவும் அம்மா.'
                  : 'No expenses detected. Please try speaking again Amma.';
              setError(msg);
              onError?.(msg);
            }
          } catch (err: any) {
            // Server error parsing speech -> try cloud recorder
            setModeState('cloud');
            startRecordingAudio();
          }
        } else {
          emptyResultCountRef.current += 1;
          if (emptyResultCountRef.current >= 2) {
            setModeState('cloud');
            startRecordingAudio();
          } else {
            setStatus('idle');
          }
        }
      };

      recognition.start();
    } catch (err: any) {
      console.warn('SpeechRecognition start failed, switching to cloud recorder:', err);
      setModeState('cloud');
      startRecordingAudio();
    }
  };

  const start = async () => {
    if (mode === 'browser' && isBrowserSupported) {
      startBrowserSpeech();
    } else {
      await startRecordingAudio();
    }
  };

  const stop = () => {
    if (mode === 'browser' && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    } else if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
  };

  return {
    status,
    mode,
    setMode,
    transcript,
    setTranscript,
    parsedExpenses,
    setParsedExpenses,
    error,
    audioLevel,
    countdown,
    needsClarification,
    clarificationQuestion,
    start,
    stop,
    reset,
    isBrowserSupported,
  };
}
