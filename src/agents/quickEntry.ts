/**
 * Schnell-Eingabe (ohne KI). Erkennt aus einem Satz wie „Miete 850 am 1.“ oder
 * „Gehalt 2.850 am 27.“ Name, Betrag, Tag und Art. Rein regelbasiert.
 */
import { CATEGORY_IDS, type CategoryId } from '../domain/categories';
import { parseAmountToCents } from '../domain/money';
import type { FixedCostValues, IncomeValues } from '../domain/types';

export type QuickResult =
  | { ok: true; kind: 'cost'; values: FixedCostValues; notes: string[] }
  | { ok: true; kind: 'income'; values: IncomeValues; notes: string[] }
  | { ok: false; error: string };

const INCOME_WORDS = /\b(gehalt|lohn|einnahme|kindergeld|minijob|rente|bezüge|salary|income|maaş|maas|gelir)\b/i;
const YEARLY_WORDS = /\b(jährlich|jahr|yearly|annual|yıllık|yillik)\b/i;
const DAY_PREFIX = /\b(am|den|jeden|zum|on|every|her|ayın)\s*$/i;
const NOISE = /\b(am|den|jeden|zum|monatlich|monat|€|eur|euro|on|every|her|ayın|monthly|per|month)\b/gi;

const CATEGORY_RULES: Array<[RegExp, CategoryId]> = [
  [/\b(versicherung|haftpflicht|hausrat|insurance|sigorta)\b/i, 'insurance'],
  [/\b(miete|kaltmiete|nebenkosten|strom|gas|wasser|heizung|rent|electricity|kira|elektrik)\b/i, 'housing'],
  [/\b(netflix|spotify|abo|disney|prime|dazn|icloud|fitness|subscription|abonelik)\b/i, 'subscriptions'],
  [/\b(internet|telekom|vodafone|o2|handy|telefon|mobilfunk|dsl|phone|telefon)\b/i, 'telecom'],
  [/\b(auto|kfz|sprit|tanken|bahn|ticket|parkhaus|leasing|fuel|yakıt)\b/i, 'mobility'],
  [/\b(kredit|darlehen|bausparen|sparrate|loan|kredi)\b/i, 'finance'],
];

export function guessCategory(name: string): CategoryId {
  for (const [pattern, id] of CATEGORY_RULES) if (pattern.test(name)) return id;
  return 'other';
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export function parseQuickEntry(input: string, now = new Date()): QuickResult {
  const text = input.replace(/\s+/g, ' ').trim();
  if (!text) return { ok: false, error: 'quick.errEmpty' };

  // Zahlen mit Position suchen (Beträge wie 2.850,00 oder 12,99, Tage wie 1 oder 27.)
  const tokens = [...text.matchAll(/\d+(?:[.,]\d+)*/g)].map((m) => ({
    raw: m[0],
    index: m.index ?? 0,
    end: (m.index ?? 0) + m[0].length,
  }));

  const hasEuro = (t: { end: number }) => /^\s*(€|eur|euro)/i.test(text.slice(t.end));
  const hasDecimalComma = (raw: string) => /,\d{1,2}$/.test(raw);

  let amountTok = tokens.find((t) => hasEuro(t) || hasDecimalComma(t.raw));
  let dayTok = tokens.find((t) => t !== amountTok && DAY_PREFIX.test(text.slice(0, t.index)));
  if (!amountTok) {
    // Ohne Hinweis: größte Zahl ist der Betrag, die kleinste ganze Zahl bis 31 der Tag.
    const rest = tokens.filter((t) => t !== dayTok);
    amountTok = rest.sort((a, b) => parseAmountTokenValue(b.raw) - parseAmountTokenValue(a.raw))[0];
  }
  if (!dayTok) {
    dayTok = [...tokens].reverse().find((t) => t !== amountTok && /^\d{1,2}\.?$/.test(text.slice(t.index).split(' ')[0]) && Number(t.raw) >= 1 && Number(t.raw) <= 31);
  }

  if (!amountTok) return { ok: false, error: 'quick.errAmount' };
  const amountCents = parseAmountToCents(amountTok.raw);
  if (amountCents === null) return { ok: false, error: 'quick.errAmount' };

  const dayNum = dayTok ? Number(dayTok.raw.replace('.', '')) : NaN;
  const notes: string[] = [];
  let dueDay = dayNum >= 1 && dayNum <= 31 ? Math.floor(dayNum) : 1;
  if (!(dayNum >= 1 && dayNum <= 31)) notes.push('quick.noteDay');

  // Name: alles außer Betrag, Tag und Füllwörtern.
  let remaining = text;
  for (const t of [amountTok, dayTok].filter(Boolean) as Array<{ raw: string; index: number; end: number }>) {
    remaining = remaining.replace(t.raw, ' ');
  }
  remaining = remaining.replace(NOISE, ' ').replace(/[€]/g, ' ').replace(/\s+/g, ' ').replace(/^[\s.,:;-]+|[\s.,:;-]+$/g, '');
  const name = capitalize(remaining);
  if (!name) return { ok: false, error: 'quick.errName' };
  if (name.length > 60) return { ok: false, error: 'quick.errName' };

  if (INCOME_WORDS.test(text)) {
    return { ok: true, kind: 'income', values: { name, amountCents, payDay: dueDay }, notes };
  }
  if (YEARLY_WORDS.test(text)) {
    return { ok: false, error: 'quick.errYearly' };
  }
  void now;
  const category: CategoryId = guessCategory(text);
  if (!(CATEGORY_IDS as readonly string[]).includes(category)) return { ok: false, error: 'quick.errName' };
  return {
    ok: true,
    kind: 'cost',
    values: { name, amountCents, category, interval: 'monthly', dueDay },
    notes,
  };
}

function parseAmountTokenValue(raw: string): number {
  const c = parseAmountToCents(raw);
  return c ?? Number(raw.replace(',', '.')) * 100;
}
