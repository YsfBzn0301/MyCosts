import { createContext, useContext, useEffect, type ReactNode } from 'react';
import de from './de.json';
import en from './en.json';
import tr from './tr.json';
import type { Lang } from '../domain/types';
import { setLocale } from '../domain/locale';

const DICTIONARIES: Record<Lang, Record<string, string>> = { de, en, tr };
export const LOCALES: Record<Lang, string> = { de: 'de-DE', en: 'en-GB', tr: 'tr-TR' };
export const LANG_NAMES: Record<Lang, string> = { de: 'Deutsch', en: 'English', tr: 'Türkçe' };

export type TFn = (key: string, vars?: Record<string, string | number>) => string;

/** Übersetzt einen Schlüssel. Fehlt er, wird Deutsch genommen, dann der Schlüssel selbst. */
export function translate(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  const raw = DICTIONARIES[lang][key] ?? DICTIONARIES.de[key] ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

interface Ctx {
  lang: Lang;
  t: TFn;
  setLang: (lang: Lang) => void;
}

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ lang, setLang, children }: { lang: Lang; setLang: (l: Lang) => void; children: ReactNode }) {
  // Zahlen- und Datumsformat folgen der Sprache. Die Logik im Domain-Layer liest es von dort.
  setLocale(LOCALES[lang]);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value: Ctx = {
    lang,
    setLang,
    t: (key, vars) => translate(lang, key, vars),
  };
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n muss innerhalb von I18nProvider genutzt werden');
  return ctx;
}
