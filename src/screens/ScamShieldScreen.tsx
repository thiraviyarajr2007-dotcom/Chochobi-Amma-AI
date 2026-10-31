import React, { useState, useRef } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  PhoneCall,
  Clipboard,
  Camera,
  Check,
  AlertOctagon,
  Sparkles,
} from 'lucide-react';
import { useI18n } from '../i18n/i18nContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Mascot } from '../components/Mascot';
import { useToast } from '../components/Toast';
import { checkScamApi } from '../lib/apiClient';
import { compressImageClientSide } from '../lib/imageCompressor';
import { ScamResult, MascotMood } from '../types';

export const ScamShieldScreen: React.FC = () => {
  const { t, lang } = useI18n();
  const { showToast } = useToast();

  const [messageText, setMessageText] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<ScamResult | null>(null);
  const [mascotMood, setMascotMood] = useState<MascotMood>('happy');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const sampleScams = [
    {
      id: 'eb_bill',
      title: 'TNEB மின்சார மிரட்டல்',
      text: t('scamShield.sample1'),
    },
    {
      id: 'google_pay',
      title: 'கூகுள் பே பரிசு பணம்',
      text: t('scamShield.sample2'),
    },
    {
      id: 'gas_subsidy',
      title: 'கேஸ் சிலிண்டர் மானியம்',
      text: t('scamShield.sample3'),
    },
    {
      id: 'safe',
      title: 'பாதுகாப்பான மெசேஜ்',
      text: 'Dear customer, your bank balance is ₹14,250 as of today. Thank you for banking with us.',
    },
  ];

  const handleSelectSample = (sample: (typeof sampleScams)[0]) => {
    setMessageText(sample.text);
    setResult(null);
    setMascotMood('thinking');
  };

  const handleCheck = async (textToCheck = messageText, imageBase64?: string) => {
    if (!textToCheck.trim() && !imageBase64) {
      showToast(t('scamShield.instructions'), 'warning');
      return;
    }

    setIsChecking(true);
    setMascotMood('thinking');

    try {
      const res = await checkScamApi(textToCheck, imageBase64, lang);
      setResult(res);

      if (res.status === 'scam') {
        setMascotMood('alert');
        showToast(t('scamShield.resultScam'), 'error');
      } else if (res.status === 'suspicious') {
        setMascotMood('alert');
        showToast(t('scamShield.resultSuspicious'), 'warning');
      } else {
        setMascotMood('happy');
        showToast(t('scamShield.resultSafe'), 'success');
      }
    } catch {
      showToast(t('common.error'), 'error');
      setMascotMood('happy');
    } finally {
      setIsChecking(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setMessageText(text);
        showToast('செய்தி ஒட்டப்பட்டது', 'info');
      }
    } catch {
      setMessageText(t('scamShield.sample1'));
    }
  };

  const handleUploadScreenshot = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showToast('ஸ்கிரீன்ஷாட் படம் வாசிக்கப்படுகிறது...', 'info');
      const { base64 } = await compressImageClientSide(file, 1280, 0.8);
      await handleCheck(messageText || 'Check attached screenshot for fraud', base64);
    } catch {
      showToast('படம் ஏற்றுவதில் பிழை', 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="pb-28 pt-2 px-4 flex flex-col gap-5 max-w-[440px] mx-auto select-none">
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-warmBrown tracking-tight">
            {t('scamShield.title')}
          </h2>
          <p className="text-xs sm:text-sm text-warmBrown-subtle font-medium mt-0.5">
            {t('scamShield.subtitle')}
          </p>
        </div>
        <Mascot mood={mascotMood} size={56} />
      </div>

      {/* Hidden file input for screenshot */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleUploadScreenshot}
        className="hidden"
      />

      {/* Input Message Card */}
      <Card variant="surface" className="flex flex-col gap-3 border-kumkum/20">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-warmBrown">
            {t('scamShield.instructions')}
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePaste}
              className="text-xs font-bold text-kumkum flex items-center gap-1 hover:underline active:scale-95"
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span>Paste</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-bold text-turmeric-dark flex items-center gap-1 hover:underline active:scale-95"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Screenshot</span>
            </button>
          </div>
        </div>

        <textarea
          rows={3}
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder={t('scamShield.placeholder')}
          className="w-full p-3.5 rounded-2xl bg-cream border border-[#EFEBE9] text-sm font-semibold text-warmBrown placeholder-warmBrown-light focus:outline-none focus:ring-2 focus:ring-kumkum/30 resize-none shadow-inner"
        />

        <Button
          variant="primary"
          onClick={() => handleCheck()}
          loading={isChecking}
          icon={<ShieldAlert className="w-5 h-5" />}
        >
          {t('scamShield.checkButton')}
        </Button>
      </Card>

      {/* Sample Scam Chips */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold text-warmBrown-subtle">
          {t('scamShield.sampleHeader')}
        </span>
        <div className="flex flex-wrap gap-2">
          {sampleScams.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => handleSelectSample(sample)}
              className="px-3 py-1.5 rounded-2xl bg-white border border-[#EFEBE9] hover:border-turmeric hover:bg-turmeric-light text-xs font-bold text-warmBrown shadow-warm-sm active:scale-95 transition-all text-left"
            >
              ⚡ {sample.title}
            </button>
          ))}
        </div>
      </div>

      {/* Result Card: Safe vs Suspicious vs Scam */}
      {result && (
        <Card
          variant={
            result.status === 'scam'
              ? 'danger'
              : result.status === 'suspicious'
              ? 'warmGold'
              : 'surface'
          }
          className={`border-2 animate-fade-in ${
            result.status === 'scam'
              ? 'border-red-500 bg-red-50'
              : result.status === 'suspicious'
              ? 'border-turmeric bg-turmeric-50'
              : 'border-leafGreen bg-leafGreen-light/30'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                result.status === 'scam'
                  ? 'bg-red-600 text-white'
                  : result.status === 'suspicious'
                  ? 'bg-turmeric text-warmBrown'
                  : 'bg-leafGreen text-white'
              }`}
            >
              {result.status === 'scam' ? (
                <ShieldAlert className="w-7 h-7" />
              ) : result.status === 'suspicious' ? (
                <AlertTriangle className="w-7 h-7" />
              ) : (
                <ShieldCheck className="w-7 h-7" />
              )}
            </div>

            <div className="flex flex-col">
              <span
                className={`text-lg sm:text-xl font-black leading-tight ${
                  result.status === 'scam'
                    ? 'text-red-700'
                    : result.status === 'suspicious'
                    ? 'text-amber-900'
                    : 'text-leafGreen'
                }`}
              >
                {t(result.titleKey)}
              </span>
              <p className="text-xs sm:text-sm font-bold text-warmBrown mt-1 leading-relaxed">
                {t(result.explanationKey)}
              </p>
            </div>
          </div>

          {/* Critical Warning Callout if Scam */}
          {result.status === 'scam' && (
            <div className="mt-3.5 p-3 rounded-2xl bg-red-600 text-white flex items-center gap-2.5 font-black text-xs shadow-warm-md">
              <AlertOctagon className="w-5 h-5 flex-shrink-0" />
              <span>எக்காரணத்தைக் கொண்டும் லிங்கைத் தொடாதீர்கள்! OTP பகிராதீர்கள்!</span>
            </div>
          )}

          {/* Actionable Warning & Guidance Points */}
          <div className="mt-4 pt-3 border-t border-black/10 flex flex-col gap-1.5">
            {result.warningPoints.map((pt, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs font-bold text-warmBrown">
                <span className="text-kumkum font-black">•</span>
                <span className="leading-relaxed">{pt}</span>
              </div>
            ))}
          </div>

          {/* Cyber Helpline callout if scam */}
          {result.status === 'scam' && (
            <div className="mt-4 p-3 rounded-2xl bg-white border border-red-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-red-600" />
                <span className="text-xs font-bold text-red-700">
                  {t('scamShield.callCyberHelpline')}
                </span>
              </div>
              <a
                href="tel:1930"
                className="px-3.5 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold active:scale-95 shadow-sm"
              >
                Call 1930
              </a>
            </div>
          )}
        </Card>
      )}

      {/* Static 3 Golden Safety Rules for Moms */}
      <Card variant="cream" className="border-turmeric/40">
        <h3 className="text-sm font-bold text-warmBrown flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-turmeric-dark" />
          <span>{t('scamShield.safetyTipsTitle')}</span>
        </h3>

        <div className="flex flex-col gap-2.5">
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-turmeric flex items-center justify-center text-xs font-bold text-warmBrown flex-shrink-0">
              1
            </span>
            <p className="text-xs sm:text-sm font-semibold text-warmBrown-muted leading-relaxed">
              {t('scamShield.tip1')}
            </p>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-turmeric flex items-center justify-center text-xs font-bold text-warmBrown flex-shrink-0">
              2
            </span>
            <p className="text-xs sm:text-sm font-semibold text-warmBrown-muted leading-relaxed">
              {t('scamShield.tip2')}
            </p>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-turmeric flex items-center justify-center text-xs font-bold text-warmBrown flex-shrink-0">
              3
            </span>
            <p className="text-xs sm:text-sm font-semibold text-warmBrown-muted leading-relaxed">
              {t('scamShield.tip3')}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
