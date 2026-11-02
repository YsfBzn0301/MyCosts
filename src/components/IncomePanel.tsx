import { useState, type FormEvent } from 'react';
import { emptyIncomeDraft, validateIncome, type IncomeDraft, type IncomeErrors } from '../agents/budgetRouter';
import { formatEUR } from '../domain/money';
import type { Income, IncomeValues } from '../domain/types';

interface Props {
  incomes: Income[];
  onAdd: (values: IncomeValues) => void;
  onRemove: (id: string) => void;
}

const inputClass =
  'mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 aria-[invalid=true]:border-rose-500';

export function IncomePanel({ incomes, onAdd, onRemove }: Props) {
  const [draft, setDraft] = useState<IncomeDraft>(emptyIncomeDraft());
  const [errors, setErrors] = useState<IncomeErrors>({});

  function submit(e: FormEvent) {
    e.preventDefault();
    const r = validateIncome(draft);
    if (!r.ok) return setErrors(r.errors);
    onAdd(r.values);
    setDraft(emptyIncomeDraft());
    setErrors({});
  }

  return (
    <section aria-label="Einnahmen" className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="font-semibold text-slate-900">Einnahmen</h2>
      <p className="mt-0.5 text-sm text-slate-500">Gehalt und feste monatliche Einnahmen.</p>

      {incomes.length > 0 && (
        <ul className="mt-4 divide-y divide-slate-100">
          {incomes.map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium text-slate-900">{i.name}</p>
                <p className="text-xs text-slate-500">jeden Monat am {i.payDay}.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold tabular-nums text-emerald-700">{formatEUR(i.amountCents)}</span>
                <button
                  onClick={() => onRemove(i.id)}
                  aria-label={`${i.name} löschen`}
                  className="rounded-lg px-2 py-1 text-sm text-rose-600 hover:bg-rose-50"
                >
                  Löschen
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} noValidate className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_9rem_6rem_auto] sm:items-end">
        <label className="block text-sm font-medium text-slate-700">
          Bezeichnung
          <input className={inputClass} value={draft.name} aria-invalid={Boolean(errors.name)} placeholder="Gehalt" maxLength={60}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          {errors.name && <span className="mt-1 block text-xs text-rose-600">{errors.name}</span>}
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Netto (€)
          <input className={inputClass} inputMode="decimal" value={draft.amount} aria-invalid={Boolean(errors.amount)} placeholder="2.850,00"
            onChange={(e) => setDraft({ ...draft, amount: e.target.value })} />
          {errors.amount && <span className="mt-1 block text-xs text-rose-600">{errors.amount}</span>}
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Zahltag
          <input className={inputClass} inputMode="numeric" value={draft.payDay} aria-invalid={Boolean(errors.payDay)}
            onChange={(e) => setDraft({ ...draft, payDay: e.target.value })} />
          {errors.payDay && <span className="mt-1 block text-xs text-rose-600">{errors.payDay}</span>}
        </label>
        <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
          Hinzufügen
        </button>
      </form>
    </section>
  );
}
