import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { useI18n } from '../i18n/i18nContext';
import { Mascot } from '../components/Mascot';
import { PinPad } from '../components/PinPad';
import { KolamMotif } from '../components/KolamMotif';
import { useToast } from '../components/Toast';
import {
  verifyPin,
  recordFailedPinAttempt,
  resetLockoutState,
  getLockoutStatus,
  isBiometricEnabled,
  authenticateWithBiometric,
  isWebAuthnSupported,
} from '../lib/security';
import { useAuthLock } from '../lib/authLockContext';
import { MascotMood } from '../types';

export const LockPage: React.FC = () => {
  const { t } = useI18n();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { unlockApp } = useAuthLock();

  const [mood, setMood] = useState<MascotMood>('happy');
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [hasBiometric, setHasBiometric] = useState(false);

  useEffect(() => {
    async function initLock() {
      // Check lockout status
      const lockout = getLockoutStatus();
      if (lockout.isLocked) {
        setCooldownRemaining(lockout.remainingSeconds);
      }

      // Check biometric support & auto-prompt if enabled
      const supported = await isWebAuthnSupported();
      setHasBiometric(supported);

      const enabled = await isBiometricEnabled();
      if (enabled && !lockout.isLocked) {
        setTimeout(async () => {
          const success = await authenticateWithBiometric();
          if (success) {
            handleUnlockSuccess();
          }
        }, 350);
      }
    }
    initLock();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const interval = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownRemaining]);

  const handleUnlockSuccess = () => {
    resetLockoutState();
    setMood('celebrate');
    showToast(t('common.success'), 'success');

    setTimeout(() => {
      const destination = unlockApp();
      navigate(destination, { replace: true });
    }, 350);
  };

  const handlePinComplete = async (enteredPin: string) => {
    if (cooldownRemaining > 0) return;

    const ok = await verifyPin(enteredPin);
    if (ok) {
      handleUnlockSuccess();
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
        const msg = `${t('lock.pinError')} (${remainingAttempts} attempts remaining)`;
        setErrorMessage(msg);
        showToast(msg, 'error');
      }

      setTimeout(() => {
        setIsError(false);
        if (cooldownRemaining <= 0) {
          setMood('happy');
        }
      }, 1500);
    }
  };

  const handleBiometricClick = async () => {
    if (cooldownRemaining > 0) return;
    const ok = await authenticateWithBiometric();
    if (ok) {
      handleUnlockSuccess();
    } else {
      showToast('கைரேகை ஏற்கப்படவில்லை, PIN பயன்படுத்தவும்', 'warning');
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8EC] flex flex-col justify-between p-5 relative overflow-hidden select-none">
      <div className="absolute -top-10 -left-10 pointer-events-none opacity-20">
        <KolamMotif size={160} color="#C2185B" />
      </div>

      <div className="flex flex-col items-center text-center pt-8 pb-2 z-10">
        <Mascot mood={mood} size={130} />
        <h2 className="text-2xl sm:text-3xl font-black text-warmBrown mt-3">
          {t('lock.welcomeBack')}
        </h2>
        <p className="text-xs sm:text-sm font-semibold text-warmBrown-muted mt-1 max-w-xs">
          {t('lock.enterPin')}
        </p>
      </div>

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
            onComplete={handlePinComplete}
            onBiometricClick={hasBiometric ? handleBiometricClick : undefined}
            isError={isError}
            errorMessage={errorMessage}
          />
        )}
      </div>

      <div className="pt-2 pb-4 text-center z-10">
        <p className="text-xs sm:text-sm font-medium text-warmBrown-subtle">
          {t('lock.mascotGreeting')}
        </p>
      </div>
    </div>
  );
};

