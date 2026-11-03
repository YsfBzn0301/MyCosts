/**
 * Cashflow-Kern (rein, ohne React/Storage).
 *
 * Fenster = heute bis einen Tag vor dem nächsten Gehaltseingang. Alles, was in diesem
 * Fenster vom Girokonto abfließt, muss schon jetzt dort liegen. Erst danach kommt Geld rein.
 */
import { addDays, nextDueDate, occurrencesInRange, startOfDay } from './schedule';
import { monthlyCents } from './money';
import type { CashSettings, FixedCost, Income } from './types';

/** Fenster ohne hinterlegte Einnahme. */
export const HORIZON_DAYS = 30;
const DAY_MS = 86_400_000;

export interface CashflowInput {
  today: Date;
  costs: FixedCost[];
  incomes: Income[];
  settings: CashSettings;
}

export interface Outflow {
  date: Date;
  name: string;
  amountCents: number;
}

export interface Shortfall {
  date: Date;
  balanceCents: number;
}

export interface CashflowResult {
  nextIncome: { date: Date; name: string; amountCents: number } | null;
  windowEnd: Date;
  windowDays: number;
  outflows: Outflow[];
  fixedUntilIncomeCents: number;
  spendingUntilIncomeCents: number;
  safetyCents: number;
  /** Betrag, der bis zum Gehalt auf dem Girokonto bleiben muss. */
  restBufferCents: number;
  /** Sofort auf das Sparkonto überweisbar. */
  safeSavingsCents: number;
  balanceCents: number;
  /** Prognostizierter Kontostand kurz vor dem Gehalt. */
  endBalanceCents: number;
  /** Erster Tag, an dem der Kontostand unter den Sicherheitspuffer fällt. */
  firstShortfall: Shortfall | null;
  monthlyIncomeCents: number;
  monthlyFixedCents: number;
  monthlySpendCents: number;
  /** Einnahmen − Fixkosten − Lebenshaltung pro Monat. */
  plannedMonthlySavingCents: number;
}

/** Tageswert der Lebenshaltung, aus dem Monatswert abgeleitet (12 Monate / 365 Tage). */
export function dailySpendCents(monthlySpendCents: number): number {
  return Math.round((monthlySpendCents * 12) / 365);
}

export function computeCashflow({ today, costs, incomes, settings }: CashflowInput): CashflowResult {
  const t0 = startOfDay(today);
  // Strikt nach heute: Ein Gehalt, das heute eingeht, ist bereits auf dem Konto.
  const tomorrow = addDays(t0, 1);

  let nextIncome: CashflowResult['nextIncome'] = null;
  for (const inc of incomes) {
    const date = nextDueDate({ interval: 'monthly', dueDay: inc.payDay }, tomorrow);
    if (!nextIncome || date < nextIncome.date) {
      nextIncome = { date, name: inc.name, amountCents: inc.amountCents };
    }
  }

  const windowEnd = nextIncome ? nextIncome.date : addDays(t0, HORIZON_DAYS);
  const windowDays = Math.round((windowEnd.getTime() - t0.getTime()) / DAY_MS);

  // Vorsichtig gerechnet: Abbuchungen am Zahltag zählen noch zum Fenster.
  const inclusiveEnd = addDays(windowEnd, 1);
  const outflows: Outflow[] = costs
    .flatMap((c) =>
      occurrencesInRange(c, t0, inclusiveEnd).map((date) => ({ date, name: c.name, amountCents: c.amountCents })),
    )
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const fixedUntil = outflows.reduce((s, o) => s + o.amountCents, 0);
  const daily = dailySpendCents(settings.monthlySpendCents);
  const spendingUntil = daily * windowDays;
  const restBuffer = fixedUntil + spendingUntil + settings.safetyCents;

  // Prognose tagesgenau: Lebenshaltung fließt täglich ab, Fixkosten am Fälligkeitstag.
  let running = settings.balanceCents;
  let firstShortfall: Shortfall | null = null;
  for (let i = 0; i <= windowDays; i++) {
    const day = addDays(t0, i);
    // Lebenshaltung nur für die Tage des Fensters, Abbuchungen auch am Zahltag.
    if (i < windowDays) running -= daily;
    for (const o of outflows) {
      if (o.date.getTime() === day.getTime()) running -= o.amountCents;
    }
    if (!firstShortfall && running < settings.safetyCents) {
      firstShortfall = { date: day, balanceCents: running };
    }
  }

  const monthlyIncome = incomes.reduce((s, i) => s + i.amountCents, 0);
  const monthlyFixed = costs.reduce((s, c) => s + monthlyCents(c), 0);

  return {
    nextIncome,
    windowEnd,
    windowDays,
    outflows,
    fixedUntilIncomeCents: fixedUntil,
    spendingUntilIncomeCents: spendingUntil,
    safetyCents: settings.safetyCents,
    restBufferCents: restBuffer,
    safeSavingsCents: Math.max(0, settings.balanceCents - restBuffer),
    balanceCents: settings.balanceCents,
    endBalanceCents: running,
    firstShortfall,
    monthlyIncomeCents: monthlyIncome,
    monthlyFixedCents: monthlyFixed,
    monthlySpendCents: settings.monthlySpendCents,
    plannedMonthlySavingCents: monthlyIncome - monthlyFixed - settings.monthlySpendCents,
  };
}

export interface MonthEntry {
  date: Date;
  name: string;
  amountCents: number;
  /** Abbuchung liegt vor dem nächsten Gehaltseingang. */
  beforeIncome: boolean;
}

/** Alle Abbuchungen des laufenden Kalendermonats, sortiert nach Datum. */
export function monthOverview(costs: FixedCost[], today: Date, windowEnd: Date): MonthEntry[] {
  const t0 = startOfDay(today);
  const monthStart = new Date(t0.getFullYear(), t0.getMonth(), 1);
  const monthEnd = new Date(t0.getFullYear(), t0.getMonth() + 1, 1);
  return costs
    .flatMap((c) =>
      occurrencesInRange(c, monthStart, monthEnd).map((date) => ({
        date,
        name: c.name,
        amountCents: c.amountCents,
        beforeIncome: date >= t0 && date <= windowEnd,
      })),
    )
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}
