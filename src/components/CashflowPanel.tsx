import { formatEUR } from '../domain/money';
import type { CashflowResult, MonthEntry } from '../domain/cashflow';
import type { PredictorWarning } from '../agents/cashflowPredictor';
import { dateFormat } from './format';
import { AnimatedEUR } from './AnimatedEUR';

interface Props {
  result: CashflowResult;
  warnings: PredictorWarning[];
  monthEntries: MonthEntry[];
}

const warnStyle: Record<PredictorWarning['severity'], string> = {
  kritisch: 'border-rose-600 text-rose-800',
  warnung: 'border-amber-500 text-amber-800',
  info: 'border-slate-300 text-slate-600',
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-slate-200 py-3 last:border-0">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="tabular-nums text-slate-900">{children}</dd>
    </div>
  );
}

export function CashflowPanel({ result: r, warnings, monthEntries }: Props) {
  const planned = r.plannedMonthlySavingCents;

  return (
    <section aria-label="Cashflow" className="space-y-10">
      <div>
        <p className="text-sm text-slate-500">Sicher sparen heute</p>
        <p className="mt-1 text-6xl font-semibold tracking-tight tabular-nums text-emerald-700 sm:text-7xl">
          <AnimatedEUR cents={r.safeSavingsCents} />
        </p>
        <p className="mt-3 max-w-prose text-slate-600">
          {r.nextIncome
            ? `Ohne Überziehung bis zum Gehalt am ${dateFormat.format(r.nextIncome.date)}, in ${r.windowDays} Tagen.`
            : 'Ohne hinterlegtes Gehalt betrachtet die Prognose die nächsten 30 Tage.'}
        </p>
      </div>

      <dl className="max-w-md">
        <Row label="Restpuffer auf dem Girokonto">
          <AnimatedEUR cents={r.restBufferCents} />
        </Row>
        <Row label="Fixkosten bis Gehalt">{formatEUR(r.fixedUntilIncomeCents)}</Row>
        <Row label="Lebenshaltung bis Gehalt">{formatEUR(r.spendingUntilIncomeCents)}</Row>
        <Row label="Sicherheitspuffer">{formatEUR(r.safetyCents)}</Row>
        <Row label="Kontostand vor Gehalt">{formatEUR(r.endBalanceCents)}</Row>
        <Row label="Planung pro Monat">
          <span className={planned < 0 ? 'text-rose-700' : undefined}>
            <AnimatedEUR cents={planned} />
          </span>
        </Row>
      </dl>
      <p className="-mt-6 text-xs text-slate-500">
        Einnahmen {formatEUR(r.monthlyIncomeCents)} − Fixkosten {formatEUR(r.monthlyFixedCents)} − Lebenshaltung{' '}
        {formatEUR(r.monthlySpendCents)}
      </p>

      {warnings.length > 0 && (
        <ul className="space-y-3" aria-label="Hinweise">
          {warnings.map((w, i) => (
            <li
              key={i}
              role={w.severity === 'kritisch' ? 'alert' : undefined}
              className={`animate-pop border-l-2 pl-3 text-sm ${warnStyle[w.severity]}`}
            >
              {w.message}
            </li>
          ))}
        </ul>
      )}

      <div>
        <h2 className="text-sm text-slate-500">Abbuchungen diesen Monat</h2>
        {monthEntries.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Keine Fixkosten in diesem Monat.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-200 border-y border-slate-200 text-sm">
            {monthEntries.map((e, i) => (
              <li key={i} className="grid grid-cols-[5.5rem_1fr_auto] items-baseline gap-3 py-2.5">
                <span className="tabular-nums text-slate-500">{dateFormat.format(e.date)}</span>
                <span className="truncate text-slate-900">
                  {e.name}
                  {e.beforeIncome && <span className="ml-2 text-xs text-amber-700">vor Gehalt</span>}
                </span>
                <span className="tabular-nums text-slate-900">{formatEUR(e.amountCents)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
