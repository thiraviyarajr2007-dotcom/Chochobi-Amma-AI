import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  TrendingDown,
  Lightbulb,
  Repeat,
  AlertTriangle,
  HelpCircle,
  Send,
  Sparkles,
} from 'lucide-react';
import { useI18n } from '../i18n/i18nContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Mascot } from '../components/Mascot';
import { useToast } from '../components/Toast';
import { db } from '../lib/db';
import {
  detectRecurringExpenses,
  detectExpenseSpikes,
  calculateBudgetStatus,
} from '../lib/budgetAnalytics';
import { getInsightsApi, askAmmaApi } from '../lib/apiClient';
import {
  ExpenseItem,
  MonthlyInsightsResult,
  RecurringExpenseSuggestion,
  ExpenseSpike,
} from '../types';

export const InsightsScreen: React.FC = () => {
  const { t, formatRupee, lang } = useI18n();
  const { showToast } = useToast();

  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [budget, setBudget] = useState<number>(35000);
  const [insightsResult, setInsightsResult] = useState<MonthlyInsightsResult | null>(null);
  const [recurringList, setRecurringList] = useState<RecurringExpenseSuggestion[]>([]);
  const [spikesList, setSpikesList] = useState<ExpenseSpike[]>([]);

  // "Ask Amma AI" states
  const [userQuestion, setUserQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);

  useEffect(() => {
    async function loadData() {
      const allExpenses = await db.expenses.toArray();
      setExpenses(allExpenses);

      const budgetSetting = await db.settings.get('monthly_budget');
      const currentBudget = budgetSetting ? parseFloat(budgetSetting.value) || 35000 : 35000;
      setBudget(currentBudget);

      // Detect recurring and spikes locally
      const recurring = detectRecurringExpenses(allExpenses);
      setRecurringList(recurring);

      const spikes = detectExpenseSpikes(allExpenses);
      setSpikesList(spikes);

      // Check IndexedDB cache for current month insights
      const currentMonthKey = new Date().toISOString().slice(0, 7);
      const cached = await db.insightsCache.get(currentMonthKey);

      // Calculate aggregated totals
      const currentMonthExpenses = allExpenses.filter((e) => e.date.startsWith(currentMonthKey));
      const totalSpent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

      const aggregated: Record<string, number> = {};
      for (const e of currentMonthExpenses) {
        aggregated[e.category] = (aggregated[e.category] || 0) + e.amount;
      }

      if (cached && Date.now() - cached.cachedAt < 24 * 3600 * 1000) {
        setInsightsResult(cached.data);
      } else {
        // Fetch from API
        const generated = await getInsightsApi({
          aggregatedTotals: aggregated,
          budget: currentBudget,
          totalSpent,
          monthName: currentMonthKey,
          lang,
        });

        setInsightsResult(generated);
        // Cache in IndexedDB
        await db.insightsCache.put({
          monthKey: currentMonthKey,
          data: generated,
          cachedAt: Date.now(),
        });
      }
    }
    loadData();
  }, [lang]);

  // Handle "Ask Amma AI"
  const handleAskAmma = async () => {
    if (!userQuestion.trim()) return;

    setIsAsking(true);
    setAiAnswer(null);

    const currentMonthKey = new Date().toISOString().slice(0, 7);
    const currentMonthExpenses = expenses.filter((e) => e.date.startsWith(currentMonthKey));
    const totalSpent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

    const aggregated: Record<string, number> = {};
    for (const e of currentMonthExpenses) {
      aggregated[e.category] = (aggregated[e.category] || 0) + e.amount;
    }

    try {
      const answer = await askAmmaApi({
        question: userQuestion.trim(),
        aggregatedTotals: aggregated,
        budget,
        totalSpent,
        lang,
      });

      setAiAnswer(answer);
      showToast('அம்மா AI பதிலளித்தது!', 'success');
    } catch {
      showToast(t('common.error'), 'error');
    } finally {
      setIsAsking(false);
    }
  };

  // Prepare chart data from actual expenses
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const currentMonthExpenses = expenses.filter((e) => e.date.startsWith(currentMonthKey));
  const categoryTotals: Record<string, number> = {};
  for (const e of currentMonthExpenses) {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  }

  const categoryChartData = Object.entries(categoryTotals).map(([cat, amount]) => ({
    name: t(`categories.${cat}`),
    amount,
    color: '#C2185B',
  }));

  const totalSpent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const monthlyComparison = [
    { name: t('insights.lastMonth'), amount: Math.round(budget * 0.68), fill: '#D7CCC8' },
    { name: t('insights.currentMonth'), amount: totalSpent || 21450, fill: '#C2185B' },
  ];

  return (
    <div className="pb-28 pt-2 px-4 flex flex-col gap-5 max-w-[440px] mx-auto select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-warmBrown tracking-tight">
            {t('insights.title')}
          </h2>
          <p className="text-xs sm:text-sm text-warmBrown-subtle font-medium mt-0.5">
            {t('insights.subtitle')}
          </p>
        </div>
        <Mascot mood="happy" size={56} />
      </div>

      {/* 1. Monthly Summary Card (AI Generated) */}
      <Card variant="surface" className="border-leafGreen/30 bg-leafGreen-light/20">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-leafGreen flex items-center justify-center text-white flex-shrink-0 shadow-warm-sm">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-base font-extrabold text-warmBrown leading-snug">
              {t('insights.summaryCardTitle')}
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-leafGreen-dark mt-1 leading-relaxed">
              {insightsResult?.summary || t('insights.summaryGood')}
            </p>
          </div>
        </div>

        {insightsResult?.insights && (
          <div className="mt-3.5 pt-3 border-t border-leafGreen/20 flex flex-col gap-1.5">
            {insightsResult.insights.map((ins, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs font-bold text-warmBrown">
                <span className="text-leafGreen font-black">•</span>
                <span>{ins}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 2. "Ask Amma AI" Assistant Box */}
      <Card variant="warmGold" className="border-turmeric-300">
        <div className="flex items-center gap-2 mb-2">
          <HelpCircle className="w-5 h-5 text-kumkum" />
          <h3 className="text-sm font-extrabold text-warmBrown">
            {t('insights.askAmmaTitle')}
          </h3>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={userQuestion}
            onChange={(e) => setUserQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAskAmma()}
            placeholder={t('insights.askAmmaPlaceholder')}
            className="flex-1 px-3.5 py-2.5 rounded-2xl bg-white border border-[#EFEBE9] text-xs sm:text-sm font-semibold text-warmBrown outline-none shadow-sm focus:border-kumkum"
          />
          <button
            type="button"
            onClick={handleAskAmma}
            disabled={isAsking || !userQuestion.trim()}
            className="px-4 py-2.5 rounded-2xl bg-kumkum hover:bg-kumkum-dark text-white font-bold text-xs flex items-center gap-1 shadow-warm-sm active:scale-95 disabled:opacity-60 transition-all"
          >
            {isAsking ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* AI Answer Bubble */}
        {aiAnswer && (
          <div className="mt-3 p-3.5 rounded-2xl bg-white border border-turmeric shadow-warm-sm flex items-start gap-2.5 animate-fade-in">
            <Mascot mood="happy" size={36} />
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-kumkum">சோகோபி அம்மா:</span>
              <p className="text-xs sm:text-sm font-bold text-warmBrown mt-0.5 leading-relaxed">
                {aiAnswer}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* 3. Automation: Recurring Reminders Detected */}
      {recurringList.length > 0 && (
        <Card variant="surface" className="border-turmeric/40">
          <div className="flex items-center gap-2 mb-2.5">
            <Repeat className="w-4 h-4 text-turmeric-dark" />
            <h4 className="text-sm font-bold text-warmBrown">
              {t('insights.recurringTitle')}
            </h4>
          </div>

          <div className="flex flex-col gap-2">
            {recurringList.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-cream border border-[#EFEBE9] flex items-center justify-between"
              >
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-warmBrown line-clamp-1">
                    {item.note}
                  </span>
                  <span className="text-[10px] font-semibold text-warmBrown-subtle">
                    {item.frequency === 'daily'
                      ? 'தினசரி'
                      : item.frequency === 'weekly'
                      ? 'வாராந்திரம்'
                      : 'மாதாந்திரம்'}{' '}
                    • {item.confidence}% உறுதி
                  </span>
                </div>
                <span className="text-sm font-black text-kumkum">
                  {formatRupee(item.estimatedAmount)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 4. Automation: Spending Spikes Detected */}
      {spikesList.length > 0 && (
        <Card variant="danger" className="border-red-300 bg-red-50">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-danger" />
            <h4 className="text-sm font-bold text-red-700">
              {t('insights.spikesTitle')}
            </h4>
          </div>

          <div className="flex flex-col gap-1.5">
            {spikesList.map((spike, idx) => (
              <p key={idx} className="text-xs font-bold text-warmBrown">
                • {spike.message} (+{formatRupee(spike.currentAmount - spike.previousAmount)})
              </p>
            ))}
          </div>
        </Card>
      )}

      {/* 5. Monthly Comparison Chart */}
      <Card variant="surface">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-warmBrown">
            {t('insights.monthlyComparison')}
          </h4>
          <span className="text-xs font-bold text-leafGreen bg-leafGreen-light px-2.5 py-1 rounded-full">
            கட்டுக்குள் உள்ளது
          </span>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyComparison} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: '#5D4037', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8D6E63', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip formatter={(val) => [formatRupee(Number(val) || 0), 'செலவு']} />
              <Bar dataKey="amount" radius={[12, 12, 4, 4]}>
                {monthlyComparison.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 6. Category Breakdown Chart */}
      {categoryChartData.length > 0 && (
        <Card variant="surface">
          <h4 className="text-sm font-bold text-warmBrown mb-3">
            {t('insights.chartTitle')}
          </h4>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={categoryChartData} margin={{ top: 5, right: 20, left: 35, bottom: 5 }}>
                <XAxis type="number" tick={{ fill: '#8D6E63', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#3E2723', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(val) => [formatRupee(Number(val) || 0), 'தொகை']} />
                <Bar dataKey="amount" fill="#C2185B" radius={[0, 10, 10, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* 7. Actionable Saving Tip Card */}
      <Card variant="warmGold" className="border-turmeric-200">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-turmeric flex items-center justify-center flex-shrink-0 text-warmBrown shadow-warm-sm">
            <Lightbulb className="w-5 h-5 text-warmBrown" />
          </div>
          <div>
            <span className="text-xs font-bold text-warmBrown uppercase tracking-wider">
              {t('insights.smartSavingTip')}
            </span>
            <p className="text-xs sm:text-sm font-semibold text-warmBrown mt-1 leading-relaxed">
              {insightsResult?.savingTip || t('insights.smartTipText')}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
