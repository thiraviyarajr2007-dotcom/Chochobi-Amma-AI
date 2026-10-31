import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  PhoneCall,
  Clipboard,
  Camera,
  Share2,
  Check,
  AlertOctagon,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { useI18n } from '../i18n/i18nContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Mascot } from '../components/Mascot';
import { TopBar } from '../components/TopBar';
import { useToast } from '../components/Toast';
import { checkScamApi } from '../lib/apiClient';
import { compressImageClientSide } from '../lib/imageCompressor';
import { ScamResult, MascotMood } from '../types';

export const ScamShieldPage: React.FC = () => {
  const { t, lang } = useI18n();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [messageText, setMessageText] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<ScamResult | null>(null);
  const [mascotMood, setMascotMood] = useState<MascotMood>('happy');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const sampleScams = [
    {
      id: 'eb_bill',
      title: lang === 'ta' ? 'TNEB மின்சார மிரட்டல்' : 'Electricity Cutoff Threat',
      text: t('scamShield.sample1'),
    },
    {
      id: 'google_pay',
      title: lang === 'ta' ? 'கூகுள் பே பரிசு பணம்' : 'UPI Lottery Reward',
      text: t('scamShield.sample2'),
    },
    {
      id: 'gas_subsidy',
      title: lang === 'ta' ? 'கேஸ் சிலிண்டர் மானியம்' : 'Gas Subsidy Link',
      text: t('scamShield.sample3'),
    },
    {
      id: 'safe',
      title: lang === 'ta' ? 'பாதுகாப்பான மெசேஜ்' : 'Safe Bank Message',
      text: 'Dear customer, your bank account ending 4092 has been credited with Rs 12,000 for salary. Available balance Rs 24,150. - State Bank of India',
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
        showToast(lang === 'ta' ? 'செய்தி ஒட்டப்பட்டது' : 'Message pasted', 'info');
      }
    } catch {
      setMessageText(t('scamShield.sample1'));
    }
  };

  const handleUploadScreenshot = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showToast(lang === 'ta' ? 'ஸ்கிரீன்ஷாட் படம் வாசிக்கப்படுகிறது...' : 'Analyzing screenshot...', 'info');
      const { base64 } = await compressImageClientSide(file, 1280, 0.8);
      await handleCheck(messageText || 'Check attached screenshot for fraud', base64);
    } catch {
      showToast(t('common.error'), 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleShareWarning = async () => {
    if (!result) return;
    const explanationText = t(result.explanationKey) || (result.reasons && result.reasons[0]) || '';
    const shareText = `🚨 ${t('scamShield.title')} 🚨\n` +
      `${lang === 'ta' ? 'முடிவு' : 'Verdict'}: ${result.status === 'scam' ? 'மோசடி / SCAM ❌' : 'சந்தேகத்திற்குரியது / SUSPICIOUS ⚠️'}\n` +
      `${explanationText}\n\n` +
      `🛡️ ${lang === 'ta' ? 'எச்சரிக்கை: OTP அல்லது பணத்தை அனுப்பாதீர்கள்!' : 'Warning: Never share OTP or send money!'}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Chocobi Amma AI Scam Warning',
          text: shareText,
        });
        showToast(lang === 'ta' ? 'பகிர்வு முடிந்தது' : 'Shared successfully', 'success');
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      showToast(lang === 'ta' ? 'எச்சரிக்கை நகலெடுக்கப்பட்டது (குடும்பத்துடன் பகிரவும்)' : 'Warning copied to clipboard!', 'success');
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8EC] flex flex-col">
      <TopBar
        title={t('scamShield.title')}
        subtitle={t('scamShield.subtitle')}
        showBack={true}
        onBack={() => navigate('/home')}
      />

      <div className="flex-1 pb-28 pt-2 px-4 flex flex-col gap-5 max-w-[440px] mx-auto w-full select-none">
        {/* Large labelled back button */}
        <button
          onClick={() => navigate('/home')}
          className="self-start flex items-center gap-2 text-sm font-bold text-warmBrown hover:text-kumkum px-2 py-1 rounded-xl transition-colors"
          aria-label={t('common.back')}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('common.back')}</span>
        </button>

        {/* Hidden file input for screenshot */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleUploadScreenshot}
        />

        {/* Message Input Box */}
        <Card variant="surface" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label htmlFor="scam-message-input" className="text-xs font-bold text-warmBrown-subtle uppercase tracking-wider">
              {t('scamShield.inputPlaceholder')}
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePaste}
                className="text-xs font-bold text-kumkum flex items-center gap-1 hover:underline"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>{t('scamShield.pasteButton')}</span>
              </button>
            </div>
          </div>

          <textarea
            id="scam-message-input"
            rows={4}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder={t('scamShield.inputPlaceholder')}
            className="w-full p-3.5 rounded-2xl bg-cream border border-[#EFEBE9] focus:border-kumkum focus:outline-none text-warmBrown text-sm font-medium resize-none"
          />

          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="primary"
              size="lg"
              onClick={() => handleCheck()}
              disabled={isChecking || !messageText.trim()}
              className="flex-1"
              icon={isChecking ? <Sparkles className="w-5 h-5 animate-spin" /> : <ShieldAlert className="w-5 h-5" />}
            >
              {isChecking ? t('scamShield.checking') : t('scamShield.checkButton')}
            </Button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title={t('scamShield.uploadScreenshot')}
              className="h-14 px-4 rounded-2xl bg-white border border-[#EFEBE9] text-warmBrown hover:bg-cream active:scale-95 transition-transform flex items-center justify-center shadow-warm-sm"
              aria-label={t('scamShield.uploadScreenshot')}
            >
              <Camera className="w-5 h-5 text-warmBrown-muted" />
            </button>
          </div>
        </Card>

        {/* RESULT CARD */}
        {result && (
          <div
            className={`p-5 rounded-3xl border-2 flex flex-col gap-4 shadow-warm-md animate-fade-in ${
              result.status === 'scam'
                ? 'bg-red-50 border-danger ring-4 ring-danger/10'
                : result.status === 'suspicious'
                ? 'bg-amber-50 border-turmeric-dark ring-4 ring-turmeric/10'
                : 'bg-leafGreen-light/50 border-leafGreen ring-4 ring-leafGreen/10'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${
                    result.status === 'scam'
                      ? 'bg-danger'
                      : result.status === 'suspicious'
                      ? 'bg-amber-600'
                      : 'bg-leafGreen'
                  }`}
                >
                  {result.status === 'scam' ? (
                    <AlertOctagon className="w-7 h-7" />
                  ) : result.status === 'suspicious' ? (
                    <AlertTriangle className="w-7 h-7" />
                  ) : (
                    <ShieldCheck className="w-7 h-7" />
                  )}
                </div>

                <div>
                  <h3
                    className={`text-lg font-black tracking-tight ${
                      result.status === 'scam'
                        ? 'text-danger'
                        : result.status === 'suspicious'
                        ? 'text-amber-900'
                        : 'text-leafGreen'
                    }`}
                  >
                    {result.status === 'scam'
                      ? t('scamShield.resultScam')
                      : result.status === 'suspicious'
                      ? t('scamShield.resultSuspicious')
                      : t('scamShield.resultSafe')}
                  </h3>
                  <span className="text-xs font-semibold text-warmBrown-muted">
                    {lang === 'ta' ? 'அம்மா AI ஆய்வு அறிக்கை' : 'Amma AI Safety Verdict'}
                  </span>
                </div>
              </div>

              <Mascot mood={mascotMood} size={50} />
            </div>

            {/* Simple Explanation */}
            <p className="text-sm font-bold text-warmBrown leading-relaxed bg-white/70 p-3 rounded-2xl border border-black/5">
              {t(result.explanationKey) || (result.reasons && result.reasons[0])}
            </p>

            {/* Reasons / Red Flags */}
            {result.reasons && result.reasons.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-black text-warmBrown uppercase tracking-wider">
                  ⚠️ {lang === 'ta' ? 'முக்கிய காரணங்கள்:' : 'Key Reasons:'}
                </span>
                <ul className="list-disc list-inside text-xs font-semibold text-warmBrown-muted space-y-1">
                  {result.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Critical Actions Advice */}
            {result.status !== 'safe' && (
              <div className="bg-white rounded-2xl p-3.5 border border-[#EFEBE9] flex flex-col gap-2">
                <span className="text-xs font-extrabold text-danger">
                  🛑 {t('scamShield.criticalRule')}
                </span>
                <div className="flex flex-col gap-1 text-xs text-warmBrown font-medium">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-danger flex-shrink-0" />
                    <span>{t('scamShield.ruleNoOtp')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-danger flex-shrink-0" />
                    <span>{t('scamShield.ruleNoUpiPin')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-danger flex-shrink-0" />
                    <span>{t('scamShield.ruleNoLinks')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Share Warning Button */}
            <Button
              variant="secondary"
              size="md"
              onClick={handleShareWarning}
              icon={<Share2 className="w-4 h-4" />}
            >
              {t('scamShield.shareWarning')}
            </Button>
          </div>
        )}

        {/* Real Sample Scams to Try */}
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-bold text-warmBrown uppercase tracking-wider">
            {t('scamShield.sampleTitle')}
          </span>
          <div className="grid grid-cols-2 gap-2">
            {sampleScams.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSelectSample(s)}
                className="p-3 rounded-2xl bg-white border border-[#EFEBE9] hover:border-kumkum/40 text-left text-xs font-bold text-warmBrown shadow-warm-sm active:scale-95 transition-all line-clamp-1"
              >
                {s.title}
              </button>
            ))}
          </div>
        </div>

        {/* Cyber Crime National Helpline Card */}
        <div className="p-4 rounded-3xl bg-cream-dark border border-turmeric/40 flex items-center justify-between gap-3 shadow-warm-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-turmeric flex items-center justify-center text-warmBrown font-bold">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-warmBrown block">
                {t('scamShield.helplineTitle')}
              </span>
              <span className="text-base font-black text-kumkum">1930</span>
            </div>
          </div>
          <a
            href="tel:1930"
            className="px-4 py-2 rounded-xl bg-kumkum text-white text-xs font-bold shadow-warm-sm"
          >
            {t('scamShield.callNow')}
          </a>
        </div>
      </div>
    </div>
  );
};
