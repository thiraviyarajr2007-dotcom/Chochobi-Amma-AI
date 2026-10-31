import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { useI18n } from '../i18n/i18nContext';

export const OfflineBanner: React.FC = () => {
  const { t } = useI18n();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-turmeric-dark text-warmBrown px-4 py-2 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-warm-sm border-b border-turmeric sticky top-0 z-50 animate-fade-in"
    >
      <WifiOff className="w-4 h-4 text-warmBrown" />
      <span>{t('offlineBanner')}</span>
    </div>
  );
};

