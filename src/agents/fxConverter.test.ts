import { describe, expect, it, vi } from 'vitest';
import { DAILY_REQUEST_BUDGET, RATE_TTL_MS, buildRatesUrl, dayKey, fetchRates, parseRates } from './fxConverter';

const CODES = ['XAU', 'USD'];
const NOW = new Date(2026, 10, 2, 12).getTime();
const freshUsage = { day: dayKey(NOW), count: 0 };
const okResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('parseRates', () => {
  it('übernimmt nur gültige positive Kurse', () => {
    expect(parseRates({ results: { XAU: 0.00032, USD: 1.08, GBP: 'x' } }, CODES)).toEqual({ XAU: 0.00032, USD: 1.08 });
    expect(parseRates({ results: { XAU: -1 } }, CODES)).toBeNull();
    expect(parseRates({ nope: true }, CODES)).toBeNull();
  });
});

describe('buildRatesUrl', () => {
  it('nutzt Basiswährung EUR und hängt den Key an', () => {
    const url = buildRatesUrl('abc', CODES);
    expect(url).toContain('from=EUR');
    expect(url).toContain('to=XAU%2CUSD');
    expect(url).toContain('api_key=abc');
  });
});

describe('fetchRates', () => {
  it('ohne Key gibt es keinen Abruf', async () => {
    const f = vi.fn();
    const r = await fetchRates({ apiKey: null, codes: CODES, now: NOW, cache: null, usage: freshUsage, online: true, fetchImpl: f });
    expect(r).toMatchObject({ ok: false, error: 'noKey' });
    expect(f).not.toHaveBeenCalled();
  });

  it('nutzt frischen Zwischenspeicher ohne Netzwerkaufruf', async () => {
    const f = vi.fn();
    const cache = { fetchedAt: NOW - 1000, rates: { XAU: 0.0003, USD: 1.1 } };
    const r = await fetchRates({ apiKey: 'k', codes: CODES, now: NOW, cache, usage: freshUsage, online: true, fetchImpl: f });
    expect(r).toMatchObject({ ok: true, fromCache: true });
    expect(f).not.toHaveBeenCalled();
  });

  it('ruft ab, wenn der Cache abgelaufen ist, und zählt das Kontingent', async () => {
    const f = vi.fn(async () => okResponse({ results: { XAU: 0.0003, USD: 1.09 } }));
    const cache = { fetchedAt: NOW - RATE_TTL_MS - 1, rates: { XAU: 0.0004, USD: 1.1 } };
    const r = await fetchRates({ apiKey: 'k', codes: CODES, now: NOW, cache, usage: freshUsage, online: true, fetchImpl: f });
    expect(r).toMatchObject({ ok: true, fromCache: false, usage: { count: 1 } });
    expect(f).toHaveBeenCalledOnce();
  });

  it('meldet abgelehnte Keys und behält den alten Stand', async () => {
    const cache = { fetchedAt: 0, rates: { XAU: 0.0004, USD: 1.1 } };
    const f = async () => new Response('', { status: 401 });
    const r = await fetchRates({ apiKey: 'bad', codes: CODES, now: NOW, cache, usage: freshUsage, online: true, fetchImpl: f });
    expect(r).toMatchObject({ ok: false, error: 'invalidKey', snapshot: cache });
  });

  it('stoppt bei aufgebrauchtem Tagesbudget ohne Abruf', async () => {
    const f = vi.fn();
    const usage = { day: dayKey(NOW), count: DAILY_REQUEST_BUDGET };
    const r = await fetchRates({ apiKey: 'k', codes: CODES, now: NOW, cache: null, usage, online: true, fetchImpl: f });
    expect(r).toMatchObject({ ok: false, error: 'limit' });
    expect(f).not.toHaveBeenCalled();
  });

  it('erkennt Netzfehler und offline', async () => {
    const f = async () => {
      throw new TypeError('fail');
    };
    const r1 = await fetchRates({ apiKey: 'k', codes: CODES, now: NOW, cache: null, usage: freshUsage, online: true, fetchImpl: f });
    expect(r1).toMatchObject({ ok: false, error: 'network' });
    const r2 = await fetchRates({ apiKey: 'k', codes: CODES, now: NOW, cache: null, usage: freshUsage, online: false });
    expect(r2).toMatchObject({ ok: false, error: 'network' });
  });
});
