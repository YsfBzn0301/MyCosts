/**
 * Agent 2 – Categorization & Quick Analysis.
 *
 * Stufe 1: lokale Regeln (kostenlos, offline, sofort).
 * Stufe 2: Haiku per /api/agent – nur wenn die Regeln nichts finden.
 * Ergebnisse werden im Speicher gecacht, damit gleiche Namen nicht erneut kosten.
 */
import { isCategoryId, type CategoryId } from '../../shared/categories';
import { callAgent } from './agentClient';

const RULES: Array<[RegExp, CategoryId]> = [
  [/versicherung|haftpflicht|hausrat|rechtsschutz|krankenkasse|\bkfz\b/i, 'insurance'],
  [/miete|nebenkosten|hausgeld|wohnung|\bstrom\b|\bgas\b|heizung|wasserwerk/i, 'housing'],
  [/netflix|spotify|disney|prime video|youtube|icloud|google one|dazn|adobe|\babo\b|fitnessstudio|gym\b/i, 'subscriptions'],
  [/telekom|vodafone|\bo2\b|telefon|mobilfunk|handyvertrag|internet|\bdsl\b|glasfaser/i, 'telecom'],
  [/\bauto\b|tanken|\bbahn\b|deutschlandticket|\bhvv\b|\bbvg\b|parkhaus|leasing|\bmobilität\b/i, 'mobility'],
  [/kredit|darlehen|sparrate|bausparen|bausparvertrag|bauspar|tilgung|bankgebühr|kontoführung/i, 'finance'],
];

export function categorizeByRules(name: string): CategoryId | null {
  for (const [pattern, category] of RULES) {
    if (pattern.test(name)) return category;
  }
  return null;
}

const cache = new Map<string, CategoryId | null>();

export async function suggestCategory(name: string, signal?: AbortSignal): Promise<CategoryId | null> {
  const trimmed = name.trim();
  if (trimmed.length < 2) return null;

  const byRule = categorizeByRules(trimmed);
  if (byRule) return byRule;

  const key = trimmed.toLowerCase();
  if (cache.has(key)) return cache.get(key) ?? null;

  const res = await callAgent<{ category: unknown }>('categorizer', { name: trimmed.slice(0, 100) }, signal);
  if (!res.ok) return null; // nicht cachen – beim nächsten Mal erneut versuchen

  const category = isCategoryId(res.output?.category) ? res.output.category : null;
  cache.set(key, category);
  return category;
}
