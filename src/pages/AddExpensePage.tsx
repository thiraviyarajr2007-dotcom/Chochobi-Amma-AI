import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Mic,
  FileText,
  Camera,
  Check,
  AlertCircle,
  Trash2,
  Sparkles,
  ArrowLeft,
  Square,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';
import { useI18n } from '../i18n/i18nContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { AmountInput } from '../components/AmountInput';
import { CategoryChip } from '../components/CategoryChip';
import { Mascot } from '../components/Mascot';
import { useToast } from '../components/Toast';
import { TopBar } from '../components/TopBar';
import { ExpenseCategory, ExpenseItem } from '../types';
import { scanBillApi, ParsedApiExpense } from '../lib/apiClient';
import { compressImageClientSide } from '../lib/imageCompressor';
import { useVoiceInput } from '../lib/audioRecorder';
import { db } from '../lib/db';

type AddTab = 'voice' | 'manual' | 'scan';

export const AddExpensePage: React.FC = () => {
  const { lang, t, formatRupee } = useI18n();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialMode = (searchParams.get('mode') as AddTab) || 'voice';
  const [activeTab, setActiveTab] = useState<AddTab>(
    ['voice', 'manual', 'scan'].includes(initialMode) ? initialMode : 'voice'
  );

  // Sync tab with URL query param
  const handleTabChange = (tab: AddTab) => {
    setActiveTab(tab);
    setSearchParams({ mode: tab });
  };

  // Manual inputs
  const [manualAmount, setManualAmount] = useState<number>(0);
  const [manualCategory, setManualCategory] = useState<ExpenseCategory>('groceries');
  const [manualNote, setManualNote] = useState<string>('');

  // Review & Confirmation Cards (Extracted items pending mom's approval)
  const [pendingItems, setPendingItems] = useState<ParsedApiExpense[]>([]);

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

  // Voice Input Hook with 3-tier Fallback (Browser Web Speech -> Recorder WAV -> Manual)
  const {
    status: voiceStatus,
    mode: voiceMode,
    setMode: setVoiceMode,
    transcript: voiceTranscript,
    parsedExpenses: voiceParsedExpenses,
    error: voiceError,
    audioLevel,
    countdown,
    needsClarification,
    clarificationQuestion,
    start: startVoice,
    stop: stopVoice,
    reset: resetVoice,
    isBrowserSupported,
  } = useVoiceInput({
    lang,
    onParsed: (items) => {
      setPendingItems(items);
      showToast(
        `${items.length} ${t('expensesList.countItems')} ${
          lang === 'ta' ? 'கண்டறியப்பட்டது' : 'detected'
        }`,
        'success'
      );
    },
    onError: (errMsg) => {
      showToast(errMsg, 'warning');
    },
  });

  // Keep pendingItems synced if voiceParsedExpenses change
  useEffect(() => {
    if (voiceParsedExpenses.length > 0 && activeTab === 'voice') {
      setPendingItems(voiceParsedExpenses);
    }
  }, [voiceParsedExpenses, activeTab]);

  // Bill Scanning
  const handleFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setPendingItems([]);

    try {
      const compressed = await compressImageClientSide(file, 1024, 0.85);
      showToast(
        lang === 'ta' ? 'பில் படிக்கப்படுகிறது...' : 'Scanning bill...',
        'info'
      );
      const scanResult = await scanBillApi(compressed.base64, lang);

      if (scanResult.items && scanResult.items.length > 0) {
        const parsedList: ParsedApiExpense[] = scanResult.items.map((it) => ({
          category: it.category || scanResult.suggestedCategory || 'groceries',
          amount: it.price,
          note: it.name,
        }));
        setPendingItems(parsedList);
        showToast(
          `${scanResult.merchant || t('categories.groceries')} • ${formatRupee(
            scanResult.total || 0
          )}`,
          'success'
        );
      } else {
        showToast(t('common.error'), 'error');
      }
    } catch (err: any) {
      showToast(err?.message || t('common.error'), 'error');
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Editing pending items
  const handleUpdatePendingItem = (index: number, field: keyof ParsedApiExpense, value: any) => {
    setPendingItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemovePendingItem = (index: number) => {
    setPendingItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Save Approved Items to Database
  const handleSaveConfirmedItems = async () => {
    if (pendingItems.length === 0) return;

    const today = new Date().toISOString().slice(0, 10);
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let firstSavedId = '';

    for (let i = 0; i < pendingItems.length; i++) {
      const item = pendingItems[i];
      if (item.amount > 0) {
        const id = 'exp-' + Date.now() + '-' + i;
        if (!firstSavedId) firstSavedId = id;
        const newRecord: ExpenseItem = {
          id,
          amount: Number(item.amount),
          category: (item.category as ExpenseCategory) || 'other',
          note: item.note || t(`categories.${item.category || 'other'}`),
          date: today,
          time: nowTime,
          isVoice: activeTab === 'voice',
          createdAt: Date.now(),
        };

        await db.expenses.add(newRecord);
      }
    }

    showToast(t('addExpense.addedSuccess'), 'success');
    navigate(`/expenses${firstSavedId ? `?highlight=${firstSavedId}` : ''}`);
  };

  // Manual save
  const handleSaveManual = async () => {
    if (manualAmount <= 0) {
      showToast(t('addExpense.amountLabel') + ' > 0', 'warning');
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const id = 'exp-' + Date.now();

    const newRecord: ExpenseItem = {
      id,
      amount: manualAmount,
      category: manualCategory,
      note: manualNote || t(`categories.${manualCategory}`),
      date: today,
      time: nowTime,
      isVoice: false,
      createdAt: Date.now(),
    };

    await db.expenses.add(newRecord);
    showToast(t('addExpense.addedSuccess'), 'success');
    navigate(`/expenses?highlight=${id}`);
  };

  // Determine Mascot Mood
  const mascotMood =
    voiceStatus === 'listening' ||
    voiceStatus === 'recording' ||
    voiceStatus === 'processing' ||
    needsClarification ||
    isScanning
      ? 'thinking'
      : pendingItems.length > 0
      ? 'celebrate'
      : 'happy';

  // Countdown circle circumference
  const circleRadius = 36;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circleCircumference * (1 - countdown / 15);

  return (
    <div className="min-h-screen bg-[#FFF8EC] flex flex-col">
      <TopBar
        title={t('addExpense.title')}
        subtitle={t('addExpense.voiceHint')}
        showBack={true}
        onBack={() => navigate('/home')}
      />

      <div className="flex-1 pb-28 pt-3 px-4 flex flex-col gap-5 max-w-[440px] mx-auto w-full select-none">
        {/* Back Link Button for Accessibility */}
        <button
          onClick={() => navigate('/home')}
          className="self-start flex items-center gap-2 text-sm font-bold text-warmBrown hover:text-kumkum px-2 py-1 rounded-xl transition-colors"
          aria-label={t('common.back')}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('common.back')}</span>
        </button>

        {/* 3 Tabs Switcher */}
        <div className="flex p-1 bg-white rounded-3xl border border-[#EFEBE9] shadow-warm-sm">
          <button
            type="button"
            onClick={() => handleTabChange('voice')}
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
            onClick={() => handleTabChange('manual')}
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
            onClick={() => handleTabChange('scan')}
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

        {/* TAB 1: VOICE ENTRY WITH GEMINI AUDIO FALLBACK */}
        {activeTab === 'voice' && (
          <div className="flex flex-col gap-4">
            {/* Status Chip & Mode Switcher */}
            <div className="flex items-center justify-between px-1 text-xs">
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#EFEBE9] shadow-warm-xs font-bold text-warmBrown"
                title={
                  voiceMode === 'browser'
                    ? t('addExpense.voiceModeBrowserDesc')
                    : t('addExpense.voiceModeCloudDesc')
                }
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    voiceMode === 'browser'
                      ? 'bg-emerald-500 animate-pulse'
                      : 'bg-blue-600 animate-pulse'
                  }`}
                />
                <span>
                  {voiceMode === 'browser'
                    ? t('addExpense.voiceModeBrowser')
                    : t('addExpense.voiceModeCloud')}
                </span>
              </div>

              {isBrowserSupported && (
                <button
                  type="button"
                  onClick={() => setVoiceMode(voiceMode === 'browser' ? 'cloud' : 'browser')}
                  className="font-bold text-xs text-kumkum hover:underline hover:text-kumkum-dark transition-colors"
                >
                  {voiceMode === 'browser'
                    ? t('addExpense.switchModeCloud')
                    : t('addExpense.switchModeBrowser')}
                </button>
              )}
            </div>

            <Card variant="surface" className="text-center py-6">
              <div className="flex flex-col items-center gap-3">
                <Mascot mood={mascotMood} size={110} />

                {/* State: IDLE */}
                {voiceStatus === 'idle' && (
                  <div className="max-w-xs">
                    <h3 className="text-lg font-bold text-warmBrown">
                      {t('addExpense.tapToSpeak')}
                    </h3>
                    <p className="text-xs text-warmBrown-subtle mt-1 font-medium">
                      {t('addExpense.voiceInstruction')}
                    </p>
                  </div>
                )}

                {/* State: LISTENING (Browser Web Speech) */}
                {voiceStatus === 'listening' && (
                  <div className="max-w-xs">
                    <h3 className="text-lg font-bold text-kumkum animate-pulse">
                      {t('addExpense.listening')}
                    </h3>
                    <p className="text-xs text-warmBrown-subtle mt-1 font-medium">
                      {t('addExpense.voiceInstruction')}
                    </p>
                  </div>
                )}

                {/* State: RECORDING (MediaRecorder Cloud Fallback) */}
                {voiceStatus === 'recording' && (
                  <div className="max-w-xs flex flex-col items-center">
                    <h3 className="text-lg font-bold text-blue-700 animate-pulse">
                      {t('addExpense.recordingAudio')}
                    </h3>
                    <p className="text-xs font-bold text-warmBrown-muted mt-0.5">
                      {t('addExpense.recordingCountdown').replace('{seconds}', String(countdown))}
                    </p>
                  </div>
                )}

                {/* State: PROCESSING */}
                {voiceStatus === 'processing' && (
                  <div className="max-w-xs flex flex-col items-center gap-1.5 py-2">
                    <div className="flex items-center gap-2 text-kumkum font-bold text-sm">
                      <Sparkles className="w-5 h-5 animate-spin" />
                      <span>{t('addExpense.processingAudio')}</span>
                    </div>
                  </div>
                )}

                {/* Interactive Mic or Stop Button */}
                <div className="my-2 flex flex-col items-center gap-3">
                  {/* If Recording in Cloud mode: show countdown circle and stop button */}
                  {voiceStatus === 'recording' ? (
                    <div className="relative flex flex-col items-center gap-3">
                      {/* SVG Countdown Ring */}
                      <div className="relative w-28 h-28 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 88 88">
                          <circle
                            cx="44"
                            cy="44"
                            r={circleRadius}
                            className="stroke-cream-dark"
                            strokeWidth="6"
                            fill="transparent"
                          />
                          <circle
                            cx="44"
                            cy="44"
                            r={circleRadius}
                            className="stroke-blue-600 transition-all duration-1000 ease-linear"
                            strokeWidth="6"
                            fill="transparent"
                            strokeDasharray={circleCircumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                          />
                        </svg>

                        <button
                          type="button"
                          onClick={stopVoice}
                          className="absolute inset-2 m-auto w-20 h-20 rounded-full bg-danger text-white flex items-center justify-center shadow-warm-lg active:scale-95 transition-transform"
                          aria-label={t('addExpense.stopRecording')}
                        >
                          <Square className="w-8 h-8 fill-current" />
                        </button>
                      </div>

                      {/* Live Waveform Level Meter */}
                      <div className="flex items-center justify-center gap-1.5 h-8 py-1">
                        {[0.3, 0.6, 0.9, 1.0, 0.8, 0.5, 0.3].map((factor, idx) => {
                          const barHeight = Math.max(
                            6,
                            Math.round((audioLevel * factor * 26) / 100)
                          );
                          return (
                            <div
                              key={idx}
                              className="w-1.5 bg-gradient-to-t from-blue-600 to-turmeric rounded-full transition-all duration-75"
                              style={{ height: `${barHeight}px` }}
                            />
                          );
                        })}
                      </div>

                      <Button
                        variant="danger"
                        size="md"
                        onClick={stopVoice}
                        icon={<Square className="w-4 h-4 fill-current" />}
                      >
                        {t('addExpense.stopRecording')} ({countdown}s)
                      </Button>
                    </div>
                  ) : (
                    /* Default Idle / Listening Mic Button */
                    <button
                      type="button"
                      onClick={
                        voiceStatus === 'listening'
                          ? stopVoice
                          : voiceStatus === 'processing'
                          ? undefined
                          : startVoice
                      }
                      disabled={voiceStatus === 'processing'}
                      className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                        voiceStatus === 'listening'
                          ? 'bg-red-600 text-white shadow-[0_0_30px_rgba(220,38,38,0.6)] animate-pulse scale-105'
                          : 'bg-gradient-to-tr from-kumkum to-kumkum-dark text-white shadow-kumkum-glow active:scale-95'
                      }`}
                      aria-label={
                        voiceStatus === 'listening'
                          ? t('addExpense.stopListening')
                          : t('addExpense.tapToSpeak')
                      }
                    >
                      <Mic
                        className={`w-10 h-10 ${
                          voiceStatus === 'listening' ? 'animate-bounce' : ''
                        }`}
                      />
                    </button>
                  )}
                </div>

                {/* Live Transcript Display */}
                {voiceTranscript && (
                  <div className="w-full bg-cream rounded-2xl p-3 border border-[#EFEBE9] text-left">
                    <span className="text-[11px] font-bold text-warmBrown-subtle uppercase">
                      {t('addExpense.youSaid')}:
                    </span>
                    <p className="text-sm font-bold text-warmBrown mt-0.5">
                      "{voiceTranscript}"
                    </p>
                  </div>
                )}

                {/* Clarification Prompt (Needs Clarification from Amma) */}
                {needsClarification && clarificationQuestion && (
                  <div className="w-full bg-turmeric-light/80 border border-turmeric rounded-2xl p-4 text-left flex flex-col gap-3 animate-fade-in">
                    <div className="flex items-start gap-2.5">
                      <div className="p-2 bg-turmeric/20 rounded-xl text-lg flex-shrink-0">
                        🤔
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-warmBrown uppercase tracking-wider">
                          {t('addExpense.clarificationTitle')}
                        </h4>
                        <p className="text-sm font-bold text-warmBrown mt-1 leading-snug">
                          {clarificationQuestion}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 mt-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => startVoice()}
                        icon={<Mic className="w-4 h-4" />}
                      >
                        {t('addExpense.replyWithVoice')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTabChange('manual')}
                        icon={<FileText className="w-4 h-4" />}
                      >
                        {t('addExpense.typeAnswer')}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Error Notice with Try Again & Manual fallback buttons */}
                {voiceError && (
                  <div className="w-full bg-red-50 border border-red-200 rounded-2xl p-4 text-left flex flex-col gap-3 animate-fade-in">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-danger leading-relaxed">
                          {voiceError}
                        </p>
                        <p className="text-[11px] text-warmBrown-subtle mt-0.5 font-medium">
                          {t('addExpense.micFallbackTip')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => startVoice()}
                        icon={<RefreshCw className="w-4 h-4" />}
                      >
                        {t('addExpense.tryAgain')}
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleTabChange('manual')}
                        icon={<FileText className="w-4 h-4" />}
                      >
                        {t('addExpense.typeManually')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Tamil / English Example Prompts */}
            <div className="bg-white/80 rounded-2xl p-3.5 border border-[#EFEBE9]">
              <span className="text-xs font-bold text-warmBrown block mb-2">
                💡 {t('addExpense.exampleTitle')}
              </span>
              <div className="flex flex-col gap-1.5 text-xs text-warmBrown-muted">
                <span className="bg-cream px-2.5 py-1.5 rounded-xl border border-[#EFEBE9]">
                  "இன்னைக்கு காய்கறி 250 ரூபாய், ஆட்டோ 80"
                </span>
                <span className="bg-cream px-2.5 py-1.5 rounded-xl border border-[#EFEBE9]">
                  "Milk 60 rs, Pooja flowers 40"
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MANUAL ENTRY */}
        {activeTab === 'manual' && (
          <div className="flex flex-col gap-4">
            <Card variant="surface">
              <span className="text-xs font-bold text-warmBrown-subtle uppercase tracking-wider block mb-2">
                {t('addExpense.amountLabel')}
              </span>
              <AmountInput value={manualAmount} onChange={setManualAmount} />
            </Card>

            {/* Category Selector */}
            <Card variant="surface">
              <span className="text-xs font-bold text-warmBrown-subtle uppercase tracking-wider block mb-3">
                {t('addExpense.selectCategory')}
              </span>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <CategoryChip
                    key={cat}
                    category={cat}
                    isSelected={manualCategory === cat}
                    onClick={() => setManualCategory(cat)}
                  />
                ))}
              </div>
            </Card>

            {/* Note/Description */}
            <Card variant="surface">
              <label
                htmlFor="manual-note"
                className="text-xs font-bold text-warmBrown-subtle uppercase tracking-wider block mb-2"
              >
                {t('addExpense.noteLabel')}
              </label>
              <input
                id="manual-note"
                type="text"
                value={manualNote}
                onChange={(e) => setManualNote(e.target.value)}
                placeholder={t('addExpense.notePlaceholder')}
                className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#EFEBE9] focus:border-kumkum focus:outline-none text-warmBrown font-medium text-sm"
              />
            </Card>

            {/* Manual Save Button */}
            <Button
              variant="primary"
              size="lg"
              onClick={handleSaveManual}
              disabled={manualAmount <= 0}
              icon={<Check className="w-5 h-5" />}
            >
              {t('addExpense.saveExpense')}
            </Button>
          </div>
        )}

        {/* TAB 3: SCAN BILL */}
        {activeTab === 'scan' && (
          <div className="flex flex-col gap-4">
            <Card variant="surface" className="text-center py-6">
              <div className="flex flex-col items-center gap-3">
                <Mascot mood={isScanning ? 'thinking' : 'happy'} size={110} />

                <h3 className="text-lg font-bold text-warmBrown">
                  {t('addExpense.scanBillTitle')}
                </h3>
                <p className="text-xs text-warmBrown-subtle max-w-xs font-medium">
                  {t('addExpense.scanBillDesc')}
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFilePicked}
                />

                <div className="mt-4 flex flex-col sm:flex-row gap-3 w-full">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isScanning}
                    icon={<Camera className="w-5 h-5" />}
                  >
                    {isScanning ? t('addExpense.scanningSim') : t('addExpense.takePhoto')}
                  </Button>
                </div>
              </div>
            </Card>

            <div className="bg-turmeric-light/60 rounded-2xl p-3.5 border border-turmeric flex items-start gap-2.5">
              <span className="text-lg">🧾</span>
              <p className="text-xs font-semibold text-warmBrown leading-relaxed">
                {t('addExpense.scanTip')}
              </p>
            </div>
          </div>
        )}

        {/* REVIEW & CONFIRMATION SECTION (MOM CAN EDIT BEFORE SAVING) */}
        {pendingItems.length > 0 && (
          <div className="mt-2 flex flex-col gap-3 border-t-2 border-dashed border-[#D7CCC8] pt-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-warmBrown">
                  {t('addExpense.confirmTitle')}
                </span>
                <span className="bg-kumkum text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingItems.length}
                </span>
              </div>
              <span className="text-xs font-bold text-warmBrown-subtle">
                {t('addExpense.editBeforeSave')}
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {pendingItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-white border border-[#EFEBE9] shadow-warm-sm flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-cream-dark flex items-center justify-center text-lg flex-shrink-0">
                      {item.category === 'groceries'
                        ? '🛒'
                        : item.category === 'vegetables'
                        ? '🥕'
                        : item.category === 'dairy'
                        ? '🥛'
                        : item.category === 'transport'
                        ? '🛺'
                        : item.category === 'medical'
                        ? '💊'
                        : item.category === 'utilities'
                        ? '💡'
                        : '🌸'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={item.note || ''}
                        onChange={(e) => handleUpdatePendingItem(idx, 'note', e.target.value)}
                        className="text-xs font-bold text-warmBrown w-full border-b border-transparent hover:border-warmBrown-subtle focus:border-kumkum focus:outline-none truncate bg-transparent"
                      />
                      <span className="text-[11px] font-semibold text-warmBrown-subtle block">
                        {t(`categories.${item.category || 'other'}`)}
                      </span>
                    </div>
                  </div>

                  {/* Editable Amount */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center font-black text-kumkum text-base">
                      <span>₹</span>
                      <input
                        type="number"
                        value={item.amount || ''}
                        onChange={(e) =>
                          handleUpdatePendingItem(idx, 'amount', parseFloat(e.target.value) || 0)
                        }
                        className="w-16 text-right font-black text-kumkum bg-cream-dark px-1.5 py-1 rounded-lg focus:outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemovePendingItem(idx)}
                      className="p-1.5 text-warmBrown-subtle hover:text-danger rounded-lg transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Confirm & Save Button */}
            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={handleSaveConfirmedItems}
                icon={<Check className="w-5 h-5" />}
              >
                {t('addExpense.confirmAndSave')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
