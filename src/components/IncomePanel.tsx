import { useState, type FormEvent } from 'react';
import { emptyIncomeDraft, validateIncome, type IncomeDraft, type IncomeErrors } from '../agents/budgetRouter';
import { formatEUR } from '../domain/money';
import type { Income, IncomeValues } from '../domain/types';
import { fieldClass, primaryButton } from './fieldStyles';

interface Props {
  incomes: Income[];
  onAdd: (values: IncomeValues) => void;
  onRemove: (id: string) => void;
}

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
    <section aria-label="Einnahmen">
      <h2 className="text-lg font-semibold text-slate-900">Einnahmen</h2>

      {incomes.length > 0 && (
        <ul className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
          {incomes.map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="text-slate-900">{i.name}</p>
                <p className="text-xs text-slate-500">jeden Monat am {i.payDay}.</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="tabular-nums text-slate-900">{formatEUR(i.amountCents)}</span>
                <button
                  onClick={() => onRemove(i.id)}
                  aria-label={`${i.name} löschen`}
                  className="text-sm text-slate-400 hover:text-rose-700"
                >
                  Löschen
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} noValidate className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-[1fr_9rem_6rem_auto] sm:items-end">
        <label className="block text-sm text-slate-600">
          Bezeichnung
          <input className={fieldClass} value={draft.name} maxLength={60} placeholder="Gehalt" aria-invalid={Boolean(errors.name)}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          {errors.name && <span className="mt-1 block text-xs text-rose-700">{errors.name}</span>}
        </label>
        <label className="block text-sm text-slate-600">
          Netto (€)
          <input className={fieldClass} inputMode="decimal" value={draft.amount} placeholder="2.850,00" aria-invalid={Boolean(errors.amount)}
            onChange={(e) => setDraft({ ...draft, amount: e.target.value })} />
          {errors.amount && <span className="mt-1 block text-xs text-rose-700">{errors.amount}</span>}
        </label>
        <label className="block text-sm text-slate-600">
          Zahltag
          <input className={fieldClass} inputMode="numeric" value={draft.payDay} aria-invalid={Boolean(errors.payDay)}
            onChange={(e) => setDraft({ ...draft, payDay: e.target.value })} />
          {errors.payDay && <span className="mt-1 block text-xs text-rose-700">{errors.payDay}</span>}
        </label>
        <button type="submit" className={primaryButton}>
          Hinzufügen
        </button>
      </form>
    </section>
  );
}
