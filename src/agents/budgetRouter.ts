/**
 * Agent 1 – Budget & Cashflow Router.
 * Formularvalidierung (Einnahmen, Einstellungen), CRUD für Einnahmen und das Routing
 * über den Cashflow-Kern. Fehler sind Übersetzungsschlüssel. Kein Sprachmodell nötig.
 */
import { parseAmountToCents } from '../domain/money';
import { computeCashflow, type CashflowInput, type CashflowResult } from '../domain/cashflow';
import type { CashSettings, Income, IncomeValues } from '../domain/types';

export function routeBudget(input: CashflowInput): CashflowResult {
  return computeCashflow(input);
}

// ---------- Einnahmen ----------

export interface IncomeDraft {
  name: string;
  amount: string;
  payDay: string;
}

export type IncomeErrors = Partial<Record<keyof IncomeDraft, string>>;

export function emptyIncomeDraft(): IncomeDraft {
  return { name: '', amount: '', payDay: '1' };
}

export function validateIncome(
  draft: IncomeDraft,
): { ok: true; values: IncomeValues } | { ok: false; errors: IncomeErrors } {
  const errors: IncomeErrors = {};
  const name = draft.name.trim();
  if (!name) errors.name = 'err.required';
  else if (name.length > 60) errors.name = 'err.nameLength';

  const amountCents = parseAmountToCents(draft.amount);
  if (amountCents === null) errors.amount = 'err.amount';

  const payDay = /^\d{1,2}$/.test(draft.payDay.trim()) ? Number(draft.payDay.trim()) : NaN;
  if (!(payDay >= 1 && payDay <= 31)) errors.payDay = 'err.payDay';

  if (Object.keys(errors).length || amountCents === null) return { ok: false, errors };
  return { ok: true, values: { name, amountCents, payDay } };
}

export function addIncome(list: Income[], values: IncomeValues, now = new Date()): Income[] {
  const stamp = now.toISOString();
  return [...list, { ...values, id: crypto.randomUUID(), createdAt: stamp, updatedAt: stamp }];
}

export function removeIncome(list: Income[], id: string): Income[] {
  return list.filter((i) => i.id !== id);
}

// ---------- Girokonto & Verbrauch ----------

export interface SettingsDraft {
  balance: string;
  monthlySpend: string;
  safety: string;
}

export type SettingsErrors = Partial<Record<keyof SettingsDraft, string>>;

export function draftFromSettings(s: CashSettings): SettingsDraft {
  const fmt = (cents: number) => (cents / 100).toFixed(2).replace('.', ',');
  return { balance: fmt(s.balanceCents), monthlySpend: fmt(s.monthlySpendCents), safety: fmt(s.safetyCents) };
}

export function validateSettings(
  draft: SettingsDraft,
): { ok: true; values: CashSettings } | { ok: false; errors: SettingsErrors } {
  const errors: SettingsErrors = {};
  const balanceCents = parseAmountToCents(draft.balance, { allowZero: true, allowNegative: true });
  if (balanceCents === null) errors.balance = 'err.balance';

  const monthlySpendCents = parseAmountToCents(draft.monthlySpend, { allowZero: true });
  if (monthlySpendCents === null) errors.monthlySpend = 'err.amountZeroOk';

  const safetyCents = parseAmountToCents(draft.safety, { allowZero: true });
  if (safetyCents === null) errors.safety = 'err.amountZeroOk';

  if (Object.keys(errors).length || balanceCents === null || monthlySpendCents === null || safetyCents === null) {
    return { ok: false, errors };
  }
  return { ok: true, values: { balanceCents, monthlySpendCents, safetyCents } };
}
