import React from 'react';
import { ExpenseCategory } from '../types';
import { CATEGORY_META } from '../theme/tokens';
import { useI18n } from '../i18n/i18nContext';

interface CategoryChipProps {
  category: ExpenseCategory;
  isSelected?: boolean;
  onClick?: () => void;
  showEmojiOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const CategoryChip: React.FC<CategoryChipProps> = ({
  category,
  isSelected = false,
  onClick,
  showEmojiOnly = false,
  size = 'md',
}) => {
  const { t } = useI18n();
  const meta = CATEGORY_META[category] || CATEGORY_META.other;
  const label = t(meta.labelKey);

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs gap-1.5 min-h-[36px]',
    md: 'px-4 py-2.5 text-sm sm:text-base gap-2 min-h-[48px]',
    lg: 'px-5 py-3 text-base sm:text-lg gap-2.5 min-h-[56px]',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl font-bold flex items-center justify-center transition-all select-none touch-manipulation active:scale-95 border ${
        sizeClasses[size]
      } ${
        isSelected
          ? 'bg-kumkum text-white border-kumkum shadow-warm-md scale-[1.03] ring-2 ring-kumkum/30'
          : 'bg-white hover:bg-cream-dark text-warmBrown border-[#EFEBE9] shadow-warm-sm'
      }`}
      aria-pressed={isSelected}
    >
      <span className="text-xl sm:text-2xl leading-none">{meta.emoji}</span>
      {!showEmojiOnly && (
        <span className="leading-tight whitespace-nowrap">{label}</span>
      )}
    </button>
  );
};

