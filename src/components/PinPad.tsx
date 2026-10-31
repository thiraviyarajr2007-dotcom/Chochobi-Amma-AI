import React, { useState } from 'react';
import { Delete, Fingerprint } from 'lucide-react';
import { useI18n } from '../i18n/i18nContext';

interface PinPadProps {
  pinLength?: number;
  onComplete: (pin: string) => void;
  onBiometricClick?: () => void;
  isError?: boolean;
  errorMessage?: string;
}

export const PinPad: React.FC<PinPadProps> = ({
  pinLength = 4,
  onComplete,
  onBiometricClick,
  isError = false,
  errorMessage,
}) => {
  const { t } = useI18n();
  const [pin, setPin] = useState<string>('');

  const handleKeyPress = (num: string) => {
    if (pin.length < pinLength) {
      const nextPin = pin + num;
      setPin(nextPin);
      if (nextPin.length === pinLength) {
        onComplete(nextPin);
        // Clear pin after a brief delay if needed
        setTimeout(() => setPin(''), 600);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'bio', '0', 'back'];

  return (
    <div className="flex flex-col items-center w-full max-w-[340px] mx-auto select-none">
      {/* 4 Dots PIN Display */}
      <div
        className={`flex items-center justify-center gap-5 my-6 ${
          isError ? 'animate-shake' : ''
        }`}
        aria-live="polite"
      >
        {Array.from({ length: pinLength }).map((_, idx) => {
          const isFilled = idx < pin.length;
          return (
            <div
              key={idx}
              className={`w-6 h-6 rounded-full transition-all duration-200 border-2 ${
                isError
                  ? 'border-red-500 bg-red-100'
                  : isFilled
                  ? 'border-kumkum bg-kumkum scale-110 shadow-kumkum-glow/40'
                  : 'border-[#D7CCC8] bg-white'
              }`}
            />
          );
        })}
      </div>

      {/* Error Message */}
      {isError && errorMessage && (
        <p className="text-sm font-bold text-danger mb-4 animate-fade-in text-center px-4">
          {errorMessage}
        </p>
      )}

      {/* 3x4 Big Keypad Grid */}
      <div className="grid grid-cols-3 gap-3.5 w-full">
        {keys.map((key, index) => {
          if (key === 'bio') {
            return (
              <button
                key={index}
                type="button"
                onClick={onBiometricClick}
                className="h-16 rounded-3xl bg-white border border-[#EFEBE9] hover:bg-turmeric-light active:scale-95 flex flex-col items-center justify-center text-turmeric-dark shadow-warm-sm transition-all focus:outline-none focus:ring-2 focus:ring-turmeric"
                aria-label={t('lock.useFingerprint')}
              >
                <Fingerprint className="w-7 h-7" />
                <span className="text-[10px] font-bold mt-0.5 text-warmBrown-muted">
                  {t('lock.touchSensor')}
                </span>
              </button>
            );
          }

          if (key === 'back') {
            return (
              <button
                key={index}
                type="button"
                onClick={handleBackspace}
                className="h-16 rounded-3xl bg-white border border-[#EFEBE9] hover:bg-red-50 active:scale-95 flex items-center justify-center text-warmBrown-muted hover:text-danger shadow-warm-sm transition-all focus:outline-none focus:ring-2 focus:ring-kumkum/20"
                aria-label={t('common.delete')}
              >
                <Delete className="w-7 h-7" />
              </button>
            );
          }

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleKeyPress(key)}
              className="h-16 rounded-3xl bg-white border border-[#EFEBE9] hover:border-kumkum hover:bg-kumkum-50 active:scale-95 flex items-center justify-center text-2xl font-extrabold text-warmBrown shadow-warm-sm transition-all focus:outline-none focus:ring-4 focus:ring-kumkum/20"
            >
              {key}
            </button>
          );
        })}
      </div>
    </div>
  );
};

