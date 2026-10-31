import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Receipt, Mic, Target, Menu } from 'lucide-react';
import { useI18n } from '../i18n/i18nContext';
import { MoreSheet } from './MoreSheet';

export const BottomNav: React.FC = () => {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const currentPath = location.pathname;

  // Do not render BottomNav on auth and onboarding screens
  if (
    currentPath === '/welcome' ||
    currentPath === '/setup-pin' ||
    currentPath === '/lock' ||
    currentPath === '/auth'
  ) {
    return null;
  }

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 max-w-[440px] mx-auto bg-white/95 backdrop-blur-md border-t border-[#EFEBE9] px-2 py-1.5 shadow-[0_-4px_16px_rgba(62,39,35,0.08)] select-none"
        role="navigation"
        aria-label="Main Navigation"
      >
        <div className="flex items-center justify-between gap-1">
          {/* 1. Home */}
          <button
            onClick={() => navigate('/home')}
            className={`flex-1 flex flex-col items-center justify-center min-w-[50px] py-1 px-1 rounded-2xl transition-all ${
              currentPath === '/home'
                ? 'text-kumkum font-bold'
                : 'text-warmBrown-muted hover:text-warmBrown font-medium'
            }`}
            aria-current={currentPath === '/home' ? 'page' : undefined}
          >
            <div
              className={`flex items-center justify-center w-9 h-7 rounded-full transition-colors ${
                currentPath === '/home' ? 'bg-kumkum-100 text-kumkum' : 'text-warmBrown-muted'
              }`}
            >
              <Home className={`w-5 h-5 ${currentPath === '/home' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            </div>
            <span className="text-[11px] leading-tight mt-0.5 truncate">{t('nav.home')}</span>
            {currentPath === '/home' && <span className="w-1.5 h-1.5 bg-kumkum rounded-full mt-0.5" />}
          </button>

          {/* 2. Expenses */}
          <button
            onClick={() => navigate('/expenses')}
            className={`flex-1 flex flex-col items-center justify-center min-w-[50px] py-1 px-1 rounded-2xl transition-all ${
              currentPath.startsWith('/expenses')
                ? 'text-kumkum font-bold'
                : 'text-warmBrown-muted hover:text-warmBrown font-medium'
            }`}
            aria-current={currentPath.startsWith('/expenses') ? 'page' : undefined}
          >
            <div
              className={`flex items-center justify-center w-9 h-7 rounded-full transition-colors ${
                currentPath.startsWith('/expenses') ? 'bg-kumkum-100 text-kumkum' : 'text-warmBrown-muted'
              }`}
            >
              <Receipt className={`w-5 h-5 ${currentPath.startsWith('/expenses') ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            </div>
            <span className="text-[11px] leading-tight mt-0.5 truncate">{t('nav.expenses')}</span>
            {currentPath.startsWith('/expenses') && <span className="w-1.5 h-1.5 bg-kumkum rounded-full mt-0.5" />}
          </button>

          {/* 3. Center Big Mic Action: Add Expense */}
          <div className="relative -top-3 flex flex-col items-center">
            <button
              onClick={() => navigate('/add?mode=voice')}
              className="w-14 h-14 rounded-full bg-gradient-to-tr from-kumkum to-kumkum-dark hover:from-kumkum-dark hover:to-[#700B41] text-white shadow-kumkum-glow/60 flex items-center justify-center border-3 border-white active:scale-95 transition-transform"
              aria-label={t('nav.add')}
            >
              <Mic className="w-7 h-7 animate-pulse-subtle" />
            </button>
            <span className="text-[11px] font-extrabold text-kumkum mt-0.5 leading-tight">
              {t('nav.add')}
            </span>
          </div>

          {/* 4. Quest */}
          <button
            onClick={() => navigate('/quest')}
            className={`flex-1 flex flex-col items-center justify-center min-w-[50px] py-1 px-1 rounded-2xl transition-all ${
              currentPath.startsWith('/quest')
                ? 'text-kumkum font-bold'
                : 'text-warmBrown-muted hover:text-warmBrown font-medium'
            }`}
            aria-current={currentPath.startsWith('/quest') ? 'page' : undefined}
          >
            <div
              className={`flex items-center justify-center w-9 h-7 rounded-full transition-colors ${
                currentPath.startsWith('/quest') ? 'bg-kumkum-100 text-kumkum' : 'text-warmBrown-muted'
              }`}
            >
              <Target className={`w-5 h-5 ${currentPath.startsWith('/quest') ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            </div>
            <span className="text-[11px] leading-tight mt-0.5 truncate">{t('nav.quest')}</span>
            {currentPath.startsWith('/quest') && <span className="w-1.5 h-1.5 bg-kumkum rounded-full mt-0.5" />}
          </button>

          {/* 5. More */}
          <button
            onClick={() => setIsMoreOpen(true)}
            className="flex-1 flex flex-col items-center justify-center min-w-[50px] py-1 px-1 rounded-2xl text-warmBrown-muted hover:text-warmBrown font-medium transition-all"
            aria-label={t('nav.more')}
          >
            <div className="flex items-center justify-center w-9 h-7 rounded-full text-warmBrown-muted hover:bg-cream">
              <Menu className="w-5 h-5 stroke-[1.8]" />
            </div>
            <span className="text-[11px] leading-tight mt-0.5 truncate">{t('nav.more')}</span>
          </button>
        </div>
      </nav>

      <MoreSheet isOpen={isMoreOpen} onClose={() => setIsMoreOpen(false)} />
    </>
  );
};
