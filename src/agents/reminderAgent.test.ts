import { describe, expect, it } from 'vitest';
import { DEFAULT_REMINDER, isDue, reminderMoment, stateFor, freshState, sumPlans, validateReminderDraft, plannedGoals } from './reminderAgent';
import type { SavingsAccount } from '../domain/types';

const at = (y: number, m: number, d: number, h = 0, min = 0) => new Date(y, m - 1, d, h, min);
const on = { ...DEFAULT_REMINDER, enabled: true };

describe('isDue', () => {
  it('ist aus, wenn die Erinnerung deaktiviert ist', () => {
    expect(isDue(DEFAULT_REMINDER, at(2026, 11, 25, 12), [25])).toBe(false);
  });

  it('ist am Gehaltstag erst ab der Uhrzeit fällig', () => {
    expect(isDue(on, at(2026, 11, 25, 8, 59), [25])).toBe(false);
    expect(isDue(on, at(2026, 11, 25, 9, 0), [25])).toBe(true);
  });

  it('nutzt den festen Tag und begrenzt ihn auf den Monatsletzten', () => {
    const cfg = { ...on, mode: 'day' as const, day: 31, time: '09:00' };
    expect(reminderMoment(cfg, at(2027, 2, 10), [])?.getDate()).toBe(28);
  });

  it('ist im Gehaltsmodus ohne Einnahme nicht bestimmbar', () => {
    expect(isDue(on, at(2026, 11, 25, 12), [])).toBe(false);
  });
});

describe('Zustand pro Monat', () => {
  it('verwirft den Zustand eines anderen Monats', () => {
    const old = { month: '2026-10', checked: ['a'], done: true, notified: true };
    expect(stateFor(old, at(2026, 11, 2))).toEqual(freshState(at(2026, 11, 2)));
  });
});

describe('Pläne', () => {
  const goals: SavingsAccount[] = [
    { id: 'a', name: 'Sparkonto', balanceCents: 0, planCents: 20000, createdAt: '', updatedAt: '' },
    { id: 'b', name: 'Fonds', balanceCents: 0, planCents: 15000, createdAt: '', updatedAt: '' },
    { id: 'c', name: 'Ohne Plan', balanceCents: 0, createdAt: '', updatedAt: '' },
  ];

  it('summiert nur ausgewählte Pläne', () => {
    expect(sumPlans(goals, ['a', 'b', 'c'])).toBe(35000);
    expect(sumPlans(goals, ['b'])).toBe(15000);
  });

  it('zeigt nur Töpfe mit Plan', () => {
    expect(plannedGoals(goals).map((g) => g.id)).toEqual(['a', 'b']);
  });
});

describe('validateReminderDraft', () => {
  it('prüft Tag und Uhrzeit', () => {
    expect(validateReminderDraft({ day: '1', time: '09:00' })).toEqual({ ok: true, day: 1, time: '09:00' });
    expect(validateReminderDraft({ day: '40', time: '25:00' })).toMatchObject({ ok: false });
  });
});
