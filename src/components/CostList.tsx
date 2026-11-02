import { CATEGORIES, type CategoryId } from '../domain/categories';
import { formatEUR, monthlyCents } from '../domain/money';
import { INTERVAL_LABELS, type FixedCost } from '../domain/types';
import { dateFormat } from './format';

export interface ListItem {
  cost: FixedCost;
  next: Date;
}

interface Props {
  items: ListItem[];
  onEdit: (cost: FixedCost) => void;
  onDelete: (cost: FixedCost) => void;
  onCreate: () => void;
}

const categoryLabel = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)?.label ?? id;

export function CostList({ items, onEdit, onDelete, onCreate }: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="font-medium text-slate-700">Noch keine Fixkosten erfasst</p>
        <p className="mt-1 text-sm text-slate-500">Miete, Versicherungen, Abos – alles, was jeden Monat abgebucht wird.</p>
        <button
          onClick={onCreate}
          className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Ersten Posten anlegen
        </button>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      {items.map(({ cost, next }) => (
        <li key={cost.id} className="animate-fade-up flex items-center gap-3 p-4 transition-colors hover:bg-slate-50">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-slate-900">{cost.name}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-slate-600">{categoryLabel(cost.category)}</span>
              <span className="mx-1.5">·</span>
              {INTERVAL_LABELS[cost.interval]}
              <span className="mx-1.5">·</span>
              fällig {dateFormat.format(next)}
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold tabular-nums text-slate-900">{formatEUR(cost.amountCents)}</p>
            {cost.interval !== 'monthly' && (
              <p className="text-xs tabular-nums text-slate-500">≈ {formatEUR(monthlyCents(cost))}/Monat</p>
            )}
          </div>
          <div className="flex flex-col gap-1 sm:flex-row">
            <button
              onClick={() => onEdit(cost)}
              className="rounded-lg px-2 py-1 text-sm text-indigo-600 hover:bg-indigo-50"
              aria-label={`${cost.name} bearbeiten`}
            >
              Bearbeiten
            </button>
            <button
              onClick={() => onDelete(cost)}
              className="rounded-lg px-2 py-1 text-sm text-rose-600 hover:bg-rose-50"
              aria-label={`${cost.name} löschen`}
            >
              Löschen
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
