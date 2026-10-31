import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  Camera,
  ShieldCheck,
  Target,
  ArrowRight,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Repeat,
} from 'lucide-react';
import { useI18n } from '../i18n/i18nContext';
import { Card } from '../components/Card';
import { BigMicButton } from '../components/BigMicButton';
import { CategoryChip } from '../components/CategoryChip';
import { KolamMotif } from '../components/KolamMotif';
import { ExpenseItem, ActiveTab } from '../types';
import {
  calculateBudgetStatus,
  detectRecurringExpenses,
  detectExpenseSpikes,
} from '../lib/budgetAnalytics';
import { db } from '../lib/db';

interface HomeScreenProps {
  expenses: ExpenseItem[];
  onNavigate: (tab: ActiveTab) => void;
  onOpenVoiceAdd: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  expenses,
  onNavigate,
  onOpenVoiceAdd,
}) => {
  const { t, formatRupee } = useI18n();

  const [monthlyBudget, setMonthlyBudget] = useState(35000);

  useEffect(() => {
    async function loadBudget() {
      const record = await db.settings.get('monthly_budget');
      if (record) {
        setMonthlyBudget(parseFloat(record.value) || 35000);
      }
    }
    loadBudget();
  }, []);

  const budgetStatus = calculateBudgetStatus(expenses, monthlyBudget);
  const totalSpent = budgetStatus.spent;
  const remaining = budgetStatus.remaining;
  const percentUsed = budgetStatus.percentageUsed;

  const recurring = detectRecurringExpenses(expenses);
  const spikes = detectExpenseSpikes(expenses);

  // SVG circular progress calculation
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (Math.min(100, percentUsed) / 100) * circumference;

  return (
    <div className="pb-28 pt-2 px-4 flex flex-col gap-5 max-w-[440px] mx-auto select-none">
      {/* 1. Warm Greeting & Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-warmBrown tracking-tight flex items-center gap-2">
            {t('home.greeting')}
          </h2>
          <p className="text-sm font-semibold text-warmBrown-subtle mt-0.5">
            {t('home.subtitle')}
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-turmeric-light border border-turmeric flex items-center justify-center text-2xl shadow-warm-sm">
          🪔
        </div>
      </div>

      {/* 2. Budget Ring Overview Card (Real Data) */}
      <Card variant="surface" className="border-turmeric/30">
        <div className="absolute top-0 right-0 pointer-events-none opacity-15">
          <KolamMotif size={120} color="#FFB300" />
        </div>

        <div className="flex items-center justify-between gap-4">
          {/* Left Text Stats */}
          <div className="flex flex-col gap-1 z-10">
            <span className="text-xs font-bold text-warmBrown-subtle uppercase tracking-wider">
              {t('home.budgetOverview')}
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-kumkum">
              {formatRupee(totalSpent)}
            </div>
            <span className="text-xs font-semibold text-warmBrown-muted">
              {t('home.totalBudget')}: <span className="font-bold">{formatRupee(monthlyBudget)}</span>
            </span>
            <div
              className={`mt-1 flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full w-fit ${
                budgetStatus.warningLevel === 'exceeded'
                  ? 'bg-red-100 text-red-700'
                  : budgetStatus.warningLevel === 'caution'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-leafGreen-light text-leafGreen'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>
                {t('home.remaining')}: {formatRupee(remaining)}
              </span>
            </div>
          </div>

          {/* Right: Circular Budget Progress Ring */}
          <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center z-10">
            <svg className="w-32 h-32 -rotate-90 transform" viewBox="0 0 128 128">
              <circle
                cx="64"
                cy="64"
                r={radius}
                stroke="#EFEBE9"
                strokeWidth="12"
                fill="none"
              />
              <circle
                cx="64"
                cy="64"
                r={radius}
                stroke={
                  budgetStatus.warningLevel === 'exceeded'
                    ? '#D32F2F'
                    : budgetStatus.warningLevel === 'caution'
                    ? '#FB8C00'
                    : '#C2185B'
                }
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-xl font-extrabold text-warmBrown leading-none">
                {percentUsed}%
              </span>
              <span className="text-[10px] font-bold text-warmBrown-subtle mt-0.5">
                {t('home.spent')}
              </span>
            </div>
          </div>
        </div>

        {/* Reassurance Status Message */}
        <div className="mt-4 pt-3 border-t border-[#EFEBE9] flex items-center gap-2 text-xs font-medium text-warmBrown">
          <span className="text-base">🌸</span>
          <span className="font-bold">
            {budgetStatus.warningLevel === 'exceeded'
              ? t('home.budgetExceeded')
              : budgetStatus.warningLevel === 'caution'
              ? t('home.budgetWarning')
              : t('home.budgetSafe')}
          </span>
        </div>
      </Card>

      {/* Automation: Spending Spike Banner if detected */}
      {spikes.length > 0 && (
        <div
          onClick={() => onNavigate('insights')}
          className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 shadow-warm-sm cursor-pointer active:scale-[0.99] transition-transform"
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs font-black text-amber-900">
                {t('home.spikeAlert')}
              </span>
              <span className="text-[11px] font-semibold text-amber-800">
                {spikes[0].message}
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-800 flex-shrink-0" />
        </div>
      )}

      {/* 3. Primary Feature: BigMicButton */}
      <BigMicButton onClick={onOpenVoiceAdd} />

      {/* 4. Quick Actions Grid (4 Big Touch Cards) */}
      <div className="flex flex-col gap-2.5">
        <h3 className="text-base font-bold text-warmBrown">
          {t('home.quickActions')}
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onNavigate('addExpense')}
            className="p-4 rounded-3xl bg-white border border-[#EFEBE9] hover:border-kumkum/40 shadow-warm-sm flex items-center gap-3 active:scale-95 transition-all text-left"
          >
            <div className="w-12 h-12 rounded-2xl bg-kumkum-100 flex items-center justify-center text-kumkum flex-shrink-0">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="font-extrabold text-warmBrown text-sm sm:text-base leading-snug">
                {t('home.actionAddExpense')}
              </div>
              <div className="text-[11px] font-semibold text-warmBrown-subtle">
                நேரடி பதிவு
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('addExpense')}
            className="p-4 rounded-3xl bg-white border border-[#EFEBE9] hover:border-turmeric shadow-warm-sm flex items-center gap-3 active:scale-95 transition-all text-left"
          >
            <div className="w-12 h-12 rounded-2xl bg-turmeric-100 flex items-center justify-center text-turmeric-dark flex-shrink-0">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <div className="font-extrabold text-warmBrown text-sm sm:text-base leading-snug">
                {t('home.actionScanBill')}
              </div>
              <div className="text-[11px] font-semibold text-warmBrown-subtle">
                ரசீது படம்
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('scamShield')}
            className="p-4 rounded-3xl bg-white border border-[#EFEBE9] hover:border-red-400 shadow-warm-sm flex items-center gap-3 active:scale-95 transition-all text-left"
          >
            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-danger flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="font-extrabold text-warmBrown text-sm sm:text-base leading-snug">
                {t('home.actionCheckScam')}
              </div>
              <div className="text-[11px] font-semibold text-warmBrown-subtle">
                SMS / WhatsApp
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('quest')}
            className="p-4 rounded-3xl bg-white border border-[#EFEBE9] hover:border-leafGreen shadow-warm-sm flex items-center gap-3 active:scale-95 transition-all text-left"
          >
            <div className="w-12 h-12 rounded-2xl bg-leafGreen-light flex items-center justify-center text-leafGreen flex-shrink-0">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <div className="font-extrabold text-warmBrown text-sm sm:text-base leading-snug">
                {t('home.actionKidsQuest')}
              </div>
              <div className="text-[11px] font-semibold text-warmBrown-subtle">
                சேமிப்பு வேட்டை
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Automation: Recurring Reminder Banner if detected */}
      {recurring.length > 0 && (
        <div
          onClick={() => onNavigate('insights')}
          className="p-3.5 rounded-2xl bg-white border border-[#EFEBE9] flex items-center justify-between gap-3 shadow-warm-sm cursor-pointer active:scale-[0.99] transition-transform"
        >
          <div className="flex items-center gap-2.5">
            <Repeat className="w-5 h-5 text-kumkum flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-warmBrown">
                {t('home.recurringAlert')}: {recurring[0].note}
              </span>
              <span className="text-[11px] font-semibold text-warmBrown-subtle">
                சுமார் {formatRupee(recurring[0].estimatedAmount)}
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-warmBrown-subtle flex-shrink-0" />
        </div>
      )}

      {/* 5. Amma's Daily Savings Tip Card */}
      <Card variant="warmGold" className="border-turmeric-200">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-turmeric flex items-center justify-center text-xl flex-shrink-0 shadow-warm-sm text-warmBrown">
            <Sparkles className="w-5 h-5 text-warmBrown" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-warmBrown leading-snug">
              {t('home.tipOfTheDay')}
            </h4>
            <p className="text-xs sm:text-sm text-warmBrown-muted font-medium mt-1 leading-relaxed">
              {t('home.dailyTip')}
            </p>
          </div>
        </div>
      </Card>

      {/* 6. Recent Expenses List */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-warmBrown">
            {t('home.recentExpenses')}
          </h3>
          <button
            type="button"
            onClick={() => onNavigate('expenses')}
            className="text-xs sm:text-sm font-bold text-kumkum flex items-center gap-1 hover:underline"
          >
            <span>{t('home.viewMore')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          {expenses.length === 0 ? (
            <p className="text-xs font-semibold text-warmBrown-subtle text-center py-4">
              {t('home.noExpenses')}
            </p>
          ) : (
            expenses.slice(0, 4).map((exp) => (
              <div
                key={exp.id}
                className="p-3.5 rounded-2xl bg-white border border-[#EFEBE9] shadow-warm-sm flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <CategoryChip category={exp.category} size="sm" showEmojiOnly />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-warmBrown line-clamp-1">
                      {exp.note}
                    </span>
                    <span className="text-[11px] font-medium text-warmBrown-subtle">
                      {exp.time || exp.date} {exp.isVoice && '• 🎙️ குரல்'}
                    </span>
                  </div>
                </div>
                <div className="text-base sm:text-lg font-extrabold text-warmBrown flex-shrink-0">
                  {formatRupee(exp.amount)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
