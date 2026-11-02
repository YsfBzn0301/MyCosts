import type { ReactNode } from 'react';
import { formatEUR } from '../domain/money';
import { AnimatedEUR } from './AnimatedEUR';
import type { Totals } from '../agents/uiDataWorker';
import type { FixedCost } from '../domain/types';
import { dateFormat } from './format';

interface Props {
  totals: Totals;
  next: { cost: FixedCost; date: Date } | null;
}

function Card({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{value}</p>
      {sub && <p className="mt-1 truncate text-sm text-slate-500">{sub}</p>}
    </div>
  );
}

export function SummaryCards({ totals, next }: Props) {
  return (
    <section aria-label="Zusammenfassung" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Card label="Monatlich" value={<AnimatedEUR cents={totals.monthlyCents} />} sub={`${totals.count} Posten`} />
      <Card label="Jährlich hochgerechnet" value={<AnimatedEUR cents={totals.yearlyCents} />} />
      <Card
        label="Nächste Fälligkeit"
        value={next ? next.cost.name : '–'}
        sub={next ? `${dateFormat.format(next.date)} · ${formatEUR(next.cost.amountCents)}` : 'Noch keine Posten'}
      />
    </section>
  );
}
