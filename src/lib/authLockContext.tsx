import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { isPinSetup } from './security';

interface AuthLockContextType {
  isUnlocked: boolean;
  hasPin: boolean;
  hasLang: boolean;
  unlockApp: (customReturnTo?: string) => string;
  lockApp: (requestedPath?: string) => void;
  refreshPinStatus: () => Promise<boolean>;
}

const AuthLockContext = createContext<AuthLockContextType | undefined>(undefined);

const RETURN_TO_KEY = 'chocobi_return_to';

export const AuthLockProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [hasLang, setHasLang] = useState<boolean>(() => {
    return !!localStorage.getItem('chocobi_lang');
  });

  const [hasPin, setHasPin] = useState<boolean>(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  const refreshPinStatus = async (): Promise<boolean> => {
    const pinExists = await isPinSetup();
    setHasPin(pinExists);
    return pinExists;
  };

  useEffect(() => {
    async function init() {
      const pinExists = await isPinSetup();
      setHasPin(pinExists);

      // Dev route bypass: if #design or /design, allow immediate unlock
      if (window.location.pathname === '/design' || window.location.hash === '#design') {
        setIsUnlocked(true);
      }

      setIsInitialized(true);
    }
    init();
  }, []);

  // Auto-lock when tab has been hidden for > 60 seconds
  useEffect(() => {
    let hiddenAt: number | null = null;

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
      } else if (document.visibilityState === 'visible') {
        if (hiddenAt && Date.now() - hiddenAt >= 60000) {
          // Locked after 60s in background
          if (window.location.pathname !== '/design' && window.location.hash !== '#design') {
            const current = window.location.pathname + window.location.search;
            if (current !== '/lock' && current !== '/welcome' && current !== '/setup-pin') {
              sessionStorage.setItem(RETURN_TO_KEY, current);
            }
            setIsUnlocked(false);
          }
        }
        hiddenAt = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const unlockApp = (customReturnTo?: string): string => {
    setIsUnlocked(true);
    const target = customReturnTo || sessionStorage.getItem(RETURN_TO_KEY) || '/home';
    sessionStorage.removeItem(RETURN_TO_KEY);
    return target;
  };

  const lockApp = (requestedPath?: string) => {
    if (requestedPath && requestedPath !== '/lock' && requestedPath !== '/welcome') {
      sessionStorage.setItem(RETURN_TO_KEY, requestedPath);
    }
    setIsUnlocked(false);
  };

  return (
    <AuthLockContext.Provider
      value={{
        isUnlocked,
        hasPin,
        hasLang,
        unlockApp,
        lockApp,
        refreshPinStatus,
      }}
    >
      {isInitialized ? children : null}
    </AuthLockContext.Provider>
  );
};

export const useAuthLock = (): AuthLockContextType => {
  const ctx = useContext(AuthLockContext);
  if (!ctx) {
    throw new Error('useAuthLock must be used within an AuthLockProvider');
  }
  return ctx;
};

