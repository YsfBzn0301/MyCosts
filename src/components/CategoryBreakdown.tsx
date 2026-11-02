import { formatEUR } from '../domain/money';
import type { CategoryTotal } from '../agents/uiDataWorker';

export function CategoryBreakdown({ groups }: { groups: CategoryTotal[] }) {
  if (groups.length === 0) return null;
  return (
    <section aria-label="Verteilung nach Kategorie" className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <h2 className="mb-3 text-sm font-semibold text-slate-700">Verteilung pro Monat</h2>
      <ul className="space-y-3">
        {groups.map((g) => (
          <li key={g.id}>
            <div className="flex justify-between text-sm">
              <span className="text-slate-700">{g.label}</span>
              <span className="tabular-nums text-slate-500">
                {formatEUR(g.monthlyCents)} · {Math.round(g.share * 100)} %
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all"
                style={{ width: `${Math.max(2, g.share * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
