import React from 'react';
import { Delete, Plus } from 'lucide-react';
import { useI18n } from '../i18n/i18nContext';

interface AmountInputProps {
  value: number | string;
  onChange: (val: number) => void;
  quickAmounts?: number[];
  label?: string;
}

export const AmountInput: React.FC<AmountInputProps> = ({
  value,
  onChange,
  quickAmounts = [50, 100, 200, 500, 1000, 2000],
  label,
}) => {
  const { t } = useI18n();
  const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;

  const handleQuickAdd = (amount: number) => {
    onChange(numValue + amount);
  };

  const handleDirectInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    onChange(raw ? parseInt(raw, 10) : 0);
  };

  const handleClear = () => {
    onChange(0);
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {label && (
        <label className="text-base font-bold text-warmBrown flex items-center justify-between">
          <span>{label}</span>
          {numValue > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-semibold text-kumkum flex items-center gap-1 hover:underline active:scale-95"
            >
              <Delete className="w-3.5 h-3.5" />
              <span>{t('common.clear')}</span>
            </button>
          )}
        </label>
      )}

      {/* Main Large Display Input Container */}
      <div className="relative flex items-center bg-white rounded-3xl border-2 border-turmeric shadow-warm-sm px-5 py-4 focus-within:border-kumkum focus-within:ring-4 focus-within:ring-kumkum/20 transition-all">
        <span className="text-3xl sm:text-4xl font-extrabold text-kumkum mr-2 select-none">
          ₹
        </span>
        <input
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          value={numValue === 0 ? '' : numValue}
          onChange={handleDirectInput}
          placeholder="0"
          className="w-full text-3xl sm:text-4xl font-extrabold text-warmBrown placeholder-warmBrown-light outline-none bg-transparent"
          aria-label={label || t('addExpense.amountLabel')}
        />
        {numValue > 0 && (
          <span className="text-xs bg-turmeric-light text-warmBrown font-bold px-2 py-1 rounded-full border border-turmeric">
            INR
          </span>
        )}
      </div>

      {/* Quick Amount Suggestion Chips */}
      <div className="flex flex-col gap-1.5 mt-1">
        <span className="text-xs font-semibold text-warmBrown-subtle">
          {t('addExpense.quickAmounts')}
        </span>
        <div className="flex flex-wrap gap-2">
          {quickAmounts.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => handleQuickAdd(amt)}
              className="min-h-[44px] px-3.5 py-1.5 rounded-2xl bg-white border border-[#EFEBE9] hover:border-turmeric hover:bg-turmeric-light text-warmBrown font-bold text-sm shadow-warm-sm active:scale-95 flex items-center gap-1 transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-kumkum" />
              <span>₹{amt}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

