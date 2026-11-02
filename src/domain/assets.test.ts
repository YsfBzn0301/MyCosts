import { describe, expect, it } from 'vitest';
import { GRAMS_PER_TROY_OUNCE, assetValueCents } from './assets';
import { computeNetWorth } from './portfolio';
import type { Asset, SavingsAccount } from './types';

const gold10g: Asset = { id: 'g', kind: 'metal', code: 'XAU', quantity: 10, unit: 'g', createdAt: '' };
const usd100: Asset = { id: 'u', kind: 'currency', code: 'USD', quantity: 100, createdAt: '' };

describe('assetValueCents', () => {
  it('rechnet Gramm über Feinunzen in Euro um (Kurs = Einheiten je 1 EUR)', () => {
    const rates = { XAU: 1 / 3000 }; // 1 Feinunze = 3000 EUR
    const expected = Math.round((10 / GRAMS_PER_TROY_OUNCE) * 3000 * 100);
    expect(assetValueCents(gold10g, rates)).toBe(expected);
  });

  it('rechnet Fremdwährung über den Kurs um', () => {
    expect(assetValueCents(usd100, { USD: 1.25 })).toBe(8000);
  });

  it('liefert null ohne Kurs', () => {
    expect(assetValueCents(usd100, null)).toBeNull();
    expect(assetValueCents(usd100, { GBP: 0.8 })).toBeNull();
  });
});

describe('computeNetWorth', () => {
  const savings: SavingsAccount[] = [{ id: 's1', name: 'Notgroschen', balanceCents: 500000, createdAt: '', updatedAt: '' }];

  it('summiert Girokonto, Sparkonten und Bestände', () => {
    const nw = computeNetWorth({ checkingCents: 200000, savings, assets: [usd100], rates: { USD: 1.25 } });
    expect(nw.totalCents).toBe(200000 + 500000 + 8000);
    expect(nw.assetsKnown).toBe(true);
  });

  it('markiert Vermögen als unvollständig, solange Kurse fehlen', () => {
    const nw = computeNetWorth({ checkingCents: 200000, savings, assets: [usd100], rates: null });
    expect(nw.assetsKnown).toBe(false);
    expect(nw.totalCents).toBe(700000);
  });
});
