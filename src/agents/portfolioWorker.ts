/**
 * Agent 1 (Erweiterung) – Vermögens-Daten.
 * Validierung und CRUD für Sparkonten, Bestände und manuelle Buchungen,
 * sowie die Verbuchung einer Buchung auf Girokonto oder Sparkonto. Deterministisch.
 */
import { parseAmountToCents } from '../domain/money';
import { CURRENCY_CODES, METAL_CODES } from '../domain/assets';
import type { Asset, CurrencyCode, MetalCode, SavingsAccount, Transaction } from '../domain/types';

/** Asset ohne id und Zeitstempel, bleibt über die Union erhalten. */
export type NewAsset = Asset extends infer A ? (A extends Asset ? Omit<A, 'id' | 'createdAt'> : never) : never;

export const CHECKING_ID = 'checking';

// ---------- Sparkonten ----------

export interface SavingsDraft {
  name: string;
  balance: string;
}

export function validateSavings(d: SavingsDraft): { ok: true; values: { name: string; balanceCents: number } } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const name = d.name.trim();
  if (!name) errors.name = 'err.required';
  else if (name.length > 60) errors.name = 'err.nameLength';
  const balanceCents = parseAmountToCents(d.balance, { allowZero: true });
  if (balanceCents === null) errors.balance = 'err.amountZeroOk';
  if (Object.keys(errors).length || balanceCents === null) return { ok: false, errors };
  return { ok: true, values: { name, balanceCents } };
}

export function addSavings(list: SavingsAccount[], name: string, balanceCents: number, now = new Date()): SavingsAccount[] {
  const stamp = now.toISOString();
  return [...list, { id: crypto.randomUUID(), name, balanceCents, createdAt: stamp, updatedAt: stamp }];
}

// ---------- Bestände ----------

export interface AssetDraft {
  kind: 'metal' | 'currency';
  code: string;
  quantity: string;
  unit: 'g' | 'oz';
}

export function emptyAssetDraft(): AssetDraft {
  return { kind: 'metal', code: 'XAU', quantity: '', unit: 'g' };
}

export function parseQuantity(input: string): number | null {
  const s = input.trim().replace(',', '.');
  if (!/^\d{1,7}(\.\d{1,4})?$/.test(s)) return null;
  const n = Number(s);
  return n > 0 ? n : null;
}

export function validateAsset(d: AssetDraft): { ok: true; value: NewAsset } | { ok: false; error: string } {
  const quantity = parseQuantity(d.quantity);
  if (quantity === null) return { ok: false, error: 'assets.quantityErr' };
  if (d.kind === 'metal') {
    if (!(METAL_CODES as string[]).includes(d.code)) return { ok: false, error: 'err.required' };
    return { ok: true, value: { kind: 'metal', code: d.code as MetalCode, quantity, unit: d.unit } };
  }
  if (!(CURRENCY_CODES as string[]).includes(d.code)) return { ok: false, error: 'err.required' };
  return { ok: true, value: { kind: 'currency', code: d.code as CurrencyCode, quantity } };
}

export function addAsset(list: Asset[], value: NewAsset, now = new Date()): Asset[] {
  return [...list, { ...value, id: crypto.randomUUID(), createdAt: now.toISOString() } as Asset];
}

export function removeAsset(list: Asset[], id: string): Asset[] {
  return list.filter((a) => a.id !== id);
}

// ---------- Buchungen ----------

/** Wendet eine Buchung auf die Kontostände an. Gibt neue Stände zurück. */
export function applyTransaction(
  tx: Transaction,
  checkingCents: number,
  savings: SavingsAccount[],
  now = new Date(),
): { checkingCents: number; savings: SavingsAccount[] } {
  if (tx.accountId === CHECKING_ID) {
    return { checkingCents: checkingCents + tx.amountCents, savings };
  }
  const stamp = now.toISOString();
  return {
    checkingCents,
    savings: savings.map((a) =>
      a.id === tx.accountId ? { ...a, balanceCents: a.balanceCents + tx.amountCents, updatedAt: stamp } : a,
    ),
  };
}

export function buildTransaction(input: {
  direction: 'in' | 'out';
  amount: string;
  accountId: string;
  note: string;
  date: Date;
}): { ok: true; value: Transaction } | { ok: false; error: string } {
  const cents = parseAmountToCents(input.amount);
  if (cents === null) return { ok: false, error: 'err.amount' };
  const d = input.date;
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return {
    ok: true,
    value: {
      id: crypto.randomUUID(),
      date,
      accountId: input.accountId,
      amountCents: input.direction === 'out' ? -cents : cents,
      note: input.note.trim().slice(0, 80),
    },
  };
}
