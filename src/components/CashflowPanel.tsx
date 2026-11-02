import { formatEUR } from '../domain/money';
import { formatDate } from '../domain/format';
import type { CashflowResult, MonthEntry } from '../domain/cashflow';
import type { PredictorWarning } from '../agents/cashflowPredictor';
import { AnimatedEUR } from './AnimatedEUR';
import { card } from './fieldStyles';
import { useI18n } from '../i18n';

interface Props {
  result: CashflowResult;
  warnings: PredictorWarning[];
  monthEntries: MonthEntry[];
  canTransfer: boolean;
  onTransfer: () => void;
}

const warnTone: Record<PredictorWarning['severity'], string> = {
  kritisch: 'bg-danger-soft text-danger',
  warnung: 'bg-warm-soft text-warm',
  info: 'bg-canvas text-muted',
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="tabular-nums">{children}</dd>
    </div>
  );
}

export function CashflowPanel({ result: r, warnings, monthEntries, canTransfer, onTransfer }: Props) {
  const { t } = useI18n();
  const planned = r.plannedMonthlySavingCents;

  return (
    <section aria-label={t('fixed.cashflowTitle')} className="space-y-6">
      <div className="rounded-[var(--radius-card)] bg-accent p-6 text-surface shadow-soft">
        <p className="text-sm opacity-80">{t('fixed.cashflowTitle')}</p>
        <p className="mt-1 text-5xl font-semibold tracking-tight tabular-nums sm:text-6xl">
          <AnimatedEUR cents={r.safeSavingsCents} />
        </p>
        <p className="mt-3 max-w-prose text-sm opacity-90">
          {r.nextIncome
            ? t('fixed.safeHint', { date: formatDate(r.nextIncome.date), days: r.windowDays })
            : t('fixed.safeNoIncome')}
        </p>
        {canTransfer && (
          <button
            onClick={onTransfer}
            className="mt-5 rounded-2xl bg-surface px-5 py-2.5 text-sm font-semibold text-accent shadow-soft transition hover:brightness-95"
          >
            {t('fixed.transfer')}
          </button>
        )}
      </div>

      <dl className={`${card} divide-y divide-line py-2`}>
        <Row label={t('fixed.restBuffer')}>
          <AnimatedEUR cents={r.restBufferCents} />
        </Row>
        <Row label={t('fixed.fixedUntil')}>{formatEUR(r.fixedUntilIncomeCents)}</Row>
        <Row label={t('fixed.spendUntil')}>{formatEUR(r.spendingUntilIncomeCents)}</Row>
        <Row label={t('fixed.safetyRow')}>{formatEUR(r.safetyCents)}</Row>
        <Row label={t('fixed.endBalance')}>{formatEUR(r.endBalanceCents)}</Row>
        <Row label={t('fixed.plan')}>
          <span className={planned < 0 ? 'text-danger' : undefined}>
            <AnimatedEUR cents={planned} />
          </span>
        </Row>
        <p className="pb-3 pt-1 text-xs text-muted">
          {t('fixed.planFormula', {
            income: formatEUR(r.monthlyIncomeCents),
            fixed: formatEUR(r.monthlyFixedCents),
            spend: formatEUR(r.monthlySpendCents),
          })}
        </p>
      </dl>

      {warnings.length > 0 && (
        <ul className="space-y-2" aria-label={t('app.notes')}>
          {warnings.map((w, i) => (
            <li
              key={i}
              role={w.severity === 'kritisch' ? 'alert' : undefined}
              className={`animate-pop rounded-2xl px-4 py-3 text-sm ${warnTone[w.severity]}`}
            >
              {t(w.key, w.vars)}
            </li>
          ))}
        </ul>
      )}

      <div className={card}>
        <h3 className="text-sm font-semibold">{t('fixed.monthTitle')}</h3>
        {monthEntries.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{t('fixed.monthEmpty')}</p>
        ) : (
          <ul className="mt-3 divide-y divide-line text-sm">
            {monthEntries.map((e, i) => (
              <li key={i} className="grid grid-cols-[5.5rem_1fr_auto] items-baseline gap-3 py-2.5">
                <span className="tabular-nums text-muted">{formatDate(e.date)}</span>
                <span className="truncate">
                  {e.name}
                  {e.beforeIncome && <span className="ml-2 rounded-full bg-warm-soft px-2 py-0.5 text-xs text-warm">{t('fixed.beforeIncome')}</span>}
                </span>
                <span className="tabular-nums">{formatEUR(e.amountCents)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
