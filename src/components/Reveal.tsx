import type { ReactNode } from 'react';

/** Blendet einen Bereich mit kleiner Verzögerung ein (gestaffelt pro Bereich). */
export function Reveal({ delay = 0, children }: { delay?: number; children: ReactNode }) {
  return (
    <div className="animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}
