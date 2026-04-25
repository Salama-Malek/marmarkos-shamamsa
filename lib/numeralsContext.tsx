import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getSetting, setSetting, SETTINGS_KEYS } from '@/db/settings';
import type { NumeralStyle } from './numerals';

interface NumeralsContextValue {
  style: NumeralStyle;
  setStyle: (s: NumeralStyle) => Promise<void>;
}

const NumeralsContext = createContext<NumeralsContextValue | null>(null);

export function NumeralsProvider({ children }: { children: React.ReactNode }) {
  const [style, setStyleState] = useState<NumeralStyle>('arabic');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const stored = await getSetting(SETTINGS_KEYS.numerals);
      if (cancelled) return;
      if (stored === 'western' || stored === 'arabic') setStyleState(stored);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setStyle = useCallback(async (s: NumeralStyle) => {
    setStyleState(s);
    await setSetting(SETTINGS_KEYS.numerals, s);
  }, []);

  return (
    <NumeralsContext.Provider value={{ style, setStyle }}>
      {children}
    </NumeralsContext.Provider>
  );
}

export function useNumerals(): NumeralsContextValue {
  const ctx = useContext(NumeralsContext);
  if (!ctx) throw new Error('useNumerals must be inside NumeralsProvider');
  return ctx;
}
