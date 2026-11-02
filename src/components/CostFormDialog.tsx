import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { CATEGORIES } from '../domain/categories';
import { INTERVAL_LABELS, type FixedCost, type FixedCostValues, type Interval } from '../domain/types';
import { draftFromCost, emptyDraft, validateDraft, type FieldErrors, type FormDraft } from '../agents/uiDataWorker';
import { getLocale } from '../domain/locale';
import { useI18n } from '../i18n';
import { fieldClass, primaryButton, ghostButton } from './fieldStyles';

interface Props {
  cost: FixedCost | null;
  onClose: () => void;
  onSave: (values: FixedCostValues) => void;
}

function Field({ label, error, children }: { label: string; error?: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div className="block text-sm text-muted">
      <label htmlFor={id}>{label}</label>
      {children(id)}
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
    </div>
  );
}

export function CostFormDialog({ cost, onClose, onSave }: Props) {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<FormDraft>(() => (cost ? draftFromCost(cost) : emptyDraft()));
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  const update = <K extends keyof FormDraft>(key: K, value: FormDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const monthName = (i: number) => new Date(2000, i, 1).toLocaleString(getLocale(), { month: 'long' });

  function submit(e: FormEvent) {
    e.preventDefault();
    const result = validateDraft(draft);
    if (!result.ok) return setErrors(result.errors);
    onSave(result.values);
  }

  const err = (key: keyof FieldErrors) => (errors[key] ? t(errors[key] as string) : undefined);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="m-auto w-[min(92vw,30rem)] rounded-[28px] bg-surface p-0 text-ink shadow-lift"
    >
      <form onSubmit={submit} noValidate className="space-y-5 p-6">
        <h2 className="text-lg font-semibold">{cost ? t('form.editCost') : t('form.newCost')}</h2>

        <Field label={t('form.name')} error={err('name')}>
          {(id) => (
            <input id={id} className={fieldClass} value={draft.name} maxLength={60} autoFocus aria-invalid={Boolean(errors.name)} placeholder={t('form.namePh')} onChange={(e) => update('name', e.target.value)} />
          )}
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label={t('form.amount')} error={err('amount')}>
            {(id) => <input id={id} className={fieldClass} inputMode="decimal" value={draft.amount} aria-invalid={Boolean(errors.amount)} placeholder="12,99" onChange={(e) => update('amount', e.target.value)} />}
          </Field>
          <Field label={t('form.interval')}>
            {(id) => (
              <select id={id} className={fieldClass} value={draft.interval} onChange={(e) => update('interval', e.target.value as Interval)}>
                {(Object.keys(INTERVAL_LABELS) as Interval[]).map((i) => (
                  <option key={i} value={i}>
                    {t(`interval.${i}`)}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>

        <Field label={t('form.category')} error={err('category')}>
          {(id) => (
            <select id={id} className={fieldClass} value={draft.category} aria-invalid={Boolean(errors.category)} onChange={(e) => update('category', e.target.value as FormDraft['category'])}>
              <option value="">{t('form.pick')}</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {t(`cat.${c.id}`)}
                </option>
              ))}
            </select>
          )}
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label={t('form.dueDay')} error={err('dueDay')}>
            {(id) => <input id={id} className={fieldClass} inputMode="numeric" value={draft.dueDay} aria-invalid={Boolean(errors.dueDay)} onChange={(e) => update('dueDay', e.target.value)} />}
          </Field>
          {draft.interval !== 'monthly' && (
            <Field label={t('form.dueMonth')} error={err('dueMonth')}>
              {(id) => (
                <select id={id} className={fieldClass} value={draft.dueMonth} onChange={(e) => update('dueMonth', e.target.value)}>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {monthName(i)}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={ghostButton}>
            {t('common.cancel')}
          </button>
          <button type="submit" className={primaryButton}>
            {t('common.save')}
          </button>
        </div>
      </form>
    </dialog>
  );
}
