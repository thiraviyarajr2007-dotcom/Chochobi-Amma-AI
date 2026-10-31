import React from 'react';
import { ArrowLeft, Settings, Globe } from 'lucide-react';
import { useI18n } from '../i18n/i18nContext';
import { Mascot } from './Mascot';

interface TopBarProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  onSettingsClick?: () => void;
  showLanguageToggle?: boolean;
  rightAction?: React.ReactNode;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  onSettingsClick,
  showLanguageToggle = true,
  rightAction,
}) => {
  const { lang, toggleLang } = useI18n();

  return (
    <header className="sticky top-0 z-30 bg-[#FFF8EC]/95 backdrop-blur-md border-b border-[#EFEBE9] px-4 py-3 select-none">
      <div className="flex items-center justify-between gap-3 max-w-[440px] mx-auto">
        {/* Left: Back button or Mascot Mini Avatar */}
        <div className="flex items-center gap-2.5">
          {showBack && onBack ? (
            <button
              onClick={onBack}
              aria-label="Back"
              className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white border border-[#EFEBE9] shadow-warm-sm text-warmBrown hover:bg-cream-dark active:scale-95 transition-transform"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="flex items-center">
              <Mascot mood="happy" size={40} animate={false} />
            </div>
          )}

          {/* Screen Title & Subtitle */}
          <div className="flex flex-col text-left">
            <h1 className="text-lg sm:text-xl font-bold text-warmBrown leading-snug tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <span className="text-xs text-warmBrown-subtle font-medium truncate max-w-[190px]">
                {subtitle}
              </span>
            )}
          </div>
        </div>

        {/* Right Actions: Language Switcher & Settings */}
        <div className="flex items-center gap-2">
          {showLanguageToggle && (
            <button
              onClick={toggleLang}
              aria-label={`Switch to ${lang === 'ta' ? 'English' : 'Tamil'}`}
              className="h-10 px-3 rounded-full bg-white border-2 border-turmeric text-warmBrown font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-warm-sm hover:bg-turmeric-light active:scale-95 transition-all"
            >
              <Globe className="w-4 h-4 text-turmeric-dark" />
              <span>{lang === 'ta' ? 'தமிழ்' : 'EN'}</span>
            </button>
          )}

          {onSettingsClick && (
            <button
              onClick={onSettingsClick}
              aria-label="Settings"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-[#EFEBE9] text-warmBrown hover:bg-cream-dark active:scale-95 shadow-warm-sm transition-transform"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          {rightAction}
        </div>
      </div>
    </header>
  );
};

