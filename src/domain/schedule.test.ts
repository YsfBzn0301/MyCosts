import { describe, expect, it } from 'vitest';
import { nextDueDate } from './schedule';

const iso = (d: Date) => d.toISOString().slice(0, 10);
const local = (y: number, m: number, d: number) => new Date(y, m - 1, d);

describe('nextDueDate', () => {
  it('nimmt den heutigen Termin, wenn er noch nicht vorbei ist', () => {
    const r = nextDueDate({ interval: 'monthly', dueDay: 15 }, local(2026, 11, 15));
    expect(iso(r)).toBe('2026-11-15');
  });

  it('springt auf den nächsten Monat, wenn der Termin vorbei ist', () => {
    const r = nextDueDate({ interval: 'monthly', dueDay: 5 }, local(2026, 11, 20));
    expect(iso(r)).toBe('2026-12-05');
  });

  it('begrenzt den Tag auf den letzten Tag kurzer Monate', () => {
    const r = nextDueDate({ interval: 'monthly', dueDay: 31 }, local(2027, 2, 1));
    expect(iso(r)).toBe('2027-02-28');
  });

  it('beachtet quartalsweise Zyklen ab dem Anker-Monat', () => {
    // Anker Januar → Jan, Apr, Jul, Okt
    const r = nextDueDate({ interval: 'quarterly', dueDay: 1, dueMonth: 1 }, local(2026, 11, 2));
    expect(iso(r)).toBe('2027-01-01');
  });

  it('beachtet jährliche Zyklen', () => {
    const r = nextDueDate({ interval: 'yearly', dueDay: 10, dueMonth: 3 }, local(2026, 11, 2));
    expect(iso(r)).toBe('2027-03-10');
  });
});
