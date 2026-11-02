import { useState, type FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { validateSavings, type SavingsDraft } from '../agents/portfolioWorker';
import { parseAmountToCents, formatEUR } from '../domain/money';
import type { GoalKind, SavingsAccount } from '../domain/types';
import { useI18n } from '../i18n';
import { card, fieldClass, ghostButton, primaryButton } from './fieldStyles';

const KINDS: GoalKind[] = ['savings', 'fund', 'crypto', 'gold'];

interface Props {
  savings: SavingsAccount[];
  onAdd: (name: string, balanceCents: number, kind: GoalKind, planCents: number) => void;
  onUpdateBalance: (id: string, balanceCents: number) => void;
  onUpdatePlan: (id: string, planCents: number) => void;
  onRemove: (id: string) => void;
}

export function SavingsPanel({ savings, onAdd, onUpdateBalance, onUpdatePlan, onRemove }: Props) {
  const { t } = useI18n();
  const [draft, setDraft] = useState<SavingsDraft & { kind: GoalKind; plan: string }>({ name: '', balance: '', kind: 'savings', plan: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    const r = validateSavings(draft);
    if (!r.ok) return setErrors(r.errors);
    const plan = draft.plan.trim() ? parseAmountToCents(draft.plan, { allowZero: true }) : 0;
    if (plan === null) return setErrors({ plan: 'err.amountZeroOk' });
    onAdd(r.values.name, r.values.balanceCents, draft.kind, plan);
    setDraft({ name: '', balance: '', kind: 'savings', plan: '' });
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
          <li key={s.id} className="rounded-2xl bg-canvas px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{s.name}</p>
                <p className="text-xs text-muted">
                  {t(`goal.kind.${s.kind ?? 'savings'}`)} · {(s.planCents ?? 0) > 0 ? t('goal.planLabel', { amount: formatEUR(s.planCents ?? 0) }) : t('goal.noPlan')}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <InlineAmount value={s.balanceCents} label={s.name} onSave={(c) => onUpdateBalance(s.id, c)} />
                <button onClick={() => onRemove(s.id)} aria-label={`${s.name} ${t('goal.delete')}`} className="rounded-lg p-2 text-muted hover:bg-danger-soft hover:text-danger">
                  <Trash2 size={15} aria-hidden />
                </button>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-end gap-2 text-xs text-muted">
              <span>{t('goal.plan')}</span>
              <InlineAmount value={s.planCents ?? 0} label={`${s.name} ${t('goal.plan')}`} onSave={(c) => onUpdatePlan(s.id, c)} small />
            </div>
          </li>
        ))}
      </ul>

      {open && (
        <form onSubmit={submit} noValidate className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block text-sm text-muted">
            {t('dash.savingsName')}
            <input className={fieldClass} value={draft.name} placeholder={t('dash.savingsNamePh')} aria-invalid={Boolean(errors.name)} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            {errors.name && <span className="mt-1 block text-xs text-danger">{t(errors.name)}</span>}
          </label>
          <label className="block text-sm text-muted">
            {t('goal.kind')}
            <select className={fieldClass} value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as GoalKind })}>
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {t(`goal.kind.${k}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-muted">
            {t('dash.savingsBalance')}
            <input className={fieldClass} inputMode="decimal" value={draft.balance} aria-invalid={Boolean(errors.balance)} onChange={(e) => setDraft({ ...draft, balance: e.target.value })} />
            {errors.balance && <span className="mt-1 block text-xs text-danger">{t(errors.balance)}</span>}
          </label>
          <label className="block text-sm text-muted">
            {t('goal.plan')}
            <input className={fieldClass} inputMode="decimal" value={draft.plan} placeholder="0,00" aria-invalid={Boolean(errors.plan)} onChange={(e) => setDraft({ ...draft, plan: e.target.value })} />
            <span className="mt-1 block text-xs">{t('goal.planHint')}</span>
            {errors.plan && <span className="mt-1 block text-xs text-danger">{t(errors.plan)}</span>}
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className={primaryButton}>
              {t('common.add')}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

function InlineAmount({ value, label, onSave, small = false }: { value: number; label: string; onSave: (cents: number) => void; small?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  if (!editing) {
    return (
      <button
        onClick={() => {
          setText((value / 100).toFixed(2).replace('.', ','));
          setEditing(true);
        }}
        aria-label={label}
        className={`tabular-nums text-ink hover:text-accent ${small ? 'text-xs' : 'text-sm font-medium'}`}
      >
        {formatEUR(value)}
      </button>
    );
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const cents = parseAmountToCents(text, { allowZero: true });
        if (cents !== null) onSave(cents);
        setEditing(false);
      }}
    >
      <input
        autoFocus
        aria-label={label}
        className={`${small ? 'w-20 px-2 py-1 text-xs' : 'w-28 px-3 py-1.5 text-sm'} rounded-xl bg-surface text-right tabular-nums ring-2 ring-accent outline-none`}
        value={text}
        inputMode="decimal"
        onChange={(e) => setText(e.target.value)}
        onBlur={() => setEditing(false)}
      />
    </form>
  );
}
