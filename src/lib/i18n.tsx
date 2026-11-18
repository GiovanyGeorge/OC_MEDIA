/**
 * Internationalization Context — OC Media Platform
 * Phase 3: Arabic (RTL) + English (LTR) support.
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type Lang = 'ar' | 'en';

interface I18nContextValue {
  lang: Lang;
  isAr: boolean;
  dir: 'rtl' | 'ltr';
  toggleLang: () => void;
  setLang: (l: Lang) => void;
  t: (ar: string, en: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children, initialLang = 'ar' }: { children: ReactNode; initialLang?: Lang }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const toggleLang = useCallback(() => setLangState(l => l === 'ar' ? 'en' : 'ar'), []);
  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const isAr = lang === 'ar';
  const dir = isAr ? 'rtl' as const : 'ltr' as const;
  const t = useCallback((ar: string, en: string) => isAr ? ar : en, [isAr]);

  return (
    <I18nContext.Provider value={{ lang, isAr, dir, toggleLang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
