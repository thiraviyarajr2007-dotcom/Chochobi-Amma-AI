import React from 'react';
import { Check, ShieldCheck, Sparkles } from 'lucide-react';
import { useI18n } from '../i18n/i18nContext';
import { Mascot } from '../components/Mascot';
import { KolamMotif } from '../components/KolamMotif';
import { Button } from '../components/Button';
import { Language } from '../types';

interface SplashScreenProps {
  onContinue: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onContinue }) => {
  const { lang, setLang, t } = useI18n();

  const handleSelectLang = (selected: Language) => {
    setLang(selected);
  };

  return (
    <div className="min-h-screen bg-[#FFF8EC] flex flex-col justify-between p-5 relative overflow-hidden select-none">
      {/* Kolam Decorative Accents */}
      <div className="absolute -top-10 -right-10 pointer-events-none opacity-20">
        <KolamMotif size={180} color="#C2185B" />
      </div>
      <div className="absolute top-1/2 -left-12 pointer-events-none opacity-15">
        <KolamMotif size={160} color="#FFB300" />
      </div>

      {/* Top Branding Section */}
      <div className="flex flex-col items-center text-center pt-8 pb-4 z-10">
        <div className="relative mb-3">
          <Mascot mood="happy" size={140} />
          <span className="absolute -bottom-1 -right-1 bg-turmeric text-warmBrown text-xs font-bold px-2.5 py-1 rounded-full shadow-warm-sm border border-white">
            100% இலவசம்
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-kumkum tracking-tight leading-tight mt-1">
          {t('app.name')}
        </h1>
        <p className="text-base sm:text-lg font-semibold text-warmBrown-muted mt-2 max-w-xs">
          {t('splash.welcome')}
        </p>
      </div>

      {/* Middle: Language Picker Cards (Tamil & English) */}
      <div className="flex flex-col gap-3.5 my-auto z-10 w-full max-w-[380px] mx-auto">
        <span className="text-sm sm:text-base font-bold text-warmBrown text-center">
          {t('splash.chooseLang')}
        </span>

        {/* Tamil Big Card */}
        <button
          type="button"
          onClick={() => handleSelectLang('ta')}
          className={`p-4 sm:p-5 rounded-3xl border-2 transition-all flex items-center justify-between text-left shadow-warm-sm active:scale-[0.99] ${
            lang === 'ta'
              ? 'bg-white border-kumkum ring-4 ring-kumkum/20 shadow-warm-md'
              : 'bg-white/80 border-[#EFEBE9] hover:border-kumkum/40'
          }`}
          aria-pressed={lang === 'ta'}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-kumkum-100 flex items-center justify-center text-2xl font-bold text-kumkum">
              த
            </div>
            <div>
              <div className="text-xl font-extrabold text-warmBrown">
                {t('splash.langTamil')}
              </div>
              <div className="text-xs sm:text-sm text-warmBrown-subtle font-medium">
                {t('splash.langTamilDesc')}
              </div>
            </div>
          </div>
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center border-2 ${
              lang === 'ta'
                ? 'bg-kumkum border-kumkum text-white'
                : 'border-[#D7CCC8] bg-transparent'
            }`}
          >
            {lang === 'ta' && <Check className="w-4 h-4 stroke-[3]" />}
          </div>
        </button>

        {/* English Big Card */}
        <button
          type="button"
          onClick={() => handleSelectLang('en')}
          className={`p-4 sm:p-5 rounded-3xl border-2 transition-all flex items-center justify-between text-left shadow-warm-sm active:scale-[0.99] ${
            lang === 'en'
              ? 'bg-white border-kumkum ring-4 ring-kumkum/20 shadow-warm-md'
              : 'bg-white/80 border-[#EFEBE9] hover:border-kumkum/40'
          }`}
          aria-pressed={lang === 'en'}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-turmeric-100 flex items-center justify-center text-2xl font-bold text-turmeric-dark">
              En
            </div>
            <div>
              <div className="text-xl font-extrabold text-warmBrown">
                {t('splash.langEnglish')}
              </div>
              <div className="text-xs sm:text-sm text-warmBrown-subtle font-medium">
                {t('splash.langEnglishDesc')}
              </div>
            </div>
          </div>
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center border-2 ${
              lang === 'en'
                ? 'bg-kumkum border-kumkum text-white'
                : 'border-[#D7CCC8] bg-transparent'
            }`}
          >
            {lang === 'en' && <Check className="w-4 h-4 stroke-[3]" />}
          </div>
        </button>

        {/* Safe Tag */}
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-leafGreen mt-2">
          <ShieldCheck className="w-4 h-4" />
          <span>{t('splash.safeTag')}</span>
        </div>
      </div>

      {/* Bottom Action Button */}
      <div className="pt-4 pb-6 z-10 w-full max-w-[380px] mx-auto">
        <Button variant="primary" onClick={onContinue} icon={<Sparkles className="w-5 h-5" />}>
          {t('splash.startBtn')}
        </Button>
      </div>
    </div>
  );
};

