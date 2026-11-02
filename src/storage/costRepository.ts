// Lokale Persistenz. localStorage reicht für Fixkosten (wenige KB) und ist synchron.
// Der Schlüssel ist versioniert, damit spätere Schema-Änderungen sauber migrierbar sind.
import type { FixedCost } from '../domain/types';
import { isFixedCost } from '../agents/uiDataWorker';

const KEY = 'fixkosten.v1.costs';

export function loadCosts(): FixedCost[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isFixedCost) : [];
  } catch {
    // Zugriff verweigert (privater Modus, blockierte Storage) → leere Liste statt Absturz
    return [];
  }
}

export function saveCosts(list: FixedCost[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}
