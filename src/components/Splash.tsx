import { useEffect, useState } from 'react';
import { Logo } from './Logo';

interface Props {
  onDone: () => void;
}

/** Startscreen: Logo baut sich auf, danach weicher Übergang in die App. */
export function Splash({ onDone }: Props) {
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
      aria-label="Fixkosten & Sparen wird geladen"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50 transition-opacity duration-500 ${
        leaving ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <Logo animated className="h-28 w-28 drop-shadow-lg" />
      <p className="mt-6 animate-fade-up text-xl font-semibold tracking-tight text-slate-900" style={{ animationDelay: '700ms' }}>
        Fixkosten & Sparen
      </p>
      <p className="mt-1 animate-fade-up text-sm text-slate-500" style={{ animationDelay: '850ms' }}>
        Dein Sparbetrag, berechnet.
      </p>
    </div>
  );
}
