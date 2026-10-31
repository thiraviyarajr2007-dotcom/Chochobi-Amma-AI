import React, { useState } from 'react';
import {
  Palette,
  Sparkles,
  Heart,
  ShieldCheck,
  Check,
  Mic,
  DollarSign,
  Info,
} from 'lucide-react';
import { useI18n } from '../i18n/i18nContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { BigMicButton } from '../components/BigMicButton';
import { Mascot } from '../components/Mascot';
import { KolamMotif } from '../components/KolamMotif';
import { AmountInput } from '../components/AmountInput';
import { CategoryChip } from '../components/CategoryChip';
import { StatTile } from '../components/StatTile';
import { EmptyState } from '../components/EmptyState';
import { PinPad } from '../components/PinPad';
import { Skeleton } from '../components/Skeleton';
import { BottomSheet } from '../components/BottomSheet';
import { triggerConfetti } from '../components/ConfettiBurst';
import { useToast } from '../components/Toast';
import { THEME_COLORS } from '../theme/tokens';
import { ExpenseCategory } from '../types';

export const DesignSystemScreen: React.FC = () => {
  const { t } = useI18n();
  const { showToast } = useToast();

  const [testAmount, setTestAmount] = useState<number>(350);
  const [selectedCat, setSelectedCat] = useState<ExpenseCategory>('groceries');
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);
  const [isMicListening, setIsMicListening] = useState<boolean>(false);
  const [pinPadError, setPinPadError] = useState<boolean>(false);

  const sampleCategories: ExpenseCategory[] = [
    'groceries',
    'dairy',
    'vegetables',
    'medical',
    'utilities',
    'temple',
    'snacks',
  ];

  return (
    <div className="pb-32 pt-2 px-4 flex flex-col gap-8 max-w-[440px] mx-auto select-none">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-kumkum font-bold text-xs uppercase tracking-wider">
          <Palette className="w-4 h-4" />
          <span>Design System Spec</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-warmBrown tracking-tight">
          {t('designSystem.title')}
        </h2>
        <p className="text-xs sm:text-sm text-warmBrown-subtle font-medium">
          {t('designSystem.subtitle')}
        </p>
      </div>

      {/* 1. Theme Color Tokens (Pongal Warmth) */}
      <div className="flex flex-col gap-3">
        <h3 className="text-base font-extrabold text-warmBrown">
          1. {t('designSystem.colorTokens')}
        </h3>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-2xl bg-white border border-[#EFEBE9] flex items-center gap-3 shadow-warm-sm">
            <div className="w-9 h-9 rounded-xl bg-kumkum flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-warmBrown">Kumkum Rose</span>
              <span className="text-[10px] font-mono text-warmBrown-subtle">#C2185B</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-[#EFEBE9] flex items-center gap-3 shadow-warm-sm">
            <div className="w-9 h-9 rounded-xl bg-turmeric flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-warmBrown">Turmeric Gold</span>
              <span className="text-[10px] font-mono text-warmBrown-subtle">#FFB300</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-[#EFEBE9] flex items-center gap-3 shadow-warm-sm">
            <div className="w-9 h-9 rounded-xl bg-leafGreen flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-warmBrown">Leaf Green</span>
              <span className="text-[10px] font-mono text-warmBrown-subtle">#2E7D32</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-[#EFEBE9] flex items-center gap-3 shadow-warm-sm">
            <div className="w-9 h-9 rounded-xl bg-[#FFF8EC] border border-[#EFEBE9] flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-warmBrown">Warm Cream</span>
              <span className="text-[10px] font-mono text-warmBrown-subtle">#FFF8EC</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-[#EFEBE9] flex items-center gap-3 shadow-warm-sm">
            <div className="w-9 h-9 rounded-xl bg-danger flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-warmBrown">Alert Danger</span>
              <span className="text-[10px] font-mono text-warmBrown-subtle">#D32F2F</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-[#EFEBE9] flex items-center gap-3 shadow-warm-sm">
            <div className="w-9 h-9 rounded-xl bg-warmBrown flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-warmBrown">Warm Brown</span>
              <span className="text-[10px] font-mono text-warmBrown-subtle">#3E2723</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Mascot Moods Showcase */}
      <div className="flex flex-col gap-3">
        <h3 className="text-base font-extrabold text-warmBrown">
          2. {t('designSystem.mascotStates')}
        </h3>
        <Card variant="surface" className="grid grid-cols-2 gap-4 text-center">
          <div className="flex flex-col items-center p-2 rounded-2xl bg-cream">
            <Mascot mood="happy" size={80} />
            <span className="text-xs font-bold text-warmBrown mt-1">happy</span>
          </div>

          <div className="flex flex-col items-center p-2 rounded-2xl bg-cream">
            <Mascot mood="thinking" size={80} />
            <span className="text-xs font-bold text-warmBrown mt-1">thinking</span>
          </div>

          <div className="flex flex-col items-center p-2 rounded-2xl bg-cream">
            <Mascot mood="alert" size={80} />
            <span className="text-xs font-bold text-warmBrown mt-1">alert</span>
          </div>

          <div className="flex flex-col items-center p-2 rounded-2xl bg-cream">
            <Mascot mood="celebrate" size={80} />
            <span className="text-xs font-bold text-warmBrown mt-1">celebrate</span>
          </div>
        </Card>
      </div>

      {/* 3. Reusable Buttons (Min 56px Height) */}
      <div className="flex flex-col gap-3">
        <h3 className="text-base font-extrabold text-warmBrown">
          3. Button Variants (Min 56px Tap Target)
        </h3>
        <div className="flex flex-col gap-2.5">
          <Button variant="primary" onClick={() => showToast('Primary Clicked!', 'success')}>
            Primary Button (Kumkum Rose)
          </Button>
          <Button variant="secondary" onClick={() => showToast('Secondary Clicked!', 'info')}>
            Secondary Button (Turmeric Gold)
          </Button>
          <Button variant="success" onClick={() => showToast('Success Clicked!', 'success')}>
            Success Button (Leaf Green)
          </Button>
          <Button variant="danger" onClick={() => showToast('Danger Clicked!', 'error')}>
            Danger Button (Scam Red)
          </Button>
          <Button variant="ghost" onClick={() => showToast('Ghost Clicked!', 'info')}>
            Ghost Outline Button
          </Button>
        </div>
      </div>

      {/* 4. BigMicButton Component */}
      <div className="flex flex-col gap-3">
        <h3 className="text-base font-extrabold text-warmBrown">
          4. BigMicButton (Voice Trigger)
        </h3>
        <BigMicButton
          isListening={isMicListening}
          onClick={() => setIsMicListening(!isMicListening)}
        />
      </div>

      {/* 5. AmountInput Component */}
      <div className="flex flex-col gap-3">
        <h3 className="text-base font-extrabold text-warmBrown">
          5. AmountInput Component
        </h3>
        <AmountInput
          value={testAmount}
          onChange={(val) => setTestAmount(val)}
          label="செலவுத் தொகை (Amount)"
        />
      </div>

      {/* 6. CategoryChip Component */}
      <div className="flex flex-col gap-3">
        <h3 className="text-base font-extrabold text-warmBrown">
          6. CategoryChip Component
        </h3>
        <div className="flex flex-wrap gap-2">
          {sampleCategories.map((c) => (
            <CategoryChip
              key={c}
              category={c}
              isSelected={selectedCat === c}
              onClick={() => setSelectedCat(c)}
              size="md"
            />
          ))}
        </div>
      </div>

      {/* 7. StatTile Component */}
      <div className="flex flex-col gap-3">
        <h3 className="text-base font-extrabold text-warmBrown">
          7. StatTile Components
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <StatTile
            label="மாத பட்ஜெட்"
            value="₹35,000"
            sublabel="அக்டோபர் 2026"
            variant="turmeric"
            icon={<Sparkles className="w-5 h-5 text-turmeric-dark" />}
          />
          <StatTile
            label="சேமிப்பு நிலை"
            value="₹13,550"
            sublabel="பாதுகாப்பானது"
            variant="success"
            icon={<ShieldCheck className="w-5 h-5 text-leafGreen" />}
          />
        </div>
      </div>

      {/* 8. Interactive Feedback: Toast & Confetti */}
      <div className="flex flex-col gap-3">
        <h3 className="text-base font-extrabold text-warmBrown">
          8. Feedback: Toast & ConfettiBurst
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              triggerConfetti();
              showToast('வாழ்த்துகள்! 🎉', 'success');
            }}
          >
            Trigger Confetti 🎉
          </Button>
          <Button
            variant="ghost"
            onClick={() => setIsSheetOpen(true)}
          >
            Open BottomSheet
          </Button>
        </div>
      </div>

      {/* 9. PinPad Preview */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-warmBrown">
            9. PinPad Component
          </h3>
          <button
            onClick={() => setPinPadError(!pinPadError)}
            className="text-xs font-bold text-kumkum underline"
          >
            Toggle Error Shake
          </button>
        </div>
        <Card variant="surface">
          <PinPad
            onComplete={(p) => showToast(`PIN Entered: ${p}`, 'info')}
            onBiometricClick={() => showToast('Biometric sensor touched', 'success')}
            isError={pinPadError}
            errorMessage="தவறான PIN எண்!"
          />
        </Card>
      </div>

      {/* 10. Kolam Motif & Empty State */}
      <div className="flex flex-col gap-3">
        <h3 className="text-base font-extrabold text-warmBrown">
          10. KolamMotif & EmptyState
        </h3>
        <EmptyState
          title="எந்தப் பதிவுகளும் இல்லை"
          description="உங்கள் குடும்பச் செலவுகளை எளிதாகக் கண்காணிக்கத் தொடங்குங்கள் அம்மா."
          actionLabel="தொடங்கவும்"
          onAction={() => showToast('Action tapped', 'info')}
          mascotMood="happy"
        />
      </div>

      {/* 11. Skeleton Loaders */}
      <div className="flex flex-col gap-3">
        <h3 className="text-base font-extrabold text-warmBrown">
          11. Skeleton Loaders
        </h3>
        <div className="flex flex-col gap-2.5">
          <Skeleton className="h-20 w-full" variant="rounded" />
          <div className="flex gap-3">
            <Skeleton className="h-12 w-12" variant="circular" />
            <Skeleton className="h-12 flex-1" variant="rounded" />
          </div>
        </div>
      </div>

      {/* BottomSheet Modal Demo */}
      <BottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title="வடிவமைப்பு மாதிரி தாள் (BottomSheet)"
      >
        <div className="flex flex-col gap-4 py-2">
          <p className="text-sm font-semibold text-warmBrown leading-relaxed">
            இது ஒரு மென்மையான மொபைல் பாட்டம் ஷீட் ஆகும். இதில் சுலபமாக விபரங்களைக் காண்பிக்கலாம் அல்லது விரைவு அமைப்புகளை இயக்கலாம்.
          </p>
          <Button variant="primary" onClick={() => setIsSheetOpen(false)}>
            சரி, புரிந்தது
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
};

