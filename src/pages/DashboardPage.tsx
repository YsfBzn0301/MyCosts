import { useMemo, type ReactNode } from 'react';
import { AnimatedEUR } from '../components/AnimatedEUR';
import { NetWorthChart } from '../components/NetWorthChart';
import { QuickEntry } from '../components/QuickEntry';
import { SavingsPanel } from '../components/SavingsPanel';
import { card } from '../components/fieldStyles';
import type { NetWorth } from '../domain/portfolio';
import { formatEUR } from '../domain/money';
import { formatDate } from '../domain/format';
import type { GoalKind, NetWorthPoint, SavingsAccount, Transaction, Asset } from '../domain/types';
import { useI18n } from '../i18n';
import { CHECKING_ID } from '../agents/portfolioWorker';

interface Props {
  nw: NetWorth;
  savings: SavingsAccount[];
  assets: Asset[];
  transactions: Transaction[];
  history: NetWorthPoint[];
  onRecord: (tx: Transaction) => void;
  onUpdateSavings: (id: string, cents: number) => void;
  onUpdatePlan: (id: string, cents: number) => void;
  onRemoveSavings: (id: string) => void;
  onAddSavings: (name: string, cents: number, kind: GoalKind, plan: number) => void;
  banner: ReactNode;
}

export function DashboardPage({ nw, savings, assets, transactions, history, onRecord, onAddSavings, onUpdateSavings, onUpdatePlan, onRemoveSavings, banner }: Props) {
  const { t } = useI18n();

  const labels = useMemo(() => {
    const map: Record<string, string> = { checking: t('dash.checking') };
    for (const s of savings) map[`savings:${s.id}`] = s.name;
    for (const a of assets) map[a.code] = t(a.kind === 'metal' ? `assets.metal.${a.code}` : a.code);
    return map;
  }, [savings, assets, t]);

  const accountName = (id: string) =>
    id === CHECKING_ID ? t('dash.accountChecking') : savings.find((s) => s.id === id)?.name ?? '–';

  return (
    <div className="space-y-6">
      {banner}

      <section aria-label={t('dash.netWorth')} className="px-1 pt-2">
        <p className="text-sm text-muted">{t('dash.netWorth')}</p>
        <p className="mt-1 text-5xl font-semibold tracking-tight tabular-nums sm:text-6xl">
          <AnimatedEUR cents={nw.totalCents} />
        </p>
        {!nw.assetsKnown && <p className="mt-2 max-w-prose text-sm text-warm">{t('dash.netWorthNoRates')}</p>}
        <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <div>
            <dt className="text-muted">{t('dash.checking')}</dt>
            <dd className="tabular-nums">{formatEUR(nw.checkingCents)}</dd>
          </div>
          <div>
            <dt className="text-muted">{t('dash.savings')}</dt>
            <dd className="tabular-nums">{formatEUR(nw.savingsCents)}</dd>
          </div>
          {assets.length > 0 && (
            <div>
              <dt className="text-muted">{t('dash.assets')}</dt>
              <dd className="tabular-nums">{nw.assetsKnown ? formatEUR(nw.assetsCents) : '–'}</dd>
            </div>
          )}
        </dl>
      </section>

      <section aria-label={t('dash.chart')} className={card}>
        <NetWorthChart slices={nw.slices} labels={labels} history={history} />
      </section>

      <QuickEntry savings={savings} onRecord={onRecord} />
      <SavingsPanel savings={savings} onAdd={onAddSavings} onUpdateBalance={onUpdateSavings} onUpdatePlan={onUpdatePlan} onRemove={onRemoveSavings} />

      <section aria-label={t('dash.recent')} className={card}>
        <h2 className="text-lg font-semibold">{t('dash.recent')}</h2>
        {transactions.length === 0 ? (
          <p className="mt-4 text-sm text-muted">{t('dash.noEntries')}</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {transactions.slice(0, 8).map((tx) => (
              <li key={tx.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm">{tx.note || accountName(tx.accountId)}</p>
                  <p className="text-xs text-muted">
                    {formatDate(new Date(tx.date))} · {accountName(tx.accountId)}
                  </p>
                </div>
                <span className={`tabular-nums text-sm font-medium ${tx.amountCents > 0 ? 'text-accent' : 'text-danger'}`}>
                  {tx.amountCents > 0 ? '+' : ''}
                  {formatEUR(tx.amountCents)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
