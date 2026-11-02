import type { CategoryId } from '../../shared/categories';

export type { CategoryId } from '../../shared/categories';

export const INTERVAL_LABELS = {
  monthly: 'Monatlich',
  quarterly: 'Vierteljährlich',
  yearly: 'Jährlich',
} as const;

export type Interval = keyof typeof INTERVAL_LABELS;

/** Wie oft pro Jahr ein Posten anfällt. */
export const PAYMENTS_PER_YEAR: Record<Interval, number> = {
  monthly: 12,
  quarterly: 4,
  yearly: 1,
};

export interface FixedCost {
  id: string;
  name: string;
  /** Betrag pro Zahlung in Cent (Ganzzahl, um Rundungsfehler zu vermeiden). */
  amountCents: number;
  category: CategoryId;
  interval: Interval;
  /** Fälligkeitstag im Monat (1–31). */
  dueDay: number;
  /** Fälligkeitsmonat (1–12) – nur bei quartalsweise/jährlich relevant. */
  dueMonth?: number;
  createdAt: string;
  updatedAt: string;
}

/** Wert aus dem Formular, bereits validiert. */
export type FixedCostValues = Omit<FixedCost, 'id' | 'createdAt' | 'updatedAt'>;
