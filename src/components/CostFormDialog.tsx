import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { CATEGORIES } from '../domain/categories';
import { INTERVAL_LABELS, type FixedCost, type FixedCostValues, type Interval } from '../domain/types';
import {
  draftFromCost,
  emptyDraft,
  validateDraft,
  type FieldErrors,
  type FormDraft,
} from '../agents/uiDataWorker';

interface Props {
  cost: FixedCost | null;
  onClose: () => void;
  onSave: (values: FixedCostValues) => void;
}

const inputClass =
  'mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 aria-[invalid=true]:border-rose-500';

/** Label und Control sind per id verknüpft (nicht umschlossen), damit der Accessible Name nur das Label ist. */
function Field({ label, error, children }: { label: string; error?: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div className="block text-sm font-medium text-slate-700">
      <label htmlFor={id}>{label}</label>
      {children(id)}
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </div>
  );
}

export function CostFormDialog({ cost, onClose, onSave }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<FormDraft>(() => (cost ? draftFromCost(cost) : emptyDraft()));
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  const update = <K extends keyof FormDraft>(key: K, value: FormDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  function submit(e: FormEvent) {
    e.preventDefault();
    const result = validateDraft(draft);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    onSave(result.values);
  }

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="m-auto w-[min(92vw,28rem)] rounded-2xl bg-white p-0 shadow-xl"
    >
      <form onSubmit={submit} noValidate className="space-y-4 p-5">
        <h2 className="text-lg font-semibold text-slate-900">
          {cost ? 'Fixkosten bearbeiten' : 'Neuer Fixkosten-Posten'}
        </h2>

        <Field label="Name" error={errors.name}>
          {(id) => (
            <input
              id={id}
              className={inputClass}
              value={draft.name}
              maxLength={60}
              autoFocus
              aria-invalid={Boolean(errors.name)}
              placeholder="z. B. Netflix, Kaltmiete"
              onChange={(e) => update('name', e.target.value)}
            />
          )}
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Betrag (€)" error={errors.amount}>
            {(id) => (
              <input
                id={id}
                className={inputClass}
                inputMode="decimal"
                value={draft.amount}
                aria-invalid={Boolean(errors.amount)}
                placeholder="12,99"
                onChange={(e) => update('amount', e.target.value)}
              />
            )}
          </Field>
          <Field label="Intervall">
            {(id) => (
              <select id={id} className={inputClass} value={draft.interval} onChange={(e) => update('interval', e.target.value as Interval)}>
                {(Object.keys(INTERVAL_LABELS) as Interval[]).map((i) => (
                  <option key={i} value={i}>
                    {INTERVAL_LABELS[i]}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>

        <Field label="Kategorie" error={errors.category}>
          {(id) => (
              <select
                id={id}
                className={inputClass}
                value={draft.category}
                aria-invalid={Boolean(errors.category)}
                onChange={(e) => update('category', e.target.value as FormDraft['category'])}
              >
                <option value="">Bitte wählen</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
          )}
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Fällig am (Tag)" error={errors.dueDay}>
            {(id) => (
              <input
                id={id}
                className={inputClass}
                inputMode="numeric"
                value={draft.dueDay}
                aria-invalid={Boolean(errors.dueDay)}
                onChange={(e) => update('dueDay', e.target.value)}
              />
            )}
          </Field>
          {draft.interval !== 'monthly' && (
            <Field label="Fälligkeitsmonat" error={errors.dueMonth}>
              {(id) => (
                <select id={id} className={inputClass} value={draft.dueMonth} onChange={(e) => update('dueMonth', e.target.value)}>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2000, i, 1).toLocaleString('de-DE', { month: 'long' })}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">
            Abbrechen
          </button>
          <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Speichern
          </button>
        </div>
      </form>
    </dialog>
  );
}
