import { useState, type FormEvent } from 'react';
import { parseQuickEntry } from '../agents/quickEntry';
import { formatEUR } from '../domain/money';
import type { FixedCostValues, IncomeValues } from '../domain/types';
import { useI18n } from '../i18n';
import { card, fieldClass, ghostButton, primaryButton } from './fieldStyles';

interface Props {
  onCost: (v: FixedCostValues) => void;
  onIncome: (v: IncomeValues) => void;
}

type Preview =
  | { kind: 'cost'; values: FixedCostValues; notes: string[] }
  | { kind: 'income'; values: IncomeValues; notes: string[] };

/** Ein Satz statt Formular: erkennt Name, Betrag und Tag und zeigt die Vorschau vor dem Speichern. */
export function QuickCostInput({ onCost, onIncome }: Props) {
  const { t } = useI18n();
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);

  function detect(e: FormEvent) {
    e.preventDefault();
    const r = parseQuickEntry(text);
    if (!r.ok) {
      setPreview(null);
      return setError(t(r.error));
    }
    setError(null);
    setPreview(r.kind === 'cost' ? { kind: 'cost', values: r.values, notes: r.notes } : { kind: 'income', values: r.values, notes: r.notes });
  }

  function save() {
    if (!preview) return;
    if (preview.kind === 'cost') onCost(preview.values);
    else onIncome(preview.values);
    setPreview(null);
    setText('');
  }

  const categoryLabel = preview?.kind === 'cost' ? t(`cat.${preview.values.category}`) : null;

  return (
    <section aria-label={t('quick.title')} className={`${card} space-y-4`}>
      <div>
        <h2 className="text-lg font-semibold">{t('quick.title')}</h2>
        <p className="mt-1 text-sm text-muted">{t('quick.hint')}</p>
      </div>

      <form onSubmit={detect} noValidate className="flex flex-col gap-3 sm:flex-row">
        <input
          className={`${fieldClass} mt-0 flex-1`}
          value={text}
          placeholder={t('quick.placeholder')}
          aria-invalid={Boolean(error)}
          onChange={(e) => {
            setText(e.target.value);
            setPreview(null);
          }}
        />
        <button type="submit" className={primaryButton}>
          {t('quick.detect')}
        </button>
      </form>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}

      {preview && (
        <div className="animate-pop space-y-3 rounded-2xl bg-accent-soft p-4">
          <p className="text-sm text-muted">{preview.kind === 'cost' ? t('quick.kindCost') : t('quick.kindIncome')}</p>
          <p className="text-lg font-semibold">
            {preview.values.name} · {formatEUR(preview.values.amountCents)}
          </p>
          <p className="text-sm">
            {t('fixed.incomeEvery', { day: preview.kind === 'cost' ? preview.values.dueDay : preview.values.payDay })}
            {categoryLabel && <span className="text-muted"> · {categoryLabel}</span>}
          </p>
          {preview.notes.map((n) => (
            <p key={n} className="text-xs text-muted">{t(n)}</p>
          ))}
          <div className="flex justify-end gap-2">
            <button onClick={() => setPreview(null)} className={ghostButton}>
              {t('common.cancel')}
            </button>
            <button onClick={save} className={primaryButton}>
              {t('quick.save')}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
