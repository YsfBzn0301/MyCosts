import { CATEGORY_IDS, isCategoryId, type CategoryId } from '../../shared/categories.ts';

// Sub-Agent 2: Kategorisierung (Haiku). Klein, schnell, günstig.

export interface CategorizerInput {
  name: string;
}

export interface CategorizerOutput {
  category: CategoryId | null;
}

export function parseCategorizerInput(raw: unknown): CategorizerInput | null {
  if (!raw || typeof raw !== 'object') return null;
  const name = (raw as { name?: unknown }).name;
  if (typeof name !== 'string') return null;
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 100) return null;
  return { name: trimmed };
}

export function buildCategorizerPrompt(input: CategorizerInput) {
  return {
    system:
      'Du ordnest wiederkehrende Fixkosten einer Kategorie zu. ' +
      'Erlaubte IDs: ' +
      CATEGORY_IDS.join(', ') +
      ' (housing=Wohnen, insurance=Versicherungen, subscriptions=Abos & Streaming, ' +
      'telecom=Telefon & Internet, mobility=Mobilität, finance=Finanzen & Kredite, other=Sonstiges). ' +
      'Antworte ausschließlich mit genau einer dieser IDs, ohne Satzzeichen oder Erklärung.',
    user: `Bezeichnung: ${input.name}`,
  };
}

export function parseCategorizerOutput(text: string): CategorizerOutput {
  const id = text.trim().toLowerCase().replace(/[^a-z]/g, '');
  return { category: isCategoryId(id) ? id : null };
}
