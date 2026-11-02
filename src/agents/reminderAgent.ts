/**
 * Erinnerungs-Planer (Agent 2b). Deterministisch, ohne Server.
 * Berechnet, wann die Erinnerung fällig ist, welche Töpfe geplant sind und ob eine
 * Auswahl den sicheren Betrag übersteigt. Die App prüft dies beim Start und minütlich.
 */
import type { SavingsAccount } from '../domain/types';

export interface ReminderConfig {
  enabled: boolean;
  /** "payday": am ersten Gehaltseingang des Monats. "day": an einem festen Tag. */
  mode: 'payday' | 'day';
  day: number;
  /** HH:MM */
  time: string;
  /** Zusätzlich eine System-Benachrichtigung anzeigen, wenn erlaubt. */
  notify: boolean;
}

export const DEFAULT_REMINDER: ReminderConfig = { enabled: false, mode: 'payday', day: 1, time: '09:00', notify: false };

export interface ReminderState {
  /** Monat, auf den sich der Zustand bezieht (YYYY-MM). */
  month: string;
  /** Ausgewählte Töpfe für diesen Monat. */
  checked: string[];
  /** Erledigt: Buchung ist erfolgt. */
  done: boolean;
  /** System-Benachrichtigung für diesen Monat schon gezeigt. */
  notified: boolean;
}

export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function freshState(now: Date): ReminderState {
  return { month: monthKey(now), checked: [], done: false, notified: false };
}

/** Zustand des aktuellen Monats. Ein alter Monat wird verworfen. */
export function stateFor(state: ReminderState, now: Date): ReminderState {
  return state.month === monthKey(now) ? state : freshState(now);
}

function parseTime(time: string): { h: number; m: number } | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time.trim());
  return match ? { h: Number(match[1]), m: Number(match[2]) } : null;
}

/** Zeitpunkt der Erinnerung im aktuellen Monat, oder null wenn nicht bestimmbar. */
export function reminderMoment(config: ReminderConfig, now: Date, payDays: number[]): Date | null {
  const time = parseTime(config.time);
  if (!time) return null;
  let day: number;
  if (config.mode === 'payday') {
    if (payDays.length === 0) return null;
    day = Math.min(...payDays);
  } else {
    day = config.day;
  }
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return new Date(now.getFullYear(), now.getMonth(), Math.min(Math.max(day, 1), lastDay), time.h, time.m);
}

export function isDue(config: ReminderConfig, now: Date, payDays: number[]): boolean {
  if (!config.enabled) return false;
  const moment = reminderMoment(config, now, payDays);
  return moment !== null && now.getTime() >= moment.getTime();
}

export function plannedGoals(savings: SavingsAccount[]): SavingsAccount[] {
  return savings.filter((s) => (s.planCents ?? 0) > 0);
}

export function sumPlans(goals: SavingsAccount[], ids: string[]): number {
  return goals.filter((g) => ids.includes(g.id)).reduce((s, g) => s + (g.planCents ?? 0), 0);
}

export interface ReminderDraft {
  day: string;
  time: string;
}

export function validateReminderDraft(d: ReminderDraft): { ok: true; day: number; time: string } | { ok: false; errors: Partial<Record<keyof ReminderDraft, string>> } {
  const errors: Partial<Record<keyof ReminderDraft, string>> = {};
  const day = /^\d{1,2}$/.test(d.day.trim()) ? Number(d.day.trim()) : NaN;
  if (!(day >= 1 && day <= 31)) errors.day = 'reminder.invalidDay';
  const time = d.time.trim();
  if (!parseTime(time)) errors.time = 'reminder.invalidTime';
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, day, time };
}
