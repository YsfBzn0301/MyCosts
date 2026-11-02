import { type CategoryId } from '../domain/categories';
import { formatEUR, monthlyCents } from '../domain/money';
import { formatDate } from '../domain/format';
import type { FixedCost } from '../domain/types';
import type { CategoryTotal, Totals } from '../agents/uiDataWorker';
import { useI18n } from '../i18n';
import { card } from './fieldStyles';

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

export function CostList({ items, totals, groups, onEdit, onDelete, onCreate }: Props) {
  const { t } = useI18n();
  const catLabel = (id: CategoryId) => t(`cat.${id}`);

  return (
    <section aria-label={t('nav.fixed')} className={`${card} space-y-6`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3">
        <div className="flex flex-wrap gap-x-8 gap-y-2">
          <div>
            <p className="text-sm text-muted">{t('fixed.monthly')}</p>
            <p className="text-2xl font-semibold tabular-nums">{formatEUR(totals.monthlyCents)}</p>
          </div>
          <div>
            <p className="text-sm text-muted">{t('fixed.yearly')}</p>
            <p className="text-2xl font-semibold tabular-nums">{formatEUR(totals.yearlyCents)}</p>
          </div>
          <p className="self-end text-sm text-muted">{t('common.count', { count: totals.count })}</p>
        </div>
        <button onClick={onCreate} title={t('fixed.addCostHint')} className="rounded-xl px-3 py-2 text-sm font-semibold text-accent hover:bg-accent-soft">
          {t('fixed.addCost')}
        </button>
      </div>

      {groups.length > 0 && (
        <ul className="space-y-2.5">
          {groups.map((g) => (
            <li key={g.id} className="grid grid-cols-[9rem_1fr_3rem] items-center gap-3 text-sm">
              <span className="text-muted">{catLabel(g.id)}</span>
              <span className="block h-2 overflow-hidden rounded-full bg-canvas">
                <span className="block h-full rounded-full bg-accent transition-[width] duration-500 ease-out" style={{ width: `${Math.max(2, g.share * 100)}%` }} />
              </span>
              <span className="text-right tabular-nums text-muted">{Math.round(g.share * 100)} %</span>
            </li>
          ))}
        </ul>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-muted">{t('fixed.emptyCosts')}</p>
      ) : (
        <div>
          <h3 className="text-sm text-muted">{t('fixed.listTitle')}</h3>
          <ul className="mt-2 divide-y divide-line">
            {items.map(({ cost, next }) => (
              <li key={cost.id} className="flex items-center gap-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate">{cost.name}</p>
                  <p className="truncate text-xs text-muted">
                    {catLabel(cost.category)} · {t(`interval.${cost.interval}`)} · {t('fixed.due', { date: formatDate(next) })}
                  </p>
                </div>
                <div className="text-right tabular-nums">
                  <p>{formatEUR(cost.amountCents)}</p>
                  {cost.interval !== 'monthly' && <p className="text-xs text-muted">{t('fixed.perMonth', { amount: formatEUR(monthlyCents(cost)) })}</p>}
                </div>
                <div className="flex gap-1 text-sm">
                  <button onClick={() => onEdit(cost)} aria-label={`${cost.name} ${t('common.edit')}`} className="rounded-lg px-2 py-1 text-muted hover:bg-accent-soft hover:text-accent">
                    {t('common.edit')}
                  </button>
                  <button onClick={() => onDelete(cost)} aria-label={`${cost.name} ${t('common.delete')}`} className="rounded-lg px-2 py-1 text-muted hover:bg-danger-soft hover:text-danger">
                    {t('common.delete')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
