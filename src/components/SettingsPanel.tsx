import { useState, type FormEvent } from 'react';
import { draftFromSettings, validateSettings, type SettingsDraft, type SettingsErrors } from '../agents/budgetRouter';
import type { CashSettings } from '../domain/types';

interface Props {
  settings: CashSettings;
  onSave: (s: CashSettings) => void;
}

const inputClass =
  'mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 aria-[invalid=true]:border-rose-500';

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
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input
        className={inputClass}
        inputMode="decimal"
        value={draft[key]}
        aria-invalid={Boolean(errors[key])}
        onChange={(e) => {
          setDraft({ ...draft, [key]: e.target.value });
          setSaved(false);
        }}
      />
      <span className="mt-1 block text-xs font-normal text-slate-500">{hint}</span>
      {errors[key] && <span className="mt-1 block text-xs text-rose-600">{errors[key]}</span>}
    </label>
  );

  return (
    <section aria-label="Girokonto und Verbrauch" className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="font-semibold text-slate-900">Girokonto & Verbrauch</h2>
      <form onSubmit={submit} noValidate className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {field('balance', 'Aktueller Kontostand (€)', 'Stand heute auf dem Girokonto')}
        {field('monthlySpend', 'Lebenshaltung pro Monat (€)', 'Essen, Tanken, Kleinkram – ohne Fixkosten')}
        {field('safety', 'Sicherheitspuffer (€)', 'Dieser Betrag bleibt immer stehen')}
        <div className="sm:col-span-3 flex items-center gap-3">
          <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
            Speichern
          </button>
          {saved && <span className="text-sm text-emerald-700">Gespeichert</span>}
        </div>
      </form>
    </section>
  );
}
