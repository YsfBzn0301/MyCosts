import { useEffect, useState } from 'react';
import { Logo } from './Logo';
import { useI18n } from '../i18n';

export function Splash({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const fade = setTimeout(() => setLeaving(true), 1600);
    const done = setTimeout(onDone, 2100);
    return () => {
      clearTimeout(fade);
      clearTimeout(done);
    };
  }, [onDone]);

  return (
    <div
      role="status"
      aria-label={t('app.loading')}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-canvas transition-opacity duration-500 ${
        leaving ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <Logo animated className="h-28 w-28 drop-shadow-md" />
      <p className="mt-6 animate-fade-up text-xl font-semibold tracking-tight" style={{ animationDelay: '700ms' }}>
        {t('app.title')}
      </p>
      <p className="mt-1 animate-fade-up text-sm text-muted" style={{ animationDelay: '850ms' }}>
        {t('app.splashTagline')}
      </p>
    </div>
  );
}
