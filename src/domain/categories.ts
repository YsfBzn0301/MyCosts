// Kategorie-IDs. Anzeigetexte kommen aus den Übersetzungen (cat.<id>).
export const CATEGORY_IDS = ['housing', 'insurance', 'subscriptions', 'telecom', 'mobility', 'finance', 'other'] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export const CATEGORIES: ReadonlyArray<{ id: CategoryId }> = CATEGORY_IDS.map((id) => ({ id }));

export function isCategoryId(value: unknown): value is CategoryId {
  return typeof value === 'string' && (CATEGORY_IDS as readonly string[]).includes(value);
}
