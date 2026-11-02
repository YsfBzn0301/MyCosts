import { useRef, useState } from 'react';
import { ChevronDown, Download, KeyRound, Upload } from 'lucide-react';
import { LANG_NAMES, useI18n } from '../i18n';
import type { Lang, Theme } from '../domain/types';
import { card, fieldClass, ghostButton, primaryButton } from '../components/fieldStyles';
import { ReminderSettings } from '../components/ReminderSettings';
import type { ReminderConfig } from '../agents/reminderAgent';
import type { NotifyPermission } from '../hooks/useReminder';

interface Props {
  lang: Lang;
  onLang: (l: Lang) => void;
  theme: Theme;
  onTheme: (t: Theme) => void;
  apiKey: string | null;
  onSaveKey: (k: string) => void;
  onRemoveKey: () => void;
  reminder: ReminderConfig;
  onReminder: (c: ReminderConfig) => void;
  permission: NotifyPermission;
  onRequestPermission: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  notice: string | null;
}

const THEMES: Theme[] = ['light', 'dark', 'system'];

export function SettingsPage(p: Props) {
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      <section aria-label={t('settings.language')} className={card}>
        <h2 className="text-lg font-semibold">{t('settings.language')}</h2>
        <div role="radiogroup" aria-label={t('settings.language')} className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-canvas p-1">
          {(Object.keys(LANG_NAMES) as Lang[]).map((l) => (
            <button
              key={l}
              role="radio"
              aria-checked={p.lang === l}
              onClick={() => p.onLang(l)}
              className={`rounded-xl py-2.5 text-sm font-medium transition-colors ${p.lang === l ? 'bg-surface text-ink shadow-soft' : 'text-muted'}`}
            >
              {LANG_NAMES[l]}
            </button>
          ))}
        </div>
      </section>

      <section aria-label={t('settings.theme')} className={card}>
        <h2 className="text-lg font-semibold">{t('settings.theme')}</h2>
        <div role="radiogroup" aria-label={t('settings.theme')} className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-canvas p-1">
          {THEMES.map((th) => (
            <button
              key={th}
              role="radio"
              aria-checked={p.theme === th}
              onClick={() => p.onTheme(th)}
              className={`rounded-xl py-2.5 text-sm font-medium transition-colors ${p.theme === th ? 'bg-surface text-ink shadow-soft' : 'text-muted'}`}
            >
              {t(`settings.theme.${th}`)}
            </button>
          ))}
        </div>
      </section>

      <ReminderSettings config={p.reminder} onChange={p.onReminder} permission={p.permission} onRequestPermission={p.onRequestPermission} />

      <FxKeyPanel apiKey={p.apiKey} onSave={p.onSaveKey} onRemove={p.onRemoveKey} />

      <section aria-label={t('settings.data')} className={card}>
        <h2 className="text-lg font-semibold">{t('settings.data')}</h2>
        <p className="mt-2 text-sm text-muted">{t('app.localOnly')}</p>
        <ul className="mt-5 divide-y divide-line">
          <li className="flex items-center justify-between gap-4 py-4">
            <div className="min-w-0">
              <p className="font-medium">{t('settings.export')}</p>
              <p className="text-sm text-muted">{t('settings.exportHint')}</p>
            </div>
            <button onClick={p.onExport} className={`${ghostButton} inline-flex shrink-0 items-center gap-2`}>
              <Download size={16} aria-hidden />
              {t('settings.export')}
            </button>
          </li>
          <li className="flex items-center justify-between gap-4 py-4">
            <div className="min-w-0">
              <p className="font-medium">{t('settings.import')}</p>
              <p className="text-sm text-muted">{t('settings.importHint')}</p>
            </div>
            <label className={`${ghostButton} inline-flex shrink-0 cursor-pointer items-center gap-2`}>
              <Upload size={16} aria-hidden />
              {t('settings.import')}
              <input
                type="file"
                accept="application/json"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) p.onImport(file);
                  e.target.value = '';
                }}
              />
            </label>
          </li>
        </ul>
        {p.notice && <p role="status" className="mt-4 animate-pop text-sm text-accent">{p.notice}</p>}
      </section>
    </div>
  );
}

function FxKeyPanel({ apiKey, onSave, onRemove }: { apiKey: string | null; onSave: (k: string) => void; onRemove: () => void }) {
  const { t } = useI18n();
  const [value, setValue] = useState('');
  const [saved, setSaved] = useState(false);
  const guideRef = useRef<HTMLDetailsElement>(null);

  return (
    <section aria-label={t('settings.fx')} className={card}>
      <div className="flex items-center gap-2">
        <KeyRound size={18} className="text-accent" aria-hidden />
        <h2 className="text-lg font-semibold">{t('settings.fx')}</h2>
      </div>

      <form
        className="mt-4 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!value.trim()) return;
          onSave(value);
          setValue('');
          setSaved(true);
          setTimeout(() => setSaved(false), 1600);
        }}
      >
        <label className="block text-sm text-muted">
          {t('settings.fxKey')}
          <input className={fieldClass} type="password" autoComplete="off" spellCheck={false} value={value} placeholder={t('settings.fxKeyPh')} onChange={(e) => setValue(e.target.value)} />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={!value.trim()} className={primaryButton}>
            {t('common.save')}
          </button>
          {apiKey && (
            <button type="button" onClick={onRemove} className={`${ghostButton} text-danger hover:bg-danger-soft`}>
              {t('settings.fxKeyRemove')}
            </button>
          )}
          {saved && <span className="animate-pop text-sm text-accent">{t('settings.fxKeySaved')}</span>}
        </div>
        <p className="text-xs text-muted">{t('settings.fxPrivacy')}</p>
      </form>

      <details ref={guideRef} className="group mt-5 rounded-2xl bg-canvas px-4 py-3 open:pb-4">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium">
          {t('settings.guideTitle')}
          <ChevronDown size={18} className="shrink-0 text-muted transition-transform duration-300 group-open:rotate-180" aria-hidden />
        </summary>
        <ol className="mt-4 space-y-3 text-sm text-muted">
          {[1, 2, 3, 4].map((n) => (
            <li key={n} className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">{n}</span>
              <span>{t(`settings.guide${n}`)}</span>
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}
