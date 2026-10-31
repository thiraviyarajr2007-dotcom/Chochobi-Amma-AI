import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ShieldCheck, Sparkles, ChevronRight, Mic, ShieldAlert, Target } from 'lucide-react';
import { useI18n } from '../i18n/i18nContext';
import { Mascot } from '../components/Mascot';
import { KolamMotif } from '../components/KolamMotif';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Language } from '../types';

export const WelcomePage: React.FC = () => {
  const { lang, setLang, t } = useI18n();
  const navigate = useNavigate();

  // 0: Language Picker, 1: Tour Step 1 (Voice), 2: Tour Step 2 (Scam Shield), 3: Tour Step 3 (Quest)
  const [step, setStep] = useState<number>(0);

  const handleSelectLang = (selected: Language) => {
    setLang(selected);
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      navigate('/setup-pin');
    }
  };

  const handleSkipTour = () => {
    navigate('/setup-pin');
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

      {/* STEP 0: Language Picker */}
      {step === 0 && (
        <>
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

            {/* Safe & Privacy Tags */}
            <div className="flex flex-col items-center gap-1 mt-2 text-center">
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-leafGreen">
                <ShieldCheck className="w-4 h-4" />
                <span>{t('splash.safeTag')}</span>
              </div>
              <span className="text-[11px] font-bold text-warmBrown-subtle">
                {t('splash.privacyNote')}
              </span>
            </div>
          </div>

          <div className="pt-4 pb-6 z-10 w-full max-w-[380px] mx-auto">
            <Button variant="primary" onClick={handleNext} icon={<Sparkles className="w-5 h-5" />}>
              {t('splash.startBtn')}
            </Button>
          </div>
        </>
      )}

      {/* STEPS 1, 2, 3: Onboarding 3-Card Tour */}
      {step > 0 && (
        <div className="flex-1 flex flex-col justify-between py-6 max-w-[380px] mx-auto w-full z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-warmBrown-subtle">
              {step} / 3
            </span>
            <button
              onClick={handleSkipTour}
              className="text-xs font-bold text-kumkum underline"
            >
              {t('onboarding.skip')}
            </button>
          </div>

          <div className="my-auto flex flex-col items-center text-center animate-fade-in">
            {step === 1 && (
              <>
                <Mascot mood="happy" size={140} />
                <div className="w-16 h-16 rounded-3xl bg-kumkum-100 flex items-center justify-center text-kumkum my-4 shadow-warm-sm">
                  <Mic className="w-9 h-9" />
                </div>
                <h3 className="text-2xl font-black text-warmBrown">
                  {t('onboarding.step1Title')}
                </h3>
                <p className="text-sm font-semibold text-warmBrown-muted mt-2 leading-relaxed">
                  {t('onboarding.step1Desc')}
                </p>
              </>
            )}

            {step === 2 && (
              <>
                <Mascot mood="alert" size={140} />
                <div className="w-16 h-16 rounded-3xl bg-red-100 flex items-center justify-center text-danger my-4 shadow-warm-sm">
                  <ShieldAlert className="w-9 h-9" />
                </div>
                <h3 className="text-2xl font-black text-warmBrown">
                  {t('onboarding.step2Title')}
                </h3>
                <p className="text-sm font-semibold text-warmBrown-muted mt-2 leading-relaxed">
                  {t('onboarding.step2Desc')}
                </p>
              </>
            )}

            {step === 3 && (
              <>
                <Mascot mood="celebrate" size={140} />
                <div className="w-16 h-16 rounded-3xl bg-leafGreen-light flex items-center justify-center text-leafGreen my-4 shadow-warm-sm">
                  <Target className="w-9 h-9" />
                </div>
                <h3 className="text-2xl font-black text-warmBrown">
                  {t('onboarding.step3Title')}
                </h3>
                <p className="text-sm font-semibold text-warmBrown-muted mt-2 leading-relaxed">
                  {t('onboarding.step3Desc')}
                </p>
              </>
            )}

            {/* Stepper Dots */}
            <div className="flex gap-2 mt-6">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-2 rounded-full transition-all ${
                    step === s ? 'w-8 bg-kumkum' : 'w-2 bg-[#D7CCC8]'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="pt-4">
            <Button variant="primary" onClick={handleNext} icon={<ChevronRight className="w-5 h-5" />}>
              {step === 3 ? t('onboarding.finish') : t('onboarding.next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

