import { CATEGORY_IDS, type CategoryId } from '../../shared/categories.ts';

// Sub-Agent 3: Financial Insights & Savings Advisor (Sonnet). Nur auf Klick.

const INTERVALS = ['monthly', 'quarterly', 'yearly'] as const;
type Interval = (typeof INTERVALS)[number];

export interface AdvisorCostItem {
  name: string;
  category: CategoryId;
  interval: Interval;
  amountEUR: number;
  monthlyEquivalentEUR: number;
  dueDay: number;
}

export interface AdvisorInput {
  costs: AdvisorCostItem[];
  totalMonthlyEUR: number;
  totalYearlyEUR: number;
}

const MAX_ITEMS = 200;

export function parseAdvisorInput(raw: unknown): AdvisorInput | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<AdvisorInput>;
  if (!Array.isArray(r.costs) || r.costs.length === 0 || r.costs.length > MAX_ITEMS) return null;
  if (typeof r.totalMonthlyEUR !== 'number' || typeof r.totalYearlyEUR !== 'number') return null;

  const costs: AdvisorCostItem[] = [];
  for (const item of r.costs as unknown[]) {
    const c = item as Partial<AdvisorCostItem>;
    if (
      typeof c.name !== 'string' ||
      typeof c.amountEUR !== 'number' ||
      typeof c.monthlyEquivalentEUR !== 'number' ||
      typeof c.dueDay !== 'number' ||
      !(INTERVALS as readonly string[]).includes(c.interval as string) ||
      !(CATEGORY_IDS as readonly string[]).includes(c.category as string)
    ) {
      return null;
    }
    costs.push({
      name: c.name.slice(0, 60),
      category: c.category as CategoryId,
      interval: c.interval as Interval,
      amountEUR: c.amountEUR,
      monthlyEquivalentEUR: c.monthlyEquivalentEUR,
      dueDay: c.dueDay,
    });
  }
  return { costs, totalMonthlyEUR: r.totalMonthlyEUR, totalYearlyEUR: r.totalYearlyEUR };
}

const SYSTEM_PROMPT = `Du bist ein nüchterner Finanzberater für private Fixkosten (Deutschland, Euro).
Analysiere die übergebene Liste monatlicher und jährlicher Fixkosten.

Ziele:
- Sparpotenziale erkennen, besonders bei Abos, Versicherungen, Telefon/Internet und doppelten Diensten.
- Strategische Hinweise zur monatlichen Budgetverteilung geben (z. B. Rücklagen für jährliche Posten).
- Realistisch und konkret bleiben. Keine Rechts- oder Steuerberatung. Keine erfundenen Anbieterpreise.

Antworte AUSSCHLIESSLICH mit einem JSON-Objekt dieses Schemas, ohne Markdown-Codeblock:
{
  "summary": "string, 2-3 Sätze Gesamteinschätzung",
  "budgetTip": "string, ein strategischer Hinweis zur Budgetverteilung",
  "suggestions": [
    {
      "title": "string, kurz",
      "detail": "string, 1-2 Sätze konkrete Maßnahme",
      "priority": "hoch" | "mittel" | "niedrig",
      "estimatedMonthlySavingEUR": number oder null
    }
  ]
}
Maximal 5 suggestions.`;

export function buildAdvisorPrompt(input: AdvisorInput) {
  return {
    system: SYSTEM_PROMPT,
    user: JSON.stringify(input),
  };
}

export function parseAdvisorOutput(text: string): { report?: unknown; raw?: string } {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try {
      return { report: JSON.parse(text.slice(start, end + 1)) };
    } catch {
      // fällt durch auf raw
    }
  }
  return { raw: text };
}
