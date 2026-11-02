import type { Asset, CurrencyCode, MetalCode } from './types';

/** Gramm je Feinunze (troy ounce). */
export const GRAMS_PER_TROY_OUNCE = 31.1034768;

/** Kurse liegen als "Einheiten je 1 EUR" vor. Umrechnung: Menge / Kurs = Wert in EUR. */
export type RateTable = Record<string, number>;

export const METAL_CODES: MetalCode[] = ['XAU', 'XAG'];
export const CURRENCY_CODES: CurrencyCode[] = ['USD', 'GBP', 'CHF', 'TRY', 'JPY', 'PLN'];

/** Menge in der Einheit, in der der Kurs gilt (Feinunzen bei Metallen, Einheiten bei Währungen). */
export function quantityInRateUnits(asset: Asset): number {
  if (asset.kind === 'currency') return asset.quantity;
  return asset.unit === 'g' ? asset.quantity / GRAMS_PER_TROY_OUNCE : asset.quantity;
}

/** Wert eines Bestands in Cent, oder null wenn der Kurs fehlt oder ungültig ist. */
export function assetValueCents(asset: Asset, rates: RateTable | null): number | null {
  if (!rates) return null;
  const rate = rates[asset.code];
  if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) return null;
  return Math.round((quantityInRateUnits(asset) / rate) * 100);
}

export function assetLabelCode(asset: Asset): string {
  return asset.code;
}
