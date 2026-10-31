import React, { useState, useEffect } from 'react';
import { useI18n } from '../i18n/i18nContext';
import { Mascot } from '../components/Mascot';
import { PinPad } from '../components/PinPad';
import { KolamMotif } from '../components/KolamMotif';
import { Button } from '../components/Button';
import { useToast } from '../components/Toast';
import {
  isPinSetup,
  setupNewPin,
  verifyPin,
  recordFailedPinAttempt,
  resetLockoutState,
  getLockoutStatus,
  isBiometricEnabled,
  authenticateWithBiometric,
  setBiometricEnabled,
  isWebAuthnSupported,
} from '../lib/security';
import { MascotMood } from '../types';
import { Fingerprint, Clock, Check } from 'lucide-react';

interface LockScreenProps {
  onUnlock: () => void;
  isFirstRun?: boolean;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock, isFirstRun = false }) => {
  const { t } = useI18n();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'unlock' | 'create_pin' | 'confirm_pin' | 'offer_bio'>(
    isFirstRun ? 'create_pin' : 'unlock'
  );

  const [enteredPin, setEnteredPin] = useState<string>('');
  const [mood, setMood] = useState<MascotMood>('happy');
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [hasBiometricSupport, setHasBiometricSupport] = useState(false);

  // Check setup status and lockout status on mount
  useEffect(() => {
    async function init() {
      const pinExists = await isPinSetup();
      if (!pinExists) {
        setMode('create_pin');
      } else {
        setMode('unlock');
        // Check WebAuthn support & auto-prompt if enabled
        const bioSupport = await isWebAuthnSupported();
        setHasBiometricSupport(bioSupport);

        const bioEnabled = await isBiometricEnabled();
        if (bioEnabled) {
          // Auto-prompt fingerprint after slight delay
          setTimeout(async () => {
            const bioSuccess = await authenticateWithBiometric();
            if (bioSuccess) {
              setMood('celebrate');
              showToast(t('lock.fingerprintSuccess'), 'success');
              resetLockoutState();
              setTimeout(onUnlock, 400);
            }
          }, 400);
        }
      }

      // Check lockout status
      const status = getLockoutStatus();
      if (status.isLocked) {
        setCooldownRemaining(status.remainingSeconds);
      }
    }
    init();
  }, []);

  // Cooldown timer interval
  useEffect(() => {
    if (cooldownRemaining <= 0) return;

    const timer = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  const handlePinInput = async (pin: string) => {
    if (cooldownRemaining > 0) {
      showToast(`${t('lock.tooManyAttempts')} (${cooldownRemaining}s)`, 'warning');
      return;
    }

    if (mode === 'create_pin') {
      setEnteredPin(pin);
      setMode('confirm_pin');
      setMood('thinking');
      return;
    }

    if (mode === 'confirm_pin') {
      if (pin === enteredPin) {
        // Setup in IndexedDB
        await setupNewPin(pin);
        setMood('celebrate');
        showToast(t('lock.pinCreated'), 'success');

        const bioSupported = await isWebAuthnSupported();
        if (bioSupported) {
          setMode('offer_bio');
        } else {
          setTimeout(onUnlock, 500);
        }
      } else {
        setIsError(true);
        setErrorMessage(t('lock.pinMismatch'));
        setMood('alert');
        setTimeout(() => {
          setIsError(false);
          setErrorMessage('');
          setMode('create_pin');
          setMood('happy');
        }, 1800);
      }
      return;
    }

    // Mode is 'unlock'
    const isCorrect = await verifyPin(pin);
    if (isCorrect) {
      resetLockoutState();
      setIsError(false);
      setMood('celebrate');
      showToast(t('common.success'), 'success');
      setTimeout(onUnlock, 450);
    } else {
      const lockout = recordFailedPinAttempt();
      setIsError(true);
      setMood('alert');

      if (lockout.isLocked) {
        setCooldownRemaining(lockout.remainingSeconds);
        setErrorMessage(t('lock.tooManyAttempts'));
        showToast(`${t('lock.tooManyAttempts')} (${lockout.remainingSeconds}s)`, 'error');
      } else {
        const remainingAttempts = 5 - (lockout.failedAttempts % 5);
        const msg = `${t('lock.pinError')} (${remainingAttempts} attempts left)`;
        setErrorMessage(msg);
        showToast(msg, 'error');
      }

      setTimeout(() => {
        setIsError(false);
        if (cooldownRemaining <= 0) {
          setMood('happy');
        }
      }, 1600);
    }
  };

  const handleBiometricClick = async () => {
    if (cooldownRemaining > 0) return;
    const success = await authenticateWithBiometric();
    if (success) {
      resetLockoutState();
      setMood('celebrate');
      showToast(t('lock.fingerprintSuccess'), 'success');
      setTimeout(onUnlock, 400);
    } else {
      showToast('கைரேகை ஏற்கப்படவில்லை, PIN பயன்படுத்தவும்', 'warning');
    }
  };

  const handleEnableBiometric = async (enable: boolean) => {
    if (enable) {
      const registered = await setBiometricEnabled(true);
      if (registered) {
        showToast(t('lock.fingerprintSuccess'), 'success');
      }
    }
    onUnlock();
  };

  return (
    <div className="min-h-screen bg-[#FFF8EC] flex flex-col justify-between p-5 relative overflow-hidden select-none">
      {/* Kolam motifs */}
      <div className="absolute -top-10 -left-10 pointer-events-none opacity-20">
        <KolamMotif size={160} color="#C2185B" />
      </div>
      <div className="absolute top-1/3 -right-10 pointer-events-none opacity-15">
        <KolamMotif size={140} color="#FFB300" />
      </div>

      {/* Top Amma Greeting */}
      <div className="flex flex-col items-center text-center pt-6 pb-2 z-10">
        <Mascot mood={mood} size={130} />
        <h2 className="text-2xl sm:text-3xl font-extrabold text-warmBrown mt-2">
          {mode === 'create_pin'
            ? t('lock.createPin')
            : mode === 'confirm_pin'
            ? t('lock.confirmPin')
            : mode === 'offer_bio'
            ? t('lock.enableBioTitle')
            : t('lock.welcomeBack')}
        </h2>
        <p className="text-sm sm:text-base font-semibold text-warmBrown-muted mt-1 max-w-xs">
          {mode === 'create_pin'
            ? 'உங்கள் குடும்பக் கணக்கைப் பாதுகாக்க 4 இலக்கங்களை அழுத்தவும்'
            : mode === 'confirm_pin'
            ? t('lock.confirmPin')
            : mode === 'offer_bio'
            ? t('lock.enableBioDesc')
            : t('lock.enterPin')}
        </p>
      </div>

      {/* Mode: Offer Biometric WebAuthn prompt */}
      {mode === 'offer_bio' ? (
        <div className="z-10 w-full max-w-[340px] mx-auto my-auto flex flex-col gap-3">
          <div className="p-6 rounded-3xl bg-white border border-[#EFEBE9] shadow-warm-md text-center flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-turmeric-100 flex items-center justify-center text-turmeric-dark">
              <Fingerprint className="w-10 h-10" />
            </div>
            <p className="text-xs sm:text-sm font-semibold text-warmBrown leading-relaxed">
              {t('lock.enableBioDesc')}
            </p>
          </div>
          <Button variant="primary" onClick={() => handleEnableBiometric(true)} icon={<Check className="w-5 h-5" />}>
            {t('lock.enableBioBtn')}
          </Button>
          <Button variant="ghost" onClick={() => handleEnableBiometric(false)}>
            {t('lock.skipBioBtn')}
          </Button>
        </div>
      ) : (
        /* Standard PinPad / Cooldown View */
        <div className="z-10 w-full max-w-[340px] mx-auto my-auto">
          {cooldownRemaining > 0 ? (
            <div className="p-6 rounded-3xl bg-red-50 border-2 border-red-300 text-center flex flex-col items-center gap-3 animate-fade-in shadow-warm-sm">
              <Clock className="w-12 h-12 text-red-600 animate-spin" />
              <h3 className="text-base font-extrabold text-red-700">
                {t('lock.tooManyAttempts')}
              </h3>
              <p className="text-xs font-bold text-warmBrown">
                {t('lock.cooldownCountdown')}{' '}
                <span className="text-2xl font-black text-red-600 mx-1">
                  {cooldownRemaining}
                </span>{' '}
                {t('lock.seconds')}
              </p>
            </div>
          ) : (
            <PinPad
              onComplete={handlePinInput}
              onBiometricClick={hasBiometricSupport ? handleBiometricClick : undefined}
              isError={isError}
              errorMessage={errorMessage}
            />
          )}
        </div>
      )}

      {/* Footer Mascot Note */}
      <div className="pt-2 pb-4 text-center z-10">
        <p className="text-xs sm:text-sm font-medium text-warmBrown-subtle">
          {t('lock.mascotGreeting')}
        </p>
      </div>
    </div>
  );
};
