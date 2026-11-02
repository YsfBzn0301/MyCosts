/**
 * Agent 2 – Cashflow-Predictor & Puffer-Checker.
 *
 * Liest die Prognose des Routers und formuliert Warnungen für Engpässe im Monat.
 * Deterministisch, damit die Warnungen exakt und ohne Token-Kosten sind.
 */
import type { CashflowResult } from '../domain/cashflow';
import { formatEUR } from '../domain/money';
import { dateFormat } from '../components/format';

export type Severity = 'info' | 'warnung' | 'kritisch';

export interface PredictorWarning {
  severity: Severity;
  message: string;
}

export function predictWarnings(r: CashflowResult): PredictorWarning[] {
  const out: PredictorWarning[] = [];

  if (!r.nextIncome) {
    out.push({ severity: 'info', message: 'Keine Einnahme hinterlegt. Prognose gilt für die nächsten 30 Tage.' });
  }
  if (r.balanceCents === 0) {
    out.push({ severity: 'info', message: 'Girokonto-Stand ist 0 €. Trage deinen aktuellen Stand ein, damit der Sparbetrag stimmt.' });
  }
  if (r.firstShortfall) {
    const { date, balanceCents } = r.firstShortfall;
    if (balanceCents < 0) {
      out.push({
        severity: 'kritisch',
        message: `Überziehung droht am ${dateFormat.format(date)}: Kontostand fiele auf ${formatEUR(balanceCents)}.`,
      });
    } else {
      out.push({
        severity: 'warnung',
        message: `Unter dem Sicherheitspuffer am ${dateFormat.format(date)} (Stand ${formatEUR(balanceCents)}).`,
      });
    }
  }
  if (r.plannedMonthlySavingCents < 0) {
    out.push({
      severity: 'kritisch',
      message: `Fixkosten und Lebenshaltung übersteigen die Einnahmen um ${formatEUR(-r.plannedMonthlySavingCents)} pro Monat.`,
    });
  }
  return out;
}
