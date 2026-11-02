import { useState, type FormEvent } from 'react';
import { buildTransaction } from '../agents/portfolioWorker';
import { useI18n } from '../i18n';
import { fieldClass, primaryButton, card } from './fieldStyles';
import { CHECKING_ID } from '../agents/portfolioWorker';
import type { SavingsAccount, Transaction } from '../domain/types';

interface Props {
  savings: SavingsAccount[];
  onRecord: (tx: Transaction) => void;
}

export function QuickEntry({ savings, onRecord }: Props) {
  const { t } = useI18n();
  const [direction, setDirection] = useState<'in' | 'out'>('in');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState(CHECKING_ID);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    const r = buildTransaction({ direction, amount, accountId, note, date: new Date() });
    if (!r.ok) return setError(t(r.error));
    onRecord(r.value);
    setAmount('');
    setNote('');
    setError(null);
  }

  return (
    <section aria-label={t('dash.quickTitle')} className={card}>
      <h2 className="text-lg font-semibold">{t('dash.quickTitle')}</h2>
      <form onSubmit={submit} noValidate className="mt-5 space-y-4">
        <div role="radiogroup" aria-label={t('dash.quickTitle')} className="grid grid-cols-2 gap-2 rounded-2xl bg-canvas p-1">
          {(['in', 'out'] as const).map((d) => (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={direction === d}
              onClick={() => setDirection(d)}
              className={`rounded-xl py-2 text-sm font-medium transition-colors ${
                direction === d ? (d === 'in' ? 'bg-accent-soft text-accent' : 'bg-danger-soft text-danger') : 'text-muted'
              }`}
            >
              {t(`dash.direction.${d}`)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block text-sm text-muted">
            {t('dash.amount')}
            <input className={fieldClass} inputMode="decimal" value={amount} placeholder="25,00" onChange={(e) => setAmount(e.target.value)} />
          </label>
          <label className="block text-sm text-muted">
            {t('dash.account')}
            <select className={fieldClass} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              <option value={CHECKING_ID}>{t('dash.accountChecking')}</option>
              {savings.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block text-sm text-muted">
          {t('dash.note')}
          <input className={fieldClass} value={note} maxLength={80} placeholder={t('dash.notePh')} onChange={(e) => setNote(e.target.value)} />
        </label>

        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <div className="flex items-center gap-3">
          <button type="submit" className={primaryButton}>
            {t('dash.record')}
          </button>
        </div>
      </form>
    </section>
  );
}
