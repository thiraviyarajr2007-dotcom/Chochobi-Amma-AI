import React from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useI18n } from '../i18n/i18nContext';

interface BigMicButtonProps {
  isListening?: boolean;
  onClick: () => void;
  label?: string;
  hint?: string;
  className?: string;
}

export const BigMicButton: React.FC<BigMicButtonProps> = ({
  isListening = false,
  onClick,
  label,
  hint,
  className = '',
}) => {
  const { t } = useI18n();

  const buttonText = label || (isListening ? t('addExpense.listening') : t('home.speakToAdd'));
  const subHint = hint || t('home.speakHint');

  return (
    <div className={`flex flex-col items-center justify-center gap-2.5 w-full ${className}`}>
      <button
        type="button"
        onClick={onClick}
        aria-label={buttonText}
        aria-pressed={isListening}
        className={`group relative w-full min-h-[64px] py-4 px-6 rounded-3xl flex items-center justify-center gap-4 transition-all duration-300 active:scale-[0.98] select-none shadow-warm-md focus:outline-none focus:ring-4 ${
          isListening
            ? 'bg-gradient-to-r from-red-600 to-kumkum text-white ring-4 ring-red-300 animate-pulse-subtle'
            : 'bg-gradient-to-r from-kumkum to-kumkum-dark hover:from-kumkum-dark hover:to-[#700B41] text-white focus:ring-kumkum/40 border border-kumkum-dark/30'
        }`}
      >
        {/* Animated Sound Wave Rings when listening */}
        {isListening && (
          <div className="absolute inset-0 rounded-3xl pointer-events-none overflow-hidden flex items-center justify-center">
            <span className="absolute w-full h-full rounded-3xl border-2 border-white/40 animate-ping opacity-60" />
            <span className="absolute w-4/5 h-4/5 rounded-3xl border border-turmeric/50 animate-pulse opacity-75" />
          </div>
        )}

        {/* Big Mic Icon */}
        <div
          className={`flex items-center justify-center w-12 h-12 rounded-2xl transition-transform ${
            isListening
              ? 'bg-white text-kumkum scale-110 shadow-lg'
              : 'bg-white/20 text-white group-hover:scale-105'
          }`}
        >
          {isListening ? (
            <MicOff className="w-7 h-7 animate-bounce" />
          ) : (
            <Mic className="w-7 h-7" />
          )}
        </div>

        {/* Label & Active State */}
        <div className="flex flex-col items-start text-left">
          <span className="text-xl font-bold tracking-wide flex items-center gap-2">
            {buttonText}
            {isListening && (
              <span className="inline-block w-2.5 h-2.5 bg-yellow-300 rounded-full animate-ping" />
            )}
          </span>
          <span className="text-sm font-medium text-white/90">
            {isListening ? t('addExpense.listening') : subHint}
          </span>
        </div>
      </button>
    </div>
  );
};

