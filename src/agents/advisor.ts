/**
 * Agent 3 – Financial Insights & Savings Advisor.
 * Wird ausschließlich aus der UI heraus auf expliziten Klick aufgerufen.
 */
import type { CategoryId } from '../../shared/categories';
import { INTERVAL_LABELS, type FixedCost } from '../domain/types';
import { monthlyCents, yearlyCents } from '../domain/money';
import { callAgent } from './agentClient';

export interface Suggestion {
  title: string;
  detail: string;
  priority: 'hoch' | 'mittel' | 'niedrig';
  estimatedMonthlySavingEUR: number | null;
}

export interface AdvisorReport {
  summary: string;
  budgetTip: string;
  suggestions: Suggestion[];
}

export type AdvisorOutcome =
  | { ok: true; report: AdvisorReport }
  | { ok: true; rawText: string }
  | { ok: false; error: string };

export function buildAdvisorInput(list: FixedCost[]) {
  const toEUR = (cents: number) => Math.round(cents) / 100;
  return {
    costs: list.map((c) => ({
      name: c.name,
      category: c.category as CategoryId,
      interval: c.interval,
      label: INTERVAL_LABELS[c.interval],
      amountEUR: toEUR(c.amountCents),
      monthlyEquivalentEUR: toEUR(monthlyCents(c)),
      dueDay: c.dueDay,
    })),
    totalMonthlyEUR: toEUR(list.reduce((s, c) => s + monthlyCents(c), 0)),
    totalYearlyEUR: toEUR(list.reduce((s, c) => s + yearlyCents(c), 0)),
  };
}

function isReport(value: unknown): value is AdvisorReport {
  if (!value || typeof value !== 'object') return false;
  const r = value as Partial<AdvisorReport>;
  return (
    typeof r.summary === 'string' &&
    typeof r.budgetTip === 'string' &&
    Array.isArray(r.suggestions) &&
    r.suggestions.every(
      (s) =>
        s &&
        typeof s.title === 'string' &&
        typeof s.detail === 'string' &&
        ['hoch', 'mittel', 'niedrig'].includes(s.priority) &&
        (s.estimatedMonthlySavingEUR === null || typeof s.estimatedMonthlySavingEUR === 'number'),
    )
  );
}

export async function analyzeCosts(list: FixedCost[], signal?: AbortSignal): Promise<AdvisorOutcome> {
  if (list.length === 0) return { ok: false, error: 'Lege zuerst mindestens einen Fixkosten-Posten an.' };
  const res = await callAgent<{ report?: unknown; raw?: string }>('advisor', buildAdvisorInput(list), signal);
  if (!res.ok) return res;
  if (isReport(res.output.report)) return { ok: true, report: res.output.report };
  if (typeof res.output.raw === 'string') return { ok: true, rawText: res.output.raw };
  return { ok: false, error: 'Die Analyse konnte nicht gelesen werden.' };
}
