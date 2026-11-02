import { useEffect, useState } from 'react';

const SESSION_KEY = 'fixkosten.intro';

/** Wurde die Intro in dieser Sitzung schon gezeigt? Dann wird sie übersprungen. */
export function introAlreadyShown(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Intro: Die Logo-Kachel mit ausgestanzter Form wächst über den Bildschirm.
 * Durch die Aussparungen wird der Hauptbildschirm sichtbar. Rein CSS, ohne Textinhalt.
 */
export function Intro({ onDone }: { onDone: () => void }) {
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      /* Speicher gesperrt: die Intro wird dann beim nächsten Start erneut gezeigt */
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      onDone();
      return;
    }
    // Erst die Kachel zeigen, dann langsam öffnen. Das Ende folgt der Zoom-Dauer.
    const start = setTimeout(() => setZoom(true), 900);
    const end = setTimeout(onDone, 3600);
    return () => {
      clearTimeout(start);
      clearTimeout(end);
    };
  }, [onDone]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <div
        className={`intro-mask absolute inset-0 bg-accent ${zoom ? 'intro-zoom' : 'intro-tile'}`}
        style={{ willChange: 'mask-size' }}
      />
    </div>
  );
}
