import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ArrowLeft,
} from 'lucide-react';
import { useI18n } from '../i18n/i18nContext';
import { Card } from '../components/Card';
import { Mascot } from '../components/Mascot';
import { BottomSheet } from '../components/BottomSheet';
import { PinPad } from '../components/PinPad';
import { Button } from '../components/Button';
import { TopBar } from '../components/TopBar';
import { useToast } from '../components/Toast';
import { db } from '../lib/db';
import {
  verifyPin,
  isBiometricEnabled,
  setBiometricEnabled,
  isWebAuthnSupported,
} from '../lib/security';
import { exportExpensesToCSV } from '../lib/budgetAnalytics';
import { useAuthLock } from '../lib/authLockContext';
import { useUserAuth } from '../lib/userAuthContext';

export const SettingsPage: React.FC = () => {
  const { lang, setLang, t, formatRupee } = useI18n();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { lockApp, refreshPinStatus } = useAuthLock();
  const { user } = useUserAuth();

  const [largeText, setLargeText] = useState<boolean>(() => {
    return document.documentElement.classList.contains('large-text');
  });

  const [budgetVal, setBudgetVal] = useState<number>(35000);
  const [isEditingBudget, setIsEditingBudget] = useState(false);

  const [fingerprintEnabled, setFingerprintEnabled] = useState(false);
  const [hasBiometricSupport, setHasBiometricSupport] = useState(false);

  // Delete all data modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePinError, setDeletePinError] = useState(false);

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
      showToast(lang === 'ta' ? 'பெரிய எழுத்துக்கள் முறை இயக்கப்பட்டது' : 'Large text mode enabled', 'info');
    } else {
      document.documentElement.classList.remove('large-text');
      showToast(lang === 'ta' ? 'சாதாரண எழுத்துக்கள் முறை' : 'Standard text mode', 'info');
    }
  };

  const handleSaveBudget = async () => {
    await db.settings.put({ key: 'monthly_budget', value: budgetVal.toString() });
    setIsEditingBudget(false);
    showToast(t('settings.budgetUpdated'), 'success');
  };

  const handleToggleBiometric = async () => {
    const nextVal = !fingerprintEnabled;
    await setBiometricEnabled(nextVal);
    setFingerprintEnabled(nextVal);
    showToast(
      nextVal
        ? lang === 'ta'
          ? 'கைரேகை பாதுகாப்பு இயக்கப்பட்டது'
          : 'Fingerprint enabled'
        : lang === 'ta'
        ? 'கைரேகை பாதுகாப்பு முடக்கப்பட்டது'
        : 'Fingerprint disabled',
      'info'
    );
  };

  const handleExportCSV = async () => {
    const expenses = await db.expenses.toArray();
    if (expenses.length === 0) {
      showToast(t('expensesList.emptyState'), 'info');
      return;
    }
    exportExpensesToCSV(expenses);
    showToast(t('settings.exportSuccess'), 'success');
  };

  // Delete All Data Flow
  const handleConfirmDeleteAll = async (enteredPin: string) => {
    const isOk = await verifyPin(enteredPin);
    if (!isOk) {
      setDeletePinError(true);
      setTimeout(() => setDeletePinError(false), 1500);
      showToast(t('lock.pinError'), 'error');
      return;
    }

    // Wipe all tables
    await db.expenses.clear();
    await db.settings.clear();
    await db.kids.clear();
    await db.goals.clear();
    await db.tasks.clear();
    await db.insightsCache.clear();

    localStorage.removeItem('chocobi_lang');
    localStorage.removeItem('chocobi_seen_splash');
    sessionStorage.clear();

    await refreshPinStatus();
    lockApp();

    setIsDeleteModalOpen(false);
    showToast(t('settings.deletedAllSuccess'), 'success');
    navigate('/welcome', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#FFF8EC] flex flex-col">
      <TopBar
        title={t('settings.title')}
        subtitle={t('settings.aboutSubtitle')}
        showBack={true}
        onBack={() => navigate('/home')}
      />

      <div className="flex-1 pb-28 pt-2 px-4 flex flex-col gap-4 max-w-[440px] mx-auto w-full select-none">
        {/* Back Link */}
        <button
          onClick={() => navigate('/home')}
          className="self-start flex items-center gap-2 text-sm font-bold text-warmBrown hover:text-kumkum px-2 py-1 rounded-xl transition-colors"
          aria-label={t('common.back')}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('common.back')}</span>
        </button>

        {/* 0. Amma Account / Firebase Integration Card */}
        <Card variant="surface" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-warmBrown-subtle uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-leafGreen" />
              {t('auth.accountDetails')}
            </span>
            {user && (
              <span className="text-[11px] font-bold text-leafGreen bg-leafGreen-light px-2 py-0.5 rounded-full uppercase">
                {user.providerId}
              </span>
            )}
          </div>

          {user ? (
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-turmeric-light border border-turmeric flex items-center justify-center text-xl shadow-warm-sm overflow-hidden">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'Amma'} className="w-full h-full object-cover" />
                  ) : (
                    <span>👩</span>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-black text-warmBrown">{user.displayName}</h4>
                  <span className="text-xs text-warmBrown-subtle font-medium truncate max-w-[180px] block">
                    {user.email || t('auth.notConnected')}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/auth')}
                className="px-3 py-1.5 rounded-xl bg-cream hover:bg-cream-dark text-warmBrown text-xs font-bold border border-[#EFEBE9]"
              >
                {t('common.edit')}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-cream-dark flex items-center justify-center text-lg">
                  🔐
                </div>
                <div>
                  <span className="text-xs font-bold text-warmBrown block">{t('auth.notConnected')}</span>
                  <span className="text-[11px] text-warmBrown-subtle font-medium block">
                    {t('auth.connectPrompt')}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/auth')}
                className="px-3.5 py-2 rounded-xl bg-kumkum text-white text-xs font-bold shadow-warm-sm hover:bg-kumkum-dark active:scale-95 transition-all whitespace-nowrap"
              >
                {t('auth.signIn')}
              </button>
            </div>
          )}
        </Card>

        {/* 1. Language Switcher Card */}
        <Card variant="surface" className="flex flex-col gap-3">
          <span className="text-xs font-bold text-warmBrown-subtle uppercase tracking-wider flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-turmeric-dark" />
            {t('settings.language')}
          </span>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setLang('ta')}
              className={`p-3 rounded-2xl border-2 flex items-center justify-between transition-all ${
                lang === 'ta'
                  ? 'border-kumkum bg-kumkum-50 text-kumkum font-bold shadow-warm-sm'
                  : 'border-[#EFEBE9] bg-white text-warmBrown font-medium'
              }`}
            >
              <span>தமிழ் (Tamil)</span>
              {lang === 'ta' && <Check className="w-4 h-4 text-kumkum" />}
            </button>

            <button
              type="button"
              onClick={() => setLang('en')}
              className={`p-3 rounded-2xl border-2 flex items-center justify-between transition-all ${
                lang === 'en'
                  ? 'border-kumkum bg-kumkum-50 text-kumkum font-bold shadow-warm-sm'
                  : 'border-[#EFEBE9] bg-white text-warmBrown font-medium'
              }`}
            >
              <span>English</span>
              {lang === 'en' && <Check className="w-4 h-4 text-kumkum" />}
            </button>
          </div>
        </Card>

        {/* 2. Monthly Budget Setting */}
        <Card variant="surface" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-warmBrown-subtle uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-leafGreen" />
              {t('settings.monthlyBudget')}
            </span>
            <button
              type="button"
              onClick={() => setIsEditingBudget(!isEditingBudget)}
              className="text-xs font-bold text-kumkum hover:underline"
            >
              {isEditingBudget ? t('common.cancel') : t('common.edit')}
            </button>
          </div>

          {!isEditingBudget ? (
            <div className="text-2xl font-black text-warmBrown">
              {formatRupee(budgetVal)}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={budgetVal}
                onChange={(e) => setBudgetVal(parseFloat(e.target.value) || 0)}
                className="flex-1 px-4 py-2.5 rounded-2xl bg-cream border border-[#EFEBE9] text-warmBrown font-bold text-base focus:border-kumkum focus:outline-none"
              />
              <Button variant="primary" size="sm" onClick={handleSaveBudget}>
                {t('common.save')}
              </Button>
            </div>
          )}
        </Card>

        {/* 3. Security Settings */}
        <Card variant="surface" className="flex flex-col divide-y divide-[#EFEBE9]">
          {/* Change PIN Route Link */}
          <button
            type="button"
            onClick={() => navigate('/settings/pin')}
            className="py-3 flex items-center justify-between w-full hover:bg-cream/40 rounded-xl px-1 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cream flex items-center justify-center text-warmBrown">
                <Lock className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-warmBrown">
                {t('settings.changePin')}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-warmBrown-subtle" />
          </button>

          {/* Biometrics Toggle (if supported) */}
          {hasBiometricSupport && (
            <div className="py-3 flex items-center justify-between px-1">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cream flex items-center justify-center text-warmBrown">
                  <Fingerprint className="w-4 h-4" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-bold text-warmBrown">
                    {t('settings.fingerprint')}
                  </span>
                  <span className="text-[11px] text-warmBrown-subtle font-medium">
                    {t('settings.fingerprintDesc')}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleBiometric}
                className={`w-12 h-7 rounded-full p-1 transition-colors ${
                  fingerprintEnabled ? 'bg-leafGreen' : 'bg-gray-300'
                }`}
                aria-label="Toggle fingerprint"
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    fingerprintEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          )}

          {/* Large Text Mode Toggle */}
          <div className="py-3 flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cream flex items-center justify-center text-warmBrown">
                <Type className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm font-bold text-warmBrown">
                  {t('settings.largeText')}
                </span>
                <span className="text-[11px] text-warmBrown-subtle font-medium">
                  {t('settings.largeTextDesc')}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleLargeText}
              className={`w-12 h-7 rounded-full p-1 transition-colors ${
                largeText ? 'bg-kumkum' : 'bg-gray-300'
              }`}
              aria-label="Toggle large text"
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  largeText ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </Card>

        {/* 4. Data & Privacy */}
        <Card variant="surface" className="flex flex-col divide-y divide-[#EFEBE9]">
          {/* Privacy Page Link */}
          <button
            type="button"
            onClick={() => navigate('/privacy')}
            className="py-3 flex items-center justify-between w-full hover:bg-cream/40 rounded-xl px-1 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-leafGreen-light flex items-center justify-center text-leafGreen">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-warmBrown">
                {t('privacy.title')}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-warmBrown-subtle" />
          </button>

          {/* Export to CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="py-3 flex items-center justify-between w-full hover:bg-cream/40 rounded-xl px-1 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cream flex items-center justify-center text-warmBrown">
                <FileDown className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-warmBrown">
                {t('settings.exportCsv')}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-warmBrown-subtle" />
          </button>

          {/* Delete All Data Danger Action */}
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="py-3 flex items-center justify-between w-full hover:bg-red-50 rounded-xl px-1 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-danger">
                <Trash2 className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-danger">
                {t('settings.deleteAllData')}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-danger/60" />
          </button>
        </Card>

        {/* About App Footer */}
        <div className="text-center py-4 flex flex-col items-center gap-1">
          <Mascot mood="happy" size={50} />
          <span className="text-xs font-bold text-warmBrown mt-1">
            {t('app.name')} • v1.0.0 PWA
          </span>
          <span className="text-[11px] text-warmBrown-subtle flex items-center gap-1 font-semibold">
            {t('settings.builtWithLove')} <Heart className="w-3 h-3 text-kumkum fill-kumkum" />
          </span>
        </div>
      </div>

      {/* DELETE ALL DATA PIN CONFIRMATION MODAL */}
      <BottomSheet
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={t('settings.deleteAllData')}
      >
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <Mascot mood="alert" size={70} />
          <p className="text-xs font-bold text-danger max-w-xs">
            {t('settings.deleteAllWarning')}
          </p>
          <p className="text-[11px] text-warmBrown-subtle font-medium">
            {t('settings.enterPinToConfirm')}
          </p>
          <PinPad
            onComplete={handleConfirmDeleteAll}
            isError={deletePinError}
            errorMessage={t('lock.pinError')}
          />
        </div>
      </BottomSheet>
    </div>
  );
};
