// Gemeinsame Kategorie-Definition (Client + Server). Reine Daten, keine Abhängigkeiten.
export const CATEGORIES = [
  { id: 'housing', label: 'Wohnen' },
  { id: 'insurance', label: 'Versicherungen' },
  { id: 'subscriptions', label: 'Abos & Streaming' },
  { id: 'telecom', label: 'Telefon & Internet' },
  { id: 'mobility', label: 'Mobilität' },
  { id: 'finance', label: 'Finanzen & Kredite' },
  { id: 'other', label: 'Sonstiges' },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]['id'];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id) as readonly CategoryId[];

export function isCategoryId(value: unknown): value is CategoryId {
  return typeof value === 'string' && (CATEGORY_IDS as readonly string[]).includes(value);
}

export function categoryLabel(id: CategoryId): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? 'Sonstiges';
}
