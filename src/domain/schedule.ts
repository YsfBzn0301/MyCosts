import type { Interval } from './types';

interface Cycle {
  interval: Interval;
  dueDay: number;
  dueMonth?: number;
}

function monthMatches(cycle: Cycle, month: number): boolean {
  const anchor = cycle.dueMonth ?? 1;
  switch (cycle.interval) {
    case 'monthly':
      return true;
    case 'quarterly':
      return (((month - anchor) % 3) + 3) % 3 === 0;
    case 'yearly':
      return month === anchor;
  }
}

/**
 * Nächster Fälligkeitstermin ab `today` (inklusive). Der Tag wird bei kurzen
 * Monaten auf den letzten Tag begrenzt (z. B. 31. → 30. April).
 */
export function nextDueDate(cycle: Cycle, today: Date): Date {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  for (let offset = 0; offset <= 24; offset++) {
    const first = new Date(start.getFullYear(), start.getMonth() + offset, 1);
    const year = first.getFullYear();
    const month = first.getMonth() + 1;
    if (!monthMatches(cycle, month)) continue;
    const lastDay = new Date(year, month, 0).getDate();
    const candidate = new Date(year, month - 1, Math.min(cycle.dueDay, lastDay));
    if (candidate.getTime() >= start.getTime()) return candidate;
  }
  return start;
}
