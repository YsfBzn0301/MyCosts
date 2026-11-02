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
export function Intro({ onReveal, onDone }: { onReveal: () => void; onDone: () => void }) {
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      /* Speicher gesperrt: die Intro wird dann beim nächsten Start erneut gezeigt */
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      onReveal();
      onDone();
      return;
    }
    // Nur das Logo zeigen, dann in das Logo hineinzoomen. Erst danach erscheint die Übersicht.
    // Die Übersicht wird ab Zoom-Start durch die Öffnungen sichtbar und ist am Ende vollständig da.
    const start = setTimeout(() => {
      setZoom(true);
      onReveal();
    }, 1200);
    const end = setTimeout(onDone, 3900);
    return () => {
      clearTimeout(start);
      clearTimeout(end);
    };
  }, [onDone, onReveal]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {/* Hintergrund: deckt alles außerhalb des Logos ab, damit die Übersicht dort nie sichtbar ist. */}
      <div className={`intro-backdrop absolute inset-0 bg-canvas ${zoom ? 'intro-backdrop-zoom' : ''}`} />
      <div
        className={`intro-mask absolute inset-0 bg-accent ${zoom ? 'intro-zoom' : 'intro-tile'}`}
        style={{ willChange: 'mask-size' }}
      />
    </div>
  );
}
