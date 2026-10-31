import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fingerprint, Check } from 'lucide-react';
import { useI18n } from '../i18n/i18nContext';
import { Mascot } from '../components/Mascot';
import { PinPad } from '../components/PinPad';
import { KolamMotif } from '../components/KolamMotif';
import { Button } from '../components/Button';
import { useToast } from '../components/Toast';
import {
  setupNewPin,
  isWebAuthnSupported,
  setBiometricEnabled,
} from '../lib/security';
import { useAuthLock } from '../lib/authLockContext';

export const SetupPinPage: React.FC = () => {
  const { t } = useI18n();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { refreshPinStatus, unlockApp } = useAuthLock();

  const [stage, setStage] = useState<'create' | 'confirm' | 'offer_bio'>('create');
  const [firstPin, setFirstPin] = useState('');
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handlePinInput = async (pin: string) => {
    if (stage === 'create') {
      setFirstPin(pin);
      setStage('confirm');
      return;
    }

    if (stage === 'confirm') {
      if (pin === firstPin) {
        await setupNewPin(pin);
        await refreshPinStatus();
        showToast(t('lock.pinCreated'), 'success');

        const bioSupported = await isWebAuthnSupported();
        if (bioSupported) {
          setStage('offer_bio');
        } else {
          unlockApp('/home');
          navigate('/home', { replace: true });
        }
      } else {
        setIsError(true);
        setErrorMessage(t('lock.pinMismatch'));
        setTimeout(() => {
          setIsError(false);
          setErrorMessage('');
          setStage('create');
        }, 1600);
      }
    }
  };

  const handleBiometricChoice = async (enable: boolean) => {
    if (enable) {
      await setBiometricEnabled(true);
      showToast(t('lock.fingerprintSuccess'), 'success');
    }
    unlockApp('/home');
    navigate('/home', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#FFF8EC] flex flex-col justify-between p-5 relative overflow-hidden select-none">
      <div className="absolute -top-10 -left-10 pointer-events-none opacity-20">
        <KolamMotif size={160} color="#C2185B" />
      </div>

      <div className="flex flex-col items-center text-center pt-8 pb-2 z-10">
        <Mascot mood={stage === 'confirm' ? 'thinking' : 'happy'} size={130} />
        <h2 className="text-2xl sm:text-3xl font-black text-warmBrown mt-3">
          {stage === 'create'
            ? t('lock.createPin')
            : stage === 'confirm'
            ? t('lock.confirmPin')
            : t('lock.enableBioTitle')}
        </h2>
        <p className="text-xs sm:text-sm font-semibold text-warmBrown-muted mt-1 max-w-xs">
          {stage === 'create'
            ? 'உங்கள் குடும்பக் கணக்கைப் பாதுகாக்க 4 இலக்க ரகசிய எண்ணை உருவாக்கவும்'
            : stage === 'confirm'
            ? t('lock.confirmPin')
            : t('lock.enableBioDesc')}
        </p>
      </div>

      {stage === 'offer_bio' ? (
        <div className="z-10 w-full max-w-[340px] mx-auto my-auto flex flex-col gap-3">
          <div className="p-6 rounded-3xl bg-white border border-[#EFEBE9] shadow-warm-md text-center flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-turmeric-100 flex items-center justify-center text-turmeric-dark">
              <Fingerprint className="w-10 h-10" />
            </div>
            <p className="text-xs sm:text-sm font-semibold text-warmBrown leading-relaxed">
              {t('lock.enableBioDesc')}
            </p>
          </div>
          <Button variant="primary" onClick={() => handleBiometricChoice(true)} icon={<Check className="w-5 h-5" />}>
            {t('lock.enableBioBtn')}
          </Button>
          <Button variant="ghost" onClick={() => handleBiometricChoice(false)}>
            {t('lock.skipBioBtn')}
          </Button>
        </div>
      ) : (
        <div className="z-10 w-full max-w-[340px] mx-auto my-auto">
          <PinPad
            onComplete={handlePinInput}
            isError={isError}
            errorMessage={errorMessage}
          />
        </div>
      )}

      <div className="pt-2 pb-4 text-center z-10">
        <p className="text-xs sm:text-sm font-medium text-warmBrown-subtle">
          {t('lock.mascotGreeting')}
        </p>
      </div>
    </div>
  );
};

