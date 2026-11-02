import { useState, type FormEvent } from 'react';
import { validateSavings, type SavingsDraft } from '../agents/portfolioWorker';
import { formatEUR } from '../domain/money';
import type { SavingsAccount } from '../domain/types';
import { useI18n } from '../i18n';
import { card, fieldClass, ghostButton, primaryButton } from './fieldStyles';

interface Props {
  savings: SavingsAccount[];
  onAdd: (name: string, balanceCents: number) => void;
  onUpdateBalance: (id: string, balanceCents: number) => void;
}

export function SavingsPanel({ savings, onAdd, onUpdateBalance }: Props) {
  const { t } = useI18n();
  const [draft, setDraft] = useState<SavingsDraft>({ name: '', balance: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    const r = validateSavings(draft);
    if (!r.ok) return setErrors(r.errors);
    onAdd(r.values.name, r.values.balanceCents);
    setDraft({ name: '', balance: '' });
    setErrors({});
    setOpen(false);
  }

  return (
    <section aria-label={t('dash.savingsTitle')} className={card}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('dash.savingsTitle')}</h2>
        <button onClick={() => setOpen((v) => !v)} className={ghostButton} aria-expanded={open}>
          {t('dash.savingsAdd')}
        </button>
      </div>

      {savings.length === 0 && !open && <p className="mt-4 text-sm text-muted">{t('dash.savingsEmpty')}</p>}

      <ul className="mt-4 space-y-3">
        {savings.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-3 rounded-2xl bg-canvas px-4 py-3">
            <span className="truncate font-medium">{s.name}</span>
            <BalanceEditor value={s.balanceCents} onSave={(c) => onUpdateBalance(s.id, c)} />
          </li>
        ))}
      </ul>

      {open && (
        <form onSubmit={submit} noValidate className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_9rem_auto] sm:items-end">
          <label className="block text-sm text-muted">
            {t('dash.savingsName')}
            <input className={fieldClass} value={draft.name} placeholder={t('dash.savingsNamePh')} aria-invalid={Boolean(errors.name)} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            {errors.name && <span className="mt-1 block text-xs text-danger">{t(errors.name)}</span>}
          </label>
          <label className="block text-sm text-muted">
            {t('dash.savingsBalance')}
            <input className={fieldClass} inputMode="decimal" value={draft.balance} aria-invalid={Boolean(errors.balance)} onChange={(e) => setDraft({ ...draft, balance: e.target.value })} />
            {errors.balance && <span className="mt-1 block text-xs text-danger">{t(errors.balance)}</span>}
          </label>
          <button type="submit" className={primaryButton}>
            {t('common.add')}
          </button>
        </form>
      )}
    </section>
  );
}

function BalanceEditor({ value, onSave }: { value: number; onSave: (cents: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  if (!editing) {
    return (
      <button onClick={() => { setText((value / 100).toFixed(2).replace('.', ',')); setEditing(true); }} className="tabular-nums text-ink hover:text-accent" aria-label={formatEUR(value)}>
        {formatEUR(value)}
      </button>
    );
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const r = validateSavings({ name: 'x', balance: text });
        if (r.ok) onSave(r.values.balanceCents);
        setEditing(false);
      }}
      className="flex items-center gap-2"
    >
      <input autoFocus className="w-28 rounded-xl bg-surface px-3 py-1.5 text-right tabular-nums ring-2 ring-accent outline-none" value={text} inputMode="decimal" onChange={(e) => setText(e.target.value)} onBlur={() => setEditing(false)} />
    </form>
  );
}
