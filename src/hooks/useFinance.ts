import { useCallback, useEffect, useState } from 'react';
import type { CashSettings, Income, IncomeValues } from '../domain/types';
import { loadIncomes, loadSettings, saveIncomes, saveSettings } from '../storage/financeRepository';
import { addIncome, removeIncome } from '../agents/budgetRouter';

/** Einnahmen und Girokonto-Einstellungen, persistiert in localStorage. */
export function useFinance() {
  const [incomes, setIncomes] = useState<Income[]>(() => loadIncomes());
  const [settings, setSettingsState] = useState<CashSettings>(() => loadSettings());
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    setSaveFailed(!saveIncomes(incomes) || !saveSettings(settings));
  }, [incomes, settings]);

  const addIncomeItem = useCallback((values: IncomeValues) => setIncomes((prev) => addIncome(prev, values)), []);
  const removeIncomeItem = useCallback((id: string) => setIncomes((prev) => removeIncome(prev, id)), []);
  const setSettings = useCallback((next: CashSettings) => setSettingsState(next), []);
  const replaceAll = useCallback((list: Income[], next: CashSettings) => {
    setIncomes(list);
    setSettingsState(next);
  }, []);

  return { incomes, settings, addIncomeItem, removeIncomeItem, setSettings, replaceAll, saveFailed };
}
