import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Sparkles,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { useI18n } from '../i18n/i18nContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Mascot } from '../components/Mascot';
import { TopBar } from '../components/TopBar';
import { useToast } from '../components/Toast';
import { db } from '../lib/db';
import {
  detectRecurringExpenses,
  detectExpenseSpikes,
  calculateBudgetStatus,
} from '../lib/budgetAnalytics';
import { getInsightsApi } from '../lib/apiClient';
import {
  ExpenseItem,
  MonthlyInsightsResult,
  RecurringExpenseSuggestion,
  ExpenseSpike,
} from '../types';

export const InsightsPage: React.FC = () => {
  const { t, formatRupee, lang } = useI18n();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [budget, setBudget] = useState<number>(35000);
  const [insightsResult, setInsightsResult] = useState<MonthlyInsightsResult | null>(null);
  const [recurringList, setRecurringList] = useState<RecurringExpenseSuggestion[]>([]);
  const [spikesList, setSpikesList] = useState<ExpenseSpike[]>([]);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

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

      if (cached && Date.now() - cached.cachedAt < 1000 * 3600 * 12) {
        setInsightsResult(cached.data);
      } else if (allExpenses.length > 0) {
        setIsLoadingAi(true);
        try {
          const res = await getInsightsApi({
            totalSpent,
            budget: currentBudget,
            aggregatedTotals: aggregated,
            monthName: currentMonthKey,
            lang,
          });
          setInsightsResult(res);
          await db.insightsCache.put({
            monthKey: currentMonthKey,
            data: res,
            cachedAt: Date.now(),
          });
        } catch {
          // Fallback static
          setInsightsResult({
            summary:
              lang === 'ta'
                ? 'இந்த மாதம் செலவு சீராக உள்ளது. மளிகை மற்றும் காய்கறி செலவுகள் வழக்கம்போல் உள்ளன.'
                : 'Spending is well controlled this month. Groceries and vegetables are within expected limits.',
            insights: [
              lang === 'ta'
                ? 'மளிகை மற்றும் காய்கறி செலவுகள் வழக்கமான வரம்பிற்குள் உள்ளன.'
                : 'Grocery expenses are well within limits.',
            ],
            savingTip:
              lang === 'ta'
                ? 'உழவர் சந்தையில் காய்கறிகள் வாங்குவது 15% வரை மிச்சப்படுத்தும்.'
                : 'Buying vegetables in local farmers market can save up to 15%.',
            budgetForecast: {
              predictedSpent: Math.round(totalSpent * 1.1),
              status: 'on_track',
            },
            spikes: [],
          });
        } finally {
          setIsLoadingAi(false);
        }
      }
    }
    loadData();
  }, [lang]);

  // Chart data preparation
  const currentMonth = new Date().toISOString().slice(0, 7);
  const thisMonthExpenses = expenses.filter((e) => e.date.startsWith(currentMonth));
  const categoryTotals: Record<string, number> = {};

  for (const exp of thisMonthExpenses) {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
  }

  const chartData = Object.entries(categoryTotals)
    .map(([cat, amount]) => ({
      name: t(`categories.${cat}`),
      amount,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);

  const colors = ['#C2185B', '#FFB300', '#2E7D32', '#0288D1', '#7B1FA2', '#E64A19'];
  const budgetStatus = calculateBudgetStatus(expenses, budget);

  return (
    <div className="min-h-screen bg-[#FFF8EC] flex flex-col">
      <TopBar
        title={t('insights.title')}
        subtitle={t('insights.subtitle')}
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

        {/* 1. Plain-Language AI Summary Card */}
        <Card variant="surface" className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-kumkum-100 flex items-center justify-center text-kumkum">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-warmBrown">
                  {t('insights.plainLanguageSummary')}
                </h3>
                <span className="text-xs text-warmBrown-subtle font-medium">
                  {lang === 'ta' ? 'அம்மா AI மாதாந்திர பார்வை' : 'Amma AI Monthly Review'}
                </span>
              </div>
            </div>
            <Mascot mood="happy" size={48} />
          </div>

          <p className="text-sm font-semibold text-warmBrown leading-relaxed bg-cream p-3 rounded-2xl border border-[#EFEBE9]">
            {isLoadingAi
              ? lang === 'ta'
                ? 'கணக்குகளை ஆய்வு செய்கிறேன்...'
                : 'Analyzing your spending habits...'
              : insightsResult?.summary || t('home.budgetSafe')}
          </p>

          {/* Saving tip */}
          {insightsResult?.savingTip && (
            <div className="flex flex-col gap-2 pt-1">
              <span className="text-xs font-bold text-leafGreen uppercase tracking-wider flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4" />
                {t('insights.savingTips')}
              </span>
              <div className="p-2.5 rounded-xl bg-leafGreen-light/50 border border-leafGreen/20 text-xs font-semibold text-leafGreen flex items-start gap-2">
                <span>💡</span>
                <span>{insightsResult.savingTip}</span>
              </div>
            </div>
          )}

          {/* Insights items */}
          {insightsResult?.insights && insightsResult.insights.length > 0 && (
            <div className="flex flex-col gap-1.5 pt-1">
              {insightsResult.insights.map((ins, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-xl bg-cream border border-[#EFEBE9] text-xs font-medium text-warmBrown flex items-start gap-2"
                >
                  <span>🌸</span>
                  <span>{ins}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 2. Category Spending Bar Chart (Recharts) */}
        <Card variant="surface" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-warmBrown-subtle uppercase tracking-wider">
              {t('insights.categoryChart')}
            </span>
            <span className="text-xs font-black text-kumkum">
              {formatRupee(budgetStatus.spent)}
            </span>
          </div>

          {chartData.length > 0 ? (
            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <XAxis
                    dataKey="name"
                    stroke="#8D6E63"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis stroke="#8D6E63" fontSize={11} tickLine={false} />
                  <Tooltip
                    formatter={(value: any) => [formatRupee(Number(value) || 0), t('nav.expenses')]}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '16px',
                      border: '1px solid #EFEBE9',
                      fontWeight: 'bold',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-8 text-center text-xs font-semibold text-warmBrown-muted">
              {t('expensesList.emptyState')}
            </div>
          )}
        </Card>

        {/* 3. Recurring Bills Detected */}
        {recurringList.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-warmBrown uppercase tracking-wider flex items-center gap-1.5">
                <Repeat className="w-4 h-4 text-turmeric-dark" />
                {t('insights.recurringBills')}
              </span>
              <span className="text-xs font-bold text-warmBrown-subtle">
                {recurringList.length} {lang === 'ta' ? 'கண்டறியப்பட்டது' : 'detected'}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {recurringList.map((rec, idx) => (
                <div
                  key={rec.note + '-' + idx}
                  className="p-3.5 rounded-2xl bg-white border border-[#EFEBE9] shadow-warm-sm flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-cream-dark flex items-center justify-center text-lg">
                      🔁
                    </div>
                    <div>
                      <span className="text-sm font-bold text-warmBrown block">{rec.note}</span>
                      <span className="text-xs font-semibold text-warmBrown-subtle">
                        {lang === 'ta' ? 'கடைசியாக' : 'Last seen'}: {rec.lastSeenDate}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-black text-kumkum">
                    {formatRupee(rec.estimatedAmount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Spending Spike Alerts */}
        {spikesList.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-bold text-danger uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              {t('insights.spikeAlert')}
            </span>

            {spikesList.map((spike, idx) => (
              <div
                key={spike.category + '-' + idx}
                className="p-3.5 rounded-2xl bg-red-50 border border-red-200 shadow-warm-sm flex items-center justify-between gap-3"
              >
                <div>
                  <span className="text-xs font-extrabold text-danger block">
                    {t(`categories.${spike.category}`)}
                  </span>
                  <span className="text-xs font-medium text-warmBrown">{spike.message}</span>
                </div>
                <span className="text-sm font-black text-danger">
                  +{spike.percentageIncrease}%
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Prompt to Ask Amma AI */}
        <div
          onClick={() => navigate('/ask')}
          className="p-4 rounded-3xl bg-gradient-to-tr from-kumkum-50 to-white border border-kumkum/30 shadow-warm-sm flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99] transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-kumkum flex items-center justify-center text-white">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-sm font-extrabold text-warmBrown block">
                {t('moreSheet.askAmma')}
              </span>
              <span className="text-xs text-warmBrown-subtle font-medium">
                {lang === 'ta' ? 'செலவு பற்றிய சந்தேகங்களை கேளுங்கள்' : 'Ask questions about your budget'}
              </span>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-kumkum" />
        </div>
      </div>
    </div>
  );
};
