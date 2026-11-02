import { useState, type FormEvent } from 'react';
import { emptyIncomeDraft, validateIncome, type IncomeDraft, type IncomeErrors } from '../agents/budgetRouter';
import { formatEUR } from '../domain/money';
import type { Income, IncomeValues } from '../domain/types';
import { useI18n } from '../i18n';
import { card, fieldClass, primaryButton } from './fieldStyles';

interface Props {
  incomes: Income[];
  onAdd: (values: IncomeValues) => void;
  onRemove: (id: string) => void;
}

export function IncomePanel({ incomes, onAdd, onRemove }: Props) {
  const { t } = useI18n();
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
    <section aria-label={t('fixed.incomeTitle')} className={card}>
      <h2 className="text-lg font-semibold">{t('fixed.incomeTitle')}</h2>
      {incomes.length === 0 && <p className="mt-2 text-sm text-muted">{t('fixed.incomeEmpty')}</p>}

      {incomes.length > 0 && (
        <ul className="mt-4 divide-y divide-line">
          {incomes.map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-4 py-3">
              <div>
                <p>{i.name}</p>
                <p className="text-xs text-muted">{t('fixed.incomeEvery', { day: i.payDay })}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="tabular-nums text-accent">{formatEUR(i.amountCents)}</span>
                <button onClick={() => onRemove(i.id)} aria-label={`${i.name} ${t('common.delete')}`} className="text-sm text-muted hover:text-danger">
                  {t('common.delete')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} noValidate className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_9rem_6rem_auto] sm:items-end">
        <label className="block text-sm text-muted">
          {t('fixed.incomeName')}
          <input className={fieldClass} value={draft.name} maxLength={60} placeholder={t('fixed.incomeNamePh')} aria-invalid={Boolean(errors.name)} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          {errors.name && <span className="mt-1 block text-xs text-danger">{t(errors.name)}</span>}
        </label>
        <label className="block text-sm text-muted">
          {t('fixed.incomeAmount')}
          <input className={fieldClass} inputMode="decimal" value={draft.amount} placeholder="2.850,00" aria-invalid={Boolean(errors.amount)} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} />
          {errors.amount && <span className="mt-1 block text-xs text-danger">{t(errors.amount)}</span>}
        </label>
        <label className="block text-sm text-muted">
          {t('fixed.incomePayDay')}
          <input className={fieldClass} inputMode="numeric" value={draft.payDay} aria-invalid={Boolean(errors.payDay)} onChange={(e) => setDraft({ ...draft, payDay: e.target.value })} />
          {errors.payDay && <span className="mt-1 block text-xs text-danger">{t(errors.payDay)}</span>}
        </label>
        <button type="submit" className={primaryButton}>
          {t('fixed.incomeAdd')}
        </button>
      </form>
    </section>
  );
}
