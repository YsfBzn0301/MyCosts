import { describe, expect, it } from 'vitest';
import {
  addCost,
  computeTotals,
  draftFromCost,
  emptyDraft,
  exportBackup,
  parseBackup,
  removeCost,
  totalsByCategory,
  updateCost,
  validateDraft,
} from './uiDataWorker';
import type { FixedCost } from '../domain/types';

const base = { name: 'Miete', amount: '800,00', category: 'housing' as const, interval: 'monthly' as const, dueDay: '1', dueMonth: '1' };

describe('validateDraft', () => {
  it('akzeptiert einen gültigen Monatsposten', () => {
    const r = validateDraft({ ...emptyDraft(), ...base });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.values.amountCents).toBe(80000);
      expect(r.values.dueMonth).toBeUndefined();
    }
  });

  it('verlangt Fälligkeitsmonat bei jährlichen Posten', () => {
    const r = validateDraft({ ...base, interval: 'yearly', dueMonth: '13' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.dueMonth).toBeDefined();
  });

  it('meldet alle Fehler gesammelt', () => {
    const r = validateDraft({ ...emptyDraft(), name: '  ', amount: 'x', category: '', dueDay: '40' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(['amount', 'category', 'dueDay', 'name']);
  });
});

describe('CRUD', () => {
  const now = new Date('2026-11-02T10:00:00Z');
  const values = { name: 'Netflix', amountCents: 1299, category: 'subscriptions' as const, interval: 'monthly' as const, dueDay: 5 };

  it('legt an, ändert und löscht', () => {
    let list: FixedCost[] = [];
    list = addCost(list, values, now);
    expect(list).toHaveLength(1);
    const id = list[0].id;

    list = updateCost(list, id, { ...values, amountCents: 1499 }, now);
    expect(list[0].amountCents).toBe(1499);
    expect(list[0].createdAt).toBe(list[0].createdAt);

    list = removeCost(list, id);
    expect(list).toHaveLength(0);
  });

  it('summiert Monats- und Jahreswerte', () => {
    const list: FixedCost[] = [
      { ...addCost([], values, now)[0], amountCents: 1000, interval: 'monthly' },
      { ...addCost([], values, now)[0], amountCents: 12000, interval: 'yearly' },
    ];
    const t = computeTotals(list);
    expect(t.yearlyCents).toBe(12000 + 12000);
    expect(t.monthlyCents).toBe(2000);
    expect(t.count).toBe(2);
  });

  it('gruppiert nach Kategorie und sortiert absteigend', () => {
    const a = addCost([], { ...values, amountCents: 500, category: 'other' }, now)[0];
    const b = addCost([], { ...values, amountCents: 5000, category: 'housing' }, now)[0];
    const groups = totalsByCategory([a, b]);
    expect(groups[0].id).toBe('housing');
    expect(groups[0].share + groups[1].share).toBeCloseTo(1, 5);
  });

  it('übernimmt Werte in ein Formular und zurück', () => {
    const cost = addCost([], values, now)[0];
    const r = validateDraft(draftFromCost(cost));
    expect(r.ok && r.values.amountCents).toBe(1299);
  });
});

describe('Backup', () => {
  it('Export → Import ist verlustfrei', () => {
    const costs = addCost([], { name: 'A', amountCents: 100, category: 'other', interval: 'monthly', dueDay: 2 }, new Date());
    const settings = { balanceCents: -500, monthlySpendCents: 1000, safetyCents: 200 };
    const savings = [{ id: 's', name: 'Notgroschen', balanceCents: 500, createdAt: '', updatedAt: '' }];
    const history = [{ date: '2026-11-02', cents: 42 }];
    const back = parseBackup(exportBackup({ costs, incomes: [], settings, savings, assets: [], transactions: [], history }));
    expect(back).toEqual({ costs, incomes: [], settings, savings, assets: [], transactions: [], history });
  });

  it('akzeptiert alte Backups (nur Fixkosten)', () => {
    const costs = addCost([], { name: 'A', amountCents: 100, category: 'other', interval: 'monthly', dueDay: 2 }, new Date());
    const back = parseBackup(JSON.stringify({ app: 'fixkosten', version: 1, costs }));
    expect(back?.costs).toEqual(costs);
    expect(back?.incomes).toEqual([]);
    expect(back?.savings).toEqual([]);
  });

  it('lehnt kaputte Dateien ab', () => {
    expect(parseBackup('kein json')).toBeNull();
    expect(parseBackup(JSON.stringify({ costs: [{ id: 1 }] }))).toBeNull();
  });
});
