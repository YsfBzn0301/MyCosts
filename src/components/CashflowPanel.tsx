import { formatEUR } from '../domain/money';
import { AnimatedEUR } from './AnimatedEUR';
import type { CashflowResult, MonthEntry } from '../domain/cashflow';
import type { PredictorWarning } from '../agents/cashflowPredictor';
import { dateFormat } from './format';

interface Props {
  result: CashflowResult;
  warnings: PredictorWarning[];
  monthEntries: MonthEntry[];
}

const severityStyle: Record<PredictorWarning['severity'], string> = {
  kritisch: 'bg-rose-50 text-rose-800 ring-rose-200',
  warnung: 'bg-amber-50 text-amber-800 ring-amber-200',
  info: 'bg-slate-50 text-slate-700 ring-slate-200',
};

export function CashflowPanel({ result: r, warnings, monthEntries }: Props) {
  const daysLeft = r.nextIncome ? r.windowDays : null;
  const savingsNegative = r.plannedMonthlySavingCents < 0;

  return (
    <section aria-label="Cashflow" className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-emerald-600 p-5 text-white shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-100">Sicherer Sparbetrag heute</p>
          <p className="mt-1 text-3xl font-bold tabular-nums"><AnimatedEUR cents={r.safeSavingsCents} /></p>
          <p className="mt-2 text-sm text-emerald-50">
            Sofort aufs Sparkonto überweisbar, ohne dass eine Fixkosten-Abbuchung bis zum Gehalt ins Minus rutscht.
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Restpuffer auf dem Girokonto</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900"><AnimatedEUR cents={r.restBufferCents} /></p>
          <p className="mt-2 text-sm text-slate-500">
            Muss bis zum nächsten Gehalt stehen bleiben.
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-sm font-semibold text-slate-700">Bis zum nächsten Gehalt</h3>
        {r.nextIncome ? (
          <p className="mt-1 text-sm text-slate-600">
            {r.nextIncome.name} am {dateFormat.format(r.nextIncome.date)} ({formatEUR(r.nextIncome.amountCents)}), in {daysLeft} Tagen.
          </p>
        ) : (
          <p className="mt-1 text-sm text-slate-600">Keine Einnahme hinterlegt. Es wird ein Zeitraum von 30 Tagen betrachtet.</p>
        )}
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
          <dt className="text-slate-500">Fixkosten</dt>
          <dd className="text-right tabular-nums sm:text-left">{formatEUR(r.fixedUntilIncomeCents)}</dd>
          <dt className="text-slate-500">Lebenshaltung</dt>
          <dd className="text-right tabular-nums sm:text-left">{formatEUR(r.spendingUntilIncomeCents)}</dd>
          <dt className="text-slate-500">Sicherheitspuffer</dt>
          <dd className="text-right tabular-nums sm:text-left">{formatEUR(r.safetyCents)}</dd>
          <dt className="text-slate-500">Prognose vor Gehalt</dt>
          <dd className="text-right tabular-nums sm:text-left">{formatEUR(r.endBalanceCents)}</dd>
        </dl>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-sm font-semibold text-slate-700">Planung pro Monat</h3>
        <p className={`mt-1 text-2xl font-bold tabular-nums ${savingsNegative ? 'text-rose-600' : 'text-slate-900'}`}>
          <AnimatedEUR cents={r.plannedMonthlySavingCents} />
        </p>
        <p className="text-sm text-slate-500">
          Einnahmen {formatEUR(r.monthlyIncomeCents)} − Fixkosten {formatEUR(r.monthlyFixedCents)} − Lebenshaltung {formatEUR(r.monthlySpendCents)}
        </p>
      </div>

      {warnings.length > 0 && (
        <ul className="space-y-2" aria-label="Hinweise">
          {warnings.map((w, i) => (
            <li key={i} role={w.severity === 'kritisch' ? 'alert' : undefined} className={`animate-pop rounded-xl px-4 py-3 text-sm ring-1 ${severityStyle[w.severity]}`}>
              {w.message}
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-sm font-semibold text-slate-700">Abbuchungen diesen Monat</h3>
        {monthEntries.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Keine Fixkosten in diesem Monat.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {monthEntries.map((e, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-2 transition-colors hover:bg-slate-50">
                <span className="text-slate-500 tabular-nums">{dateFormat.format(e.date)}</span>
                <span className="flex-1 truncate text-slate-800">{e.name}</span>
                {e.beforeIncome && (
                  <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">vor Gehalt</span>
                )}
                <span className="tabular-nums text-slate-900">{formatEUR(e.amountCents)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
