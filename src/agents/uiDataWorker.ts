/**
 * Agent 1 – Daten-Worker (Fixkosten, Backup).
 * Deterministisch: Validierung, CRUD, Summen, Import/Export. Kein Sprachmodell nötig.
 * Fehler werden als Übersetzungsschlüssel zurückgegeben, die UI übersetzt sie.
 */
import { CATEGORIES, isCategoryId, type CategoryId } from '../domain/categories';
import { parseAmountToCents, yearlyCents } from '../domain/money';
import {
  DEFAULT_SETTINGS,
  type Asset,
  type CashSettings,
  type FixedCost,
  type FixedCostValues,
  type Income,
  type Interval,
  type NetWorthPoint,
  type SavingsAccount,
  type Transaction,
} from '../domain/types';

export interface FormDraft {
  name: string;
  amount: string;
  category: CategoryId | '';
  interval: Interval;
  dueDay: string;
  dueMonth: string;
}

export type FieldErrors = Partial<Record<'name' | 'amount' | 'category' | 'dueDay' | 'dueMonth', string>>;

export type ValidationResult = { ok: true; values: FixedCostValues } | { ok: false; errors: FieldErrors };

export function emptyDraft(): FormDraft {
  return { name: '', amount: '', category: '', interval: 'monthly', dueDay: '1', dueMonth: '1' };
}

export function draftFromCost(cost: FixedCost): FormDraft {
  return {
    name: cost.name,
    amount: (cost.amountCents / 100).toFixed(2).replace('.', ','),
    category: cost.category,
    interval: cost.interval,
    dueDay: String(cost.dueDay),
    dueMonth: String(cost.dueMonth ?? 1),
  };
}

function parseInteger(value: string, min: number, max: number): number | null {
  if (!/^\d{1,2}$/.test(value.trim())) return null;
  const n = Number(value.trim());
  return n >= min && n <= max ? n : null;
}

export function validateDraft(draft: FormDraft): ValidationResult {
  const errors: FieldErrors = {};
  const name = draft.name.trim();
  if (name.length === 0) errors.name = 'err.required';
  else if (name.length > 60) errors.name = 'err.nameLength';

  const amountCents = parseAmountToCents(draft.amount);
  if (amountCents === null) errors.amount = 'err.amount';

  if (!isCategoryId(draft.category)) errors.category = 'err.category';

  const dueDay = parseInteger(draft.dueDay, 1, 31);
  if (dueDay === null) errors.dueDay = 'err.day';

  let dueMonth: number | undefined;
  if (draft.interval !== 'monthly') {
    const m = parseInteger(draft.dueMonth, 1, 12);
    if (m === null) errors.dueMonth = 'err.month';
    else dueMonth = m;
  }

  if (Object.keys(errors).length > 0 || amountCents === null || !isCategoryId(draft.category) || dueDay === null) {
    return { ok: false, errors };
  }
  return {
    ok: true,
    values: {
      name,
      amountCents,
      category: draft.category,
      interval: draft.interval,
      dueDay,
      ...(dueMonth !== undefined ? { dueMonth } : {}),
    },
  };
}

// ---------- CRUD (pur) ----------

export function addCost(list: FixedCost[], values: FixedCostValues, now = new Date()): FixedCost[] {
  const stamp = now.toISOString();
  return [...list, { ...values, id: crypto.randomUUID(), createdAt: stamp, updatedAt: stamp }];
}

export function updateCost(list: FixedCost[], id: string, values: FixedCostValues, now = new Date()): FixedCost[] {
  return list.map((c) => (c.id === id ? { ...c, ...values, updatedAt: now.toISOString() } : c));
}

export function removeCost(list: FixedCost[], id: string): FixedCost[] {
  return list.filter((c) => c.id !== id);
}

// ---------- Summen ----------

export interface Totals {
  monthlyCents: number;
  yearlyCents: number;
  count: number;
}

export function computeTotals(list: FixedCost[]): Totals {
  const yearly = list.reduce((sum, c) => sum + yearlyCents(c), 0);
  return { yearlyCents: yearly, monthlyCents: Math.round(yearly / 12), count: list.length };
}

export interface CategoryTotal {
  id: CategoryId;
  monthlyCents: number;
  share: number;
}

export function totalsByCategory(list: FixedCost[]): CategoryTotal[] {
  const map = new Map<CategoryId, number>();
  for (const c of list) map.set(c.category, (map.get(c.category) ?? 0) + yearlyCents(c));
  const grandMonthly = computeTotals(list).monthlyCents;
  return CATEGORIES.map((cat) => {
    const monthly = Math.round((map.get(cat.id) ?? 0) / 12);
    return { id: cat.id, monthlyCents: monthly, share: grandMonthly > 0 ? monthly / grandMonthly : 0 };
  })
    .filter((t) => t.monthlyCents > 0)
    .sort((a, b) => b.monthlyCents - a.monthlyCents);
}

