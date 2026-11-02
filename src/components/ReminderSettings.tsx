import { useState, type FormEvent } from 'react';
import { validateReminderDraft, type ReminderConfig } from '../agents/reminderAgent';
import type { NotifyPermission } from '../hooks/useReminder';
import { useI18n } from '../i18n';
import { card, fieldClass, ghostButton, primaryButton } from './fieldStyles';

interface Props {
  config: ReminderConfig;
  onChange: (c: ReminderConfig) => void;
  permission: NotifyPermission;
  onRequestPermission: () => void;
}

export function ReminderSettings({ config, onChange, permission, onRequestPermission }: Props) {
  const { t } = useI18n();
  const [day, setDay] = useState(String(config.day));
  const [time, setTime] = useState(config.time);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    const r = validateReminderDraft({ day, time });
    if (!r.ok) return setErrors(r.errors);
    setErrors({});
    onChange({ ...config, day: r.day, time: r.time });
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  }

  const notifyText =
    permission === 'unsupported'
      ? t('reminder.notifyUnsupported')
      : permission === 'denied'
        ? t('reminder.notifyDenied')
        : permission === 'granted'
          ? t('reminder.notifyGranted')
          : null;

  return (
    <section aria-label={t('reminder.title')} className={card}>
      <h2 className="text-lg font-semibold">{t('reminder.title')}</h2>

      <label className="mt-5 flex items-center justify-between gap-4">
        <span className="text-sm">{t('reminder.enable')}</span>
        <input type="checkbox" className="peer sr-only" checked={config.enabled} onChange={(e) => onChange({ ...config, enabled: e.target.checked })} />
        <span
          className={`relative h-7 w-12 rounded-full transition-colors duration-300 ${config.enabled ? 'bg-accent' : 'bg-line'}`}
          aria-hidden
        >
          <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-surface shadow-soft transition-transform duration-300 ${config.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </span>
      </label>

      <div className="mt-5">
        <p className="text-sm text-muted">{t('reminder.mode')}</p>
        <div role="radiogroup" aria-label={t('reminder.mode')} className="mt-2 grid grid-cols-2 gap-2 rounded-2xl bg-canvas p-1">
          {(['payday', 'day'] as const).map((m) => (
            <button
              key={m}
              role="radio"
              aria-checked={config.mode === m}
              onClick={() => onChange({ ...config, mode: m })}
              className={`rounded-xl py-2 text-sm font-medium transition-colors ${config.mode === m ? 'bg-surface shadow-soft' : 'text-muted'}`}
            >
              {t(`reminder.mode.${m}`)}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={submit} noValidate className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        {config.mode === 'day' ? (
          <label className="block text-sm text-muted">
            {t('reminder.day')}
            <input className={fieldClass} inputMode="numeric" value={day} aria-invalid={Boolean(errors.day)} onChange={(e) => setDay(e.target.value)} />
            {errors.day && <span className="mt-1 block text-xs text-danger">{t(errors.day)}</span>}
          </label>
        ) : (
          <div />
        )}
        <label className="block text-sm text-muted">
          {t('reminder.time')}
          <input className={fieldClass} inputMode="numeric" placeholder="09:00" value={time} aria-invalid={Boolean(errors.time)} onChange={(e) => setTime(e.target.value)} />
          {errors.time && <span className="mt-1 block text-xs text-danger">{t(errors.time)}</span>}
        </label>
        <button type="submit" className={primaryButton}>
          {t('common.save')}
        </button>
      </form>
      {saved && <p className="mt-3 animate-pop text-sm text-accent">{t('app.saved')}</p>}

      <div className="mt-6 rounded-2xl bg-canvas p-4">
        <p className="text-sm font-medium">{t('reminder.notify')}</p>
        {notifyText ? (
          <p className="mt-1 text-sm text-muted">{notifyText}</p>
        ) : (
          <button onClick={onRequestPermission} className={`${ghostButton} mt-2`}>
            {t('reminder.notifyOn')}
          </button>
        )}
        <label className="mt-3 flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[var(--color-accent)]"
            checked={config.notify}
            disabled={permission !== 'granted'}
            onChange={(e) => onChange({ ...config, notify: e.target.checked })}
          />
          {t('reminder.notify')}
        </label>
        <p className="mt-3 text-xs text-muted">{t('reminder.hint')}</p>
      </div>
    </section>
  );
}
