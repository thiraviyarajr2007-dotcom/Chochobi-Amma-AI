import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import taDict from './ta.json';
import enDict from './en.json';
import { Language } from '../types';

type Dictionaries = typeof taDict;

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: string, fallback?: string) => string;
  formatRupee: (amount: number) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Helper to look up dot-notated keys e.g. "home.greeting"
function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = (current as Record<string, unknown>)[k];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('chocobi_lang');
    return saved === 'en' ? 'en' : 'ta'; // Default to Tamil
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('chocobi_lang', newLang);
    document.documentElement.lang = newLang;
  };

  const toggleLang = () => {
    setLang(lang === 'ta' ? 'en' : 'ta');
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key: string, fallback?: string): string => {
    const dict = (lang === 'en' ? enDict : taDict) as unknown as Record<string, unknown>;
    const value = getNestedValue(dict, key);
    if (value !== undefined) {
      return value;
    }
    // Fallback to other language or provided fallback
    const fallbackDict = (lang === 'en' ? taDict : enDict) as unknown as Record<string, unknown>;
    const fallbackVal = getNestedValue(fallbackDict, key);
    return fallbackVal || fallback || key;
  };

  const formatRupee = (amount: number): string => {
    // Format according to Indian Numbering format (e.g. 1,50,000)
    return '₹' + amount.toLocaleString('en-IN');
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, toggleLang, t, formatRupee }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

