import { PAYMENTS_PER_YEAR, type FixedCost } from './types';

import { eurFormat } from './locale';

export function formatEUR(cents: number): string {
  return eurFormat().format(cents / 100);
}

/**
 * Parst deutsche Beträge ("12,99", "1.200,50", "12.99") in Cent.
 * Gibt null zurück, wenn der Wert ungültig oder nicht positiv ist.
 */
export interface AmountOptions {
  allowZero?: boolean;
  allowNegative?: boolean;
}

export function parseAmountToCents(input: string, opts: AmountOptions = {}): number | null {
  let s = input.trim().replace(/\s/g, '');
  const negative = s.startsWith('-');
  if (negative) {
    if (!opts.allowNegative) return null;
    s = s.slice(1);
  }
  if (s.includes(',')) {
    // Deutsches Format: Punkte sind Tausendertrenner, Komma ist Dezimaltrenner.
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    // "1.000" oder "2.850.000": Punkt als Tausendertrenner (drei Ziffern danach ist nie ein Dezimalbruch).
    s = s.replace(/\./g, '');
  }
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(s)) return null;
  const cents = Math.round(Number(s) * 100);
  if (cents === 0 && !opts.allowZero) return null;
  return negative ? -cents : cents;
}

/** Cent-Betrag als Eingabestring im deutschen Format, z. B. 1299 → "12,99". */
export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',');
}

export function yearlyCents(cost: Pick<FixedCost, 'amountCents' | 'interval'>): number {
  return cost.amountCents * PAYMENTS_PER_YEAR[cost.interval];
}

/** Monatlicher Anteil. Gerundet auf ganze Cent. */
export function monthlyCents(cost: Pick<FixedCost, 'amountCents' | 'interval'>): number {
  return Math.round(yearlyCents(cost) / 12);
}
