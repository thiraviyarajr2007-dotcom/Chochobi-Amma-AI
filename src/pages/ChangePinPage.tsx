import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Check } from 'lucide-react';
import { useI18n } from '../i18n/i18nContext';
import { Card } from '../components/Card';
import { Mascot } from '../components/Mascot';
import { PinPad } from '../components/PinPad';
import { TopBar } from '../components/TopBar';
import { useToast } from '../components/Toast';
import { verifyPin, setupNewPin } from '../lib/security';
import { useAuthLock } from '../lib/authLockContext';

export const ChangePinPage: React.FC = () => {
  const { t, lang } = useI18n();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { refreshPinStatus } = useAuthLock();

  // stage: 'verify_old' -> 'enter_new' -> 'confirm_new'
  const [stage, setStage] = useState<'verify_old' | 'enter_new' | 'confirm_new'>('verify_old');
  const [newPinCandidate, setNewPinCandidate] = useState('');
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handlePinInput = async (enteredPin: string) => {
    if (stage === 'verify_old') {
      const isOk = await verifyPin(enteredPin);
      if (isOk) {
        setStage('enter_new');
        setErrorMessage('');
      } else {
        setIsError(true);
        setErrorMessage(t('lock.pinError'));
        setTimeout(() => {
          setIsError(false);
          setErrorMessage('');
        }, 1500);
      }
      return;
    }

    if (stage === 'enter_new') {
      setNewPinCandidate(enteredPin);
      setStage('confirm_new');
      return;
    }

    if (stage === 'confirm_new') {
      if (enteredPin === newPinCandidate) {
        await setupNewPin(enteredPin);
        await refreshPinStatus();
        showToast(t('settings.pinChangedSuccess'), 'success');
        navigate('/settings');
      } else {
        setIsError(true);
        setErrorMessage(t('lock.pinMismatch'));
        setTimeout(() => {
          setIsError(false);
          setErrorMessage('');
          setStage('enter_new');
        }, 1500);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8EC] flex flex-col">
      <TopBar
        title={t('settings.changePin')}
        showBack={true}
        onBack={() => navigate('/settings')}
      />

      <div className="flex-1 pb-28 pt-2 px-4 flex flex-col items-center gap-4 max-w-[440px] mx-auto w-full select-none">
        {/* Back Link */}
        <button
          onClick={() => navigate('/settings')}
          className="self-start flex items-center gap-2 text-sm font-bold text-warmBrown hover:text-kumkum px-2 py-1 rounded-xl transition-colors"
          aria-label={t('common.back')}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('common.back')}</span>
        </button>

        <div className="flex flex-col items-center text-center pt-2">
          <Mascot mood={isError ? 'alert' : 'happy'} size={90} />

          <h2 className="text-xl font-black text-warmBrown mt-2">
            {stage === 'verify_old'
              ? t('settings.enterOldPin')
              : stage === 'enter_new'
              ? t('settings.enterNewPin')
              : t('settings.confirmNewPin')}
          </h2>

          <p className="text-xs font-semibold text-warmBrown-muted mt-1 max-w-xs">
            {stage === 'verify_old'
              ? lang === 'ta'
                ? 'தற்போதைய 4 இலக்க பின்னை உள்ளிடவும்'
                : 'Enter your current 4-digit PIN to continue'
              : stage === 'enter_new'
              ? lang === 'ta'
                ? 'புதிய 4 இலக்க பின்னை உள்ளிடவும்'
                : 'Enter your new 4-digit PIN'
              : lang === 'ta'
              ? 'புதிய பின்னை மீண்டும் உள்ளிட்டு உறுதிப்படுத்தவும்'
              : 'Re-enter your new PIN to confirm'}
          </p>
        </div>

        <div className="w-full max-w-[320px] mt-2">
          <PinPad
            onComplete={handlePinInput}
            isError={isError}
            errorMessage={errorMessage}
          />
        </div>
      </div>
    </div>
  );
};
