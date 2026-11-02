// API-Key, Kurs-Zwischenspeicher und Tageszähler. Der Key bleibt nur auf diesem Gerät.
import type { FxUsage, RateSnapshot } from '../agents/fxConverter';
import { readJson, writeJson } from './kv';

const K = { key: 'fixkosten.v1.fx.key', cache: 'fixkosten.v1.fx.cache', usage: 'fixkosten.v1.fx.usage' };

export function loadFxKey(): string | null {
  const v = readJson(K.key);
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}
export const saveFxKey = (key: string) => writeJson(K.key, key.trim());
export function removeFxKey(): void {
  try {
    localStorage.removeItem(K.key);
  } catch {
    /* ignorieren */
  }
}

export function loadFxCache(): RateSnapshot | null {
  const v = readJson(K.cache) as Partial<RateSnapshot> | undefined;
  if (!v || typeof v.fetchedAt !== 'number' || !v.rates || typeof v.rates !== 'object') return null;
  return { fetchedAt: v.fetchedAt, rates: v.rates as RateSnapshot['rates'] };
}
export const saveFxCache = (s: RateSnapshot) => writeJson(K.cache, s);

export function loadFxUsage(): FxUsage {
  const v = readJson(K.usage) as Partial<FxUsage> | undefined;
  if (v && typeof v.day === 'string' && typeof v.count === 'number') return { day: v.day, count: v.count };
  return { day: '', count: 0 };
}
export const saveFxUsage = (u: FxUsage) => writeJson(K.usage, u);
