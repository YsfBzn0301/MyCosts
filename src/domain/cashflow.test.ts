import { describe, expect, it } from 'vitest';
import { computeCashflow, dailySpendCents, monthOverview } from './cashflow';
import type { FixedCost, Income } from './types';

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);
const cost = (name: string, amountCents: number, dueDay: number, extra: Partial<FixedCost> = {}): FixedCost => ({
  id: name, name, amountCents, category: 'other', interval: 'monthly', dueDay, createdAt: '', updatedAt: '', ...extra,
});
const salary = (payDay: number, amountCents = 300000): Income => ({
  id: 'gehalt', name: 'Gehalt', amountCents, payDay, createdAt: '', updatedAt: '',
});

describe('computeCashflow', () => {
  it('berechnet Sparbetrag und Puffer bis zum nächsten Gehalt', () => {
    const r = computeCashflow({
      today: d(2026, 11, 20),
      incomes: [salary(25)],
      costs: [cost('Netflix', 1299, 21), cost('Versicherung', 4000, 24), cost('Miete', 85000, 1)],
      settings: { balanceCents: 100000, monthlySpendCents: 0, safetyCents: 0 },
    });
    expect(r.nextIncome?.date).toEqual(d(2026, 11, 25));
    expect(r.outflows.map((o) => o.name)).toEqual(['Netflix', 'Versicherung']);
    expect(r.restBufferCents).toBe(1299 + 4000);
    expect(r.safeSavingsCents).toBe(100000 - 5299);
  });

  it('zählt einen heutigen Gehaltseingang nicht mehr zum Fenster', () => {
    const r = computeCashflow({
      today: d(2026, 11, 25),
      incomes: [salary(25)],
      costs: [],
      settings: { balanceCents: 0, monthlySpendCents: 0, safetyCents: 0 },
    });
    expect(r.nextIncome?.date).toEqual(d(2026, 12, 25));
  });

  it('verteilt die Lebenshaltung auf die Tage des Fensters', () => {
    expect(dailySpendCents(36500)).toBe(1200);
    const r = computeCashflow({
      today: d(2026, 11, 20),
      incomes: [salary(25)],
      costs: [],
      settings: { balanceCents: 10000, monthlySpendCents: 36500, safetyCents: 0 },
    });
    expect(r.windowDays).toBe(5);
    expect(r.spendingUntilIncomeCents).toBe(6000);
    expect(r.safeSavingsCents).toBe(4000);
  });

  it('meldet den ersten Tag mit Unterdeckung', () => {
    const r = computeCashflow({
      today: d(2026, 11, 20),
      incomes: [salary(25)],
      costs: [cost('Netflix', 8000, 21), cost('Strom', 5000, 23)],
      settings: { balanceCents: 10000, monthlySpendCents: 0, safetyCents: 0 },
    });
    // 10000 − 8000 = 2000 am 21., dann 2000 − 5000 = −3000 am 23.
    expect(r.firstShortfall?.date).toEqual(d(2026, 11, 23));
    expect(r.firstShortfall?.balanceCents).toBe(-3000);
    expect(r.endBalanceCents).toBe(-3000);
    expect(r.safeSavingsCents).toBe(0);
  });

  it('nutzt ein 30-Tage-Fenster, wenn keine Einnahme hinterlegt ist', () => {
    const r = computeCashflow({
      today: d(2026, 11, 2),
      incomes: [],
      costs: [cost('Miete', 85000, 15)],
      settings: { balanceCents: 90000, monthlySpendCents: 0, safetyCents: 0 },
    });
    expect(r.nextIncome).toBeNull();
    expect(r.windowDays).toBe(30);
    expect(r.outflows).toHaveLength(1);
  });

  it('berechnet die Monatsplanung', () => {
    const r = computeCashflow({
      today: d(2026, 11, 2),
      incomes: [salary(25, 300000)],
      costs: [cost('Miete', 85000, 1), cost('Versicherung', 12000, 1, { interval: 'yearly', dueMonth: 3 })],
      settings: { balanceCents: 0, monthlySpendCents: 100000, safetyCents: 0 },
    });
    // Fixkosten monatlich: 85000 + 1000 = 86000; Einnahmen 300000; Lebenshaltung 100000
    expect(r.monthlyFixedCents).toBe(86000);
    expect(r.plannedMonthlySavingCents).toBe(300000 - 86000 - 100000);
  });
});

describe('monthOverview', () => {
  it('listet Abbuchungen des Monats und markiert die vor dem Gehalt', () => {
    const list = monthOverview(
      [cost('Netflix', 1299, 5), cost('Miete', 85000, 28), cost('Strom', 5000, 20)],
      d(2026, 11, 10),
      d(2026, 11, 25),
    );
    // Netflix (5.) liegt schon in der Vergangenheit und zählt nicht mehr zum Fenster.
    expect(list.map((e) => [e.name, e.beforeIncome])).toEqual([
      ['Netflix', false],
      ['Strom', true],
      ['Miete', false],
    ]);
  });
});
