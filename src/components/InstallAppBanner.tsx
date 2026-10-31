import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { useI18n } from '../i18n/i18nContext';
import { Card } from './Card';

export const InstallAppBanner: React.FC = () => {
  const { t } = useI18n();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  if (!deferredPrompt || isDismissed) return null;

  return (
    <Card variant="warmGold" className="border-turmeric-300 relative animate-fade-in my-1">
      <button
        onClick={() => setIsDismissed(true)}
        className="absolute top-3 right-3 p-1 rounded-full text-warmBrown-subtle hover:bg-black/5"
        aria-label={t('installApp.dismiss')}
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div className="w-10 h-10 rounded-2xl bg-turmeric flex items-center justify-center text-warmBrown flex-shrink-0 shadow-warm-sm">
          <Download className="w-5 h-5 text-warmBrown" />
        </div>
        <div className="flex flex-col">
          <h4 className="text-sm font-extrabold text-warmBrown">
            {t('installApp.title')}
          </h4>
          <p className="text-xs font-semibold text-warmBrown-muted mt-0.5 leading-relaxed">
            {t('installApp.desc')}
          </p>

          <button
            type="button"
            onClick={handleInstallClick}
            className="mt-2.5 px-4 py-2 rounded-xl bg-kumkum text-white font-bold text-xs w-fit shadow-warm-sm active:scale-95 transition-all"
          >
            {t('installApp.installBtn')}
          </button>
        </div>
      </div>
    </Card>
  );
};

