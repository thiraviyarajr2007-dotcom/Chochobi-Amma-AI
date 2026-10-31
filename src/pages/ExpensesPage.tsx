import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  Plus,
  Mic,
  Calendar,
  Sparkles,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { useI18n } from '../i18n/i18nContext';
import { Card } from '../components/Card';
import { CategoryChip } from '../components/CategoryChip';
import { EmptyState } from '../components/EmptyState';
import { TopBar } from '../components/TopBar';
import { db } from '../lib/db';
import { exportExpensesToCSV } from '../lib/budgetAnalytics';
import { useToast } from '../components/Toast';
import { ExpenseCategory, ExpenseItem } from '../types';

type TimeFilter = 'all' | 'week' | 'month';

export const ExpensesPage: React.FC = () => {
  const { lang, t, formatRupee } = useI18n();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const highlightId = searchParams.get('highlight');
  const highlightedItemRef = useRef<HTMLDivElement | null>(null);

  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | 'all'>('all');

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

  useEffect(() => {
    async function loadData() {
      const list = await db.expenses.reverse().toArray();
      setExpenses(list);
    }
    loadData();
  }, []);

  // Auto-scroll highlighted item into view
  useEffect(() => {
    if (highlightId && highlightedItemRef.current) {
      highlightedItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightId, expenses]);

  const handleExportCSV = () => {
    if (expenses.length === 0) {
      showToast(t('expensesList.emptyState'), 'info');
      return;
    }
    exportExpensesToCSV(expenses);
    showToast(t('settings.exportSuccess'), 'success');
  };

  // Filter logic
  const now = new Date();
  const filteredExpenses = expenses.filter((item) => {
    // 1. Category
    if (selectedCategory !== 'all' && item.category !== selectedCategory) {
      return false;
    }

    // 2. Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNote = item.note.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      const matchAmount = item.amount.toString().includes(q);
      if (!matchNote && !matchCat && !matchAmount) return false;
    }

    // 3. Time
    if (timeFilter === 'week') {
      const itemDate = new Date(item.date);
      const diffDays = (now.getTime() - itemDate.getTime()) / (1000 * 3600 * 24);
      if (diffDays > 7) return false;
    } else if (timeFilter === 'month') {
      const itemDate = new Date(item.date);
      if (
        itemDate.getMonth() !== now.getMonth() ||
        itemDate.getFullYear() !== now.getFullYear()
      ) {
        return false;
      }
    }

    return true;
  });

  const totalFiltered = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="min-h-screen bg-[#FFF8EC] flex flex-col">
      <TopBar
        title={t('expensesList.title')}
        subtitle={`${filteredExpenses.length} ${t('expensesList.countItems')}`}
        showBack={true}
        onBack={() => navigate('/home')}
        rightAction={
          <button
            onClick={handleExportCSV}
            title={t('expensesList.exportCsv')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-[#EFEBE9] text-warmBrown hover:bg-cream-dark active:scale-95 shadow-warm-sm transition-transform"
            aria-label={t('expensesList.exportCsv')}
          >
            <Download className="w-4 h-4" />
          </button>
        }
      />

      <div className="flex-1 pb-28 pt-2 px-4 flex flex-col gap-4 max-w-[440px] mx-auto w-full select-none">
        {/* Back Link */}
        <button
          onClick={() => navigate('/home')}
          className="self-start flex items-center gap-2 text-sm font-bold text-warmBrown hover:text-kumkum px-2 py-1 rounded-xl transition-colors"
          aria-label={t('common.back')}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('common.back')}</span>
        </button>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-warmBrown-subtle absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('expensesList.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-[#EFEBE9] focus:border-kumkum focus:outline-none text-warmBrown text-sm font-semibold shadow-warm-sm"
          />
        </div>

        {/* Time Filter Pills */}
        <div className="flex items-center gap-2 p-1 bg-white rounded-2xl border border-[#EFEBE9] shadow-warm-sm">
          <button
            type="button"
            onClick={() => setTimeFilter('all')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              timeFilter === 'all'
                ? 'bg-kumkum text-white shadow-warm-sm'
                : 'text-warmBrown-muted hover:text-warmBrown'
            }`}
          >
            {t('expensesList.filterAll')}
          </button>
          <button
            type="button"
            onClick={() => setTimeFilter('week')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              timeFilter === 'week'
                ? 'bg-kumkum text-white shadow-warm-sm'
                : 'text-warmBrown-muted hover:text-warmBrown'
            }`}
          >
            {t('expensesList.filterWeek')}
          </button>
          <button
            type="button"
            onClick={() => setTimeFilter('month')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              timeFilter === 'month'
                ? 'bg-kumkum text-white shadow-warm-sm'
                : 'text-warmBrown-muted hover:text-warmBrown'
            }`}
          >
            {t('expensesList.filterMonth')}
          </button>
        </div>

        {/* Category Horizontal Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
              selectedCategory === 'all'
                ? 'bg-turmeric text-warmBrown border-turmeric shadow-warm-sm'
                : 'bg-white text-warmBrown-muted border-[#EFEBE9] hover:bg-cream'
            }`}
          >
            {t('categories.all')}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                selectedCategory === cat
                  ? 'bg-turmeric text-warmBrown border-turmeric shadow-warm-sm'
                  : 'bg-white text-warmBrown-muted border-[#EFEBE9] hover:bg-cream'
              }`}
            >
              {t(`categories.${cat}`)}
            </button>
          ))}
        </div>

        {/* Summary Header */}
        <div className="flex items-center justify-between px-1 text-xs font-bold text-warmBrown-subtle">
          <span>{filteredExpenses.length} {t('expensesList.countItems')}</span>
          <span className="text-sm font-black text-kumkum">
            {t('expensesList.total')}: {formatRupee(totalFiltered)}
          </span>
        </div>

        {/* Expense Items List */}
        {filteredExpenses.length === 0 ? (
          <EmptyState
            title={t('expensesList.emptyState')}
            description={t('expensesList.emptyStateDesc')}
            actionLabel={t('expensesList.addFirst')}
            onAction={() => navigate('/add?mode=voice')}
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {filteredExpenses.map((item) => {
              const isHighlighted = item.id === highlightId;
              return (
                <div
                  key={item.id}
                  ref={isHighlighted ? highlightedItemRef : undefined}
                  onClick={() => navigate(`/expenses/${item.id}`)}
                  className={`p-3.5 rounded-3xl bg-white border transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] shadow-warm-sm hover:shadow-warm-md ${
                    isHighlighted
                      ? 'border-kumkum ring-4 ring-kumkum/20 bg-kumkum-50/40'
                      : 'border-[#EFEBE9] hover:border-kumkum/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-cream-dark flex items-center justify-center text-xl shadow-warm-sm flex-shrink-0">
                      {item.category === 'groceries'
                        ? '🛒'
                        : item.category === 'dairy'
                        ? '🥛'
                        : item.category === 'vegetables'
                        ? '🥕'
                        : item.category === 'medical'
                        ? '💊'
                        : item.category === 'utilities'
                        ? '💡'
                        : item.category === 'education'
                        ? '📚'
                        : item.category === 'temple'
                        ? '🪔'
                        : item.category === 'snacks'
                        ? '☕'
                        : item.category === 'transport'
                        ? '🛺'
                        : '🌸'}
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-warmBrown line-clamp-1">
                          {item.note}
                        </span>
                        {item.isVoice && (
                          <span className="w-5 h-5 rounded-full bg-kumkum-100 flex items-center justify-center text-kumkum" title="Voice Added">
                            <Mic className="w-3 h-3" />
                          </span>
                        )}
                        {isHighlighted && (
                          <span className="text-[10px] bg-kumkum text-white font-extrabold px-1.5 py-0.5 rounded-full uppercase">
                            {lang === 'ta' ? 'புதியது' : 'New'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-warmBrown-subtle font-medium mt-0.5">
                        <span>{t(`categories.${item.category}`)}</span>
                        <span>•</span>
                        <span>{item.date}</span>
                        {item.time && (
                          <>
                            <span>•</span>
                            <span>{item.time}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pl-2">
                    <span className="text-base font-black text-kumkum whitespace-nowrap">
                      {formatRupee(item.amount)}
                    </span>
                    <ArrowRight className="w-4 h-4 text-warmBrown-subtle" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
