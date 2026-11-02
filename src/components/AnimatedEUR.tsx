import { formatEUR } from '../domain/money';
import { useAnimatedNumber } from '../hooks/useAnimatedNumber';

/** Geldbetrag, der beim Ändern sanft hoch- bzw. herunterzählt. */
export function AnimatedEUR({ cents, className }: { cents: number; className?: string }) {
  const value = useAnimatedNumber(cents);
  return <span className={className}>{formatEUR(value)}</span>;
}
