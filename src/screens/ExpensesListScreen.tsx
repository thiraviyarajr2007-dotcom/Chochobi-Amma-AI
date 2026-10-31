import React, { useState } from 'react';
import { Search, Calendar, Trash2, Download, Undo2, Edit3, Check } from 'lucide-react';
import { useI18n } from '../i18n/i18nContext';
import { Card } from '../components/Card';
import { CategoryChip } from '../components/CategoryChip';
import { EmptyState } from '../components/EmptyState';
import { BottomSheet } from '../components/BottomSheet';
import { Button } from '../components/Button';
import { useToast } from '../components/Toast';
import { ExpenseItem, ExpenseCategory } from '../types';
import { exportExpensesToCSV } from '../lib/budgetAnalytics';
import { db } from '../lib/db';

interface ExpensesListScreenProps {
  expenses: ExpenseItem[];
  onDeleteExpense: (id: string) => void;
  onAddNew: () => void;
  onRefreshExpenses?: () => void;
}

export const ExpensesListScreen: React.FC<ExpensesListScreenProps> = ({
  expenses,
  onDeleteExpense,
  onAddNew,
  onRefreshExpenses,
}) => {
  const { t, formatRupee } = useI18n();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month'>('all');
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | 'all'>('all');
  const [selectedExpense, setSelectedExpense] = useState<ExpenseItem | null>(null);

  // Edit modal state
  const [isEditing, setIsEditing] = useState(false);
  const [editNote, setEditNote] = useState('');
  const [editAmount, setEditAmount] = useState(0);
  const [editCategory, setEditCategory] = useState<ExpenseCategory>('groceries');

  // Undo buffer
  const [recentlyDeleted, setRecentlyDeleted] = useState<ExpenseItem | null>(null);

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

  const now = new Date();
  const currentMonthKey = now.toISOString().slice(0, 7);
  const oneWeekAgoTime = now.getTime() - 7 * 86400000;

  // Filter expenses
  const filtered = expenses.filter((item) => {
    // Time filter
    if (timeFilter === 'month' && !item.date.startsWith(currentMonthKey)) {
      return false;
    }
    if (timeFilter === 'week') {
      const itemTime = new Date(item.date).getTime();
      if (itemTime < oneWeekAgoTime) return false;
    }

    // Category match
    if (selectedCategory !== 'all' && item.category !== selectedCategory) {
      return false;
    }

    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNote = item.note.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      if (!matchNote && !matchCat) return false;
    }
    return true;
  });

  const totalFilteredSpent = filtered.reduce((acc, curr) => acc + curr.amount, 0);

  const handleDelete = async () => {
    if (selectedExpense) {
      const toDelete = selectedExpense;
      setSelectedExpense(null);
      setRecentlyDeleted(toDelete);

      // Remove from DB & Parent state
      await db.expenses.delete(toDelete.id);
      onDeleteExpense(toDelete.id);

      // Offer Undo notification
      showToast(
        `${toDelete.note} நீக்கப்பட்டது. ${t('common.undo')}?`,
        'warning'
      );
    }
  };

  const handleUndo = async () => {
    if (recentlyDeleted) {
      await db.expenses.put(recentlyDeleted);
      onRefreshExpenses?.();
      setRecentlyDeleted(null);
      showToast(t('common.undoSuccess'), 'success');
    }
  };

  const handleStartEdit = () => {
    if (selectedExpense) {
      setEditNote(selectedExpense.note);
      setEditAmount(selectedExpense.amount);
      setEditCategory(selectedExpense.category);
      setIsEditing(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedExpense) return;
    const updated: ExpenseItem = {
      ...selectedExpense,
      note: editNote || selectedExpense.note,
      amount: editAmount > 0 ? editAmount : selectedExpense.amount,
      category: editCategory,
    };

    await db.expenses.put(updated);
    setIsEditing(false);
    setSelectedExpense(updated);
    onRefreshExpenses?.();
    showToast(t('common.success'), 'success');
  };

  const handleExportCSV = () => {
    exportExpensesToCSV(expenses);
    showToast(t('expensesList.csvDownloaded'), 'success');
  };

  return (
    <div className="pb-28 pt-2 px-4 flex flex-col gap-4 max-w-[440px] mx-auto select-none">
      {/* 1. Header Summary Card with CSV Export Button */}
      <Card variant="surface" className="border-kumkum/20">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-warmBrown-subtle uppercase tracking-wider">
              {t('expensesList.totalSpent')}
            </span>
            <div className="text-3xl font-black text-kumkum mt-0.5">
              {formatRupee(totalFilteredSpent)}
            </div>
            <span className="text-xs font-medium text-warmBrown-muted">
              {filtered.length} {t('expensesList.countItems')}
            </span>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-2xl bg-cream hover:bg-cream-dark border border-[#EFEBE9] text-xs font-bold text-warmBrown flex items-center gap-1 shadow-warm-sm active:scale-95 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-kumkum" />
              <span>CSV</span>
            </button>
            <div className="w-9 h-9 rounded-2xl bg-kumkum-100 flex items-center justify-center text-kumkum">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
        </div>
      </Card>

      {/* Undo Floating Banner if recently deleted */}
      {recentlyDeleted && (
        <div className="p-3.5 rounded-2xl bg-warmBrown text-white flex items-center justify-between shadow-warm-lg animate-fade-in">
          <span className="text-xs font-bold truncate max-w-[210px]">
            "{recentlyDeleted.note}" நீக்கப்பட்டது
          </span>
          <button
            type="button"
            onClick={handleUndo}
            className="px-3 py-1 rounded-xl bg-turmeric text-warmBrown font-black text-xs flex items-center gap-1 active:scale-95 transition-all"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>{t('common.undo')}</span>
          </button>
        </div>
      )}

      {/* 2. Search Box */}
      <div className="relative flex items-center bg-white rounded-2xl border border-[#EFEBE9] px-4 py-3 shadow-warm-sm focus-within:border-kumkum transition-all">
        <Search className="w-5 h-5 text-warmBrown-subtle mr-2 flex-shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('expensesList.searchPlaceholder')}
          className="w-full text-sm font-semibold text-warmBrown placeholder-warmBrown-light bg-transparent outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs text-warmBrown-subtle font-bold px-2 py-0.5 rounded-full hover:bg-cream"
          >
            ✕
          </button>
        )}
      </div>

      {/* 3. Time Filter Buttons (All, Week, Month) */}
      <div className="flex gap-2">
        {(['all', 'week', 'month'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setTimeFilter(mode)}
            className={`flex-1 py-2 rounded-2xl font-bold text-xs sm:text-sm border transition-all ${
              timeFilter === mode
                ? 'bg-kumkum text-white border-kumkum shadow-warm-sm'
                : 'bg-white text-warmBrown-muted border-[#EFEBE9] hover:bg-cream'
            }`}
          >
            {mode === 'all'
              ? t('expensesList.filterAll')
              : mode === 'week'
              ? t('expensesList.filterWeek')
              : t('expensesList.filterMonth')}
          </button>
        ))}
      </div>

      {/* 4. Horizontal Category Scroll Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 -mx-4 px-4 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`px-3.5 py-1.5 rounded-2xl font-bold text-xs sm:text-sm whitespace-nowrap border transition-all ${
            selectedCategory === 'all'
              ? 'bg-warmBrown text-white border-warmBrown shadow-warm-sm'
              : 'bg-white text-warmBrown border-[#EFEBE9] hover:bg-cream'
          }`}
        >
          {t('expensesList.filterAll')}
        </button>
        {categories.map((cat) => (
          <CategoryChip
            key={cat}
            category={cat}
            isSelected={selectedCategory === cat}
            onClick={() => setSelectedCategory(cat)}
            size="sm"
          />
        ))}
      </div>

      {/* 5. Expense Cards List */}
      {filtered.length === 0 ? (
        <EmptyState
          title={t('expensesList.emptyState')}
          description={t('expensesList.emptyTip')}
          actionLabel="+ புதிய செலவு சேர்க்க"
          onAction={onAddNew}
          mascotMood="thinking"
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                setSelectedExpense(item);
                setIsEditing(false);
              }}
              className="p-4 rounded-3xl bg-white border border-[#EFEBE9] hover:border-kumkum/40 shadow-warm-sm flex items-center justify-between gap-3 active:scale-[0.99] cursor-pointer transition-all"
            >
              <div className="flex items-center gap-3">
                <CategoryChip category={item.category} size="md" showEmojiOnly />
                <div className="flex flex-col">
                  <span className="text-base font-bold text-warmBrown leading-snug">
                    {item.note}
                  </span>
                  <span className="text-xs font-semibold text-warmBrown-subtle mt-0.5">
                    {item.date} {item.time && `• ${item.time}`} {item.isVoice && '• 🎙️ குரல்'}
                  </span>
                </div>
              </div>

              <div className="text-lg sm:text-xl font-black text-warmBrown flex-shrink-0">
                {formatRupee(item.amount)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expense Detail & Edit BottomSheet Modal */}
      <BottomSheet
        isOpen={!!selectedExpense}
        onClose={() => {
          setSelectedExpense(null);
          setIsEditing(false);
        }}
        title={isEditing ? 'செலவைத் திருத்த (Edit Expense)' : 'செலவு விவரம் (Expense Details)'}
      >
        {selectedExpense && (
          <div className="flex flex-col gap-4 py-2">
            {isEditing ? (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs font-bold text-warmBrown-subtle">
                    {t('addExpense.noteLabel')}
                  </label>
                  <input
                    type="text"
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    className="w-full min-h-[48px] px-3.5 rounded-2xl bg-cream border border-[#EFEBE9] font-bold text-warmBrown mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-warmBrown-subtle">
                    {t('addExpense.amountLabel')}
                  </label>
                  <input
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(parseFloat(e.target.value) || 0)}
                    className="w-full min-h-[48px] px-3.5 rounded-2xl bg-cream border border-[#EFEBE9] font-black text-kumkum mt-1 text-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-warmBrown-subtle mb-1 block">
                    {t('addExpense.categoryLabel')}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map((c) => (
                      <CategoryChip
                        key={c}
                        category={c}
                        isSelected={editCategory === c}
                        onClick={() => setEditCategory(c)}
                        size="sm"
                      />
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <Button variant="primary" onClick={handleSaveEdit} icon={<Check className="w-5 h-5" />}>
                    {t('common.save')}
                  </Button>
                  <Button variant="ghost" onClick={() => setIsEditing(false)}>
                    {t('common.cancel')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#EFEBE9]">
                  <span className="text-sm font-semibold text-warmBrown-subtle">
                    செலவுத் தொகை:
                  </span>
                  <span className="text-3xl font-black text-kumkum">
                    {formatRupee(selectedExpense.amount)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-warmBrown-subtle">
                    பிரிவு:
                  </span>
                  <CategoryChip category={selectedExpense.category} size="sm" isSelected />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-warmBrown-subtle">
                    கடை / குறிப்பு:
                  </span>
                  <span className="text-base font-bold text-warmBrown text-right">
                    {selectedExpense.note}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-warmBrown-subtle">
                    தேதி மற்றும் நேரம்:
                  </span>
                  <span className="text-sm font-medium text-warmBrown-muted">
                    {selectedExpense.date} {selectedExpense.time}
                  </span>
                </div>

                <div className="pt-3 flex gap-2.5">
                  <Button variant="secondary" onClick={handleStartEdit} icon={<Edit3 className="w-5 h-5" />}>
                    திருத்த (Edit)
                  </Button>
                  <Button variant="danger" onClick={handleDelete} icon={<Trash2 className="w-5 h-5" />}>
                    {t('common.delete')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  );
};
