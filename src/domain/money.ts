import { PAYMENTS_PER_YEAR, type FixedCost } from './types';

const eur = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

export function formatEUR(cents: number): string {
  return eur.format(cents / 100);
}

/**
 * Parst deutsche Beträge ("12,99", "1.200,50", "12.99") in Cent.
 * Gibt null zurück, wenn der Wert ungültig oder nicht positiv ist.
 */
export function parseAmountToCents(input: string): number | null {
  let s = input.trim().replace(/\s/g, '');
  if (s.includes(',')) {
    // Deutsches Format: Punkte sind Tausendertrenner, Komma ist Dezimaltrenner.
    s = s.replace(/\./g, '').replace(',', '.');
  }
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(s)) return null;
  const cents = Math.round(Number(s) * 100);
  return cents > 0 ? cents : null;
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
