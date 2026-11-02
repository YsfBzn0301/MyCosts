import { useState, type FormEvent } from 'react';
import { draftFromSettings, validateSettings, type SettingsDraft, type SettingsErrors } from '../agents/budgetRouter';
import type { CashSettings } from '../domain/types';
import { useI18n } from '../i18n';
import { card, fieldClass, primaryButton } from './fieldStyles';

interface Props {
  settings: CashSettings;
  onSave: (s: CashSettings) => void;
}

export function SettingsPanel({ settings, onSave }: Props) {
  const { t } = useI18n();
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
    setTimeout(() => setSaved(false), 1600);
  }

  const field = (key: keyof SettingsDraft, label: string, hint: string) => (
    <label className="block text-sm text-muted">
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
      <span className="mt-1 block text-xs">{hint}</span>
      {errors[key] && <span className="mt-1 block text-xs text-danger">{t(errors[key] as string)}</span>}
    </label>
  );

  return (
    <section aria-label={t('fixed.settingsTitle')} className={card}>
      <h2 className="text-lg font-semibold">{t('fixed.settingsTitle')}</h2>
      <form onSubmit={submit} noValidate className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {field('balance', t('fixed.balance'), t('fixed.balanceHint'))}
        {field('monthlySpend', t('fixed.spend'), t('fixed.spendHint'))}
        {field('safety', t('fixed.safety'), t('fixed.safetyHint'))}
        <div className="flex items-center gap-3 sm:col-span-3">
          <button type="submit" className={primaryButton}>
            {t('common.save')}
          </button>
          {saved && <span className="animate-pop text-sm text-accent">{t('app.saved')}</span>}
        </div>
      </form>
    </section>
  );
}
