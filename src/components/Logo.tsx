import type { CSSProperties } from 'react';

interface Props {
  /** Balken wachsen und die Münze fällt ein (nur Startanimation). */
  animated?: boolean;
  className?: string;
}

// Geometrie identisch zu public/icon.svg und scripts/make-icons.py.
export function Logo({ animated = false, className }: Props) {
  const anim = (delay: number) =>
    animated ? { className: 'logo-bar', style: { '--d': `${delay}ms` } as CSSProperties } : {};
  return (
    <svg viewBox="0 0 512 512" className={className} role="img" aria-label="Fixkosten & Sparen">
      <rect width="512" height="512" rx="112" fill="#2f6a58" />
      <rect x="120" y="310" width="64" height="90" rx="32" fill="#bfd9cc" {...anim(120)} />
      <rect x="210" y="250" width="64" height="150" rx="32" fill="#dcebe4" {...anim(260)} />
      <rect x="300" y="190" width="64" height="210" rx="32" fill="#fffdf9" {...anim(400)} />
      <g className={animated ? 'logo-coin' : undefined}>
        <circle cx="392" cy="128" r="62" fill="#e0a85a" />
        <circle cx="392" cy="128" r="40" fill="none" stroke="#f5e9d3" strokeWidth="12" />
      </g>
    </svg>
  );
}
