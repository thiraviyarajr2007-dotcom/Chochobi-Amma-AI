import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Mic,
  Tag,
  Edit2,
  Trash2,
  Check,
  X,
  Share2,
} from 'lucide-react';
import { useI18n } from '../i18n/i18nContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { AmountInput } from '../components/AmountInput';
import { CategoryChip } from '../components/CategoryChip';
import { TopBar } from '../components/TopBar';
import { Mascot } from '../components/Mascot';
import { useToast } from '../components/Toast';
import { db } from '../lib/db';
import { ExpenseItem, ExpenseCategory } from '../types';

export const ExpenseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lang, t, formatRupee } = useI18n();
  const { showToast } = useToast();

  const [item, setItem] = useState<ExpenseItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editCategory, setEditCategory] = useState<ExpenseCategory>('groceries');
  const [editNote, setEditNote] = useState<string>('');

  // Delete modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
    async function loadItem() {
      if (!id) return;
      const record = await db.expenses.get(id);
      if (record) {
        setItem(record);
        setEditAmount(record.amount);
        setEditCategory(record.category);
        setEditNote(record.note);
      }
      setLoading(false);
    }
    loadItem();
  }, [id]);

  const handleSaveEdit = async () => {
    if (!item) return;
    if (editAmount <= 0) {
      showToast(t('addExpense.amountLabel') + ' > 0', 'warning');
      return;
    }

    const updated: ExpenseItem = {
      ...item,
      amount: editAmount,
      category: editCategory,
      note: editNote || t(`categories.${editCategory}`),
    };

    await db.expenses.put(updated);
    setItem(updated);
    setIsEditing(false);
    showToast(t('common.success'), 'success');
  };

  const handleDelete = async () => {
    if (!item) return;
    const backupItem = { ...item };
    await db.expenses.delete(item.id);

    showToast(t('expensesList.deletedSuccess'), 'info', 5000, {
      label: t('common.undo'),
      onClick: async () => {
        await db.expenses.add(backupItem);
        showToast(t('common.restored'), 'success');
      },
    });

    navigate('/expenses');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8EC] flex items-center justify-center">
        <Mascot mood="thinking" size={90} animate={true} />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-[#FFF8EC] flex flex-col items-center justify-center p-6 text-center">
        <Mascot mood="alert" size={100} />
        <h2 className="text-xl font-black text-warmBrown mt-3">{t('expensesList.emptyState')}</h2>
        <p className="text-sm text-warmBrown-muted mt-1">{t('expensesList.emptyStateDesc')}</p>
        <div className="mt-5">
          <Button variant="primary" onClick={() => navigate('/expenses')}>
            {t('common.back')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8EC] flex flex-col">
      <TopBar
        title={isEditing ? t('common.edit') : item.note}
        subtitle={item.date}
        showBack={true}
        onBack={() => navigate('/expenses')}
      />

      <div className="flex-1 pb-28 pt-2 px-4 flex flex-col gap-4 max-w-[440px] mx-auto w-full select-none">
        {/* Large labelled back button */}
        <button
          onClick={() => navigate('/expenses')}
          className="self-start flex items-center gap-2 text-sm font-bold text-warmBrown hover:text-kumkum px-2 py-1 rounded-xl transition-colors"
          aria-label={t('common.back')}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('common.back')}</span>
        </button>

        {/* VIEW MODE */}
        {!isEditing ? (
          <>
            <Card variant="surface" className="text-center py-6">
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs font-bold text-warmBrown-subtle uppercase tracking-wider">
                  {t('addExpense.amountLabel')}
                </span>
                <div className="text-4xl sm:text-5xl font-black text-kumkum tracking-tight">
                  {formatRupee(item.amount)}
                </div>

                <div className="mt-2 inline-flex items-center gap-2 bg-cream-dark px-3.5 py-1.5 rounded-full border border-[#EFEBE9]">
                  <Tag className="w-4 h-4 text-warmBrown-subtle" />
                  <span className="text-xs sm:text-sm font-bold text-warmBrown">
                    {t(`categories.${item.category}`)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Details List */}
            <Card variant="surface" className="flex flex-col gap-3">
              <div className="flex items-center justify-between py-2 border-b border-[#EFEBE9]">
                <div className="flex items-center gap-2 text-xs font-bold text-warmBrown-subtle">
                  <Calendar className="w-4 h-4 text-warmBrown-muted" />
                  <span>{t('common.date')}</span>
                </div>
                <span className="text-sm font-bold text-warmBrown">{item.date}</span>
              </div>

              {item.time && (
                <div className="flex items-center justify-between py-2 border-b border-[#EFEBE9]">
                  <div className="flex items-center gap-2 text-xs font-bold text-warmBrown-subtle">
                    <Clock className="w-4 h-4 text-warmBrown-muted" />
                    <span>{t('common.time')}</span>
                  </div>
                  <span className="text-sm font-bold text-warmBrown">{item.time}</span>
                </div>
              )}

              <div className="flex items-center justify-between py-2 border-b border-[#EFEBE9]">
                <div className="flex items-center gap-2 text-xs font-bold text-warmBrown-subtle">
                  <Tag className="w-4 h-4 text-warmBrown-muted" />
                  <span>{t('addExpense.noteLabel')}</span>
                </div>
                <span className="text-sm font-bold text-warmBrown">{item.note}</span>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2 text-xs font-bold text-warmBrown-subtle">
                  <Mic className="w-4 h-4 text-warmBrown-muted" />
                  <span>{t('addExpense.source')}</span>
                </div>
                <span className="text-xs font-bold text-warmBrown bg-cream px-2.5 py-1 rounded-full">
                  {item.isVoice ? `🎙️ ${t('addExpense.tabVoice')}` : `✍️ ${t('addExpense.tabManual')}`}
                </span>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-2">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => setIsEditing(true)}
                icon={<Edit2 className="w-4 h-4" />}
                className="flex-1"
              >
                {t('common.edit')}
              </Button>

              <Button
                variant="danger"
                size="lg"
                onClick={() => setShowDeleteConfirm(true)}
                icon={<Trash2 className="w-4 h-4" />}
                className="flex-1"
              >
                {t('common.delete')}
              </Button>
            </div>
          </>
        ) : (
          /* EDIT MODE */
          <div className="flex flex-col gap-4">
            <Card variant="surface">
              <span className="text-xs font-bold text-warmBrown-subtle uppercase tracking-wider block mb-2">
                {t('addExpense.amountLabel')}
              </span>
              <AmountInput value={editAmount} onChange={setEditAmount} />
            </Card>

            <Card variant="surface">
              <span className="text-xs font-bold text-warmBrown-subtle uppercase tracking-wider block mb-3">
                {t('addExpense.selectCategory')}
              </span>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <CategoryChip
                    key={cat}
                    category={cat}
                    isSelected={editCategory === cat}
                    onClick={() => setEditCategory(cat)}
                  />
                ))}
              </div>
            </Card>

            <Card variant="surface">
              <label htmlFor="edit-note" className="text-xs font-bold text-warmBrown-subtle uppercase tracking-wider block mb-2">
                {t('addExpense.noteLabel')}
              </label>
              <input
                id="edit-note"
                type="text"
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#EFEBE9] focus:border-kumkum focus:outline-none text-warmBrown font-medium text-sm"
              />
            </Card>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => setIsEditing(false)}
                icon={<X className="w-4 h-4" />}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={handleSaveEdit}
                icon={<Check className="w-5 h-5" />}
                className="flex-1"
              >
                {t('common.save')}
              </Button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-warm-lg flex flex-col items-center text-center gap-3 animate-scale-up">
              <Mascot mood="alert" size={80} />
              <h3 className="text-lg font-black text-warmBrown">{t('expensesList.deleteConfirm')}</h3>
              <p className="text-xs font-semibold text-warmBrown-muted">
                {item.note} • {formatRupee(item.amount)}
              </p>
              <div className="flex gap-3 w-full mt-2">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  variant="danger"
                  size="md"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    handleDelete();
                  }}
                  className="flex-1"
                >
                  {t('common.delete')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