// ---------- Backup ----------

export interface Backup {
  costs: FixedCost[];
  incomes: Income[];
  settings: CashSettings;
  savings: SavingsAccount[];
  assets: Asset[];
  transactions: Transaction[];
  history: NetWorthPoint[];
}

export const EMPTY_BACKUP: Backup = {
  costs: [],
  incomes: [],
  settings: DEFAULT_SETTINGS,
  savings: [],
  assets: [],
  transactions: [],
  history: [],
};

export function exportBackup(data: Backup): string {
  return JSON.stringify({ app: 'fixkosten', version: 3, exportedAt: new Date().toISOString(), ...data }, null, 2);
}

/** Akzeptiert Version 1 bis 3. Fehlende Bereiche bekommen Standardwerte. */
export function parseBackup(text: string): Backup | null {
  try {
    const data = JSON.parse(text) as Partial<Record<keyof Backup, unknown>>;
    if (!data || !Array.isArray(data.costs) || !data.costs.every(isFixedCost)) return null;
    const pick = <T>(value: unknown, guard: (x: unknown) => x is T): T[] =>
      Array.isArray(value) ? value.filter(guard) : [];
    return {
      costs: data.costs,
      incomes: pick(data.incomes, isIncome),
      settings: isSettings(data.settings) ? data.settings : DEFAULT_SETTINGS,
      savings: pick(data.savings, isSavingsAccount),
      assets: pick(data.assets, isAsset),
      transactions: pick(data.transactions, isTransaction),
      history: pick(data.history, isPoint),
    };
  } catch {
    return null;
  }
}

export function isFixedCost(value: unknown): value is FixedCost {
  if (!value || typeof value !== 'object') return false;
  const c = value as Partial<FixedCost>;
  return (
    typeof c.id === 'string' &&
    typeof c.name === 'string' &&
    typeof c.amountCents === 'number' &&
    c.amountCents > 0 &&
    isCategoryId(c.category) &&
    (c.interval === 'monthly' || c.interval === 'quarterly' || c.interval === 'yearly') &&
    typeof c.dueDay === 'number' &&
    c.dueDay >= 1 &&
    c.dueDay <= 31 &&
    typeof c.createdAt === 'string' &&
    typeof c.updatedAt === 'string'
  );
}

export function isIncome(value: unknown): value is Income {
  if (!value || typeof value !== 'object') return false;
  const i = value as Partial<Income>;
  return (
    typeof i.id === 'string' &&
    typeof i.name === 'string' &&
    typeof i.amountCents === 'number' &&
    i.amountCents > 0 &&
    typeof i.payDay === 'number' &&
    i.payDay >= 1 &&
    i.payDay <= 31
  );
}

export function isSettings(value: unknown): value is CashSettings {
  if (!value || typeof value !== 'object') return false;
  const s = value as Partial<CashSettings>;
  return typeof s.balanceCents === 'number' && typeof s.monthlySpendCents === 'number' && typeof s.safetyCents === 'number';
}

export function isSavingsAccount(value: unknown): value is SavingsAccount {
  if (!value || typeof value !== 'object') return false;
  const s = value as Partial<SavingsAccount>;
  return typeof s.id === 'string' && typeof s.name === 'string' && typeof s.balanceCents === 'number';
}

export function isAsset(value: unknown): value is Asset {
  if (!value || typeof value !== 'object') return false;
  const a = value as Partial<Asset> & { kind?: string };
  if (typeof a.id !== 'string' || typeof a.quantity !== 'number' || !(a.quantity > 0)) return false;
  if (a.kind === 'metal') return (a.code === 'XAU' || a.code === 'XAG') && (a.unit === 'g' || a.unit === 'oz');
  if (a.kind === 'currency') return typeof a.code === 'string' && /^[A-Z]{3}$/.test(a.code);
  return false;
}

export function isTransaction(value: unknown): value is Transaction {
  if (!value || typeof value !== 'object') return false;
  const t = value as Partial<Transaction>;
  return (
    typeof t.id === 'string' &&
    typeof t.date === 'string' &&
    typeof t.accountId === 'string' &&
    typeof t.amountCents === 'number' &&
    t.amountCents !== 0 &&
    typeof t.note === 'string'
  );
}

export function isPoint(value: unknown): value is NetWorthPoint {
  if (!value || typeof value !== 'object') return false;
  const p = value as Partial<NetWorthPoint>;
  return typeof p.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(p.date) && typeof p.cents === 'number';
}
