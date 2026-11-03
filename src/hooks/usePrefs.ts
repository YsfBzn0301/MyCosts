import { useCallback, useEffect, useState } from 'react';
import type { Lang, Prefs, Theme } from '../domain/types';
import { loadPrefs, savePrefs } from '../storage/portfolioRepository';

/** Ist das Design dunkel? „system“ folgt dem Gerät, sonst zählt nur der Schalter. */
function resolveDark(theme: Theme): boolean {
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function usePrefs() {
  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs());

  useEffect(() => {
    savePrefs(prefs);
  }, [prefs]);

  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const dark = resolveDark(prefs.theme);
      root.classList.toggle('dark', dark);
      // Farbe der Statusleiste (iOS/Android) an das gewählte Design anpassen.
      document.getElementById('theme-color')?.setAttribute('content', dark ? '#151417' : '#f6f3ee');
    };
    apply();
    if (prefs.theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [prefs.theme]);

  const setLang = useCallback((lang: Lang) => setPrefs((p) => ({ ...p, lang })), []);
  const setTheme = useCallback((theme: Theme) => setPrefs((p) => ({ ...p, theme })), []);

  return { prefs, setLang, setTheme };
}
