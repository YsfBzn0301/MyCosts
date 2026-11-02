/**
 * Gesamtvermögen aus manuellen Ständen und Kursen. Rein, ohne Storage.
 */
import { assetValueCents, type RateTable } from './assets';
import type { Asset, SavingsAccount } from './types';

export interface Slice {
  key: string;
  cents: number;
}

export interface NetWorth {
  checkingCents: number;
  savingsCents: number;
  assetsCents: number;
  /** false, solange Kurse fehlen. Dann ist assetsCents 0 und nicht vollständig. */
  assetsKnown: boolean;
  totalCents: number;
  slices: Slice[];
}

export function computeNetWorth(input: {
  checkingCents: number;
  savings: SavingsAccount[];
  assets: Asset[];
  rates: RateTable | null;
}): NetWorth {
  const savingsCents = input.savings.reduce((s, a) => s + a.balanceCents, 0);
  let assetsCents = 0;
  let assetsKnown = true;
  const assetSlices: Slice[] = [];

  for (const asset of input.assets) {
    const value = assetValueCents(asset, input.rates);
    if (value === null) {
      assetsKnown = false;
      continue;
    }
    assetsCents += value;
    assetSlices.push({ key: asset.code, cents: value });
  }
  if (input.assets.length === 0) assetsKnown = true;

  const slices: Slice[] = [];
  if (input.checkingCents > 0) slices.push({ key: 'checking', cents: input.checkingCents });
  for (const a of input.savings) {
    if (a.balanceCents > 0) slices.push({ key: `savings:${a.id}`, cents: a.balanceCents });
  }
  slices.push(...assetSlices.filter((s) => s.cents > 0));

  return {
    checkingCents: input.checkingCents,
    savingsCents,
    assetsCents,
    assetsKnown,
    totalCents: input.checkingCents + savingsCents + assetsCents,
    slices,
  };
}
