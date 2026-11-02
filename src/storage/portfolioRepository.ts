import type { Asset, NetWorthPoint, SavingsAccount, Transaction, Prefs, Lang, Theme } from '../domain/types';
import { isAsset, isPoint, isSavingsAccount, isTransaction } from '../agents/uiDataWorker';
import { readJson, readList, writeJson } from './kv';

const K = {
  savings: 'fixkosten.v1.savings',
  assets: 'fixkosten.v1.assets',
  transactions: 'fixkosten.v1.transactions',
  history: 'fixkosten.v1.history',
  prefs: 'fixkosten.v1.prefs',
};

export const loadSavings = (): SavingsAccount[] => readList(K.savings, isSavingsAccount);
export const saveSavings = (v: SavingsAccount[]) => writeJson(K.savings, v);

export const loadAssets = (): Asset[] => readList(K.assets, isAsset);
export const saveAssets = (v: Asset[]) => writeJson(K.assets, v);

export const loadTransactions = (): Transaction[] => readList(K.transactions, isTransaction);
export const saveTransactions = (v: Transaction[]) => writeJson(K.transactions, v);

export const loadHistory = (): NetWorthPoint[] => readList(K.history, isPoint);
export const saveHistory = (v: NetWorthPoint[]) => writeJson(K.history, v);

const LANGS: Lang[] = ['de', 'en', 'tr'];
const THEMES: Theme[] = ['light', 'dark', 'system'];

/** Sprache und Darstellung. Ohne gespeicherten Wert: Gerätesprache, helles Design. */
export function loadPrefs(): Prefs {
  const raw = readJson(K.prefs) as Partial<Prefs> | undefined;
  const detected = typeof navigator !== 'undefined' ? navigator.language.slice(0, 2).toLowerCase() : 'de';
  const fallbackLang: Lang = (LANGS as string[]).includes(detected) ? (detected as Lang) : 'de';
  return {
    lang: raw && LANGS.includes(raw.lang as Lang) ? (raw.lang as Lang) : fallbackLang,
    theme: raw && THEMES.includes(raw.theme as Theme) ? (raw.theme as Theme) : 'light',
  };
}

export const savePrefs = (v: Prefs) => writeJson(K.prefs, v);
