/**
 * Agent 2 (Cashflow-Predictor) – Warnungen aus der Prognose. Deterministisch.
 * Liefert Übersetzungsschlüssel mit fertig formatierten Werten. Die UI übersetzt.
 */
import type { CashflowResult } from '../domain/cashflow';
import { formatEUR } from '../domain/money';
import { formatDate } from '../domain/format';

export type Severity = 'info' | 'warnung' | 'kritisch';

export interface PredictorWarning {
  severity: Severity;
  key: string;
  vars: Record<string, string>;
}

export function predictWarnings(r: CashflowResult): PredictorWarning[] {
  const out: PredictorWarning[] = [];

  if (!r.nextIncome) out.push({ severity: 'info', key: 'warn.noIncome', vars: {} });
  if (r.balanceCents === 0) out.push({ severity: 'info', key: 'warn.noBalance', vars: {} });

  if (r.firstShortfall) {
    const { date, balanceCents } = r.firstShortfall;
    const vars = { date: formatDate(date), balance: formatEUR(balanceCents) };
    if (balanceCents < 0) out.push({ severity: 'kritisch', key: 'warn.overdraft', vars });
    else out.push({ severity: 'warnung', key: 'warn.belowSafety', vars });
  }

  if (r.plannedMonthlySavingCents < 0) {
    out.push({
      severity: 'kritisch',
      key: 'warn.negativePlan',
      vars: { amount: formatEUR(-r.plannedMonthlySavingCents) },
    });
  }
  return out;
}
