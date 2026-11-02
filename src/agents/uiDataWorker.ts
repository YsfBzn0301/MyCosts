/**
 * Agent 1 – UI & Local Data Worker.
 *
 * Reine, deterministische Logik: Validierung, CRUD, Summen, Import/Export.
 * Bewusst OHNE LLM-Aufruf – diese Aufgaben brauchen keine Tokens und wären
 * mit einem Modell nur langsamer und teurer. Die einzige Stelle, an der ein
 * Modell sinnvoll ist, sind Kategorie-Vorschläge (Agent 2) und Analysen (Agent 3).
 */
import { CATEGORIES, isCategoryId, type CategoryId } from '../../shared/categories';
import { parseAmountToCents, yearlyCents } from '../domain/money';
import type { FixedCost, FixedCostValues, Interval } from '../domain/types';

export interface FormDraft {
  name: string;
  amount: string;
  category: CategoryId | '';
  interval: Interval;
  dueDay: string;
  dueMonth: string;
}

export type FieldErrors = Partial<Record<'name' | 'amount' | 'category' | 'dueDay' | 'dueMonth', string>>;

export type ValidationResult =
  | { ok: true; values: FixedCostValues }
  | { ok: false; errors: FieldErrors };

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
  if (name.length === 0) errors.name = 'Bitte einen Namen eingeben.';
  else if (name.length > 60) errors.name = 'Maximal 60 Zeichen.';

  const amountCents = parseAmountToCents(draft.amount);
  if (amountCents === null) errors.amount = 'Gültiger Betrag > 0, z. B. 12,99.';

  if (!isCategoryId(draft.category)) errors.category = 'Bitte eine Kategorie wählen.';

  const dueDay = parseInteger(draft.dueDay, 1, 31);
  if (dueDay === null) errors.dueDay = 'Tag zwischen 1 und 31.';

  let dueMonth: number | undefined;
  if (draft.interval !== 'monthly') {
    const m = parseInteger(draft.dueMonth, 1, 12);
    if (m === null) errors.dueMonth = 'Monat zwischen 1 und 12.';
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

// ---------- CRUD (pur, liefert neue Listen zurück) ----------

export function addCost(list: FixedCost[], values: FixedCostValues, now = new Date()): FixedCost[] {
  const stamp = now.toISOString();
  const cost: FixedCost = { ...values, id: crypto.randomUUID(), createdAt: stamp, updatedAt: stamp };
  return [...list, cost];
}

export function updateCost(list: FixedCost[], id: string, values: FixedCostValues, now = new Date()): FixedCost[] {
  return list.map((c) => (c.id === id ? { ...c, ...values, updatedAt: now.toISOString() } : c));
}

export function removeCost(list: FixedCost[], id: string): FixedCost[] {
  return list.filter((c) => c.id !== id);
}

// ---------- Summen & Gruppierung ----------

export interface Totals {
  monthlyCents: number;
  yearlyCents: number;
  count: number;
}

export function computeTotals(list: FixedCost[]): Totals {
  const yearly = list.reduce((sum, c) => sum + yearlyCents(c), 0);
  return {
    yearlyCents: yearly,
    monthlyCents: Math.round(yearly / 12),
    count: list.length,
  };
}

export interface CategoryTotal {
  id: CategoryId;
  label: string;
  monthlyCents: number;
  share: number; // 0..1 am Monatsgesamt
}

export function totalsByCategory(list: FixedCost[]): CategoryTotal[] {
  const map = new Map<CategoryId, number>();
  for (const c of list) map.set(c.category, (map.get(c.category) ?? 0) + yearlyCents(c));
  const grandMonthly = computeTotals(list).monthlyCents;
  return CATEGORIES.map((cat) => {
    const monthly = Math.round((map.get(cat.id) ?? 0) / 12);
    return {
      id: cat.id,
      label: cat.label,
      monthlyCents: monthly,
      share: grandMonthly > 0 ? monthly / grandMonthly : 0,
    };
  })
    .filter((t) => t.monthlyCents > 0)
    .sort((a, b) => b.monthlyCents - a.monthlyCents);
}

// ---------- Import / Export ----------

export function exportCostsJson(list: FixedCost[]): string {
  return JSON.stringify({ app: 'fixkosten', version: 1, exportedAt: new Date().toISOString(), costs: list }, null, 2);
}

export function parseImport(text: string): FixedCost[] | null {
  try {
    const data = JSON.parse(text) as { costs?: unknown };
    if (!data || !Array.isArray(data.costs)) return null;
    const valid = data.costs.filter(isFixedCost);
    return valid.length === data.costs.length ? valid : null;
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
