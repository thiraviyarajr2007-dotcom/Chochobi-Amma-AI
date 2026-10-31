import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  FileText,
  Camera,
  Check,
  Volume2,
  AlertCircle,
  Edit2,
  Trash2,
  Plus,
  Sparkles,
} from 'lucide-react';
import { useI18n } from '../i18n/i18nContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { AmountInput } from '../components/AmountInput';
import { CategoryChip } from '../components/CategoryChip';
import { Mascot } from '../components/Mascot';
import { useToast } from '../components/Toast';
import { ExpenseCategory, ExpenseItem } from '../types';
import { parseExpenseApi, scanBillApi, ParsedApiExpense } from '../lib/apiClient';
import { compressImageClientSide } from '../lib/imageCompressor';
import { db } from '../lib/db';

interface AddExpenseScreenProps {
  onAddExpense: (expense: Omit<ExpenseItem, 'id'>) => void;
  onDone: () => void;
}

type AddTab = 'voice' | 'manual' | 'scan';

// Web Speech API interfaces
interface IWindowSpeechRecognition extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export const AddExpenseScreen: React.FC<AddExpenseScreenProps> = ({
  onAddExpense,
  onDone,
}) => {
  const { lang, t, formatRupee } = useI18n();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<AddTab>('voice');

  // Manual inputs
  const [manualAmount, setManualAmount] = useState<number>(0);
  const [manualCategory, setManualCategory] = useState<ExpenseCategory>('groceries');
  const [manualNote, setManualNote] = useState<string>('');

  // Voice recognition states
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  // Review & Confirmation Cards (Extracted items pending mom's approval)
  const [pendingItems, setPendingItems] = useState<ParsedApiExpense[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Scan state
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories: ExpenseCategory[] = [
    'groceries',
    'dairy',
    'vegetables',
    'medical',
    'utilities',
    'education',
    'temple',
    'snacks',
    'transport',
    'other',
  ];

  // Initialize SpeechRecognition support check
  useEffect(() => {
    const win = window as IWindowSpeechRecognition;
    const SpeechClass = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechClass) {
      setSpeechSupported(false);
    }
  }, []);

  const handleStartVoice = () => {
    setVoiceError(null);
    setLiveTranscript('');
    setPendingItems([]);

    const win = window as IWindowSpeechRecognition;
    const SpeechClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechClass) {
      setSpeechSupported(false);
      setVoiceError(t('addExpense.voiceUnsupported'));
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

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let currentText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setLiveTranscript(currentText);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setVoiceError(t('addExpense.micPermissionDenied'));
        } else if (event.error === 'no-speech') {
          setVoiceError(t('addExpense.noSpeechDetected'));
        } else {
          setVoiceError(`Voice error: ${event.error}`);
        }
      };

      recognition.onend = async () => {
        setIsListening(false);
        if (liveTranscript.trim()) {
          await analyzeVoiceTranscript(liveTranscript.trim());
        }
      };

      recognition.start();
    } catch (err: any) {
      setIsListening(false);
      setVoiceError(err?.message || 'Could not start microphone');
    }
  };

  const handleStopVoice = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const analyzeVoiceTranscript = async (text: string) => {
    setIsAnalyzing(true);
    try {
      const result = await parseExpenseApi(text, lang);
      if (result.expenses && result.expenses.length > 0) {
        setPendingItems(result.expenses);
        showToast(
          `${result.expenses.length} ${t('expensesList.countItems')} கண்டறியப்பட்டது`,
          'success'
        );
      } else {
        showToast(t('addExpense.noSpeechDetected'), 'warning');
      }
    } catch {
      showToast(t('common.error'), 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Bill Scanning
  const handleFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setPendingItems([]);

    try {
      // 1. Compress client-side <1MB
      const { base64 } = await compressImageClientSide(file, 1280, 0.82);

      // 2. Call Gemini Vision API
      const scanData = await scanBillApi(base64, lang);

      if (scanData.items && scanData.items.length > 0) {
        const mapped = scanData.items.map((i) => ({
          name: i.name,
          note: `${scanData.merchant}: ${i.name}`,
          amount: i.price,
          category: i.category || scanData.suggestedCategory || 'groceries',
        }));
        setPendingItems(mapped);
        showToast(t('addExpense.billScanned'), 'success');
      } else if (scanData.total > 0) {
        setPendingItems([
          {
            note: `${scanData.merchant} பில்`,
            amount: scanData.total,
            category: scanData.suggestedCategory || 'groceries',
          },
        ]);
        showToast(t('addExpense.billScanned'), 'success');
      }
    } catch (err: any) {
      showToast(err?.message || t('common.error'), 'error');
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Save reviewed pending expenses
  const handleSavePendingItems = async () => {
    if (pendingItems.length === 0) return;

    const today = new Date().toISOString().slice(0, 10);
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    for (const item of pendingItems) {
      if (item.amount > 0) {
        const newRecord: ExpenseItem = {
          id: 'exp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
          amount: item.amount,
          category: item.category,
          note: item.note || t(`categories.${item.category}`),
          date: today,
          time: nowTime,
          isVoice: activeTab === 'voice',
          createdAt: Date.now(),
        };

        await db.expenses.add(newRecord);
        onAddExpense(newRecord);
      }
    }

    showToast(t('addExpense.addedSuccess'), 'success');
    onDone();
  };

  // Manual save
  const handleSaveManual = async () => {
    if (manualAmount <= 0) {
      showToast(t('addExpense.amountLabel') + ' > 0', 'warning');
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newRecord: ExpenseItem = {
      id: 'exp-' + Date.now(),
      amount: manualAmount,
      category: manualCategory,
      note: manualNote || t(`categories.${manualCategory}`),
      date: today,
      time: nowTime,
      isVoice: false,
      createdAt: Date.now(),
    };

    await db.expenses.add(newRecord);
    onAddExpense(newRecord);
    showToast(t('addExpense.addedSuccess'), 'success');
    onDone();
  };

  return (
    <div className="pb-28 pt-2 px-4 flex flex-col gap-5 max-w-[440px] mx-auto select-none">
      {/* 3 Tabs Switcher */}
      <div className="flex p-1 bg-white rounded-3xl border border-[#EFEBE9] shadow-warm-sm">
        <button
          type="button"
          onClick={() => setActiveTab('voice')}
          className={`flex-1 py-3 px-2 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'voice'
              ? 'bg-kumkum text-white shadow-warm-sm'
              : 'text-warmBrown-muted hover:text-warmBrown'
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>{t('addExpense.tabVoice')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('manual')}
          className={`flex-1 py-3 px-2 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'manual'
              ? 'bg-kumkum text-white shadow-warm-sm'
              : 'text-warmBrown-muted hover:text-warmBrown'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{t('addExpense.tabManual')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('scan')}
          className={`flex-1 py-3 px-2 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'scan'
              ? 'bg-kumkum text-white shadow-warm-sm'
              : 'text-warmBrown-muted hover:text-warmBrown'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>{t('addExpense.tabScan')}</span>
        </button>
      </div>

      {/* 1. Voice Tab */}
      {activeTab === 'voice' && (
        <div className="flex flex-col gap-4 animate-fade-in">
          <Card variant="surface" className="text-center flex flex-col items-center p-6 border-kumkum/30">
            <Mascot mood={isListening || isAnalyzing ? 'thinking' : 'happy'} size={120} />
            <h3 className="text-lg sm:text-xl font-extrabold text-warmBrown mt-3">
              {isListening
                ? t('addExpense.listening')
                : isAnalyzing
                ? 'AI செலவுகளைப் பிரிக்கிறது...'
                : t('addExpense.voicePrompt')}
            </h3>
            <p className="text-xs sm:text-sm text-warmBrown-subtle mt-1 max-w-xs">
              {t('addExpense.voiceExample')}
            </p>

            {/* Giant Center Mic Button */}
            <div className="my-6 relative">
              {isListening && (
                <div className="absolute -inset-4 rounded-full bg-kumkum/20 animate-ping" />
              )}
              <button
                type="button"
                onClick={isListening ? handleStopVoice : handleStartVoice}
                className={`w-24 h-24 rounded-full flex items-center justify-center shadow-warm-lg transition-transform active:scale-90 ${
                  isListening
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-gradient-to-tr from-kumkum to-kumkum-dark text-white hover:scale-105'
                }`}
                aria-label="Toggle Microphone"
              >
                <Mic className="w-10 h-10" />
              </button>
            </div>

            {/* Live Transcript Display */}
            {liveTranscript && (
              <div className="w-full p-4 rounded-2xl bg-cream border border-turmeric text-left flex items-start gap-3 mt-2">
                <Volume2 className="w-5 h-5 text-kumkum flex-shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-warmBrown-subtle">
                    {t('addExpense.voiceDetected')}
                  </span>
                  <span className="text-base font-extrabold text-warmBrown">
                    {liveTranscript}
                  </span>
                </div>
              </div>
            )}

            {/* Friendly Voice Error Message */}
            {voiceError && (
              <div className="mt-3 p-3 rounded-2xl bg-red-50 border border-red-200 text-left flex items-start gap-2.5 w-full">
                <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-danger leading-relaxed">
                    {voiceError}
                  </span>
                  {!speechSupported && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('manual')}
                      className="text-xs font-extrabold text-kumkum underline mt-1 text-left"
                    >
                      நேரடிப் பதிவிற்கு மாறுக (Switch to Manual) →
                    </button>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* 2. Manual Tab */}
      {activeTab === 'manual' && (
        <div className="flex flex-col gap-4 animate-fade-in">
          <AmountInput
            value={manualAmount}
            onChange={(val) => setManualAmount(val)}
            label={t('addExpense.amountLabel')}
          />

          <div className="flex flex-col gap-2">
            <label className="text-base font-bold text-warmBrown">
              {t('addExpense.categoryLabel')}
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <CategoryChip
                  key={cat}
                  category={cat}
                  isSelected={manualCategory === cat}
                  onClick={() => setManualCategory(cat)}
                  size="md"
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-base font-bold text-warmBrown">
              {t('addExpense.noteLabel')}
            </label>
            <input
              type="text"
              value={manualNote}
              onChange={(e) => setManualNote(e.target.value)}
              placeholder={t('addExpense.notePlaceholder')}
              className="w-full min-h-[56px] px-4 rounded-2xl bg-white border border-[#EFEBE9] text-base font-bold text-warmBrown placeholder-warmBrown-light focus:outline-none focus:ring-2 focus:ring-kumkum/30 shadow-warm-sm"
            />
          </div>

          <Button
            variant="primary"
            onClick={handleSaveManual}
            disabled={manualAmount <= 0}
            icon={<Check className="w-5 h-5" />}
          >
            {t('addExpense.saveExpense')} • {formatRupee(manualAmount)}
          </Button>
        </div>
      )}

      {/* 3. Scan Bill Tab */}
      {activeTab === 'scan' && (
        <div className="flex flex-col gap-4 animate-fade-in">
          <Card variant="surface" className="text-center flex flex-col items-center p-6 border-turmeric/40">
            <Mascot mood={isScanning ? 'thinking' : 'happy'} size={110} />
            <h3 className="text-lg sm:text-xl font-extrabold text-warmBrown mt-3">
              {t('addExpense.scanTitle')}
            </h3>
            <p className="text-xs sm:text-sm text-warmBrown-subtle mt-1 max-w-xs">
              {t('addExpense.scanSubtitle')}
            </p>

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleFilePicked}
              className="hidden"
            />

            {/* Camera Viewfinder Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-44 rounded-3xl bg-[#2E1C14] mt-5 relative flex items-center justify-center overflow-hidden border-2 border-turmeric cursor-pointer active:scale-[0.99] transition-transform"
            >
              <div className="absolute inset-4 border-2 border-dashed border-white/50 rounded-2xl pointer-events-none flex items-center justify-center">
                {isScanning ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 border-4 border-turmeric border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-white font-bold bg-black/60 px-3 py-1 rounded-full">
                      {t('addExpense.scanningSim')}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-white/90 font-bold px-3 py-1.5 bg-black/50 rounded-full">
                    📷 படம் எடுக்க இங்கே தொடவும்
                  </span>
                )}
              </div>
              <Camera className="w-12 h-12 text-white/40" />
            </div>

            <div className="mt-5 w-full">
              <Button
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                loading={isScanning}
                icon={<Camera className="w-5 h-5" />}
              >
                {t('addExpense.takePhoto')}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Confirmation Card: When voice or scan detected items (Editable before saving!) */}
      {pendingItems.length > 0 && (
        <Card variant="warmGold" className="animate-fade-in flex flex-col gap-3.5 border-turmeric-300">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-extrabold text-warmBrown flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-kumkum" />
              <span>{t('addExpense.confirmTitle')}</span>
            </h4>
            <span className="text-xs bg-white text-kumkum font-bold px-2.5 py-0.5 rounded-full border border-turmeric">
              {pendingItems.length} பொருட்கள்
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {pendingItems.map((item, index) => (
              <div
                key={index}
                className="p-3.5 rounded-2xl bg-white border border-[#EFEBE9] shadow-warm-sm flex flex-col gap-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={item.note}
                    onChange={(e) => {
                      const updated = [...pendingItems];
                      updated[index].note = e.target.value;
                      setPendingItems(updated);
                    }}
                    className="font-bold text-sm text-warmBrown bg-transparent border-b border-dashed border-[#D7CCC8] outline-none flex-1 py-0.5"
                  />
                  <div className="flex items-center gap-1">
                    <span className="font-extrabold text-kumkum text-base">₹</span>
                    <input
                      type="number"
                      value={item.amount || ''}
                      onChange={(e) => {
                        const updated = [...pendingItems];
                        updated[index].amount = parseFloat(e.target.value) || 0;
                        setPendingItems(updated);
                      }}
                      className="w-20 font-black text-right text-base text-kumkum bg-transparent border-b border-dashed border-kumkum outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPendingItems(pendingItems.filter((_, idx) => idx !== index));
                      }}
                      className="p-1 rounded-full text-warmBrown-subtle hover:text-danger ml-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Quick Category selection for this line item */}
                <div className="flex items-center gap-1 overflow-x-auto pb-0.5 pt-0.5 scrollbar-none">
                  {categories.map((c) => (
                    <CategoryChip
                      key={c}
                      category={c}
                      isSelected={item.category === c}
                      onClick={() => {
                        const updated = [...pendingItems];
                        updated[index].category = c;
                        setPendingItems(updated);
                      }}
                      size="sm"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Button
            variant="primary"
            onClick={handleSavePendingItems}
            icon={<Check className="w-5 h-5" />}
          >
            {t('common.confirm')} & {t('common.save')} (
            {formatRupee(pendingItems.reduce((acc, curr) => acc + (curr.amount || 0), 0))})
          </Button>
        </Card>
      )}
    </div>
  );
};
