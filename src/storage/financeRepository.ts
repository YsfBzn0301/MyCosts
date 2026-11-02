// Persistenz für Einnahmen und Girokonto-Einstellungen (localStorage, versioniert).
import { DEFAULT_SETTINGS, type CashSettings, type Income } from '../domain/types';
import { isIncome, isSettings } from '../agents/uiDataWorker';

const INCOMES_KEY = 'fixkosten.v1.incomes';
const SETTINGS_KEY = 'fixkosten.v1.settings';

export function loadIncomes(): Income[] {
  try {
    const raw = localStorage.getItem(INCOMES_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isIncome) : [];
  } catch {
    return [];
  }
}

export function saveIncomes(list: Income[]): boolean {
  try {
    localStorage.setItem(INCOMES_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

export function loadSettings(): CashSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return isSettings(parsed) ? parsed : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: CashSettings): boolean {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}
