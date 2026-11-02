import type { ReminderConfig, ReminderState } from '../agents/reminderAgent';
import { DEFAULT_REMINDER } from '../agents/reminderAgent';
import { readJson, writeJson } from './kv';

const K = { config: 'fixkosten.v1.reminder', state: 'fixkosten.v1.reminderState' };

export function loadReminderConfig(): ReminderConfig {
  const v = readJson(K.config) as Partial<ReminderConfig> | undefined;
  if (!v || typeof v !== 'object') return DEFAULT_REMINDER;
  return {
    enabled: v.enabled === true,
    mode: v.mode === 'day' ? 'day' : 'payday',
    day: typeof v.day === 'number' ? v.day : DEFAULT_REMINDER.day,
    time: typeof v.time === 'string' ? v.time : DEFAULT_REMINDER.time,
    notify: v.notify === true,
  };
}
export const saveReminderConfig = (c: ReminderConfig) => writeJson(K.config, c);

export function loadReminderState(): ReminderState {
  const v = readJson(K.state) as Partial<ReminderState> | undefined;
  return {
    month: typeof v?.month === 'string' ? v.month : '',
    checked: Array.isArray(v?.checked) ? v.checked.filter((x): x is string => typeof x === 'string') : [],
    done: v?.done === true,
    notified: v?.notified === true,
  };
}
export const saveReminderState = (s: ReminderState) => writeJson(K.state, s);
