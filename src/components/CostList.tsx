import { CATEGORIES, type CategoryId } from '../domain/categories';
import { formatEUR, monthlyCents } from '../domain/money';
import { INTERVAL_LABELS, type FixedCost } from '../domain/types';
import type { CategoryTotal, Totals } from '../agents/uiDataWorker';
import { dateFormat } from './format';

export interface ListItem {
  cost: FixedCost;
  next: Date;
}

interface Props {
  items: ListItem[];
  totals: Totals;
  groups: CategoryTotal[];
  onEdit: (cost: FixedCost) => void;
  onDelete: (cost: FixedCost) => void;
  onCreate: () => void;
}

const categoryLabel = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)?.label ?? id;

export function CostList({ items, totals, groups, onEdit, onDelete, onCreate }: Props) {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-baseline gap-x-10 gap-y-2">
        <div>
          <p className="text-sm text-slate-500">Monatlich</p>
          <p className="text-2xl font-semibold tabular-nums text-slate-900">{formatEUR(totals.monthlyCents)}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Jährlich</p>
          <p className="text-2xl font-semibold tabular-nums text-slate-900">{formatEUR(totals.yearlyCents)}</p>
        </div>
        <p className="text-sm text-slate-500">{totals.count} Posten</p>
      </div>

      {groups.length > 0 && (
        <ul className="space-y-2.5">
          {groups.map((g) => (
            <li key={g.id} className="grid grid-cols-[8.5rem_1fr_3rem] items-center gap-3 text-sm">
              <span className="text-slate-600">{g.label}</span>
              <span className="block h-[3px] overflow-hidden rounded-full bg-slate-200">
                <span
                  className="block h-full rounded-full bg-slate-900 transition-[width] duration-500 ease-out"
                  style={{ width: `${Math.max(2, g.share * 100)}%` }}
                />
              </span>
              <span className="text-right tabular-nums text-slate-500">{Math.round(g.share * 100)} %</span>
            </li>
          ))}
        </ul>
      )}

      <div>
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm text-slate-500">Alle Posten, nach Fälligkeit</h3>
          <button onClick={onCreate} className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
            + Posten
          </button>
        </div>

        {items.length === 0 ? (
          <p className="mt-4 text-slate-500">Noch keine Fixkosten. Miete, Versicherungen und Abos hier eintragen.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-200 border-y border-slate-200">
            {items.map(({ cost, next }) => (
              <li key={cost.id} className="flex items-center gap-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-slate-900">{cost.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {categoryLabel(cost.category)} · {INTERVAL_LABELS[cost.interval]} · fällig {dateFormat.format(next)}
                  </p>
                </div>
                <div className="text-right tabular-nums">
                  <p className="text-slate-900">{formatEUR(cost.amountCents)}</p>
                  {cost.interval !== 'monthly' && (
                    <p className="text-xs text-slate-500">≈ {formatEUR(monthlyCents(cost))} / Monat</p>
                  )}
                </div>
                <div className="flex gap-3 text-sm">
                  <button
                    onClick={() => onEdit(cost)}
                    aria-label={`${cost.name} bearbeiten`}
                    className="text-slate-500 hover:text-slate-900"
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={() => onDelete(cost)}
                    aria-label={`${cost.name} löschen`}
                    className="text-slate-400 hover:text-rose-700"
                  >
                    Löschen
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
