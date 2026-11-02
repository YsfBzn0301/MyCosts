import type { CategoryId } from './categories';

export type { CategoryId } from './categories';

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

/** Monatlich wiederkehrende Einnahme (z. B. Gehalt). */
export interface Income {
  id: string;
  name: string;
  amountCents: number;
  /** Tag im Monat, an dem das Geld eingeht (1–31). */
  payDay: number;
  createdAt: string;
  updatedAt: string;
}

export type IncomeValues = Omit<Income, 'id' | 'createdAt' | 'updatedAt'>;

/** Girokonto und Verbrauchsannahmen, alle Beträge in Cent. */
export interface CashSettings {
  /** Aktueller Stand des Girokontos. Darf negativ sein. */
  balanceCents: number;
  /** Lebenshaltung pro Monat (ohne Fixkosten), z. B. Essen, Tanken. */
  monthlySpendCents: number;
  /** Sicherheitspuffer, der immer auf dem Girokonto bleiben soll. */
  safetyCents: number;
}

export const DEFAULT_SETTINGS: CashSettings = { balanceCents: 0, monthlySpendCents: 0, safetyCents: 0 };

/** Sparkonto oder Depot mit manuell gepflegtem Stand. */
export interface SavingsAccount {
  id: string;
  name: string;
  balanceCents: number;
  createdAt: string;
  updatedAt: string;
}

export type MetalCode = 'XAU' | 'XAG';
export type CurrencyCode = 'USD' | 'GBP' | 'CHF' | 'TRY' | 'JPY' | 'PLN';

/** Physischer Bestand. Metalle in Gramm oder Feinunzen, Währungen in Einheiten. */
export type Asset =
  | { id: string; kind: 'metal'; code: MetalCode; quantity: number; unit: 'g' | 'oz'; createdAt: string }
  | { id: string; kind: 'currency'; code: CurrencyCode; quantity: number; createdAt: string };

/** Manuelle Ein- oder Auszahlung. amountCents ist positiv bei Eingang, negativ bei Ausgang. */
export interface Transaction {
  id: string;
  date: string;
  accountId: string;
  amountCents: number;
  note: string;
}

/** Tageswert des Gesamtvermögens für den Verlauf. date im Format YYYY-MM-DD. */
export interface NetWorthPoint {
  date: string;
  cents: number;
}

export type Theme = 'light' | 'dark' | 'system';
export type Lang = 'de' | 'en' | 'tr';

export interface Prefs {
  lang: Lang;
  theme: Theme;
}
