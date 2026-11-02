import { useState } from 'react';
import { formatEUR } from '../domain/money';
import type { FixedCost } from '../domain/types';
import { analyzeCosts, type AdvisorOutcome } from '../agents/advisor';

interface Props {
  costs: FixedCost[];
  online: boolean;
}

const priorityStyle: Record<'hoch' | 'mittel' | 'niedrig', string> = {
  hoch: 'bg-rose-100 text-rose-700',
  mittel: 'bg-amber-100 text-amber-700',
  niedrig: 'bg-slate-100 text-slate-600',
};

export function AdvisorPanel({ costs, online }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [outcome, setOutcome] = useState<AdvisorOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setStatus('loading');
    setError(null);
    const result = await analyzeCosts(costs);
    if (result.ok) {
      setOutcome(result);
      setStatus('done');
    } else {
      setError(result.error);
      setStatus('error');
    }
  }

  const potentialSaving = outcome && outcome.ok && 'report' in outcome
    ? outcome.report.suggestions.reduce((s, x) => s + (x.estimatedMonthlySavingEUR ?? 0), 0)
    : 0;

  return (
    <section aria-label="KI-Analyse" className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-900">KI-Analyse & Sparpotenziale</h2>
          <p className="mt-0.5 text-sm text-slate-500">Läuft nur auf Klick. Es werden nur deine Posten übermittelt.</p>
        </div>
        <button
          onClick={run}
          disabled={!online || costs.length === 0 || status === 'loading'}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {status === 'loading' ? 'Analysiere …' : 'Analysiere meine Fixkosten'}
        </button>
      </div>

      {!online && <p className="mt-3 text-sm text-amber-700">Offline – die Analyse ist gerade nicht verfügbar.</p>}
      {error && <p role="alert" className="mt-3 text-sm text-rose-600">{error}</p>}

      {outcome && outcome.ok && 'report' in outcome && (
        <div className="mt-5 space-y-5">
          <p className="text-slate-700">{outcome.report.summary}</p>
          <div className="rounded-xl bg-indigo-50 p-4 text-sm text-indigo-900">
            <span className="font-semibold">Budget-Tipp: </span>
            {outcome.report.budgetTip}
          </div>
          {outcome.report.suggestions.length > 0 && (
            <ul className="space-y-3">
              {outcome.report.suggestions.map((s, i) => (
                <li key={i} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${priorityStyle[s.priority]}`}>
                      Priorität {s.priority}
                    </span>
                    <h3 className="font-medium text-slate-900">{s.title}</h3>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{s.detail}</p>
                  {s.estimatedMonthlySavingEUR !== null && (
                    <p className="mt-2 text-sm font-medium text-emerald-700">
                      ≈ {formatEUR(Math.round(s.estimatedMonthlySavingEUR * 100))} pro Monat sparen
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
          {potentialSaving > 0 && (
            <p className="text-sm text-slate-500">
              Geschätztes Gesamtpotenzial: <strong>{formatEUR(Math.round(potentialSaving * 100))}</strong> pro Monat
            </p>
          )}
        </div>
      )}

      {outcome && outcome.ok && 'rawText' in outcome && (
        <pre className="mt-5 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm text-slate-700">{outcome.rawText}</pre>
      )}
    </section>
  );
}
