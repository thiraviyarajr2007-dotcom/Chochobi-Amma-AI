import React, { useState, useEffect } from 'react';
import {
  Globe,
  Lock,
  Fingerprint,
  Type,
  FileDown,
  Trash2,
  Heart,
  ChevronRight,
  ShieldCheck,
  Check,
  DollarSign,
} from 'lucide-react';
import { useI18n } from '../i18n/i18nContext';
import { Card } from '../components/Card';
import { Mascot } from '../components/Mascot';
import { BottomSheet } from '../components/BottomSheet';
import { PinPad } from '../components/PinPad';
import { Button } from '../components/Button';
import { useToast } from '../components/Toast';
import { db } from '../lib/db';
import {
  verifyPin,
  setupNewPin,
  isBiometricEnabled,
  setBiometricEnabled,
  isWebAuthnSupported,
} from '../lib/security';
import { exportExpensesToCSV } from '../lib/budgetAnalytics';

interface SettingsScreenProps {
  onDataReset?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onDataReset }) => {
  const { lang, setLang, t, formatRupee } = useI18n();
  const { showToast } = useToast();

  const [largeText, setLargeText] = useState<boolean>(() => {
    return document.documentElement.classList.contains('large-text');
  });

  const [budgetVal, setBudgetVal] = useState<number>(35000);
  const [isEditingBudget, setIsEditingBudget] = useState(false);

  const [fingerprintEnabled, setFingerprintEnabled] = useState(false);
  const [hasBiometricSupport, setHasBiometricSupport] = useState(false);

  // Change PIN flow states: 'verify_old' -> 'enter_new'
  const [pinChangeStage, setPinChangeStage] = useState<'idle' | 'verify_old' | 'enter_new'>('idle');

  // Delete all data modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const budgetRecord = await db.settings.get('monthly_budget');
      if (budgetRecord) {
        setBudgetVal(parseFloat(budgetRecord.value) || 35000);
      }

      const bioSupport = await isWebAuthnSupported();
      setHasBiometricSupport(bioSupport);

      const bioActive = await isBiometricEnabled();
      setFingerprintEnabled(bioActive);
    }
    loadSettings();
  }, []);

  const toggleLargeText = () => {
    const nextVal = !largeText;
    setLargeText(nextVal);
    if (nextVal) {
      document.documentElement.classList.add('large-text');
      showToast('பெரிய எழுத்துக்கள் முறை இயக்கப்பட்டது', 'info');
    } else {
      document.documentElement.classList.remove('large-text');
      showToast('சாதாரண எழுத்துக்கள் முறை', 'info');
    }
  };

  const handleSaveBudget = async () => {
    if (budgetVal <= 0) return;
    await db.settings.put({ key: 'monthly_budget', value: budgetVal.toString() });
    setIsEditingBudget(false);
    showToast(t('common.success'), 'success');
  };

  const handleToggleBiometric = async () => {
    const nextVal = !fingerprintEnabled;
    const ok = await setBiometricEnabled(nextVal);
    if (ok) {
      setFingerprintEnabled(nextVal);
      showToast('கைரேகை அமைப்புகள் புதுப்பிக்கப்பட்டது', 'success');
    } else {
      showToast('கைரேகை அமைப்பதில் பிழை அல்லது ஆதரவு இல்லை', 'warning');
    }
  };

  // Change PIN: Step 1 Verify Old PIN
  const handleVerifyOldPin = async (enteredPin: string) => {
    const isOldCorrect = await verifyPin(enteredPin);
    if (isOldCorrect) {
      setPinChangeStage('enter_new');
    } else {
      showToast(t('lock.pinError'), 'error');
    }
  };

  // Change PIN: Step 2 Set New PIN
  const handleSetNewPin = async (enteredPin: string) => {
    await setupNewPin(enteredPin);
    setPinChangeStage('idle');
    showToast(t('lock.pinCreated'), 'success');
  };

  // Delete All Data (Factory Reset with PIN confirmation)
  const handleConfirmDeleteData = async (enteredPin: string) => {
    const isOk = await verifyPin(enteredPin);
    if (!isOk) {
      showToast(t('lock.pinError'), 'error');
      return;
    }

    // Wipe IndexedDB tables
    await db.expenses.clear();
    await db.kids.clear();
    await db.goals.clear();
    await db.tasks.clear();
    await db.settings.clear();
    await db.insightsCache.clear();
    localStorage.clear();

    setIsDeleteModalOpen(false);
    showToast('அனைத்துத் தகவல்களும் வெற்றிகரமாக அழிக்கப்பட்டது', 'info');

    setTimeout(() => {
      onDataReset ? onDataReset() : window.location.reload();
    }, 800);
  };

  const handleExportCSV = async () => {
    const expenses = await db.expenses.toArray();
    exportExpensesToCSV(expenses);
    showToast(t('settings.exportSuccess'), 'success');
  };

  return (
    <div className="pb-28 pt-2 px-4 flex flex-col gap-5 max-w-[440px] mx-auto select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-warmBrown tracking-tight">
            {t('settings.title')}
          </h2>
          <p className="text-xs sm:text-sm text-warmBrown-subtle font-medium mt-0.5">
            {t('settings.subtitle')}
          </p>
        </div>
        <Mascot mood="happy" size={56} />
      </div>

      {/* 1. Language Section */}
      <Card variant="surface" className="flex flex-col gap-3">
        <span className="text-xs font-bold text-warmBrown-subtle uppercase tracking-wider">
          {t('settings.general')}
        </span>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-turmeric-100 flex items-center justify-center text-turmeric-dark">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-warmBrown">
                {t('settings.language')}
              </div>
              <div className="text-xs font-semibold text-warmBrown-subtle">
                {lang === 'ta' ? 'தமிழ் (Tamil)' : 'English'}
              </div>
            </div>
          </div>

          <div className="flex p-1 bg-cream rounded-2xl border border-[#EFEBE9]">
            <button
              type="button"
              onClick={() => setLang('ta')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                lang === 'ta'
                  ? 'bg-kumkum text-white shadow-warm-sm'
                  : 'text-warmBrown-muted hover:text-warmBrown'
              }`}
            >
              தமிழ்
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                lang === 'en'
                  ? 'bg-kumkum text-white shadow-warm-sm'
                  : 'text-warmBrown-muted hover:text-warmBrown'
              }`}
            >
              EN
            </button>
          </div>
        </div>

        {/* Monthly Budget Setting */}
        <div className="pt-3 border-t border-[#EFEBE9] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-leafGreen-light flex items-center justify-center text-leafGreen font-black">
              ₹
            </div>
            <div>
              <div className="text-sm font-bold text-warmBrown">
                {t('settings.budgetSetting')}
              </div>
              <div className="text-xs font-black text-kumkum">
                {formatRupee(budgetVal)}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEditingBudget(true)}
            className="px-3 py-1.5 rounded-xl bg-cream border border-[#EFEBE9] text-xs font-bold text-warmBrown hover:bg-cream-dark active:scale-95"
          >
            மாற்றுக
          </button>
        </div>
      </Card>

      {/* 2. Accessibility (Large Text Mode) */}
      <Card variant="surface" className="flex flex-col gap-3">
        <span className="text-xs font-bold text-warmBrown-subtle uppercase tracking-wider">
          {t('settings.accessibility')}
        </span>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-kumkum-100 flex items-center justify-center text-kumkum">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-warmBrown">
                {t('settings.largeText')}
              </div>
              <div className="text-xs font-semibold text-warmBrown-subtle max-w-[210px]">
                {t('settings.largeTextDesc')}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleLargeText}
            role="switch"
            aria-checked={largeText}
            className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 ${
              largeText ? 'bg-kumkum' : 'bg-[#D7CCC8]'
            }`}
          >
            <div
              className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${
                largeText ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </Card>

      {/* 3. Security (PIN & WebAuthn Biometric) */}
      <Card variant="surface" className="flex flex-col gap-4">
        <span className="text-xs font-bold text-warmBrown-subtle uppercase tracking-wider">
          {t('settings.security')}
        </span>

        {/* Change PIN button */}
        <div
          onClick={() => setPinChangeStage('verify_old')}
          className="flex items-center justify-between cursor-pointer active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cream-dark flex items-center justify-center text-warmBrown">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-warmBrown">
                {t('settings.pinLock')}
              </div>
              <div className="text-xs font-semibold text-warmBrown-subtle">
                {t('settings.changePin')}
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-warmBrown-subtle" />
        </div>

        {/* Biometric Toggle (only if supported) */}
        {hasBiometricSupport && (
          <div className="flex items-center justify-between pt-2 border-t border-[#EFEBE9]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-turmeric-100 flex items-center justify-center text-turmeric-dark">
                <Fingerprint className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-warmBrown">
                  {t('settings.biometric')}
                </div>
                <div className="text-xs font-semibold text-warmBrown-subtle">
                  {t('settings.biometricDesc')}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleBiometric}
              role="switch"
              aria-checked={fingerprintEnabled}
              className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 ${
                fingerprintEnabled ? 'bg-leafGreen' : 'bg-[#D7CCC8]'
              }`}
            >
              <div
                className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${
                  fingerprintEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        )}
      </Card>

      {/* 4. Privacy & Data Export Section */}
      <Card variant="surface" className="flex flex-col gap-3">
        <span className="text-xs font-bold text-warmBrown-subtle uppercase tracking-wider">
          {t('settings.data')}
        </span>

        {/* Privacy Note */}
        <div className="p-3.5 rounded-2xl bg-leafGreen-light/30 border border-leafGreen/20 flex flex-col gap-1">
          <span className="text-xs font-extrabold text-leafGreen flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>{t('settings.privacyTitle')}</span>
          </span>
          <p className="text-[11px] font-semibold text-warmBrown-muted leading-relaxed">
            {t('settings.privacyDesc')}
          </p>
        </div>

        {/* Export CSV button */}
        <button
          type="button"
          onClick={handleExportCSV}
          className="p-3.5 rounded-2xl bg-cream hover:bg-cream-dark border border-[#EFEBE9] flex items-center justify-between active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-3">
            <FileDown className="w-5 h-5 text-kumkum" />
            <span className="text-sm font-bold text-warmBrown text-left">
              {t('settings.backupData')}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-warmBrown-subtle" />
        </button>

        {/* Delete All Data button */}
        <button
          type="button"
          onClick={() => setIsDeleteModalOpen(true)}
          className="p-3.5 rounded-2xl bg-red-50 hover:bg-red-100 border border-red-200 flex items-center justify-between active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-3">
            <Trash2 className="w-5 h-5 text-danger" />
            <span className="text-sm font-bold text-danger text-left">
              {t('settings.resetData')}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-red-400" />
        </button>
      </Card>

      {/* 5. About App & Mascot Story */}
      <Card variant="cream" className="flex flex-col items-center text-center p-6 border-turmeric-200">
        <Mascot mood="happy" size={90} />
        <h3 className="text-lg font-black text-kumkum mt-2">
          {t('app.name')}
        </h3>
        <span className="text-xs font-semibold text-warmBrown-subtle">
          {t('settings.version')}
        </span>
        <p className="text-xs sm:text-sm font-medium text-warmBrown mt-2 leading-relaxed">
          {t('settings.aboutText')}
        </p>

        <div className="mt-4 pt-3 border-t border-[#EFEBE9] w-full flex items-center justify-center gap-1.5 text-xs font-bold text-kumkum">
          <Heart className="w-4 h-4 fill-kumkum text-kumkum" />
          <span>{t('settings.madeWithLove')}</span>
        </div>
      </Card>

      {/* Edit Budget Modal */}
      <BottomSheet isOpen={isEditingBudget} onClose={() => setIsEditingBudget(false)} title="மாத பட்ஜெட் அமைக்க">
        <div className="flex flex-col gap-4 py-2">
          <label className="text-xs font-bold text-warmBrown-subtle">
            மாதாந்திர மொத்த குடும்ப பட்ஜெட் (₹):
          </label>
          <input
            type="number"
            value={budgetVal}
            onChange={(e) => setBudgetVal(parseFloat(e.target.value) || 0)}
            className="w-full min-h-[52px] px-4 rounded-2xl bg-cream border border-[#EFEBE9] text-2xl font-black text-kumkum"
          />
          <Button variant="primary" onClick={handleSaveBudget} icon={<Check className="w-5 h-5" />}>
            {t('settings.saveBudget')}
          </Button>
        </div>
      </BottomSheet>

      {/* Change PIN Modal */}
      <BottomSheet
        isOpen={pinChangeStage !== 'idle'}
        onClose={() => setPinChangeStage('idle')}
        title={t('settings.changePin')}
      >
        <div className="py-4 flex flex-col items-center">
          <p className="text-sm font-bold text-warmBrown mb-4 text-center">
            {pinChangeStage === 'verify_old'
              ? t('settings.verifyOldPin')
              : t('settings.enterNewPin')}
          </p>
          <PinPad
            onComplete={pinChangeStage === 'verify_old' ? handleVerifyOldPin : handleSetNewPin}
          />
        </div>
      </BottomSheet>

      {/* Delete All Data PIN Confirmation Modal */}
      <BottomSheet
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={t('settings.resetData')}
      >
        <div className="py-3 flex flex-col items-center">
          <p className="text-xs sm:text-sm font-bold text-danger mb-4 text-center px-2 leading-relaxed">
            {t('settings.resetWarning')}
          </p>
          <PinPad onComplete={handleConfirmDeleteData} />
        </div>
      </BottomSheet>
    </div>
  );
};
