import { useState, type FormEvent } from 'react';
import { draftFromSettings, validateSettings, type SettingsDraft, type SettingsErrors } from '../agents/budgetRouter';
import type { CashSettings } from '../domain/types';
import { fieldClass, primaryButton } from './fieldStyles';

interface Props {
  settings: CashSettings;
  onSave: (s: CashSettings) => void;
}

export function SettingsPanel({ settings, onSave }: Props) {
  const [draft, setDraft] = useState<SettingsDraft>(() => draftFromSettings(settings));
  const [errors, setErrors] = useState<SettingsErrors>({});
  const [saved, setSaved] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    const r = validateSettings(draft);
    if (!r.ok) return setErrors(r.errors);
    onSave(r.values);
    setErrors({});
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  const field = (key: keyof SettingsDraft, label: string, hint: string) => (
    <label className="block text-sm text-slate-600">
      {label}
      <input
        className={fieldClass}
        inputMode="decimal"
        value={draft[key]}
        aria-invalid={Boolean(errors[key])}
        onChange={(e) => {
          setDraft({ ...draft, [key]: e.target.value });
          setSaved(false);
        }}
      />
      <span className="mt-1 block text-xs text-slate-500">{hint}</span>
      {errors[key] && <span className="mt-1 block text-xs text-rose-700">{errors[key]}</span>}
    </label>
  );

  return (
    <section aria-label="Girokonto und Verbrauch">
      <h2 className="text-lg font-semibold text-slate-900">Girokonto und Verbrauch</h2>
      <form onSubmit={submit} noValidate className="mt-5 grid grid-cols-1 gap-8 sm:grid-cols-3">
        {field('balance', 'Aktueller Kontostand (€)', 'Stand heute auf dem Girokonto')}
        {field('monthlySpend', 'Lebenshaltung pro Monat (€)', 'Essen, Tanken, Kleinkram')}
        {field('safety', 'Sicherheitspuffer (€)', 'Bleibt immer stehen')}
        <div className="flex items-center gap-3 sm:col-span-3">
          <button type="submit" className={primaryButton}>
            Speichern
          </button>
          {saved && <span className="text-sm text-emerald-700">Gespeichert</span>}
        </div>
      </form>
    </section>
  );
}
