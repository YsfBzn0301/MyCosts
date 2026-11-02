/**
 * Agent 2 – Asset & Currency Converter (fastFOREX).
 *
 * Holt Kurse, cached sie und begrenzt die Abrufe pro Tag auf der Client-Seite.
 * Rein deterministisch: kein Sprachmodell nötig. Der API-Key verlässt das Gerät nur
 * in Richtung fastFOREX und wird nie protokolliert.
 */
import type { RateTable } from '../domain/assets';

export const FX_BASE = 'EUR';
/** Kurse gelten zehn Minuten als frisch. Danach wird neu abgerufen. */
export const RATE_TTL_MS = 10 * 60 * 1000;
/** Sicherheitsgrenze gegen unnötig viele Abrufe pro Tag (Kostenschutz im Free-Tarif). */
export const DAILY_REQUEST_BUDGET = 40;

export interface RateSnapshot {
  fetchedAt: number;
  rates: RateTable;
}

export interface FxUsage {
  day: string;
  count: number;
}

export type FxError = 'noKey' | 'invalidKey' | 'limit' | 'network' | 'format';

export type FxResult =
  | { ok: true; snapshot: RateSnapshot; fromCache: boolean; usage: FxUsage }
  | { ok: false; error: FxError; snapshot: RateSnapshot | null; usage: FxUsage };

export function dayKey(now: number): string {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Liest "results" aus der Antwort. Nur endliche positive Zahlen werden übernommen. */
export function parseRates(json: unknown, codes: readonly string[]): RateTable | null {
  if (!json || typeof json !== 'object') return null;
  const results = (json as { results?: unknown }).results;
  if (!results || typeof results !== 'object') return null;
  const table: RateTable = {};
  for (const code of codes) {
    const value = (results as Record<string, unknown>)[code];
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) table[code] = value;
  }
  return Object.keys(table).length > 0 ? table : null;
}

export function buildRatesUrl(apiKey: string, codes: readonly string[]): string {
  const params = new URLSearchParams({ from: FX_BASE, to: codes.join(','), api_key: apiKey });
  return `https://api.fastforex.io/fetch-multi?${params.toString()}`;
}

export interface FetchArgs {
  apiKey: string | null;
  codes: readonly string[];
  now: number;
  cache: RateSnapshot | null;
  usage: FxUsage;
  online: boolean;
  /** Ignoriert den Zwischenspeicher, z. B. bei „Kurse aktualisieren“. Tagesbudget gilt trotzdem. */
  force?: boolean;
  fetchImpl?: typeof fetch;
}

export async function fetchRates(args: FetchArgs): Promise<FxResult> {
  const { apiKey, codes, now, cache, online, force } = args;
  const today = dayKey(now);
  const usage: FxUsage = args.usage.day === today ? args.usage : { day: today, count: 0 };

  if (!apiKey) return { ok: false, error: 'noKey', snapshot: cache, usage };

  if (!force && cache && now - cache.fetchedAt < RATE_TTL_MS) {
    return { ok: true, snapshot: cache, fromCache: true, usage };
  }

  if (!online) return { ok: false, error: 'network', snapshot: cache, usage };

  if (usage.count >= DAILY_REQUEST_BUDGET) {
    // Heutiges Budget aufgebraucht: vorhandenen Stand weiterverwenden, sonst Fehler.
    if (cache) return { ok: true, snapshot: cache, fromCache: true, usage };
    return { ok: false, error: 'limit', snapshot: null, usage };
  }

  let response: Response;
  try {
    response = await (args.fetchImpl ?? fetch)(buildRatesUrl(apiKey, codes), { method: 'GET' });
  } catch {
    return { ok: false, error: 'network', snapshot: cache, usage };
  }

  const nextUsage = { ...usage, count: usage.count + 1 };
  if (response.status === 401 || response.status === 403) return { ok: false, error: 'invalidKey', snapshot: cache, usage: nextUsage };
  if (response.status === 429) return { ok: false, error: 'limit', snapshot: cache, usage: nextUsage };
  if (!response.ok) return { ok: false, error: 'network', snapshot: cache, usage: nextUsage };

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    return { ok: false, error: 'format', snapshot: cache, usage: nextUsage };
  }
  const rates = parseRates(json, codes);
  if (!rates) return { ok: false, error: 'format', snapshot: cache, usage: nextUsage };

  return { ok: true, snapshot: { fetchedAt: now, rates }, fromCache: false, usage: nextUsage };
}
