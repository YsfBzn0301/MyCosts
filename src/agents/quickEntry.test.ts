import { describe, expect, it } from 'vitest';
import { parseQuickEntry } from './quickEntry';

describe('parseQuickEntry', () => {
  it('erkennt eine Fixkosten-Abbuchung mit Betrag und Tag', () => {
    const r = parseQuickEntry('Miete 850 am 1.');
    expect(r).toMatchObject({ ok: true, kind: 'cost', values: { name: 'Miete', amountCents: 85000, category: 'housing', interval: 'monthly', dueDay: 1 } });
  });

  it('erkennt Beträge mit Komma und Tausenderpunkt', () => {
    const r = parseQuickEntry('Netflix 12,99 am 5.');
    expect(r).toMatchObject({ ok: true, kind: 'cost', values: { name: 'Netflix', amountCents: 1299, category: 'subscriptions', dueDay: 5 } });
  });

  it('erkennt ein Gehalt als Einnahme mit Zahltag', () => {
    const r = parseQuickEntry('Gehalt 2.850,00 am 27.');
    expect(r).toMatchObject({ ok: true, kind: 'income', values: { name: 'Gehalt', amountCents: 285000, payDay: 27 } });
  });

  it('erkennt Strom als Wohnen', () => {
    const r = parseQuickEntry('Strom 56,61 am 5');
    expect(r).toMatchObject({ ok: true, kind: 'cost', values: { name: 'Strom', category: 'housing', dueDay: 5 } });
  });

  it('nimmt ohne Tag den 1. und sagt es dazu', () => {
    const r = parseQuickEntry('Internet 39,99');
    expect(r).toMatchObject({ ok: true, kind: 'cost', values: { name: 'Internet', dueDay: 1 } });
    if (r.ok) expect(r.notes).toContain('quick.noteDay');
  });

  it('meldet fehlenden Betrag und jährliche Posten', () => {
    expect(parseQuickEntry('Miete am 1.')).toMatchObject({ ok: false });
    expect(parseQuickEntry('Versicherung 120 jährlich am 3.')).toMatchObject({ ok: false, error: 'quick.errYearly' });
  });
});
