import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  Send,
  Sparkles,
  ArrowLeft,
  Volume2,
  HelpCircle,
  MessageCircle,
} from 'lucide-react';
import { useI18n } from '../i18n/i18nContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Mascot } from '../components/Mascot';
import { TopBar } from '../components/TopBar';
import { useToast } from '../components/Toast';
import { db } from '../lib/db';
import { askAmmaApi } from '../lib/apiClient';
import { MascotMood } from '../types';

export const AskAmmaPage: React.FC = () => {
  const { t, lang } = useI18n();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [mascotMood, setMascotMood] = useState<MascotMood>('happy');

  // Voice speech recognition
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const sampleQuestions = [
    {
      id: 'veggies',
      text: lang === 'ta' ? 'இந்த மாதம் காய்கறிக்கு எவ்வளவு செலவாச்சு?' : 'How much spent on vegetables this month?',
    },
    {
      id: 'gold_chit',
      text: lang === 'ta' ? 'தங்கச் சீட்டு போடுவது நல்லதா?' : 'Is investing in a gold chit fund safe and good?',
    },
    {
      id: 'eb_tips',
      text: lang === 'ta' ? 'மின்சார கட்டணத்தை குறைக்க டிப்ஸ் கொடுங்கள்' : 'Give tips to reduce electricity bill',
    },
    {
      id: 'budget_check',
      text: lang === 'ta' ? 'மாதக் கடைசி வரை எனது பட்ஜெட் தாங்குமா?' : 'Will my budget last till month end?',
    },
  ];

  const handleAsk = async (textToAsk = question) => {
    if (!textToAsk.trim()) return;

    setIsAsking(true);
    setMascotMood('thinking');
    setAnswer(null);

    try {
      // Gather financial context
      const expenses = await db.expenses.toArray();
      const currentMonth = new Date().toISOString().slice(0, 7);
      const thisMonth = expenses.filter((e) => e.date.startsWith(currentMonth));
      const totalSpent = thisMonth.reduce((acc, e) => acc + e.amount, 0);

      const categoryTotals: Record<string, number> = {};
      for (const e of thisMonth) {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
      }

      const budgetSetting = await db.settings.get('monthly_budget');
      const budget = budgetSetting ? parseFloat(budgetSetting.value) || 35000 : 35000;

      const res = await askAmmaApi({
        question: textToAsk,
        aggregatedTotals: categoryTotals,
        budget,
        totalSpent,
        lang,
      });
      setAnswer(res);
      setMascotMood('celebrate');
    } catch {
      showToast(t('common.error'), 'error');
      setMascotMood('happy');
    } finally {
      setIsAsking(false);
    }
  };

  const handleStartVoice = () => {
    const win = window as any;
    const SpeechClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechClass) {
      showToast(t('addExpense.voiceUnsupported'), 'warning');
      return;
    }

    try {
      if (recognitionRef.current) recognitionRef.current.abort();

      const recognition = new SpeechClass();
      recognitionRef.current = recognition;
      recognition.lang = lang === 'ta' ? 'ta-IN' : 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        setQuestion(transcript);
        handleAsk(transcript);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleSpeakAnswer = () => {
    if (!answer || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(answer);
    utterance.lang = lang === 'ta' ? 'ta-IN' : 'en-IN';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-screen bg-[#FFF8EC] flex flex-col">
      <TopBar
        title={t('moreSheet.askAmma')}
        subtitle={lang === 'ta' ? 'குடும்ப நிதி வழிகாட்டி' : 'Family Finance Guide'}
        showBack={true}
        onBack={() => navigate('/home')}
      />

      <div className="flex-1 pb-28 pt-2 px-4 flex flex-col gap-5 max-w-[440px] mx-auto w-full select-none">
        {/* Back Link */}
        <button
          onClick={() => navigate('/home')}
          className="self-start flex items-center gap-2 text-sm font-bold text-warmBrown hover:text-kumkum px-2 py-1 rounded-xl transition-colors"
          aria-label={t('common.back')}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('common.back')}</span>
        </button>

        {/* Mascot Header */}
        <Card variant="surface" className="text-center py-6">
          <div className="flex flex-col items-center gap-2">
            <Mascot mood={mascotMood} size={110} animate={true} />
            <h2 className="text-xl font-black text-warmBrown mt-1">
              {lang === 'ta' ? 'அம்மாவிடம் கேளுங்கள்' : 'Ask Amma AI'}
            </h2>
            <p className="text-xs font-semibold text-warmBrown-subtle max-w-xs">
              {lang === 'ta'
                ? 'வீட்டுச் செலவு, சேமிப்பு, குடும்ப பட்ஜெட் பற்றிய எந்த சந்தேகத்தையும் கேளுங்கள்.'
                : 'Ask anything about household expenses, savings tips, and family budgeting.'}
            </p>
          </div>
        </Card>

        {/* Input Question Box */}
        <div className="relative">
          <div className="flex items-center gap-2 bg-white rounded-3xl p-2 border border-[#EFEBE9] shadow-warm-sm">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
              placeholder={lang === 'ta' ? 'கேள்வியை தட்டச்சு செய்யவும் அல்லது பேசவும்...' : 'Type or speak your question...'}
              className="flex-1 px-3 py-2 text-sm font-bold text-warmBrown bg-transparent focus:outline-none"
            />

            <button
              type="button"
              onClick={handleStartVoice}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-danger text-white animate-pulse'
                  : 'bg-cream text-warmBrown hover:bg-cream-dark'
              }`}
              title="Voice Ask"
              aria-label="Voice Ask"
            >
              <Mic className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => handleAsk()}
              disabled={isAsking || !question.trim()}
              className="w-11 h-11 rounded-2xl bg-kumkum text-white flex items-center justify-center disabled:opacity-50 hover:bg-kumkum-dark active:scale-95 transition-all shadow-warm-sm"
              title="Send"
              aria-label="Send"
            >
              {isAsking ? <Sparkles className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Answer Card */}
        {answer && (
          <Card variant="surface" className="border-kumkum/40 ring-4 ring-kumkum/10 flex flex-col gap-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🪔</span>
                <span className="text-xs font-extrabold text-kumkum uppercase tracking-wider">
                  {lang === 'ta' ? 'அம்மாவின் பதில்' : 'Amma\'s Advice'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleSpeakAnswer}
                className="p-1.5 rounded-xl bg-cream text-warmBrown hover:bg-cream-dark transition-colors"
                title="Listen to advice"
                aria-label="Listen to advice"
              >
                <Volume2 className="w-4 h-4 text-warmBrown-subtle" />
              </button>
            </div>

            <p className="text-sm font-semibold text-warmBrown leading-relaxed bg-cream/70 p-3.5 rounded-2xl border border-[#EFEBE9]">
              {answer}
            </p>
          </Card>
        )}

        {/* Sample Questions Pills */}
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-bold text-warmBrown-subtle uppercase tracking-wider">
            {lang === 'ta' ? 'மாதிரி கேள்விகள்:' : 'Sample Questions:'}
          </span>
          <div className="flex flex-col gap-2">
            {sampleQuestions.map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => {
                  setQuestion(q.text);
                  handleAsk(q.text);
                }}
                className="p-3 rounded-2xl bg-white border border-[#EFEBE9] hover:border-kumkum/40 text-left text-xs font-bold text-warmBrown shadow-warm-sm active:scale-[0.99] transition-all flex items-center gap-2.5"
              >
                <MessageCircle className="w-4 h-4 text-kumkum flex-shrink-0" />
                <span className="line-clamp-1">{q.text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
